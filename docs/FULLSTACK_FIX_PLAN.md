# CRAVECART FULL-STACK FIX PLAN & REMEDIATION LOG

This document outlines the identified technical gaps, security vulnerabilities, edge-case flaws, and architecture enhancements prioritized by severity (P0 to P3), detailing root causes, exact code changes, test validations, and regression verifications.

---

## Priority Classification Framework

- **P0 — Critical**: Security vulnerabilities, unauthorized resource access (IDOR), payment integrity failures, data corruption, or duplicate order/delivery race conditions.
- **P1 — High**: Broken core user journeys, missing backend functionality, incorrect order lifecycle transitions, or unhandled payment/delivery errors.
- **P2 — Medium**: Incomplete APIs, incorrect database persistence, missing notifications, hardcoded dashboard data, or broken error handling.
- **P3 — Low**: UI inconsistencies, minor responsiveness issues, redundant network requests, or cosmetic styling glitches.

---

## Remediated Gaps & Fix Log

### [P0] Critical Security & Data Integrity

#### Fix P0-1: Cross-User Resource Access & IDOR Prevention in Live Order Tracking
- **Severity**: P0
- **Location**: `backend/Routes/UserRoutes/routes.js` (`GET /user/order-tracking/:orderId`)
- **Root Cause**: The authorization logic checked ownership using `order.menuid?.restaurantid?._id === req.user.id`. For multi-item checkouts where `order.restaurantId` was populated instead of single-item `order.menuid`, restaurant owners were locked out with 403 Forbidden, and direct parameter tampering on order IDs needed strict role verification.
- **Remediation**:
  ```javascript
  const isOwner = order.userid?._id?.toString() === req.user.id || order.userid?.toString() === req.user.id;
  const isDelivery = order.deliverypersonid?._id?.toString() === req.user.id || order.deliverypersonid?.toString() === req.user.id;
  const isRest =
    order.menuid?.restaurantid?._id?.toString() === req.user.id ||
    order.restaurantId?._id?.toString() === req.user.id ||
    order.restaurantId?.toString() === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isDelivery && !isRest && !isAdmin) {
    return res.status(403).json({ message: "Forbidden: Not authorized to view tracking for this order." });
  }
  ```
- **Validation**: Verified in `tests/fullstack_e2e.test.js` under `Scenario 5: Security & IDOR Verification`. Customer B is strictly denied access to Customer A's order tracking (403 Forbidden).

#### Fix P0-2: Atomic Concurrency Protection for Delivery Offer Acceptance
- **Severity**: P0
- **Location**: `backend/services/delivery.service.js` (`acceptDeliveryOffer`)
- **Root Cause**: If two delivery partners simultaneously accepted the same trip offer, a non-atomic `findOne` followed by `save` could create a race condition resulting in duplicate rider assignment.
- **Remediation**:
  Implemented atomic conditional lock using `Order.findOneAndUpdate({ _id, deliveryStatus: 'OFFERED', 'deliveryOffer.deliveryPartnerId': partnerObjectId, 'deliveryOffer.offerState': 'PENDING', 'deliveryOffer.offerExpiresAt': { $gt: now } }, ...)`
- **Validation**: Verified in `tests/delivery_workflow.test.js` under `Scenario 3.3` with concurrency tests.

---

### [P1] Core Lifecycle & State Machine Integrity

#### Fix P1-1: Decoupling Delivery State Transitions from Restaurant Control
- **Severity**: P1
- **Location**: `backend/Routes/RestaurantRoutes/restaurantroutes.js` (`PATCH /order/statuschange/:id`)
- **Root Cause**: Legacy workflows allowed restaurants to update any status string, including "Out for Delivery" and "Delivered", breaking the independent delivery partner lifecycle.
- **Remediation**:
  ```javascript
  if (["Out for Delivery", "Delivered", "Picked Up"].includes(newStatus)) {
    return res.status(403).json({
      message: "Forbidden: Kitchens cannot mark delivery transit or completion states. The delivery partner controls pickup and delivery.",
    });
  }
  ```
- **Validation**: Verified in `tests/fullstack_e2e.test.js` under `Scenario 2: Restaurant Workflow`. Restaurant attempts to mark "Delivered" return 403 Forbidden.

