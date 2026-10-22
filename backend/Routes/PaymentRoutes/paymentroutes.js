const express = require("express");
const menuModel = require("../../Models/Menuitems");
const couponModel = require("../../Models/CouponSchema");
const orderModel = require("../../Models/OrderSchema");
const { authenticate } = require("../../middleware/auth.middleware");
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  KEY_ID,
} = require("../../services/razorpay.service");

const paymentRouter = express.Router();
paymentRouter.use(express.json());

/**
 * Public config endpoint: exposes the Razorpay test key ID safely to the client
 */
paymentRouter.get("/config", (req, res) => {
  return res.status(200).json({ keyId: KEY_ID });
});

/**
 * Server-authoritative Order Creation for Razorpay Checkout
 */
paymentRouter.post("/create-order", authenticate, async (req, res) => {
  const { items, couponCode } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Cart items are required to initiate payment." });
  }

  try {
    let subtotal = 0;

    // Fetch authoritative menu item prices directly from MongoDB
    for (const item of items) {
      const menuid = item.menuid?._id || item.menuid;
      const dbItem = await menuModel.findById(menuid);
      if (!dbItem) {
        return res.status(404).json({ message: `Menu item '${item.name || menuid}' is no longer available.` });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      subtotal += dbItem.price * qty;
    }

    const deliveryFee = 60;
    let discountAmount = 0;

    // Authoritative coupon evaluation
    if (couponCode && typeof couponCode === "string") {
      const coupon = await couponModel.findOne({ code: couponCode.trim().toUpperCase() });
      if (coupon) {
        const discountResult = coupon.calculateDiscount(subtotal);
        if (discountResult.valid) {
          discountAmount = discountResult.discountAmount;
        }
      }
    }

    const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

    const receipt = `rcpt_${Date.now()}_${(req.user.id || "").toString().slice(-4)}`;
    const razorpayOrder = await createRazorpayOrder({
      amountInRupees: finalTotal,
      receipt,
      notes: {
        userId: req.user.id,
        itemCount: items.length,
      },
    });

    return res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount: finalTotal,
      keyId: KEY_ID,
      isMock: razorpayOrder.isMock,
    });
  } catch (err) {
    console.error("Payment order creation failed:", err.message);
    return res.status(500).json({ message: "Failed to initiate payment gateway order: " + err.message });
  }
});

/**
 * Server-side payment signature verification
 */
paymentRouter.post("/verify", authenticate, async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: "Missing Razorpay payment verification parameters." });
  }

  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    return res.status(400).json({ message: "Invalid payment signature verification failed." });
  }

  try {
    if (orderId) {
      await orderModel.findByIdAndUpdate(orderId, {
        $set: {
          paymentStatus: "Paid",
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        },
        $push: {
          statusHistory: {
            status: "Payment Confirmed",
            timestamp: new Date(),
            comment: `Razorpay test payment ${razorpayPaymentId} verified successfully.`,
            updatedBy: "razorpay_gateway",
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment successfully verified and recorded.",
      paymentId: razorpayPaymentId,
    });
  } catch (err) {
    console.error("Error recording verified payment:", err.message);
    return res.status(500).json({ message: "Server error recording payment: " + err.message });
  }
});

/**
 * Razorpay Webhook Endpoint
 */
paymentRouter.post("/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (process.env.RAZORPAY_WEBHOOK_SECRET) {
    const isWebhookValid = verifyWebhookSignature(req.body, signature);
    if (!isWebhookValid) {
      return res.status(400).json({ message: "Invalid webhook signature." });
    }
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;

  if (event === "payment.captured" && paymentEntity) {
    try {
      const orderId = paymentEntity.notes?.orderId;
      if (orderId) {
        await orderModel.findByIdAndUpdate(orderId, {
          $set: {
            paymentStatus: "Paid",
            razorpayPaymentId: paymentEntity.id,
          },
        });
      }
    } catch (e) {
      console.warn("Webhook processing notice:", e.message);
    }
  }

  return res.status(200).json({ status: "ok" });
});

module.exports = paymentRouter;
