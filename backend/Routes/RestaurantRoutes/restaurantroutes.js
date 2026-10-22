const express = require("express");
const multer = require("multer");
const path = require("path");
const restSchema = require("../../Models/RestaurantSchema");
const menuSchema = require("../../Models/Menuitems");
const orderSchema = require("../../Models/OrderSchema");
const { signToken } = require("../../config/auth.config");
const { authenticate, authorizeRoles } = require("../../middleware/auth.middleware");
const { sendStatusUpdate } = require("../../services/email.service");
const { dispatchNextCandidate } = require("../../services/delivery.service");

const restRoute = express.Router();
restRoute.use(express.json());
restRoute.use(express.urlencoded({ extended: true }));

// Multer storage
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/restaurants"),
  filename: function (req, file, cb) {
    const filename = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedtypes = /jpeg|jpg|png|webp/;
  const extension = allowedtypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedtypes.test(file.mimetype);

  if (extension && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: fileFilter,
});

/**
 * Restaurant Sign In / Register
 */
restRoute.post("/signin", upload.single("image"), async (req, res) => {
  let restaurant = { ...req.body };
  let imagename = req.file ? "/uploads/restaurants/" + req.file.filename : "/uploads/restaurants/default.jpg";

  try {
    const existing = await restSchema.findOne({ email: restaurant.email });
    if (existing) {
      return res.status(400).json({ message: "Restaurant email already exists." });
    }

    const created = await restSchema.create({ ...restaurant, image: imagename });
    return res.status(200).json({ message: "Signin Success! Please Login to Continue", id: created._id });
  } catch (err) {
    return res.status(400).json({ message: "Signin Failed : " + err.message });
  }
});

/**
 * Restaurant Login
 */