#### Fix P1-2: Authoritative Server-Side Pricing & Cart Validation
- **Severity**: P1
- **Location**: `backend/Routes/UserRoutes/routes.js` (`POST /user/order/:id`) & `backend/Routes/PaymentRoutes/paymentroutes.js` (`POST /payment/create-order`)
- **Root Cause**: Relying on frontend-provided prices could allow malicious users to tamper with request payloads to purchase items at discounted rates.
- **Remediation**:
  All menu prices are fetched directly from MongoDB via `menuSchema.findById(menuid)`. Delivery fee (₹60) and coupon discount calculations are executed strictly server-side.
- **Validation**: Verified in `tests/fullstack_e2e.test.js` under `Scenario 1: Customer Cart, Coupon, and Order Creation`.

#### Fix P1-3: Customer 4-Digit PIN OTP Delivery Completion Enforcement
- **Severity**: P1
- **Location**: `backend/services/delivery.service.js` (`confirmDeliveryCompletion`)
- **Root Cause**: Delivery partners could falsely mark orders delivered without customer confirmation.
- **Remediation**:
  Order creation generates a secure 4-digit PIN OTP (`order.deliveryOtp`). The driver must provide this OTP to complete delivery via `POST /delivery/order/:orderId/complete`.
- **Validation**: Verified in `tests/fullstack_e2e.test.js`. Incorrect OTP returns 400 error; valid OTP transitions order to `DELIVERED` and releases driver back to `isAvailable: true`.

---

### [P2] Persistence, Queries & Business Rule Consistency

#### Fix P2-1: Coupon Usage Limit Rollback on Order Cancellation
- **Severity**: P2
- **Location**: `backend/Routes/UserRoutes/routes.js` (`POST /user/order/cancel/:orderId`)
- **Root Cause**: Cancelling an order before kitchen acceptance failed to restore the customer's coupon quota.
- **Remediation**:
  ```javascript
  if (order.couponCode) {
    const couponModel = require("../../Models/CouponSchema");
    await couponModel
      .updateOne({ code: order.couponCode, timesUsed: { $gt: 0 } }, { $inc: { timesUsed: -1 } })
      .catch(() => {});
  }
  ```
- **Validation**: Verified in unit cancellation flow; coupon quota persists accurately.

#### Fix P2-2: Nested Subdocument Query Casting in Delivery Offers
- **Severity**: P2
- **Location**: `backend/Routes/DeliverypersonRoutes/deliverroutes.js` (`GET /offers/:partnerId`)
- **Root Cause**: In Mongoose subdocument queries, passing `partnerId` as a raw route string could bypass index matching.
- **Remediation**:
  Explicitly cast `partnerId` to `mongoose.Types.ObjectId(partnerId)` prior to querying MongoDB.
- **Validation**: Verified in `tests/fullstack_e2e.test.js`. Rider active offer polling returns exact matching offer with real-time countdown.

#### Fix P2-3: Payment Method Schema Enum Extension
- **Severity**: P2
- **Location**: `backend/Models/OrderSchema.js`
- **Root Cause**: Strict enum `['COD', 'Online']` threw schema validation errors if legacy or third-party clients submitted `'Cash on Delivery'`.
- **Remediation**:
  Updated enum to `['COD', 'Online', 'Cash on Delivery']` and normalized values to `'COD'` in order handlers.
- **Validation**: Verified in `tests/fullstack_e2e.test.js` under order placement tests.

---

### [P3] Frontend Usability, Resilience & Fallbacks

#### Fix P3-1: Live Tracking Map WebGL & API Key Resilience
- **Severity**: P3
- **Location**: `frontend/src/components/LiveTrackingMap.js`
- **Root Cause**: If the client browser disabled WebGL or MapTiler API quota exceeded, the map rendered blank.
- **Remediation**:
  Configured MapLibre GL with user's MapTiler API Key, coupled with an automated Canvas Vector Radar fallback displaying restaurant, rider, and customer nodes with animated radar rings.
- **Validation**: Verified in browser rendering tests; map and fallback function without rendering errors.

#### Fix P3-2: Removal of Non-Standard "V2" Badges and Emblem Restoration
- **Severity**: P3
- **Location**: `frontend/src/components/CraveCartLogo.jsx`, `Navbar.js`, `Footer.js`, `UserLogin.js`, `App.js`
- **Root Cause**: "V2" and "OPS" badges deviated from brand identity.
- **Remediation**:
  Restored original circular orange emblem (`#FF6F00`) with white "C" and removed non-standard badges across all authentication pages and navigation headers.
- **Validation**: Verified in frontend build and component rendering.
