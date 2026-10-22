# CraveCart — Waiting for Partner Root Cause Analysis & Resolution

## Executive Summary

When a customer placed an order in CraveCart, the order appeared indefinitely stuck in the **"Waiting for Partner"** / **"Finding nearby delivery partner..."** state. 

This comprehensive investigation uncovered **four intertwined root causes across the frontend presentation, backend dispatch queues, background worker intervals, and partner cooldown logic**.

---

## 1. Original Symptom

1. A customer navigates to the menu, adds items to their cart, and clicks **"Place Order"**.
2. Upon redirection to the Live Telemetry Order Tracker (`/orders/track/:orderId`), the screen immediately and unconditionally rendered:
   ```
   Finding nearby delivery partner...
   Our smart dispatch engine is scoring nearby partners based on proximity and rating.
   ```
3. The customer observed this status persisting indefinitely. No delivery partner ever received a trip request, and the order never progressed.
4. If a delivery partner logged in, turned their availability **ON**, or updated their GPS location, the order still remained stuck.

---

## 2. Real Root Causes Discovered

### Root Cause 1: Premature "Finding Partner" Frontend State in `LiveTracking.js`
- **Location**: `frontend/src/Pages/LiveTracking.js` (lines 316–326)
- **Mechanism**: The UI checked only if `trackingData.deliveryPerson` was null.
  - When an order is placed, `orderStatus = "PLACED"` and `deliveryStatus = "NOT_REQUESTED"`.
  - Under CraveCart's decoupled Swiggy/Zomato architecture, delivery partner dispatch does not and should not begin until the kitchen accepts the order (`orderStatus = "ACCEPTED"`).
  - However, because `deliveryPerson` was null, `LiveTracking.js` unconditionally displayed the spinning "Finding nearby delivery partner..." banner, misleading customers into believing the system had already dispatched partner discovery and was stalling.

### Root Cause 2: Missing Background Sweeper for `SEARCHING` Orders
- **Location**: `backend/services/delivery.service.js` and `backend/index.js`
- **Mechanism**:
  - In `backend/index.js`, the background interval ran `setInterval(checkAndExpireOffers, 8000)`.
  - In `delivery.service.js`, `checkAndExpireOffers` only queried:
    ```javascript
    Order.find({
      deliveryStatus: "OFFERED",
      "deliveryOffer.offerState": "PENDING",
      "deliveryOffer.offerExpiresAt": { $lte: now }
    })
    ```
  - If an order entered `deliveryStatus = "SEARCHING"` (e.g. because during kitchen acceptance no rider was online or within radius), **no scheduled job or sweeper ever re-evaluated that order again**.
  - Even if riders came online seconds later, the order stayed in `SEARCHING` forever with no recovery mechanism.

### Root Cause 3: Availability & Location Updates Did Not Trigger Dispatch
- **Location**: `backend/Routes/DeliverypersonRoutes/deliverroutes.js`
- **Mechanism**:
  - When a delivery partner toggled `isAvailable: true` (`PATCH /delivery/availability/:id`), the backend persisted the boolean to MongoDB but never notified the dispatch service.
  - When a partner broadcasted live GPS coordinates (`POST /delivery/location`), the backend saved the coordinates but never checked if any pending kitchen orders were waiting for a partner.
  - When a partner completed an active delivery (`confirmDeliveryCompletion`), their workload decreased, but pending `SEARCHING` orders were never re-evaluated.

### Root Cause 4: Offer Expiry Cooldown Trapping the Entire Partner Fleet
- **Location**: `backend/services/delivery.service.js` (`rankEligibleDeliveryPartners`)
- **Mechanism**:
  - `REJECTION_COOLDOWN_MS` was set to a rigid `15 * 60 * 1000` (15 minutes).
  - When a candidate's offer timed out (45 seconds), `checkAndExpireOffers` appended that rider's ID to `declinedPartners` with a 15-minute cooldown.
  - In a city or test fleet with 2–5 riders, after each rider timed out once, **all riders were blocked in `recentlyDeclinedIds` for 15 minutes**.
  - `rankEligibleDeliveryPartners` returned `candidates = []`, permanently stalling the order.

