const express = require("express");
const adminSchema = require("../../Models/Admin");
const userSchema = require("../../Models/UserSchema");
const restSchema = require("../../Models/RestaurantSchema");
const deliverySchema = require("../../Models/Deliveryperson");
const menuSchema = require("../../Models/Menuitems");
const orderSchema = require("../../Models/OrderSchema");
const couponModel = require("../../Models/CouponSchema");
const { signToken } = require("../../config/auth.config");
const { authenticate, authorizeRoles } = require("../../middleware/auth.middleware");

const adminRoute = express.Router();
adminRoute.use(express.json());

// Ensure at least one default admin account exists for testing and management
async function ensureDefaultAdmin() {
  try {
    const adminCount = await adminSchema.countDocuments();
    if (adminCount === 0) {
      await adminSchema.create({
        name: "CraveCart Admin",
        email: "admin@cravecart.com",
        password: "adminpassword123",
        role: "admin",
      });
      console.log("Default admin account created: admin@cravecart.com");
    }
  } catch (err) {
    // Non-critical
  }
}
ensureDefaultAdmin();

/**
 * Admin Login
 */
adminRoute.post("/login", async (req, res) => {
  const enteredemail = (req.body.email || "").trim().toLowerCase();
  const enteredpassword = req.body.password;

  try {
    const result = await adminSchema.findOne({ email: enteredemail });

    if (result) {
      const isMatch = await result.comparepassword(enteredpassword);

      if (isMatch) {
        const token = signToken({
          email: result.email,
          id: result._id,
          role: "admin",
        });

        return res.status(200).json({
          message: "Login Success",
          token: token,
          email: result.email,
          id: result._id,
          name: result.name,
          role: "admin",
        });
      } else {
        return res.status(400).json({ message: "Invalid Password" });
      }
    } else {
      return res.status(400).json({ message: "Invalid Email Credentials" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Admin Dashboard Overview
 */
adminRoute.get("/dashboard", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await userSchema.find().select("-password");
    const restaurant = await restSchema.find().select("-password");
    const deliveryman = await deliverySchema.find().select("-password");
    const menu = await menuSchema.find().populate("restaurantid");
    const orders = await orderSchema
      .find()
      .populate("userid", "-password")
      .populate({ path: "menuid", populate: "restaurantid" })
      .populate("deliverypersonid", "-password")
      .sort({ createdAt: -1 });

    const coupons = await couponModel.find().sort({ createdAt: -1 });

    // Financial analytics summary
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.price || 0), 0);
    const completedOrders = orders.filter((o) => o.status === "Delivered").length;

    return res.status(200).json({
      user: users,
      restaurant: restaurant,
      deliveryman: deliveryman,
      menu: menu,
      orders: orders,
      coupons: coupons,
      stats: {
        totalUsers: users.length,
        totalRestaurants: restaurant.length,
        totalDeliveryPartners: deliveryman.length,
        totalOrders: orders.length,
        completedOrders,
        totalRevenue,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Toggle Restaurant Approval / Active Status
 */
adminRoute.patch("/restaurant/:id/toggle", authenticate, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const rest = await restSchema.findById(id);
    if (!rest) return res.status(404).json({ message: "Restaurant not found." });

    rest.isactive = !rest.isactive;
    await rest.save();

    if (req.io) {
      const allMenus = await menuSchema.find().populate("restaurantid");
      req.io.emit("foodsData", allMenus);
    }

    return res.status(200).json({
      message: `Restaurant ${rest.name} is now ${rest.isactive ? "Active & Approved" : "Inactive"}`,
      isactive: rest.isactive,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error toggling status: " + err.message });
  }
});

/**
 * Admin Delivery Dispatch Operations Monitor
 */
adminRoute.get("/deliveries", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const orders = await orderSchema
      .find({
        orderStatus: { $in: ["PLACED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP"] },
      })
      .populate("restaurantId", "name address coordinates")
      .populate({ path: "menuid", populate: { path: "restaurantid" } })
      .populate("userid", "name phonenumber address")
      .populate("deliverypersonid", "name phonenumber vehicleType rating currentLocation")
      .sort({ createdAt: -1 });

    const activeDrivers = await deliverySchema.find({ isAvailable: true }).select("-password");

    const searching = orders.filter((o) => o.deliveryStatus === "SEARCHING" || o.deliveryStatus === "NOT_REQUESTED");
    const offered = orders.filter((o) => o.deliveryStatus === "OFFERED");
    const inTransit = orders.filter((o) => ["ASSIGNED", "ARRIVED_AT_RESTAURANT", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.deliveryStatus));

    const summary = {
      totalActive: orders.length,
      searchingCount: searching.length,
      offeredCount: offered.length,
      inTransitCount: inTransit.length,
      onlineDriversCount: activeDrivers.length,
    };

    return res.status(200).json({
      summary,
      stats: summary,
      deliveries: orders,
      searching,
      offered,
      inTransit,
      onlineDrivers: activeDrivers,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch delivery monitor data: " + err.message });
  }
});

/**
 * Admin Delivery Manual Reassignment & Override
 */
adminRoute.post("/deliveries/:orderId/reassign", authenticate, authorizeRoles("admin"), async (req, res) => {
  const { orderId } = req.params;
  const { partnerId, reason = "Administrative reassignment" } = req.body;

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (["DELIVERED", "CANCELLED", "REJECTED"].includes(order.orderStatus)) {
      return res.status(400).json({ message: "Cannot reassign order in terminal state: " + order.orderStatus });
    }

    const now = new Date();
    if (partnerId) {
      const partner = await deliverySchema.findById(partnerId);
      if (!partner) return res.status(404).json({ message: "Target delivery partner not found." });

      order.deliverypersonid = partner._id;
      order.deliveryStatus = "ASSIGNED";
      order.deliveryOffer = {
        deliveryPartnerId: partner._id,
        offerCreatedAt: now,
        offerExpiresAt: now,
        offerState: "ACCEPTED",
      };
      order.deliveryTimeline.push({
        status: "ASSIGNED",
        timestamp: now,
        comment: `Admin manually assigned delivery to ${partner.name}. Reason: ${reason}`,
        updatedBy: "admin",
      });

      await order.save();

      if (req.io) {
        req.io.to(`delivery_${partner._id}`).emit("delivery:assigned", { orderId, order });
        req.io.to(`order_${orderId}`).emit("delivery:assigned", { orderId, order });
      }

      return res.status(200).json({ message: `Order successfully assigned to ${partner.name}`, order });
    } else {
      // Re-trigger automated candidate search
      const { dispatchNextCandidate } = require("../../services/delivery.service");
      order.deliveryStatus = "SEARCHING";
      order.deliverypersonid = null;
      order.deliveryTimeline.push({
        status: "SEARCHING",
        timestamp: now,
        comment: `Admin reset delivery to automated search. Reason: ${reason}`,
        updatedBy: "admin",
      });
      await order.save();

      dispatchNextCandidate(order._id, req.io).catch(() => {});

      return res.status(200).json({ message: "Automated delivery search re-initiated", order });
    }
  } catch (err) {
    return res.status(500).json({ message: "Failed to reassign delivery: " + err.message });
  }
});

module.exports = adminRoute;