restRoute.post("/login", async (req, res) => {
  const enteredemail = (req.body.email || "").trim().toLowerCase();
  const enteredpassword = req.body.password;

  try {
    const result = await restSchema.findOne({ email: enteredemail });

    if (result) {
      const isMatch = await result.comparepassword(enteredpassword);

      if (isMatch) {
        const token = signToken({
          email: result.email,
          role: result.role || "restaurant",
          id: result._id,
        });

        return res.status(200).json({
          message: "Login Success",
          token: token,
          role: result.role || "restaurant",
          id: result._id,
          name: result.name,
        });
      } else {
        return res.status(400).json({ message: "Invalid Password" });
      }
    } else {
      return res.status(400).json({ message: "Invalid Email Credentials" });
    }
  } catch (err) {
    return res.status(400).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Restaurant Details
 */
restRoute.get("/details/:id", authenticate, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await restSchema.findById(id).select("-password");
    if (!result) return res.status(404).json({ message: "Restaurant not found" });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Menu Item Upload
 */
restRoute.post("/menuupload", authenticate, upload.single("image"), async (req, res) => {
  let menu = { ...req.body };
  let menuimage = req.file ? "/uploads/restaurants/" + req.file.filename : "/uploads/restaurants/default-food.jpg";

  try {
    await menuSchema.create({
      ...menu,
      image: menuimage,
      isVeg: req.body.isVeg === "true" || req.body.isVeg === true,
      price: Number(req.body.price),
    });

    const result = await menuSchema.find().populate("restaurantid");
    result.sort((a, b) => {
      const aActive = Boolean(a.restaurantid && a.restaurantid.isactive);
      const bActive = Boolean(b.restaurantid && b.restaurantid.isactive);
      return (bActive ? 1 : 0) - (aActive ? 1 : 0);
    });

    if (req.io) {
      req.io.emit("foodsData", result);
    }

    return res.status(200).json({ message: "Menu Item Added Successfully" });
  } catch (err) {
    return res.status(400).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Menu Items Display for Restaurant
 */
restRoute.get("/menudisplay/:id", authenticate, async (req, res) => {
  const restaurantid = req.params.id;

  try {
    const result = await menuSchema.find({ restaurantid: restaurantid }).sort({ createdAt: -1 });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: "Server Error " + err.message });
  }
});

/**
 * Delete Menu Item
 */
restRoute.delete("/deletemenu/:id", authenticate, async (req, res) => {
  const deleteid = req.params.id;

  try {
    await menuSchema.deleteOne({ _id: deleteid });
    const result = await menuSchema.find().populate("restaurantid");
    if (req.io) {
      req.io.emit("foodsData", result);
    }
    return res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    return res.status(400).json({ message: "Server Error " + err.message });
  }
});

/**
 * Display Orders for Restaurant
 */
restRoute.get("/order/:id", authenticate, async (req, res) => {
  const restaurantid = req.params.id;

  try {
    const orders = await orderSchema
      .find()
      .populate({ path: "menuid", populate: { path: "restaurantid" } })
      .populate("restaurantId")
      .populate("userid", "-password")
      .populate("deliverypersonid", "-password")
      .sort({ createdAt: -1 });

    const restaurantOrders = orders.filter(
      (order) =>
        order?.menuid?.restaurantid?._id?.toString() === restaurantid.toString() ||
        order?.restaurantId?._id?.toString() === restaurantid.toString() ||
        order?.restaurantId?.toString() === restaurantid.toString()
    );

    return res.status(200).json(restaurantOrders);
  } catch (err) {
    return res.status(500).json({ message: "Server Error " + err.message });
  }
});

/**
 * Restaurant Action 1: Accept Order
 * Transitions order to ACCEPTED/PREPARING and triggers Delivery Candidate Discovery!
 */
restRoute.post("/order/:id/accept", authenticate, async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await orderSchema.findById(orderId).populate("userid", "-password");
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (["CANCELLED", "REJECTED", "DELIVERED"].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Cannot accept order in terminal status: ${order.orderStatus}` });
    }

    const now = new Date();
    order.orderStatus = "ACCEPTED";
    order.status = "Preparing";
    order.deliveryStatus = "SEARCHING";

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: "Accepted",
      timestamp: now,
      comment: "Kitchen accepted the order and started preparation.",
      updatedBy: "restaurant",
    });

    if (!order.deliveryTimeline) order.deliveryTimeline = [];
    order.deliveryTimeline.push({
      status: "SEARCHING",
      timestamp: now,
      comment: "Order accepted by kitchen. Searching for nearby delivery partners.",
      updatedBy: "system",
    });

    await order.save();

    // Notify rooms
    if (req.io) {
      req.io.to(`order_${orderId}`).emit("order:accepted", { orderId, orderStatus: "ACCEPTED", status: "Preparing" });
      req.io.to(`user_${order.userid?._id || order.userid}`).emit("orderStatusChanged", order);
    }

    // Begin Swiggy-style delivery partner discovery asynchronously
    dispatchNextCandidate(order._id, req.io).catch((err) =>
      console.warn("Delivery dispatch notice:", err.message)
    );

    return res.status(200).json({
      message: "Order accepted by kitchen! Finding nearby delivery partner...",
      order,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to accept order: " + err.message });
  }
});

/**
 * Restaurant Action 2: Reject Order
 */
restRoute.post("/order/:id/reject", authenticate, async (req, res) => {
  const orderId = req.params.id;
  const reason = req.body.reason || "Restaurant unable to fulfill order at this time";

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (["DELIVERED", "PICKED_UP", "CANCELLED"].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Cannot reject order in status: ${order.orderStatus}` });
    }

    const now = new Date();
    order.orderStatus = "REJECTED";
    order.status = "Rejected";
    order.deliveryStatus = "CANCELLED";
    order.rejectionReason = reason;

    if (order.paymentmethod === "Online" && order.paymentStatus === "Paid") {
      order.paymentStatus = "Refunded";
    }

    order.statusHistory.push({
      status: "Rejected",
      timestamp: now,
      comment: `Order rejected by restaurant: ${reason}`,
      updatedBy: "restaurant",
    });

    await order.save();

    if (req.io) {
      req.io.to(`order_${orderId}`).emit("order:rejected", { orderId, reason });
      req.io.to(`user_${order.userid}`).emit("order:rejected", { orderId, reason });
    }

    return res.status(200).json({
      message: "Order rejected and customer notified.",
      order,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to reject order: " + err.message });
  }
});

/**
 * Restaurant Action 3: Mark Food Ready for Pickup
 */
restRoute.post("/order/:id/ready", authenticate, async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (["CANCELLED", "REJECTED", "DELIVERED", "PICKED_UP"].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Cannot mark food ready when status is: ${order.orderStatus}` });
    }

    const now = new Date();
    order.orderStatus = "READY_FOR_PICKUP";
    order.status = "Ready for Pickup";
    order.statusHistory.push({
      status: "Ready for Pickup",
      timestamp: now,
      comment: "Food is freshly cooked and packed for pickup.",
      updatedBy: "restaurant",
    });

    await order.save();

    if (req.io) {
      req.io.to(`order_${orderId}`).emit("order:ready", { orderId, status: "Ready for Pickup" });
      req.io.to(`user_${order.userid}`).emit("order:ready", { orderId, status: "Ready for Pickup" });
      if (order.deliverypersonid) {
        req.io.to(`delivery_${order.deliverypersonid}`).emit("order:ready", { orderId, message: "Order is packed and ready for pickup!" });
      }
    }

    // If delivery is still searching, re-attempt candidate dispatch
    if (order.deliveryStatus === "SEARCHING" || order.deliveryStatus === "NOT_REQUESTED") {
      dispatchNextCandidate(order._id, req.io).catch(() => {});
    }

    return res.status(200).json({
      message: "Food marked ready for pickup!",
      order,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update food status: " + err.message });
  }
});

/**
 * Restaurant Action: Retry Delivery Partner Dispatch
 */
restRoute.post("/order/:id/retry-dispatch", authenticate, async (req, res) => {
  const orderId = req.params.id;
  try {
    const result = await dispatchNextCandidate(orderId, req.io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to dispatch partner: " + err.message });
  }
});

/**
 * Legacy Status Change Endpoint with Strict Role Validation
 * Prevents restaurants from hijacking delivery partner's status transitions!
 */
restRoute.patch("/order/statuschange/:id", authenticate, async (req, res) => {
  const orderid = req.params.id;
  const newStatus = req.body.status;

  // Strict Boundary Enforcement: Restaurants CANNOT set delivery transit states
  if (["Out for Delivery", "Delivered", "Picked Up"].includes(newStatus)) {
    return res.status(403).json({
      message: "Forbidden: Kitchens cannot mark delivery transit or completion states. The delivery partner controls pickup and delivery.",
    });
  }

  try {
    const order = await orderSchema.findById(orderid);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const now = new Date();
    if (newStatus === "Preparing" || newStatus === "Accepted") {
      order.orderStatus = "PREPARING";
      order.status = "Preparing";
      dispatchNextCandidate(order._id, req.io).catch(() => {});
    } else if (newStatus === "Ready for Pickup") {
      order.orderStatus = "READY_FOR_PICKUP";
      order.status = "Ready for Pickup";
      if (order.deliverypersonid && req.io) {
        req.io.to(`delivery_${order.deliverypersonid}`).emit("order:ready", { orderId: orderid });
      }
    } else if (newStatus === "Rejected" || newStatus === "Cancelled") {
      order.orderStatus = "REJECTED";
      order.status = "Rejected";
      order.deliveryStatus = "CANCELLED";
    }

    order.statusHistory.push({
      status: order.status,
      timestamp: now,
      comment: `Status updated to ${order.status} by restaurant.`,
      updatedBy: "restaurant",
    });

    await order.save();

    const updatedOrder = await orderSchema
      .findById(orderid)
      .populate("userid", "-password")
      .populate("deliverypersonid", "-password")
      .populate({ path: "menuid", populate: { path: "restaurantid" } });

    if (req.io) {
      req.io.to(`user_${updatedOrder.userid?._id || updatedOrder.userid}`).emit("orderStatusChanged", updatedOrder);
      req.io.to(`order_${orderid}`).emit("status:update", { orderId: orderid, status: order.status });
    }

    return res.status(200).json({ message: "Status Updated", order: updatedOrder });
  } catch (err) {
    return res.status(500).json({ message: "Server Error " + err.message });
  }
});

/**
 * Restaurant Availability Toggle
 */
restRoute.patch("/availability/:id", authenticate, async (req, res) => {
  const restaurantid = req.params.id;

  try {
    await restSchema.findByIdAndUpdate(restaurantid, { $set: req.body });

    const result = await menuSchema.find().populate("restaurantid");
    if (req.io) {
      req.io.emit("foodsData", result);
    }

    return res.status(200).json({ message: "Availability Status Updated !" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Error handling middleware for Multer
restRoute.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large! Max 15MB allowed." });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = restRoute;
