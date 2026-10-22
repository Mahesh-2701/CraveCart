const express = require("express");
require("dotenv").config();
const userSchema = require("../../Models/UserSchema");
const menuSchema = require("../../Models/Menuitems");
const restSchema = require("../../Models/RestaurantSchema");
const cartSchema = require("../../Models/CartSchema");
const deliverySchema = require("../../Models/Deliveryperson");
const orderSchema = require("../../Models/OrderSchema");
const couponModel = require("../../Models/CouponSchema");
const adminSchema = require("../../Models/Admin");
const { signToken } = require("../../config/auth.config");
const { authenticate, enforceOwnership } = require("../../middleware/auth.middleware");
const { sendOrderConfirmation } = require("../../services/email.service");

const userrouter = express.Router();
userrouter.use(express.json());

// Public health / validation check
userrouter.get("/home", (req, res) => {
  res.status(200).json({ message: "validation sucess" });
});

/**
 * User Registration
 */
userrouter.post("/signin", async (req, res) => {
  let user = { ...req.body };

  try {
    const existing = await userSchema.findOne({ email: user.email });
    if (existing) {
      return res.status(400).json({ message: "Email Already Exists. Please login instead." });
    }
    const createdUser = await userSchema.create({ ...user });
    const token = signToken({ email: createdUser.email, id: createdUser._id, role: createdUser.role || "user" });
    return res.status(200).json({
      message: "Signin Success",
      token,
      id: createdUser._id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role || "user",
    });
  } catch (err) {
    console.error("User signin error:", err.message);
    return res.status(500).json({ message: "Registration Failed: " + err.message });
  }
});

/**
 * User Login
 */
