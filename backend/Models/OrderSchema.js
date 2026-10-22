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

    // 1. Order & Kitchen Lifecycle State Machine
    orderStatus: {
      type: String,
      enum: ["PLACED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERED", "CANCELLED", "REJECTED"],
      default: "PLACED",
    },
    // Backward-compatible synced status string
    status: {
      type: String,
      enum: ["Pending", "Placed", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "Out for Delivery", "Delivered", "Cancelled", "Rejected"],
      default: "Placed",
    },
    statusHistory: [statusHistorySchema],
    rejectionReason: { type: String, default: "" },

    // 2. Delivery Orchestration Lifecycle State Machine
    deliveryStatus: {
      type: String,
      enum: [
        "NOT_REQUESTED",
        "SEARCHING",
        "OFFERED",
        "ASSIGNED",
        "ARRIVED_AT_RESTAURANT",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "ARRIVED_AT_CUSTOMER",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
      ],
      default: "NOT_REQUESTED",
    },
    deliveryTimeline: [statusHistorySchema],

    // Active delivery offer tracking
    deliveryOffer: {
      deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "deliveryperson",
        default: null,
      },
      offerCreatedAt: { type: Date, default: null },
      offerExpiresAt: { type: Date, default: null },
      offerState: {
        type: String,
        enum: ["NONE", "PENDING", "ACCEPTED", "DECLINED", "EXPIRED"],
        default: "NONE",
      },
      attemptCount: { type: Number, default: 0 },
    },

    // Candidates who declined or timed out for this order
    declinedPartners: [
      {
        partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "deliveryperson" },
        declinedAt: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
      },
    ],

    // Customer delivery confirmation OTP
    deliveryOtp: { type: String, default: null },

    // Restaurant Association
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurant",
      default: null,
    },

    // Payment details
    paymentmethod: {
      type: String,
      enum: ["COD", "Online", "Cash on Delivery"],
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

// Auto-populate helper, OTP generation, and total calculation
orderSchema.pre("save", function (next) {
  if (!this.totalAmount || this.totalAmount === 0) {
    this.totalAmount = (this.price * (this.quantity || 1)) + (this.deliveryFee || 0) - (this.discountAmount || 0);
  }

  // Generate 4-digit Delivery Confirmation PIN if not set
  if (!this.deliveryOtp) {
    this.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Keep legacy status field in sync with orderStatus
  const statusMap = {
    PLACED: "Placed",
    ACCEPTED: "Accepted",
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready for Pickup",
    PICKED_UP: "Picked Up",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
  };
  if (this.orderStatus && statusMap[this.orderStatus]) {
    this.status = statusMap[this.orderStatus];
  }

  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [
      {
        status: this.status,
        timestamp: new Date(),
        comment: "Order placed by customer.",
        updatedBy: "customer",
      },
    ];
  }

  if (!this.deliveryTimeline || this.deliveryTimeline.length === 0) {
    this.deliveryTimeline = [
      {
        status: this.deliveryStatus || "NOT_REQUESTED",
        timestamp: new Date(),
        comment: "Delivery not yet requested.",
        updatedBy: "system",
      },
    ];
  }

  next();
});

const orderModel = mongoose.model("orders", orderSchema);

module.exports = orderModel;