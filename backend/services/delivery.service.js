/**
 * CraveCart Production Delivery Orchestration Service
 * Implements Swiggy/Zomato-style independent delivery lifecycle:
 * - Distance calculation via Haversine formula
 * - Multi-factor candidate discovery & ranking
 * - Delivery offers with atomic acceptance & timeout handling
 * - Concurrency protection preventing race conditions
 * - Partner pickup, transit, and OTP-verified delivery completion
 */

const mongoose = require("mongoose");
const Order = require("../Models/OrderSchema");
const DeliveryPerson = require("../Models/Deliveryperson");
const Restaurant = require("../Models/RestaurantSchema");

// Configuration parameters
const OFFER_TIMEOUT_SECONDS = parseInt(process.env.DELIVERY_OFFER_TIMEOUT_SEC, 10) || 45;
const MAX_ACTIVE_DELIVERIES_PER_RIDER = 2;
const MAX_SEARCH_RADIUS_KM = 25;
const EXTENDED_SEARCH_RADIUS_KM = 50;
const EXPLICIT_DECLINE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes for explicit decline
const TIMEOUT_COOLDOWN_MS = 60 * 1000; // 60 seconds for missed/timed-out offer

/**
 * Calculates Great-Circle distance between two coordinates in kilometers (Haversine Formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Discovers and ranks eligible delivery partners for an order
 */
async function rankEligibleDeliveryPartners(orderOrCandidates, restCoordsOverride) {
  let partners;
  let restCoords;
  let recentlyDeclinedIds = new Set();
  let workloadMap = {};
  let orderIdStr = "in-memory";

  if (Array.isArray(orderOrCandidates)) {
    partners = orderOrCandidates.filter((p) => p.isAvailable);
    restCoords = restCoordsOverride || { lat: 12.9784, lng: 77.6408 };
  } else {
    const order = orderOrCandidates || {};
    orderIdStr = order._id ? order._id.toString() : "unknown";
    restCoords = order.restaurantCoordinates || { lat: 12.9784, lng: 77.6408 };

    // 1. Fetch available delivery partners
    partners = await DeliveryPerson.find({ isAvailable: true }).select("-password");
    if (!partners || partners.length === 0) {
      console.log(`[DISPATCH] Order ${orderIdStr}: No delivery partners are currently online (isAvailable=true).`);
      return [];
    }

    // 2. Identify recently declined or timed-out partner IDs with differentiated cooldowns
    const now = Date.now();
    const activeDeclines = (order.declinedPartners || []).filter((d) => {
      const elapsed = now - new Date(d.declinedAt).getTime();
      const isTimeout = (d.reason || "").toLowerCase().includes("timed out") || (d.reason || "").toLowerCase().includes("countdown");
      const cooldown = isTimeout ? TIMEOUT_COOLDOWN_MS : EXPLICIT_DECLINE_COOLDOWN_MS;
      return elapsed < cooldown;
    });

    recentlyDeclinedIds = new Set(activeDeclines.map((d) => d.partnerId?.toString()));

    // If ALL available partners would be filtered out by cooldown, cycle/reset so order doesn't stall
    if (recentlyDeclinedIds.size >= partners.length && partners.length > 0) {
      console.log(`[DISPATCH] Order ${orderIdStr}: All ${partners.length} available partner(s) were in cooldown; cycling/resetting cooldown to avoid stalling.`);
      recentlyDeclinedIds.clear();
    }

    // 3. Count active deliveries per partner
    const activeOrders = await Order.find({
      deliveryStatus: { $in: ["ASSIGNED", "ARRIVED_AT_RESTAURANT", "PICKED_UP", "OUT_FOR_DELIVERY"] },
      deliverypersonid: { $ne: null },
    }).select("deliverypersonid");

    for (const o of activeOrders) {
      const pid = o.deliverypersonid?.toString();
      if (pid) workloadMap[pid] = (workloadMap[pid] || 0) + 1;
    }
  }

  // Helper to score candidates given a radius limit
  const evaluateCandidates = (maxRadius) => {
    const results = [];
    for (const partner of partners) {
      const pid = partner._id.toString();

      // Skip recently declined
      if (recentlyDeclinedIds.has(pid)) continue;

      // Skip overloaded riders
      const currentWorkload = workloadMap[pid] || 0;
      if (currentWorkload >= MAX_ACTIVE_DELIVERIES_PER_RIDER) continue;

      // Calculate distance from restaurant
      const pCoords = partner.currentLocation || { lat: 12.9716, lng: 77.5946 };
      const distKm = calculateDistance(pCoords.lat, pCoords.lng, restCoords.lat, restCoords.lng);

      if (distKm > maxRadius) continue;

      // Ranking Score: Lower is better (proximity 1.5x + active jobs 2x - rating bonus)
      const score = distKm * 1.5 + currentWorkload * 2.0 - (partner.rating || 4.5);

      results.push({
        _id: partner._id,
        partner,
        distanceKm: distKm,
        workload: currentWorkload,
        dispatchScore: 100 - score,
        score,
      });
    }
    return results;
  };

  // 4. Try default radius first, expand if no candidates found
  let candidates = evaluateCandidates(MAX_SEARCH_RADIUS_KM);
  if (candidates.length === 0 && partners.length > 0) {
    candidates = evaluateCandidates(EXTENDED_SEARCH_RADIUS_KM);
    if (candidates.length > 0) {
      console.log(`[DISPATCH] Order ${orderIdStr}: Extended search radius to ${EXTENDED_SEARCH_RADIUS_KM}km; found ${candidates.length} candidate(s).`);
    }
  }

  // Sort by score ascending (best match first)
  candidates.sort((a, b) => a.score - b.score);
  console.log(`[DISPATCH] Order ${orderIdStr}: Discovered ${candidates.length} eligible partner candidate(s).`);
  return candidates;
}