userrouter.post("/login", async (req, res) => {
  const enteredemail = (req.body.email || "").trim().toLowerCase();
  const enteredpassword = req.body.password;

  if (!enteredemail || !enteredpassword) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const result = await userSchema.findOne({ email: enteredemail });

    if (result) {
      const comparingpassword = await result.comparepassword(enteredpassword);

      if (comparingpassword) {
        const token = signToken({
          email: result.email,
          id: result._id,
          role: result.role || "user",
        });

        return res.status(200).json({
          message: "Login Success",
          token: token,
          email: result.email,
          id: result._id,
          name: result.name,
          address: result.address,
          role: result.role || "user",
        });
      } else {
        return res.status(400).json({ message: "Invalid Password" });
      }
    } else {
      // Check if user is trying to log in with an Admin, Restaurant, or Delivery account
      const isAdmin = await adminSchema.findOne({ email: enteredemail });
      if (isAdmin) {
        return res.status(400).json({
          message: "This is an Admin account. Please log in at http://localhost:3000/admin",
        });
      }
      const isRest = await restSchema.findOne({ email: enteredemail });
      if (isRest) {
        return res.status(400).json({
          message: "This is a Restaurant partner account. Please log in at http://localhost:3000/restaurant/login",
        });
      }
      const isDelivery = await deliverySchema.findOne({ email: enteredemail });
      if (isDelivery) {
        return res.status(400).json({
          message: "This is a Delivery partner account. Please log in at http://localhost:3000/delivery/login",
        });
      }
      return res.status(400).json({ message: "Invalid Email Credentials" });
    }
  } catch (err) {
    return res.status(400).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Search & Discovery: Foods with Rich Filters
 */
userrouter.get("/foods", async (req, res) => {
  const { search, cuisine, isVeg, sort, category, minPrice, maxPrice } = req.query;

  try {
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { description: searchRegex }, { cuisine: searchRegex }, { category: searchRegex }];
    }

    if (isVeg === "true") {
      query.isVeg = true;
    }

    if (cuisine && cuisine.trim()) {
      query.cuisine = new RegExp(cuisine.trim(), "i");
    }

    if (category && category.trim()) {
      query.category = new RegExp(category.trim(), "i");
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions = {};
    if (sort === "price_asc") sortOptions.price = 1;
    else if (sort === "price_desc") sortOptions.price = -1;
    else if (sort === "rating") sortOptions.rating = -1;

    let result = await menuSchema.find(query).populate("restaurantid").sort(sortOptions);

    // Prioritize foods from currently active / open restaurants
    result.sort((a, b) => {
      const aActive = Boolean(a.restaurantid && a.restaurantid.isactive);
      const bActive = Boolean(b.restaurantid && b.restaurantid.isactive);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Foods fetch error:", err.message);
    return res.status(500).json({ message: "Server Error fetching dishes: " + err.message });
  }
});

/**
 * Search & Discovery: Restaurants
 */
userrouter.get("/restaurant", async (req, res) => {
  const { search, city, cuisine } = req.query;

  try {
    const query = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { address: searchRegex }, { cuisine: searchRegex }];
    }
    if (city && city.trim()) {
      query.city = new RegExp(city.trim(), "i");
    }
    if (cuisine && cuisine.trim()) {
      query.cuisine = new RegExp(cuisine.trim(), "i");
    }

    let result = await restSchema.find(query);
    // Sort active restaurants first
    result.sort((a, b) => (b.isactive ? 1 : 0) - (a.isactive ? 1 : 0));
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server Error: " + err.message });
  }
});

/**
 * Get User Profile
 */
userrouter.get("/view/:id", authenticate, enforceOwnership("id"), async (req, res) => {
  const userid = req.params.id;

  try {
    const result = await userSchema.findById(userid).select("-password");
    if (!result) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Update User Details
 */
userrouter.put("/update/:id", authenticate, enforceOwnership("id"), async (req, res) => {
  let userUpdates = { ...req.body };
  let userid = req.params.id;

  try {
    await userSchema.findByIdAndUpdate(userid, { ...userUpdates });
    return res.status(200).json({ message: "Update Success Please Login to Continue" });
  } catch (err) {
    return res.status(500).json({ message: "Error Try Again Later : " + err.message });
  }
});

/**
 * Add Item to Cart
 */
userrouter.post("/addtocart", authenticate, async (req, res) => {
  const { userid, menuid, price } = req.body;

  try {
    // Check if this item is already in user's cart; if so, increment quantity
    const existingCartItem = await cartSchema.findOne({ userid, menuid });
    if (existingCartItem) {
      existingCartItem.quantity = (existingCartItem.quantity || 1) + 1;
      await existingCartItem.save();
      return res.status(200).json({ message: "Item quantity updated in Cart" });
    }

    await cartSchema.create({ userid, menuid, price });
    return res.status(200).json({ message: "Item Added to Cart" });
  } catch (err) {
    return res.status(500).json({ message: "Network Error " + err.message });
  }
});

/**
 * Cart Display
 */
userrouter.get("/cartdisplay/:id", authenticate, enforceOwnership("id"), async (req, res) => {
  const userid = req.params.id;

  try {
    const result = await cartSchema
      .find({ userid: userid })
      .populate("userid", "-password")
      .populate({ path: "menuid", populate: { path: "restaurantid", select: "name address coordinates isactive" } });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Delete Item from Cart
 */
userrouter.delete("/cartdelete/:id", authenticate, async (req, res) => {
  const deleteid = req.params.id;

  try {
    await cartSchema.deleteOne({ _id: deleteid });
    return res.status(200).json({ message: "Item Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Refresh / Clear Cart after ordering
 */
userrouter.delete("/cartrefresh/:id", authenticate, enforceOwnership("id"), async (req, res) => {
  const userid = req.params.id;

  try {
    await cartSchema.deleteMany({ userid: userid });
    return res.status(200).json({ message: "Cart Items Refreshed Continue Shopping" });
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Place Order (Supports single items and multi-item orders)
 */
userrouter.post("/order/:id", authenticate, enforceOwnership("id"), async (req, res) => {
  const userid = req.params.id;

  try {
    // 1. Authoritative pricing calculation & restaurant discovery
    let calculatedSubtotal = 0;
    const items = req.body.items || [];
    let detectedRestaurantId = null;
    let detectedRestCoordinates = { lat: 12.9784, lng: 77.6408 };

    if (items.length > 0) {
      for (const it of items) {
        const m = await menuSchema.findById(it.menuid).populate("restaurantid");
        if (m) {
          calculatedSubtotal += m.price * (it.quantity || 1);
          if (!detectedRestaurantId && m.restaurantid) {
            detectedRestaurantId = m.restaurantid._id || m.restaurantid;
            if (m.restaurantid.coordinates) {
              detectedRestCoordinates = m.restaurantid.coordinates;
            }
          }
        }
      }
    } else if (req.body.menuid) {
      const m = await menuSchema.findById(req.body.menuid).populate("restaurantid");
      calculatedSubtotal = (m ? m.price : req.body.price) * (req.body.quantity || 1);
      if (m && m.restaurantid) {
        detectedRestaurantId = m.restaurantid._id || m.restaurantid;
        if (m.restaurantid.coordinates) {
          detectedRestCoordinates = m.restaurantid.coordinates;
        }
      }
    }

    const deliveryFee = 60;
    let discountAmount = 0;

    if (req.body.couponCode) {
      const coupon = await couponModel.findOne({ code: req.body.couponCode.trim().toUpperCase() });
      if (coupon) {
        const evalResult = coupon.calculateDiscount(calculatedSubtotal);
        if (evalResult.valid) {
          discountAmount = evalResult.discountAmount;
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await coupon.save();
        }
      }
    }

    const finalTotal = Math.max(0, calculatedSubtotal + deliveryFee - discountAmount);

    // Initial state: PLACED order, delivery NOT_REQUESTED, no rider assigned yet
    const orderData = {
      userid,
      menuid: req.body.menuid || (items[0] && items[0].menuid),
      price: req.body.price || calculatedSubtotal,
      quantity: req.body.quantity || 1,
      items: items.length > 0 ? items : undefined,
      subtotal: calculatedSubtotal,
      deliveryFee,
      discountAmount,
      couponCode: req.body.couponCode || null,
      totalAmount: finalTotal,
      paymentmethod: req.body.paymentmethod || "COD",
      paymentStatus: req.body.paymentmethod === "Online" ? "Paid" : "Pending",
      address: req.body.address,
      restaurantId: detectedRestaurantId,
      restaurantCoordinates: detectedRestCoordinates,
      customerCoordinates: req.body.coordinates || { lat: 12.9345, lng: 77.6256 },
      // Strict decoupling: Delivery is NOT requested or assigned until restaurant accepts!
      deliverypersonid: null,
      orderStatus: "PLACED",
      status: "Placed",
      deliveryStatus: "NOT_REQUESTED",
      deliveryLocation: {
        lat: detectedRestCoordinates.lat,
        lng: detectedRestCoordinates.lng,
        updatedAt: new Date(),
      },
      statusHistory: [
        {
          status: "Placed",
          timestamp: new Date(),
          comment: "Order placed by customer. Waiting for kitchen acceptance.",
          updatedBy: "customer",
        },
      ],
      deliveryTimeline: [
        {
          status: "NOT_REQUESTED",
          timestamp: new Date(),
          comment: "Delivery not yet requested. Awaiting restaurant acceptance.",
          updatedBy: "system",
        },
      ],
    };

    const newOrder = await orderSchema.create(orderData);
    const populatedOrder = await orderSchema
      .findById(newOrder._id)
      .populate("userid", "-password")
      .populate({ path: "menuid", populate: { path: "restaurantid" } })
      .populate("restaurantId");

    const restaurantId = detectedRestaurantId || populatedOrder?.menuid?.restaurantid?._id;

    // Scoped Real-time Events
    if (req.io) {
      if (restaurantId) {
        req.io.to(`restaurant_${restaurantId}`).emit("newKitchenOrder", populatedOrder);
        req.io.to(`restaurant_${restaurantId}`).emit("updatingRestOrder", [populatedOrder]);
      }
      req.io.to(`user_${userid}`).emit("orderPlaced", populatedOrder);
    }

    // Trigger transactional order confirmation email
    const userDoc = await userSchema.findById(userid);
    sendOrderConfirmation(populatedOrder, userDoc);

    return res.status(200).json({
      message: "Order placed successfully! Waiting for kitchen acceptance.",
      orderId: newOrder._id,
      order: populatedOrder,
    });
  } catch (err) {
    console.error("Order placement error:", err.message);
    return res.status(500).json({ message: "Server Error Try Again Later: " + err.message });
  }
});

/**
 * Customer Order Cancellation (Only allowed before restaurant accepts)
 */
userrouter.post("/order/cancel/:orderId", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const reason = req.body?.reason || "Cancelled by customer";

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (order.userid?.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: You do not own this order." });
    }

    if (order.orderStatus !== "PLACED") {
      return res.status(400).json({
        message: `Order cannot be cancelled because the kitchen has already accepted it (Current Status: ${order.orderStatus}). Please contact support.`,
      });
    }

    const now = new Date();
    order.orderStatus = "CANCELLED";
    order.status = "Cancelled";
    order.deliveryStatus = "CANCELLED";
    order.rejectionReason = reason;

    if (order.paymentmethod === "Online" && order.paymentStatus === "Paid") {
      order.paymentStatus = "Refunded";
    }

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: "Cancelled",
      timestamp: now,
      comment: `Order cancelled by customer before restaurant acceptance: ${reason}`,
      updatedBy: "customer",
    });

    if (!order.deliveryTimeline) order.deliveryTimeline = [];
    order.deliveryTimeline.push({
      status: "CANCELLED",
      timestamp: now,
      comment: "Delivery request cancelled.",
      updatedBy: "customer",
    });

    await order.save();

    if (order.couponCode) {
      const couponModel = require("../../Models/CouponSchema");
      await couponModel
        .updateOne({ code: order.couponCode, timesUsed: { $gt: 0 } }, { $inc: { timesUsed: -1 } })
        .catch(() => {});
    }

    if (req.io) {
      req.io.to(`order_${orderId}`).emit("order:cancelled", { orderId, reason });
      if (order.restaurantId) {
        req.io.to(`restaurant_${order.restaurantId}`).emit("order:cancelled", { orderId, reason });
      }
    }

    return res.status(200).json({
      message: "Order cancelled successfully.",
      order,
    });
  } catch (err) {
    console.error("Cancel order error:", err.message, err.stack);
    return res.status(500).json({ message: "Failed to cancel order: " + err.message });
  }
});

/**
 * Display User Order History
 */
userrouter.get("/orders/:id", authenticate, enforceOwnership("id"), async (req, res) => {
  const userid = req.params.id;

  try {
    const result = await orderSchema
      .find({ userid: userid })
      .populate("userid", "-password")
      .populate("restaurantId", "name address image")
      .populate({ path: "menuid", populate: { path: "restaurantid", select: "name address image" } })
      .populate("deliverypersonid")
      .sort({ createdAt: -1 });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: "Server Error " + err.message });
  }
});

/**
 * Live Delivery Tracking Detail for Single Order
 */
userrouter.get("/order-tracking/:orderId", authenticate, async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await orderSchema
      .findById(orderId)
      .populate("userid", "name email phonenumber address")
      .populate("restaurantId", "name address coordinates image")
      .populate({ path: "menuid", populate: { path: "restaurantid", select: "name address coordinates image" } })
      .populate("deliverypersonid", "name phonenumber vehicleType rating");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Authorization: User must own the order or be an Admin, Restaurant owner, or Delivery partner
    const isOwner = order.userid?._id?.toString() === req.user.id || order.userid?.toString() === req.user.id;
    const isDelivery = order.deliverypersonid?._id?.toString() === req.user.id || order.deliverypersonid?.toString() === req.user.id;
    const isRest =
      order.menuid?.restaurantid?._id?.toString() === req.user.id ||
      order.restaurantId?._id?.toString() === req.user.id ||
      order.restaurantId?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isDelivery && !isRest && !isAdmin) {
      return res.status(403).json({ message: "Forbidden: Not authorized to view tracking for this order." });
    }

    const restData = order.restaurantId || order.menuid?.restaurantid;

    return res.status(200).json({
      orderId: order._id,
      orderStatus: order.orderStatus || "PLACED",
      deliveryStatus: order.deliveryStatus || "NOT_REQUESTED",
      status: order.status,
      statusHistory: order.statusHistory,
      deliveryTimeline: order.deliveryTimeline,
      deliveryLocation: order.deliveryLocation,
      customerCoordinates: order.customerCoordinates,
      restaurantCoordinates: order.restaurantCoordinates || restData?.coordinates,
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
      isSimulated: order.isSimulated,
      address: order.address,
      paymentmethod: order.paymentmethod,
      totalAmount: order.totalAmount || order.price,
      restaurant: restData,
      deliveryPerson: order.deliverypersonid,
      item: order.menuid,
      deliveryOtp: isOwner || isAdmin ? order.deliveryOtp : undefined,
      rejectionReason: order.rejectionReason,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching tracking data: " + err.message });
  }
});

module.exports = userrouter;