const express = require("express");
const multer = require("multer");
const path = require("path");
const restSchema = require("../../Models/RestaurantSchema");
const menuSchema = require("../../Models/Menuitems");
const orderSchema = require("../../Models/OrderSchema");
const { signToken } = require("../../config/auth.config");
const { authenticate, authorizeRoles } = require("../../middleware/auth.middleware");
const { sendStatusUpdate } = require("../../services/email.service");

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
      .populate("userid", "-password")
      .populate("deliverypersonid")
      .sort({ createdAt: -1 });

    const restaurantOrders = orders.filter(
      (order) => order?.menuid?.restaurantid?._id?.toString() === restaurantid.toString()
    );

    return res.status(200).json(restaurantOrders);
  } catch (err) {
    return res.status(500).json({ message: "Server Error " + err.message });
  }
});

/**
 * Order Status Change
 */
restRoute.patch("/order/statuschange/:id", authenticate, async (req, res) => {
  const orderid = req.params.id;
  const newStatus = req.body.status;

  try {
    const updatedOrder = await orderSchema
      .findByIdAndUpdate(
        orderid,
        {
          $set: { status: newStatus },
          $push: {
            statusHistory: {
              status: newStatus,
              timestamp: new Date(),
              comment: `Status updated to ${newStatus} by restaurant.`,
              updatedBy: "restaurant",
            },
          },
        },
        { new: true }
      )
      .populate("userid", "-password")
      .populate("deliverypersonid")
      .populate({ path: "menuid", populate: { path: "restaurantid" } });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Scoped socket updates
    if (req.io) {
      // Notify customer room
      req.io.to(`user_${updatedOrder.userid._id}`).emit("orderStatusChanged", updatedOrder);
      req.io.to(`order_${orderid}`).emit("status:update", { orderId: orderid, status: newStatus });

      // Delivery room
      if (updatedOrder.deliverypersonid) {
        req.io.to(`delivery_${updatedOrder.deliverypersonid._id}`).emit("deliveryOrderUpdate", updatedOrder);
      }

      // Legacy user orders update event
      const userOrders = await orderSchema
        .find({ userid: updatedOrder.userid._id })
        .populate("userid menuid deliverypersonid")
        .sort({ createdAt: -1 });
      req.io.emit("updatedOrder", userOrders);
    }

    // Send transactional status update email
    sendStatusUpdate(updatedOrder, updatedOrder.userid, newStatus);

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