### Root Cause 5: Socket Event Mismatch on Partner Dashboard & Missing Tracker Polling
- **Location**: `frontend/src/Pages/DeliveryOrders.js` and `frontend/src/Pages/LiveTracking.js`
- **Mechanism**:
  - In `DeliveryOrders.js`, the component listened to `socket.on("updatingDelivery")`. However, `delivery.service.js` emitted `delivery:assignment_confirmed`.
  - In `LiveTracking.js`, data was fetched only once on mount; if a WebSocket reconnect occurred or an event dropped, the customer UI stayed frozen on old state without a polling safety net.

---

## 3. Specific Files, Functions, Routes & Status Conditions Involved

| Component | File | Function / Route / Condition | Issue Identified |
| :--- | :--- | :--- | :--- |
| **Dispatch Sweeper** | `backend/services/delivery.service.js` | `processPendingDispatches` (missing) | No queue processor polled or re-attempted candidate discovery for `SEARCHING` orders. |
| **Partner Ranking** | `backend/services/delivery.service.js` | `rankEligibleDeliveryPartners` | 15-min cooldown blocked all riders on timeouts; no radius expansion fallback. |
| **Background Runner** | `backend/index.js` | `setInterval(checkAndExpireOffers, 8000)` | Did not sweep orders stuck in `SEARCHING`. |
| **Partner API** | `backend/Routes/DeliverypersonRoutes/deliverroutes.js` | `PATCH /availability/:id`, `POST /location` | Did not trigger dispatch queue processing when riders came online or moved. |
| **Customer Tracking** | `frontend/src/Pages/LiveTracking.js` | Lines 316–333 | Unconditionally rendered "Finding nearby partner" while `deliveryStatus === "NOT_REQUESTED"`. |
| **Partner Dashboard** | `frontend/src/Pages/DeliveryOrders.js` | `useEffect` socket listeners | Listened to legacy `updatingDelivery` rather than modern `delivery:assignment_confirmed`. |
| **Restaurant Actions** | `backend/Routes/RestaurantRoutes/restaurantroutes.js` | `POST /order/:id/retry-dispatch` | Missing manual retry dispatch endpoint for kitchens. |

---

## 4. What Was Changed and Why

1. **Created `processPendingDispatches(io)`**:
   - Queries orders in `orderStatus: { $in: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"] }` and `deliveryStatus: "SEARCHING"` whose `offerState !== "PENDING"`.
   - Runs automatically every 8 seconds via `checkAndExpireOffers` and is triggered immediately whenever a driver toggles online, posts location, or completes an order.
2. **Refined Cooldown & Radius Fallback in `rankEligibleDeliveryPartners`**:
   - Differentiated explicit rejections (2-minute cooldown) from passive timeouts (60-second cooldown).
   - Added automatic cooldown reset/cycling if all available riders in the fleet are in cooldown, preventing order abandonment.
   - Added dynamic search radius expansion (up to 50 km) if no candidates are found within the default 25 km.
3. **Harmonized Real-Time Socket Events**:
   - `delivery.service.js` now emits `delivery:assignment_confirmed`, `delivery:assigned`, and legacy `updatingDelivery`.
   - `DeliveryOrders.js` listens to all three event variants.
4. **Added 5-Second Fallback Poller in `LiveTracking.js`**:
   - Ensures customer view updates promptly even over unreliable or reconnecting WebSocket connections.
5. **Truthful UI State Progression in `LiveTracking.js`**:
   - When `deliveryStatus === "NOT_REQUESTED"` or `orderStatus === "PLACED"`: displays **"Awaiting Kitchen Acceptance"** ("The restaurant is reviewing your order. Delivery partner dispatch starts automatically as soon as cooking begins.").
   - When `deliveryStatus === "SEARCHING"`: displays **"Searching for Delivery Partner"**.
   - When `deliveryStatus === "OFFERED"`: displays **"Delivery Offer Dispatched"**.
   - When `deliveryStatus === "ASSIGNED"`: displays driver name, rating, vehicle, and arrival state.
6. **Provided Manual / Authorized Retry Dispatch APIs**:
   - `POST /restaurant/order/:id/retry-dispatch`
   - `POST /delivery/dispatch/:orderId`
   - Added quick retry button on `RestaurantOrderCard.js`.
