const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscount: {
      type: Number,
      default: 200,
    },
    minOrderAmount: {
      type: Number,
      default: 149,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    usageLimit: {
      type: Number,
      default: 10000,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

couponSchema.methods.calculateDiscount = function (subtotal) {
  if (!this.isActive) {
    return { valid: false, message: "Coupon is no longer active." };
  }
  if (this.validUntil && new Date() > this.validUntil) {
    return { valid: false, message: "Coupon has expired." };
  }
  if (subtotal < this.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${this.minOrderAmount} required for coupon ${this.code}.`,
    };
  }

  let discount = 0;
  if (this.discountType === "percentage") {
    discount = Math.round((subtotal * this.discountValue) / 100);
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = Math.min(this.discountValue, subtotal);
  }

  return {
    valid: true,
    code: this.code,
    discountAmount: discount,
    finalAmount: Math.max(0, subtotal - discount),
  };
};

const couponModel = mongoose.model("coupons", couponSchema);

module.exports = couponModel;
