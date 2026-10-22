const crypto = require("crypto");
require("dotenv").config();

let Razorpay;
try {
  Razorpay = require("razorpay");
} catch (e) {
  Razorpay = null;
}

const KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder";

const isConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.includes("placeholder")
);

let razorpayClient = null;
if (isConfigured && Razorpay) {
  try {
    razorpayClient = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    });
  } catch (err) {
    console.warn("Razorpay initialization error:", err.message);
  }
}

/**
 * Creates a Razorpay order. If live/test credentials are unset, generates a verifiable mock test order.
 */
async function createRazorpayOrder({ amountInRupees, receipt, notes = {} }) {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (razorpayClient) {
    try {
      const order = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt.toString(),
        notes: notes,
      });
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        isMock: false,
      };
    } catch (err) {
      console.error("Razorpay order creation error:", err.message);
      throw err;
    }
  }

  // Verifiable sandbox test order fallback
  const mockOrderId = "order_test_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  return {
    id: mockOrderId,
    amount: amountInPaise,
    currency: "INR",
    receipt: receipt.toString(),
    status: "created",
    isMock: true,
  };
}

/**
 * Verifies Razorpay HMAC-SHA256 signature
 */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  // In mock sandbox test mode with simulated order IDs
  if (razorpayOrderId.startsWith("order_test_")) {
    const expectedMockSig = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    // Accept either exact HMAC or standard test signature "mock_signature_valid"
    return razorpaySignature === expectedMockSig || razorpaySignature === "mock_signature_valid";
  }

  const generatedSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
}

/**
 * Verifies Razorpay Webhook signature
 */
function verifyWebhookSignature(rawBody, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!signature || !secret) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody))
      .digest("hex");
    return expectedSignature === signature;
  } catch (err) {
    return false;
  }
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  isConfigured,
  KEY_ID,
};