/**
 * Dispatches a delivery offer to the next best eligible partner
 */
async function dispatchNextCandidate(orderId, io) {
  const order = await Order.findById(orderId)
    .populate("restaurantId", "name address coordinates")
    .populate("userid", "name address");

  if (!order) return { success: false, message: "Order not found" };

  // Terminal checks
  if (["CANCELLED", "REJECTED", "DELIVERED"].includes(order.orderStatus)) {
    return { success: false, message: `Order is already in terminal state: ${order.orderStatus}` };
  }
  if (["ASSIGNED", "ARRIVED_AT_RESTAURANT", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.deliveryStatus)) {
    return { success: false, message: `Delivery is already assigned to a partner` };
  }

  // Rank candidates
  const ranked = await rankEligibleDeliveryPartners(order);

  if (ranked.length === 0) {
    // No eligible partner currently found: maintain truthful SEARCHING state
    order.deliveryStatus = "SEARCHING";
    order.deliveryOffer = {
      deliveryPartnerId: null,
      offerCreatedAt: null,
      offerExpiresAt: null,
      offerState: "NONE",
      attemptCount: (order.deliveryOffer?.attemptCount || 0) + 1,
    };
    order.deliveryTimeline.push({
      status: "SEARCHING",
      timestamp: new Date(),
      comment: "Searching for nearby delivery partner... (No active candidates available right now)",
      updatedBy: "system",
    });
    await order.save();

    if (io) {
      io.to(`order_${orderId}`).emit("delivery:status_update", {
        orderId,
        deliveryStatus: "SEARCHING",
        message: "Searching for nearby delivery partner...",
      });
      io.to(`user_${order.userid?._id || order.userid}`).emit("delivery:status_update", {
        orderId,
        deliveryStatus: "SEARCHING",
        message: "Searching for nearby delivery partner...",
      });
    }

    return { success: true, status: "SEARCHING", message: "Searching for eligible delivery partner" };
  }

  // Best candidate selected
  const chosen = ranked[0];
  const partner = chosen.partner;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OFFER_TIMEOUT_SECONDS * 1000);
  const attempt = (order.deliveryOffer?.attemptCount || 0) + 1;

  order.deliveryStatus = "OFFERED";
  order.deliveryOffer = {
    deliveryPartnerId: partner._id,
    offerCreatedAt: now,
    offerExpiresAt: expiresAt,
    offerState: "PENDING",
    attemptCount: attempt,
  };
  order.deliveryTimeline.push({
    status: "OFFERED",
    timestamp: now,
    comment: `Delivery offer #${attempt} dispatched to ${partner.name} (${chosen.distanceKm} km away). Expires in ${OFFER_TIMEOUT_SECONDS}s.`,
    updatedBy: "system",
  });
  await order.save();

  // Construct safe offer payload for delivery partner (minimal privacy-preserving info)
  const offerPayload = {
    orderId: order._id,
    restaurantName: order.restaurantId?.name || "Kitchen Partner",
    restaurantAddress: order.restaurantId?.address || "Pickup Point",
    restaurantCoordinates: order.restaurantCoordinates || { lat: 12.9784, lng: 77.6408 },
    deliveryArea: order.address?.split(",")?.slice(-2)?.join(",")?.trim() || "Customer Location",
    distanceKm: chosen.distanceKm,
    estimatedPayout: Math.round(40 + chosen.distanceKm * 6),
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: OFFER_TIMEOUT_SECONDS,
  };

  if (io) {
    // Notify candidate partner
    io.to(`delivery_${partner._id}`).emit("delivery:offer_received", offerPayload);
    // Notify order room
    io.to(`order_${orderId}`).emit("delivery:status_update", {
      orderId,
      deliveryStatus: "OFFERED",
      message: "Delivery offer sent to nearby partner. Awaiting confirmation...",
    });
  }

  return { success: true, status: "OFFERED", partnerId: partner._id, offer: offerPayload };
}

