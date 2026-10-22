const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "menuitems",
    required: true,
  },
  name: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  image: { type: String },
  restaurantid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "restaurant",
  },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String, default: "" },
  updatedBy: { type: String, default: "system" },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    // Retained for legacy single-item backwards compatibility
    menuid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "menuitems",
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    // Enhanced multi-item order support
    items: [orderItemSchema],

    // Order status state machine
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready for Pickup", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Preparing",
    },
    statusHistory: [statusHistorySchema],

    // Payment details
    paymentmethod: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    // Financial breakdown
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 60 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    totalAmount: { type: Number, default: 0 },

    // Address and delivery instructions
    address: {
      type: String,
      required: true,
    },
    deliveryNotes: { type: String, default: "" },

    deliverypersonid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "deliveryperson",
      default: null,
    },

    // Real-time tracking coordinates & status
    deliveryLocation: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
      updatedAt: { type: Date, default: Date.now },
      heading: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
    customerCoordinates: {
      lat: { type: Number, default: 12.9780 },
      lng: { type: Number, default: 77.6010 },
    },
    restaurantCoordinates: {
      lat: { type: Number, default: 12.9650 },
      lng: { type: Number, default: 77.5880 },
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true }
);

// Auto-populate helper and total calculation
orderSchema.pre("save", function (next) {
  if (!this.totalAmount || this.totalAmount === 0) {
    this.totalAmount = (this.price * (this.quantity || 1)) + (this.deliveryFee || 0) - (this.discountAmount || 0);
  }
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date(),
      comment: "Order initial status",
      updatedBy: "system",
    }];
  }
  next();
});

const orderModel = mongoose.model("orders", orderSchema);

module.exports = orderModel;