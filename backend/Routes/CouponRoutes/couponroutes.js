const express = require("express");
const couponModel = require("../../Models/CouponSchema");
const { authenticate, authorizeRoles } = require("../../middleware/auth.middleware");

const couponRouter = express.Router();
couponRouter.use(express.json());

// Default sample coupons seed helper
async function ensureDefaultCoupons() {
  try {
    const count = await couponModel.countDocuments();
    if (count === 0) {
      await couponModel.insertMany([
        {
          code: "WELCOME50",
          title: "50% Off First Order",
          description: "Get 50% discount up to ₹150 on your first food order.",
          discountType: "percentage",
          discountValue: 50,
          maxDiscount: 150,
          minOrderAmount: 199,
          isActive: true,
        },
        {
          code: "CRAVE20",
          title: "Flat 20% Off",
          description: "Get 20% discount up to ₹100 on all orders above ₹249.",
          discountType: "percentage",
          discountValue: 20,
          maxDiscount: 100,
          minOrderAmount: 249,
          isActive: true,
        },
        {
          code: "FLAT100",
          title: "Flat ₹100 Off Mega Feast",
          description: "Flat ₹100 off on party orders above ₹500.",
          discountType: "flat",
          discountValue: 100,
          maxDiscount: 100,
          minOrderAmount: 500,
          isActive: true,
        },
      ]);
    }
  } catch (err) {
    // Non-critical seed
  }
}
ensureDefaultCoupons();

/**
 * List active public coupons
 */
couponRouter.get("/", async (req, res) => {
  try {
    const coupons = await couponModel.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json(coupons);
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching coupons: " + err.message });
  }
});

/**
 * Apply and validate coupon against a given subtotal
 */
couponRouter.post("/apply", async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code || typeof code !== "string" || typeof subtotal !== "number") {
    return res.status(400).json({ valid: false, message: "Valid coupon code and subtotal are required." });
  }

  try {
    const coupon = await couponModel.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ valid: false, message: `Coupon '${code}' is invalid or does not exist.` });
    }

    const evaluation = coupon.calculateDiscount(subtotal);
    if (!evaluation.valid) {
      return res.status(400).json(evaluation);
    }

    return res.status(200).json(evaluation);
  } catch (err) {
    return res.status(500).json({ valid: false, message: "Server error evaluating coupon: " + err.message });
  }
});

/**
 * Create a new coupon (Admin only)
 */
couponRouter.post("/", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const coupon = await couponModel.create({ ...req.body, code: (req.body.code || "").toUpperCase() });
    return res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (err) {
    return res.status(400).json({ message: "Failed to create coupon: " + err.message });
  }
});

module.exports = couponRouter;