/**
 * Accepts a delivery offer atomically (prevents concurrent assignment races)
 */
async function acceptDeliveryOffer(orderId, partnerId, io) {
  const now = new Date();

  // Atomic conditional update: order must be OFFERED, offered to partnerId, and unexpired
  const partnerObjectId = mongoose.Types.ObjectId.isValid(partnerId)
    ? new mongoose.Types.ObjectId(partnerId)
    : partnerId;

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      deliveryStatus: "OFFERED",
      "deliveryOffer.deliveryPartnerId": { $in: [partnerId, partnerObjectId] },
      "deliveryOffer.offerState": "PENDING",
      "deliveryOffer.offerExpiresAt": { $gt: now },
    },
    {
      $set: {
        deliveryStatus: "ASSIGNED",
        "deliveryOffer.offerState": "ACCEPTED",
        deliverypersonid: partnerObjectId,
      },
      $push: {
        deliveryTimeline: {
          status: "ASSIGNED",
          timestamp: now,
          comment: "Delivery offer accepted by partner.",
          updatedBy: "delivery_partner",
        },
      },
    },
    { new: true }
  )
    .populate("deliverypersonid", "name phonenumber vehicleType rating currentLocation")
    .populate("userid", "name phonenumber address")
    .populate("restaurantId", "name address coordinates phonenumber");

  if (!updatedOrder) {
    // Offer either expired, cancelled, or accepted by someone else
    return {
      success: false,
      conflict: true,
      message: "Offer is no longer available. It may have expired or been reassigned.",
    };
  }

  // Emit real-time events to all relevant parties
  if (io) {
    const assignedPayload = {
      orderId: updatedOrder._id,
      deliveryStatus: "ASSIGNED",
      deliveryPerson: {
        id: updatedOrder.deliverypersonid?._id,
        name: updatedOrder.deliverypersonid?.name,
        phone: updatedOrder.deliverypersonid?.phonenumber,
        vehicleType: updatedOrder.deliverypersonid?.vehicleType,
        rating: updatedOrder.deliverypersonid?.rating,
      },
    };

    io.to(`order_${orderId}`).emit("delivery:assigned", assignedPayload);
    io.to(`user_${updatedOrder.userid?._id || updatedOrder.userid}`).emit("delivery:assigned", assignedPayload);
    if (updatedOrder.restaurantId?._id) {
      io.to(`restaurant_${updatedOrder.restaurantId._id}`).emit("delivery:assigned", assignedPayload);
    }
    io.to(`delivery_${partnerId}`).emit("delivery:assignment_confirmed", {
      orderId: updatedOrder._id,
      order: updatedOrder,
    });
    // Emit legacy event for backwards compatibility with existing UI components
    io.to(`delivery_${partnerId}`).emit("updatingDelivery", {
      orderId: updatedOrder._id,
      order: updatedOrder,
    });
  }

  // Trigger dispatch queue processor for any other orders waiting in SEARCHING
  processPendingDispatches(io).catch(() => {});

  return { success: true, order: updatedOrder };
}

/**
 * Declines a delivery offer and dispatches to next eligible candidate
 */
