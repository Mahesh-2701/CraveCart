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

module.exports = adminRoute;