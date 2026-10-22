const express = require("express");
const deliverySchema = require("../../Models/Deliveryperson");
const orderSchema = require("../../Models/OrderSchema");
const { signToken } = require("../../config/auth.config");
const { authenticate, authorizeRoles } = require("../../middleware/auth.middleware");
const { startDeliverySimulation, stopDeliverySimulation } = require("../../services/socket.service");
const { sendStatusUpdate } = require("../../services/email.service");
const {
  acceptDeliveryOffer,
  declineDeliveryOffer,
  dispatchNextCandidate,
  processPendingDispatches,
  markArrivedAtRestaurant,
  confirmPickup,
  confirmDeliveryCompletion,
} = require("../../services/delivery.service");

const deliveryroute = express.Router();
deliveryroute.use(express.json());

/**
 * Delivery Person Registration
 */
deliveryroute.post("/signin", async (req, res) => {
  const deliveryperson = { ...req.body };

  try {
    const existing = await deliverySchema.findOne({ email: deliveryperson.email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered for delivery partner." });
    }

    const created = await deliverySchema.create({ ...deliveryperson });
    return res.status(200).json({ message: "Registration Success", id: created._id });
  } catch (err) {
    return res.status(500).json({ message: "Registration Failed: " + err.message });
  }
});

/**
 * Delivery Person Login
 */
deliveryroute.post("/login", async (req, res) => {
  const enteredemail = (req.body.email || "").trim().toLowerCase();
  const enteredpassword = req.body.password;

  try {
    const result = await deliverySchema.findOne({ email: enteredemail });

    if (result) {
      const isMatch = await result.comparepassword(enteredpassword);

      if (isMatch) {
        const token = signToken({
          email: result.email,
          id: result._id,
          role: result.role || "deliveryperson",
        });

        return res.status(200).json({
          message: "Login Success",
          email: result.email,
          id: result._id,
          name: result.name,
          role: result.role || "deliveryperson",
          token: token,
        });
      } else {
        return res.status(400).json({ message: "Invalid Password Credentials" });
      }
    } else {
      return res.status(400).json({ message: "Invalid Email Credentials" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Server Error " + err.message });
  }
});

/**
 * Display Delivery Person Profile
 */
deliveryroute.get("/view/:id", authenticate, async (req, res) => {
  const delpersonid = req.params.id;

  try {
    const result = await deliverySchema.findById(delpersonid).select("-password");
    if (!result) return res.status(404).json({ message: "Delivery partner not found." });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Update Delivery Person Profile
 */
deliveryroute.put("/update/:id", authenticate, async (req, res) => {
  const delperson = { ...req.body };
  const delpersonid = req.params.id;

  try {
    await deliverySchema.findByIdAndUpdate(delpersonid, { ...delperson });
    return res.status(200).json({ message: "Update Success Please Login to Continue" });
  } catch (err) {
    return res.status(500).json({ message: "Error Try Again Later : " + err.message });
  }
});

/**
 * Toggle Delivery Partner Availability
 */
deliveryroute.patch("/availability/:id", authenticate, async (req, res) => {
  const delpersonid = req.params.id;
  const { isAvailable } = req.body;

  try {
    const updated = await deliverySchema.findByIdAndUpdate(
      delpersonid,
      { $set: { isAvailable: Boolean(isAvailable) } },
      { new: true }
    );

    // If driver became available, immediately process any waiting SEARCHING orders
    if (updated.isAvailable) {
      processPendingDispatches(req.io).catch(() => {});
    }

    return res.status(200).json({
      message: `Status updated: You are now ${updated.isAvailable ? "Online (Accepting Orders)" : "Offline"}`,
      isAvailable: updated.isAvailable,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update availability: " + err.message });
  }
});

/**
 * Assigned Order History for Delivery Partner
 */
deliveryroute.get("/order/:id", authenticate, async (req, res) => {
  const deliverypersonid = req.params.id;

  try {
    const result = await orderSchema
      .find({ deliverypersonid: deliverypersonid })
      .populate("userid", "-password")
      .populate({ path: "menuid", populate: { path: "restaurantid" } })
      .populate("deliverypersonid", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server Error " + err.message });
  }
});

/**
 * Get Active Incoming Delivery Offer for Partner
 */
deliveryroute.get("/offers/:partnerId", authenticate, async (req, res) => {
  const { partnerId } = req.params;

  try {
    const mongoose = require("mongoose");
    const partnerObjectId = mongoose.Types.ObjectId.isValid(partnerId)
      ? new mongoose.Types.ObjectId(partnerId)
      : partnerId;

    const activeOfferOrder = await orderSchema
      .findOne({
        deliveryStatus: "OFFERED",
        "deliveryOffer.deliveryPartnerId": partnerObjectId,
        "deliveryOffer.offerState": "PENDING",
        "deliveryOffer.offerExpiresAt": { $gt: new Date() },
      })
      .populate("restaurantId", "name address coordinates")
      .populate({ path: "menuid", populate: { path: "restaurantid" } });

    if (!activeOfferOrder) {
      return res.status(200).json({ hasOffer: false, offer: null });
    }

    const rest = activeOfferOrder.restaurantId || activeOfferOrder.menuid?.restaurantid;
    const now = new Date();
    const remainingSeconds = Math.max(
      0,
      Math.round((new Date(activeOfferOrder.deliveryOffer.offerExpiresAt).getTime() - now.getTime()) / 1000)
    );

    const offer = {
      orderId: activeOfferOrder._id,
      restaurantName: rest?.name || "Kitchen Partner",
      restaurantAddress: rest?.address || "Pickup Location",
      restaurantCoordinates: activeOfferOrder.restaurantCoordinates || rest?.coordinates,
      customerAddress: activeOfferOrder.address,
      itemCount: activeOfferOrder.items?.length || 1,
      totalAmount: activeOfferOrder.totalAmount || activeOfferOrder.price,
      estimatedPayout: Math.round(45 + (activeOfferOrder.deliveryFee || 50) * 0.7),
      expiresAt: activeOfferOrder.deliveryOffer.offerExpiresAt,
      remainingSeconds,
      expiresInSeconds: remainingSeconds,
    };

    return res.status(200).json({ hasOffer: true, offer });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch offers: " + err.message });
  }
});

/**
 * Accept Delivery Offer
 */
deliveryroute.post("/offers/:orderId/accept", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const partnerId = req.user?.id || req.user?._id || req.body?.deliveryPartnerId;

  try {
    const result = await acceptDeliveryOffer(orderId, partnerId, req.io);
    if (!result.success) {
      const statusCode = result.conflict ? 409 : 400;
      return res.status(statusCode).json({ message: result.message });
    }

    return res.status(200).json({
      message: "Delivery accepted! Proceed to restaurant for pickup.",
      order: result.order,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to accept offer: " + err.message });
  }
});

/**
 * Decline Delivery Offer
 */
deliveryroute.post("/offers/:orderId/decline", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const partnerId = req.user?.id || req.user?._id || req.body?.deliveryPartnerId;
  const { reason = "Declined by rider" } = req.body;

  try {
    const result = await declineDeliveryOffer(orderId, partnerId, reason, req.io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to decline offer: " + err.message });
  }
});

/**
 * Partner Arrived at Restaurant
 */
deliveryroute.post("/order/:orderId/arrived", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const partnerId = req.user?.id || req.user?._id || req.body?.deliveryPartnerId;

  try {
    const result = await markArrivedAtRestaurant(orderId, partnerId, req.io);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.status(200).json({ message: "Arrival recorded. Awaiting food package.", order: result.order });
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark arrival: " + err.message });
  }
});

/**
 * Confirm Food Pickup
 */
deliveryroute.post("/order/:orderId/pickup", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const partnerId = req.user?.id || req.user?._id || req.body?.deliveryPartnerId;

  try {
    const result = await confirmPickup(orderId, partnerId, req.io);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.status(200).json({ message: "Food picked up! Heading to customer.", order: result.order });
  } catch (err) {
    return res.status(500).json({ message: "Failed to confirm pickup: " + err.message });
  }
});

/**
 * Confirm Delivery Completion (with optional customer OTP verification)
 */
deliveryroute.post("/order/:orderId/complete", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const partnerId = req.user?.id || req.user?._id || req.body?.deliveryPartnerId;
  const { otp } = req.body;

  try {
    const result = await confirmDeliveryCompletion(orderId, partnerId, otp, req.io);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.status(200).json({ message: "Order delivered successfully! Payout credited.", order: result.order });
  } catch (err) {
    return res.status(500).json({ message: "Failed to complete delivery: " + err.message });
  }
});

/**
 * Live GPS Location Broadcast from Delivery Partner
 */
deliveryroute.post("/location", authenticate, async (req, res) => {
  const partnerId = req.user.id;
  const { lat, lng, speed = 0, heading = 0 } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude are required." });
  }

  try {
    const now = new Date();
    await deliverySchema.findByIdAndUpdate(partnerId, {
      $set: {
        currentLocation: { lat, lng, updatedAt: now },
      },
    });

    // Update coordinates on any active deliveries
    const activeOrder = await orderSchema.findOne({
      deliverypersonid: partnerId,
      deliveryStatus: { $in: ["ASSIGNED", "ARRIVED_AT_RESTAURANT", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    });

    if (activeOrder) {
      activeOrder.deliveryLocation = { lat, lng, heading, speed, updatedAt: now };
      await activeOrder.save();

      if (req.io) {
        req.io.to(`order_${activeOrder._id}`).emit("tracking:update", {
          orderId: activeOrder._id,
          lat,
          lng,
          speed,
          heading,
          isSimulated: false,
          updatedAt: now,
        });
      }
    } else {
      // Driver is moving and has capacity; check if any orders are waiting for a rider
      processPendingDispatches(req.io).catch(() => {});
    }

    return res.status(200).json({ success: true, message: "Location updated" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update location: " + err.message });
  }
});

/**
 * Manual/Authorized Dispatch Trigger & Retry for Order
 * Allows admin, restaurant, or delivery services to re-evaluate candidate discovery
 */
deliveryroute.post("/dispatch/:orderId", authenticate, async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await dispatchNextCandidate(orderId, req.io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Dispatch trigger failed: " + err.message });
  }
});

/**
 * Legacy Status Endpoint (Mapped safely to new lifecycle)
 */
deliveryroute.patch("/order/status/:orderId", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const { status, otp } = req.body;
  const partnerId = req.user.id;

  if (status === "Out for Delivery" || status === "Picked Up") {
    const resPick = await confirmPickup(orderId, partnerId, req.io);
    if (!resPick.success) return res.status(400).json({ message: resPick.message });
    return res.status(200).json({ message: "Status updated to Out for Delivery", order: resPick.order });
  }

  if (status === "Delivered") {
    const resDel = await confirmDeliveryCompletion(orderId, partnerId, otp, req.io);
    if (!resDel.success) return res.status(400).json({ message: resDel.message });
    return res.status(200).json({ message: "Status updated to Delivered", order: resDel.order });
  }

  return res.status(400).json({ message: "Invalid status transition request for delivery partner." });
});

/**
 * Development / Demonstration Delivery Route Simulation Endpoint
 */
deliveryroute.post("/simulate/:orderId", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const { intervalMs = 2000, stepCount = 15 } = req.body;

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const startCoords = order.restaurantCoordinates || { lat: 12.9650, lng: 77.5880 };
    const endCoords = order.customerCoordinates || { lat: 12.9780, lng: 77.6010 };

    startDeliverySimulation(orderId, startCoords, endCoords, stepCount, intervalMs);

    return res.status(200).json({
      message: "Delivery simulation started successfully. Listening on room 'order_" + orderId + "'.",
      isSimulated: true,
      simulationNotice: "DEMO / SIMULATED TRACKING ACTIVE",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to start simulation: " + err.message });
  }
});

/**
 * Stop Delivery Simulation
 */
deliveryroute.post("/simulate-stop/:orderId", authenticate, (req, res) => {
  const { orderId } = req.params;
  stopDeliverySimulation(orderId);
  return res.status(200).json({ message: "Delivery simulation stopped." });
});

module.exports = deliveryroute;