async function declineDeliveryOffer(orderId, partnerId, reason = "Declined by partner", io) {
  const order = await Order.findById(orderId);
  if (!order) return { success: false, message: "Order not found" };

  if (
    order.deliveryStatus === "OFFERED" &&
    order.deliveryOffer?.deliveryPartnerId?.toString() === partnerId.toString()
  ) {
    order.deliveryOffer.offerState = "DECLINED";
    order.declinedPartners.push({
      partnerId: new mongoose.Types.ObjectId(partnerId),
      declinedAt: new Date(),
      reason,
    });
    order.deliveryTimeline.push({
      status: "OFFER_DECLINED",
      timestamp: new Date(),
      comment: `Offer declined by partner: ${reason}`,
      updatedBy: "delivery_partner",
    });
    order.deliveryStatus = "SEARCHING";
    await order.save();

    // Trigger dispatch to next best candidate immediately
    dispatchNextCandidate(orderId, io).catch((err) =>
      console.error("Next dispatch attempt error:", err.message)
    );

    return { success: true, message: "Offer declined successfully" };
  }

  return { success: false, message: "No active offer matching this partner" };
}

/**
 * Background sweeper and queue processor for orders waiting in SEARCHING state
 */
async function processPendingDispatches(io) {
  try {
    const pendingOrders = await Order.find({
      orderStatus: { $in: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"] },
      deliveryStatus: "SEARCHING",
      "deliveryOffer.offerState": { $ne: "PENDING" },
    }).sort({ createdAt: 1 }).limit(10);

    if (pendingOrders.length > 0) {
      console.log(`[DISPATCH] Processing ${pendingOrders.length} pending SEARCHING order(s)...`);
      for (const order of pendingOrders) {
        await dispatchNextCandidate(order._id, io);
      }
    }
  } catch (err) {
    console.error("[DISPATCH] Error in processPendingDispatches:", err.message);
  }
}

/**
 * Sweeper function to expire timed-out offers, re-dispatch, and process waiting SEARCHING orders
 */
async function checkAndExpireOffers(io) {
  const now = new Date();
  const expiredOrders = await Order.find({
    deliveryStatus: "OFFERED",
    "deliveryOffer.offerState": "PENDING",
    "deliveryOffer.offerExpiresAt": { $lte: now },
  });

  for (const order of expiredOrders) {
    const expiredPartnerId = order.deliveryOffer?.deliveryPartnerId;
    order.deliveryOffer.offerState = "EXPIRED";
    if (expiredPartnerId) {
      order.declinedPartners.push({
        partnerId: expiredPartnerId,
        declinedAt: now,
        reason: "Offer timed out (no response within countdown)",
      });
    }
    order.deliveryTimeline.push({
      status: "OFFER_EXPIRED",
      timestamp: now,
      comment: "Delivery offer timed out without acceptance.",
      updatedBy: "system",
    });
    order.deliveryStatus = "SEARCHING";
    await order.save();

    if (io && expiredPartnerId) {
      io.to(`delivery_${expiredPartnerId}`).emit("delivery:offer_expired", {
        orderId: order._id,
        message: "Offer timed out.",
      });
    }

    // Attempt next candidate
    dispatchNextCandidate(order._id, io).catch((e) =>
      console.warn("Expiry re-dispatch notice:", e.message)
    );
  }

  // Also sweep and process orders waiting in SEARCHING state
  await processPendingDispatches(io);
}

/**
 * Handles Partner Arrival at Restaurant
 */
async function markArrivedAtRestaurant(orderId, partnerId, io) {
  const order = await Order.findOne({
    _id: orderId,
    deliverypersonid: partnerId,
    deliveryStatus: "ASSIGNED",
  });

  if (!order) {
    return { success: false, message: "Order not found or invalid delivery state for arrival." };
  }

  order.deliveryStatus = "ARRIVED_AT_RESTAURANT";
  order.deliveryTimeline.push({
    status: "ARRIVED_AT_RESTAURANT",
    timestamp: new Date(),
    comment: "Delivery partner arrived at kitchen.",
    updatedBy: "delivery_partner",
  });
  await order.save();

  if (io) {
    io.to(`order_${orderId}`).emit("delivery:partner_arrived", { orderId });
    io.to(`user_${order.userid}`).emit("delivery:partner_arrived", { orderId });
    if (order.restaurantId) {
      io.to(`restaurant_${order.restaurantId}`).emit("delivery:partner_arrived", { orderId });
    }
  }

  return { success: true, order };
}

/**
 * Handles Food Pickup by Delivery Partner
 */
async function confirmPickup(orderId, partnerId, io) {
  const order = await Order.findOne({
    _id: orderId,
    deliverypersonid: partnerId,
  });

  if (!order) return { success: false, message: "Order not found or not assigned to you." };

  if (["DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
    return { success: false, message: "Cannot pick up an already completed or cancelled order." };
  }

  const now = new Date();
  order.orderStatus = "PICKED_UP";
  order.status = "Picked Up";
  order.deliveryStatus = "OUT_FOR_DELIVERY";

  order.statusHistory.push({
    status: "Picked Up",
    timestamp: now,
    comment: "Food picked up from restaurant by delivery partner.",
    updatedBy: "delivery_partner",
  });

  order.deliveryTimeline.push({
    status: "OUT_FOR_DELIVERY",
    timestamp: now,
    comment: "Delivery partner picked up food and is heading to customer.",
    updatedBy: "delivery_partner",
  });

  await order.save();

  if (io) {
    const payload = {
      orderId: order._id,
      orderStatus: "PICKED_UP",
      deliveryStatus: "OUT_FOR_DELIVERY",
      status: "Picked Up",
    };
    io.to(`order_${orderId}`).emit("delivery:picked_up", payload);
    io.to(`user_${order.userid}`).emit("delivery:picked_up", payload);
  }

  return { success: true, order };
}

/**
 * Handles Delivery Completion with optional OTP verification
 */
async function confirmDeliveryCompletion(orderId, partnerId, otp, io) {
  const order = await Order.findOne({
    _id: orderId,
    deliverypersonid: partnerId,
  });

  if (!order) return { success: false, message: "Order not found or not assigned to you." };

  if (order.orderStatus === "DELIVERED") {
    return { success: true, message: "Order is already marked delivered (idempotent).", order };
  }

  if (order.deliveryStatus !== "OUT_FOR_DELIVERY" && order.deliveryStatus !== "ARRIVED_AT_CUSTOMER") {
    return { success: false, message: "Order cannot be delivered before being picked up and out for delivery." };
  }

  // Validate OTP if customer delivery OTP is configured
  if (order.deliveryOtp && otp) {
    if (order.deliveryOtp.trim() !== otp.trim()) {
      return { success: false, message: "Invalid delivery OTP. Please verify with customer." };
    }
  }

  const now = new Date();
  order.orderStatus = "DELIVERED";
  order.status = "Delivered";
  order.deliveryStatus = "DELIVERED";
  order.paymentStatus = "Paid";

  order.statusHistory.push({
    status: "Delivered",
    timestamp: now,
    comment: "Order successfully delivered to customer.",
    updatedBy: "delivery_partner",
  });

  order.deliveryTimeline.push({
    status: "DELIVERED",
    timestamp: now,
    comment: "Delivery completed successfully.",
    updatedBy: "delivery_partner",
  });

  await order.save();

  // Increment delivery partner stats
  try {
    await DeliveryPerson.findByIdAndUpdate(partnerId, {
      $inc: { totalDeliveries: 1 },
    });
  } catch (e) {
    // Non-fatal stat update
  }

  if (io) {
    const payload = {
      orderId: order._id,
      orderStatus: "DELIVERED",
      deliveryStatus: "DELIVERED",
      status: "Delivered",
    };
    io.to(`order_${orderId}`).emit("delivery:delivered", payload);
    io.to(`user_${order.userid}`).emit("delivery:delivered", payload);
  }

  // Delivery completed: partner capacity freed up, check if other pending orders are waiting
  processPendingDispatches(io).catch(() => {});

  return { success: true, order };
}

module.exports = {
  calculateDistance,
  rankEligibleDeliveryPartners,
  dispatchNextCandidate,
  acceptDeliveryOffer,
  declineDeliveryOffer,
  processPendingDispatches,
  checkAndExpireOffers,
  markArrivedAtRestaurant,
  confirmPickup,
  confirmDeliveryCompletion,
  OFFER_TIMEOUT_SECONDS,
};
