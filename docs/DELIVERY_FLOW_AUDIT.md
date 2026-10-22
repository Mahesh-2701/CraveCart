# CraveCart — Delivery & Order Orchestration Architecture Audit
**Document**: `docs/DELIVERY_FLOW_AUDIT.md`  
**Date**: October 2026  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## 1. Executive Summary

An exhaustive audit of CraveCart's existing ordering and delivery architecture was conducted across the React frontend, Node.js/Express backend, Socket.IO real-time channels, and MongoDB database models.

The current system exhibits critical architectural anti-patterns common in early prototypes:
1. **Coupled Lifecycle**: Order status, kitchen preparation, and delivery progress are conflated into a single flat `status` string (`Pending`, `Preparing`, `Ready for Pickup`, `Out for Delivery`, `Delivered`).
2. **Premature & Arbitrary Assignment**: When a customer places an order, the backend executes `deliverySchema.findOne({ isAvailable: true })` and instantly assigns whatever delivery partner appears first in the database, before the restaurant has even seen or accepted the order.
3. **Improper Role Authority**: The restaurant dashboard contains a dropdown (`<select>`) that allows the restaurant owner to unilaterally set order status to `Out for Delivery` and `Delivered`, completely disempowering the delivery partner.
4. **Absence of Delivery Offers & Acceptance**: Delivery partners are never offered an order with the option to accept or decline; orders simply appear in their queue without consent.
5. **Lack of Concurrency Control**: No conditional update checks or atomic locks exist to prevent duplicate assignment or race conditions.

---

## 2. Existing Flow Analysis

### Current Sequence of Events:
```
Customer Checkout 
    ↓
POST /user/order/:id
    ↓
Backend queries `deliverySchema.findOne({ isAvailable: true })`
    ↓
Order saved with `status: "Preparing"` & hard-assigned `deliverypersonid`
    ↓
Restaurant sees order in table with status dropdown:
[Preparing, Ready for Pickup, Out For Delivery, Delivered]
    ↓
Restaurant clicks dropdown → PATCH /restaurant/order/statuschange/:id
    ↓
Restaurant marks "Out for Delivery" and "Delivered" on behalf of the driver
```

### Critical Flaws Identified:
1. **Zero Kitchen Consent**: The order starts directly in `Preparing` without the restaurant confirming item availability or kitchen capacity.
2. **Zero Driver Consent**: The delivery partner has no offer notification, no acceptance window, and no ability to decline.
3. **No Proximity or Workload Intelligence**: Selection ignores rider distance from the restaurant, current battery/fuel, travel time, and active delivery load.
4. **False Customer Tracking**: Customers see a delivery partner assigned immediately at minute 0, even though the food may take 30 minutes to prepare and the driver hasn't accepted.
5. **Security Vulnerability**: `PATCH /restaurant/order/statuschange/:id` permits any authenticated user to update any order to any arbitrary status with no role or state transition validation.

---

## 3. Relevant Files and Endpoints

| Component | File Path | Current Issues |
| :--- | :--- | :--- |
| **Order Model** | `backend/Models/OrderSchema.js` | Single `status` enum; lacks distinct `orderStatus` vs `deliveryStatus`; lacks offer lifecycle fields. |
| **Order Placement** | `backend/Routes/UserRoutes/routes.js` | Lines 296–365 randomly assign `deliverypersonid` on order creation and force `status = "Preparing"`. |
| **Restaurant Status** | `backend/Routes/RestaurantRoutes/restaurantroutes.js` | Lines 206–250 allow restaurant to set any status, including `Out for Delivery` and `Delivered`. |
| **Delivery Routes** | `backend/Routes/DeliverypersonRoutes/deliverroutes.js` | Lacks `/offers`, `/accept`, `/decline`, `/arrived`, `/pickup`, `/complete` endpoints. |
| **Restaurant UI** | `frontend/src/components/RestaurantOrderCard.js` | `<select>` dropdown allows restaurant to drive delivery states. |
| **Delivery UI** | `frontend/src/Pages/DeliveryOrders.js` | Flat order list lacking offer cards, countdown timers, and progressive pickup buttons. |
| **Customer Tracking** | `frontend/src/Pages/LiveTracking.js` | Flat stepper unable to distinguish kitchen prep from rider transit. |

---

## 4. Target Architecture: Dual State Machine & Swiggy-Style Orchestration

### 4.1. Separation of Concerns
```
┌────────────────────────────────────────────────────────┐
│                   ORDER LIFECYCLE                      │
│ PLACED ──► ACCEPTED ──► PREPARING ──► READY ──► PICKED ──► DELIVERED
│    │           │
│    ▼           ▼
│ CANCELLED   REJECTED
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                  DELIVERY LIFECYCLE                    │
│ NOT_REQUESTED ──► SEARCHING ──► OFFERED ──► ASSIGNED   │
│                                   │                    │
│                          (Timeout/Decline)             │
│                                   ▼                    │
│                        ARRIVED_AT_RESTAURANT           │
│                                   ▼                    │
│                               PICKED_UP                │
│                                   ▼                    │
│                           OUT_FOR_DELIVERY             │
│                                   ▼                    │
│                         ARRIVED_AT_CUSTOMER            │
│                                   ▼                    │
│                               DELIVERED                │
└────────────────────────────────────────────────────────┘
```

### 4.2. Candidate Discovery & Ranking Algorithm
Delivery candidates are evaluated using a multi-factor score:
$$\text{Score} = w_1 \cdot \text{Distance} + w_2 \cdot \text{ActiveOrders} + w_3 \cdot (1 - \text{Rating})$$
- Excludes offline partners (`isAvailable === false`).
- Excludes partners with $\ge 2$ active deliveries.
- Excludes partners who have already declined this specific order within a 15-minute cooldown.
- Excludes partners with stale GPS location (> 60 minutes).
- Calculates true Haversine distance between partner GPS and restaurant coordinates.

### 4.3. Atomic Concurrency Control
Offers are accepted using MongoDB atomic conditional updates:
```javascript
const updated = await Order.findOneAndUpdate(
  {
    _id: orderId,
    deliveryStatus: "OFFERED",
    "deliveryOffer.deliveryPartnerId": partnerId,
    "deliveryOffer.offerState": "PENDING",
    "deliveryOffer.offerExpiresAt": { $gt: new Date() }
  },
  {
    $set: {
      deliveryStatus: "ASSIGNED",
      "deliveryOffer.offerState": "ACCEPTED",
      deliverypersonid: partnerId
    }
  },
  { new: true }
);
```
If two delivery partners attempt to accept simultaneously, exactly one succeeds and the other receives an HTTP 409 Conflict.

---

## 5. Migration Strategy & Compatibility Constraints
1. **Backward Compatibility**: Keep the legacy `status` field in `OrderSchema` synchronized with `orderStatus` so existing analytics and queries continue functioning.
2. **Safe Model Extension**: Extend `OrderSchema` with embedded sub-documents for `deliveryOffer`, `declinedPartners`, and `deliveryTimeline` without dropping or migrating collections.
3. **No Downtime Transition**: Allow existing orders in MongoDB Atlas to resolve under their current status while all new orders flow through the dual state machine.
