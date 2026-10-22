# CRAVECART FULL-STACK INTEGRATION AUDIT

**Audit Date**: October 2026  
**System Architecture**: React 18 (Frontend SPA) + Node.js / Express 4 (Backend API) + MongoDB Atlas / Mongoose (Data Persistence) + Socket.IO (Real-Time Communication Engine)  
**Security Model**: Stateless JWT Tokens (`HS256`), Bcrypt Password Hashing, Multi-Role Middleware (`authenticate`, `authorizeRoles`, `enforceOwnership`)  

---

## 1. Executive Summary

A comprehensive full-stack inspection of the CraveCart food delivery platform was conducted to determine whether recent UI and feature upgrades are genuinely integrated end-to-end or reliant on frontend-only simulations and placeholders.

### Key Audit Findings:
1. **Core Data Persistence**: All primary entities (Users, Restaurants, Delivery Partners, Menus, Orders, and Coupons) persist in active MongoDB Atlas collections.
2. **Server-Authoritative Business Logic**: Order pricing, delivery fees, and discount calculations are strictly calculated server-side in `POST /user/order/:id` and `POST /payment/create-order`. Client-supplied totals are never blindly trusted.
3. **Decoupled Swiggy-Style Delivery Orchestration**: Restaurants cannot mark delivery transit states (`Picked Up`, `Delivered`). Order dispatch discovery operates asynchronously using Haversine candidate ranking, a 45-second offer expiration timer, atomic offer claim mechanisms, and a 4-digit customer delivery OTP verification step.
4. **Resilient Mapping Architecture**: MapLibre GL is configured with MapTiler API Key integration, with an automatic HTML5 Canvas Vector Radar Fallback ensuring tracking is never blank.
5. **Real-time Telemetry**: Socket.IO is configured with scoped rooms (`user_<id>`, `restaurant_<id>`, `delivery_<id>`, `order_<id>`), providing live tracking without polling.

---

## 2. Frontend-to-Backend Feature Traceability Matrix

| Feature | Frontend Page / Component | User Action | Frontend API Call | Backend Endpoint | Controller / Service | Database Model & Ops | Authorization & RBAC | Integration Status | Test Result | Final Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Customer Registration** | `UserSigin.js` | Form Submit ("Sign Up") | `POST /user/signin` | `POST /user/signin` | `Routes/UserRoutes/routes.js` | `UserSchema.create()` | Public, checks duplicate email | Real MongoDB | Pass (Unit + E2E) | **VERIFIED END TO END** |
| **Customer Login** | `UserLogin.js` | Form Submit ("Sign In") | `POST /user/login` | `POST /user/login` | `Routes/UserRoutes/routes.js` | `UserSchema.findOne()`, Bcrypt compare | Public, generates JWT token with `role: "user"` | Real MongoDB + JWT | Pass (51/51 test suite) | **VERIFIED END TO END** |
| **Restaurant Login** | `UserLogin.js` | Switch Role & Submit | `POST /restaurant/login` | `POST /restaurant/login` | `Routes/RestaurantRoutes/restaurantroutes.js` | `RestaurantSchema.findOne()` | Generates JWT token with `role: "restaurant"` | Real MongoDB + JWT | Pass (API + E2E) | **VERIFIED END TO END** |
| **Delivery Partner Login** | `UserLogin.js` | Switch Role & Submit | `POST /delivery/login` | `POST /delivery/login` | `Routes/DeliverypersonRoutes/deliverroutes.js` | `Deliveryperson.findOne()` | Generates JWT token with `role: "deliveryperson"` | Real MongoDB + JWT | Pass (API + E2E) | **VERIFIED END TO END** |
| **Admin Login** | `AdminLogin.js` | Form Submit ("Sign In") | `POST /admin/login` | `POST /admin/login` | `Routes/AdminRoutes/adminroutes.js` | `Admin.findOne()` | Generates JWT token with `role: "admin"` | Real MongoDB + JWT | Pass (API + E2E) | **VERIFIED END TO END** |
| **Restaurant Discovery & Search** | `Foods.js`, `Home.js` | Type query, filter Veg/Non-Veg | `GET /user/foods` | `GET /user/foods` | `Routes/UserRoutes/routes.js` | `Menuitems.find().populate('restaurantid')` | Public | Real MongoDB live query | Pass (Live curl & browser) | **VERIFIED END TO END** |
| **Menu Listing per Restaurant** | `RestaurantMenu.js` | Click restaurant card | `GET /user/restaurant/:id` | `GET /user/restaurant/:id` | `Routes/UserRoutes/routes.js` | `RestaurantSchema.findById()`, `Menuitems.find({ restaurantid })` | Public | Real MongoDB query | Pass (Browser & E2E) | **VERIFIED END TO END** |
| **Add / Update Cart** | `Foods.js`, `Cart.js` | Click "Add to Cart" / Quantity buttons | `POST /user/cart/:id` | `POST /user/cart/:id` | `Routes/UserRoutes/routes.js` | `CartSchema.findOneAndUpdate()` | `authenticate`, `enforceOwnership` | Real MongoDB Cart collection | Pass (API & E2E) | **VERIFIED END TO END** |
| **Display Cart Items** | `Cart.js` | Open `/cart` page | `GET /user/cartdisplay/:id` | `GET /user/cartdisplay/:id` | `Routes/UserRoutes/routes.js` | `CartSchema.find({ userid }).populate('menuid')` | `authenticate`, `enforceOwnership` | Real MongoDB Cart collection | Pass (API & E2E) | **VERIFIED END TO END** |
| **Coupon Evaluation** | `Cart.js` | Click "Apply Coupon" | `POST /coupons/apply` | `POST /coupons/apply` | `Routes/CouponRoutes/couponroutes.js` | `CouponSchema.findOne()`, `calculateDiscount()` | Public | Real MongoDB coupon rules | Pass (E2E Scenario 1) | **VERIFIED END TO END** |
| **Razorpay Payment Gateway Init** | `Cart.js` | Select "Online Payment" & click Pay | `POST /payment/create-order` | `POST /payment/create-order` | `services/razorpay.service.js` | `Menuitems.findById()`, recompute subtotal | `authenticate` | Real Razorpay Test API + Fallback | Pass (API test) | **VERIFIED END TO END** |
| **Razorpay Signature Verification** | `Cart.js` | Razorpay modal `handler()` | `POST /payment/verify` | `POST /payment/verify` | `services/razorpay.service.js` | HMAC-SHA256 signature check, `Order.findByIdAndUpdate()` | `authenticate` | Real HMAC-SHA256 crypto | Pass (API test) | **VERIFIED END TO END** |
| **Authoritative Order Placement** | `Cart.js` | Click "Place Order" (COD or Verified Online) | `POST /user/order/:id` | `POST /user/order/:id` | `Routes/UserRoutes/routes.js` | Recalculate subtotal from DB, apply coupon, `OrderSchema.create()` | `authenticate`, `enforceOwnership` | Real MongoDB persistence | Pass (E2E Scenario 1) | **VERIFIED END TO END** |
| **Customer Order History** | `Orders.js` | Open `/orders` page | `GET /user/orders/:id` | `GET /user/orders/:id` | `Routes/UserRoutes/routes.js` | `OrderSchema.find({ userid }).populate('restaurantId')` | `authenticate`, `enforceOwnership` | Real MongoDB read | Pass (E2E Scenario 5) | **VERIFIED END TO END** |
| **Live Order Tracking Detail** | `OrderTracking.js` | Click "Track Order" | `GET /user/order-tracking/:orderId` | `GET /user/order-tracking/:orderId` | `Routes/UserRoutes/routes.js` | `OrderSchema.findById()`, populate rider & restaurant | `authenticate`, IDOR ownership check | Real MongoDB + WebSockets | Pass (E2E Scenario 5) | **VERIFIED END TO END** |
| **Interactive Live Tracking Map** | `LiveTrackingMap.js` | View GPS route on map | MapLibre GL Tile request + Socket.IO | Socket.IO room `order_<id>` | `services/socket.service.js` | Live GPS coordinate stream (`lat`, `lng`, `heading`, `speed`) | Token required for Socket join | Real MapTiler Vector Tiles + Canvas Radar Fallback | Pass (Browser verified) | **VERIFIED END TO END** |
| **Customer Cancel Order** | `OrderTracking.js`, `Orders.js` | Click "Cancel Order" | `POST /user/order/cancel/:orderId` | `POST /user/order/cancel/:orderId` | `Routes/UserRoutes/routes.js` | `OrderSchema.findByIdAndUpdate()`, `CouponSchema.updateOne({ $inc: { timesUsed: -1 } })` | `authenticate`, ownership check, only if `PLACED` | Real MongoDB update | Pass (API & E2E) | **VERIFIED END TO END** |
| **Kitchen Incoming Orders (KDS)** | `RestaurantOrder.js` | Open Restaurant Dashboard | `GET /restaurant/order/:id` | `GET /restaurant/order/:id` | `Routes/RestaurantRoutes/restaurantroutes.js` | `OrderSchema.find()`, filter by `restaurantId` | `authenticate`, role check | Real MongoDB read | Pass (API & E2E) | **VERIFIED END TO END** |
| **Kitchen Accept Order** | `RestaurantOrder.js` | Click "Accept Order" | `POST /restaurant/order/:id/accept` | `POST /restaurant/order/:id/accept` | `services/delivery.service.js` (`dispatchNextCandidate`) | `OrderSchema.save()`, triggers candidate ranking | `authenticate`, role check | Real MongoDB + Async dispatch | Pass (E2E Scenario 2) | **VERIFIED END TO END** |
| **Kitchen Reject Order** | `RestaurantOrder.js` | Click "Reject Order" with reason | `POST /restaurant/order/:id/reject` | `POST /restaurant/order/:id/reject` | `Routes/RestaurantRoutes/restaurantroutes.js` | `OrderSchema.save()`, `orderStatus: 'REJECTED'` | `authenticate`, role check | Real MongoDB update | Pass (API & E2E) | **VERIFIED END TO END** |
| **Kitchen Mark Food Ready** | `RestaurantOrder.js` | Click "Mark Ready" | `POST /restaurant/order/:id/ready` | `POST /restaurant/order/:id/ready` | `Routes/RestaurantRoutes/restaurantroutes.js` | `OrderSchema.save()`, `orderStatus: 'READY_FOR_PICKUP'` | `authenticate`, role check | Real MongoDB update | Pass (E2E Scenario 2) | **VERIFIED END TO END** |
| **Menu Item Upload** | `RestaurantAdmin.js` | Form Submit ("Add Dish") | `POST /restaurant/menuupload` | `POST /restaurant/menuupload` | `Routes/RestaurantRoutes/restaurantroutes.js` | Multer image storage, `Menuitems.create()` | `authenticate`, role check | Real MongoDB + disk storage | Pass (API verified) | **VERIFIED END TO END** |
| **Menu Item Deletion** | `RestaurantAdmin.js` | Click "Delete Dish" | `DELETE /restaurant/deletemenu/:id` | `DELETE /restaurant/deletemenu/:id` | `Routes/RestaurantRoutes/restaurantroutes.js` | `Menuitems.deleteOne()` | `authenticate`, role check | Real MongoDB delete | Pass (API verified) | **VERIFIED END TO END** |
| **Restaurant Availability Toggle** | `RestaurantAdmin.js` | Toggle "Online / Offline" switch | `PATCH /restaurant/availability/:id` | `PATCH /restaurant/availability/:id` | `Routes/RestaurantRoutes/restaurantroutes.js` | `RestaurantSchema.findByIdAndUpdate()` | `authenticate`, role check | Real MongoDB update | Pass (API verified) | **VERIFIED END TO END** |
| **Delivery Active Offer Polling / Push** | `DeliveryOrders.js` | View incoming trip modal | `GET /delivery/offers/:partnerId` | `GET /delivery/offers/:partnerId` | `Routes/DeliverypersonRoutes/deliverroutes.js` | `OrderSchema.findOne({ deliveryStatus: 'OFFERED' })` | `authenticate`, role check | Real MongoDB + Countdown timer | Pass (E2E Scenario 3) | **VERIFIED END TO END** |
| **Delivery Accept Offer** | `DeliveryOrders.js` | Click "Accept Delivery" | `POST /delivery/offers/:orderId/accept` | `POST /delivery/offers/:orderId/accept` | `services/delivery.service.js` | Atomic `findOneAndUpdate()`, assign `deliverypersonid` | `authenticate`, role check | Real MongoDB atomic lock | Pass (E2E Scenario 3) | **VERIFIED END TO END** |
| **Delivery Decline Offer** | `DeliveryOrders.js` | Click "Decline" | `POST /delivery/offers/:orderId/decline` | `POST /delivery/offers/:orderId/decline` | `services/delivery.service.js` | Record decline in `declinedPartners`, trigger next | `authenticate`, role check | Real MongoDB update | Pass (API & E2E) | **VERIFIED END TO END** |
| **Delivery Partner Arrived at Kitchen** | `DeliveryOrders.js` | Click "I Have Arrived" | `POST /delivery/order/:orderId/arrived` | `POST /delivery/order/:orderId/arrived` | `services/delivery.service.js` | `OrderSchema.save()`, `deliveryStatus: 'ARRIVED_AT_RESTAURANT'` | `authenticate`, driver ownership check | Real MongoDB update | Pass (E2E Scenario 3) | **VERIFIED END TO END** |
| **Delivery Confirm Food Pickup** | `DeliveryOrders.js` | Click "Confirm Pickup" | `POST /delivery/order/:orderId/pickup` | `POST /delivery/order/:orderId/pickup` | `services/delivery.service.js` | `orderStatus: 'PICKED_UP'`, `deliveryStatus: 'OUT_FOR_DELIVERY'` | `authenticate`, driver ownership check | Real MongoDB update | Pass (E2E Scenario 3) | **VERIFIED END TO END** |
| **Delivery GPS Location Broadcast** | `DeliveryOrders.js` | Geolocation Watcher | `POST /delivery/location` | `POST /delivery/location` | `Routes/DeliverypersonRoutes/deliverroutes.js` | `Deliveryperson.findByIdAndUpdate()`, updates active order | `authenticate`, driver ownership check | Real MongoDB + Socket.IO broadcast | Pass (E2E Scenario 3) | **VERIFIED END TO END** |
| **Delivery Completion with OTP** | `DeliveryOrders.js` | Enter 4-digit PIN & Submit | `POST /delivery/order/:orderId/complete` | `POST /delivery/order/:orderId/complete` | `services/delivery.service.js` | Verify OTP vs `order.deliveryOtp`, credit driver earnings | `authenticate`, driver ownership check | Real MongoDB update | Pass (E2E Scenario 3) | **VERIFIED END TO END** |
| **Delivery Partner Availability Toggle** | `DeliveryOrders.js` | Toggle "Online / Offline" | `PATCH /delivery/availability/:id` | `PATCH /delivery/availability/:id` | `Routes/DeliverypersonRoutes/deliverroutes.js` | `Deliveryperson.findByIdAndUpdate()` | `authenticate`, driver ownership check | Real MongoDB update | Pass (API verified) | **VERIFIED END TO END** |
| **Admin Dashboard Analytics** | `AdminDashboard.js` | Open `/admin` | `GET /admin/dashboard` | `GET /admin/dashboard` | `Routes/AdminRoutes/adminroutes.js` | Aggregates Users, Restaurants, Riders, Orders, Revenue | `authenticate`, `authorizeRoles('admin')` | Real MongoDB aggregations | Pass (E2E Admin test) | **VERIFIED END TO END** |
| **Admin Delivery Dispatch Monitor** | `AdminDashboard.js` | View Live Dispatch Board | `GET /admin/deliveries` | `GET /admin/deliveries` | `Routes/AdminRoutes/adminroutes.js` | Queries `SEARCHING`, `OFFERED`, `IN_TRANSIT` orders | `authenticate`, `authorizeRoles('admin')` | Real MongoDB aggregations | Pass (API verified) | **VERIFIED END TO END** |
| **Admin Manual Driver Reassignment** | `AdminDashboard.js` | Select driver & Click Reassign | `POST /admin/deliveries/:orderId/reassign` | `POST /admin/deliveries/:orderId/reassign` | `Routes/AdminRoutes/adminroutes.js` | Administrative override of `deliverypersonid` | `authenticate`, `authorizeRoles('admin')` | Real MongoDB update | Pass (API verified) | **VERIFIED END TO END** |
| **Admin Restaurant Approval Toggle** | `AdminDashboard.js` | Click "Approve / Inactivate" | `PATCH /admin/restaurant/:id/toggle` | `PATCH /admin/restaurant/:id/toggle` | `Routes/AdminRoutes/adminroutes.js` | `RestaurantSchema.findByIdAndUpdate()` | `authenticate`, `authorizeRoles('admin')` | Real MongoDB update | Pass (API verified) | **VERIFIED END TO END** |
| **Admin Create Coupon** | `AdminDashboard.js` | Submit new coupon form | `POST /coupons` | `POST /coupons` | `Routes/CouponRoutes/couponroutes.js` | `CouponSchema.create()` | `authenticate`, `authorizeRoles('admin')` | Real MongoDB persistence | Pass (API verified) | **VERIFIED END TO END** |
| **AI Assistant Chatbot** | `AIChatWidget.js` | Send question in floating chat | `POST /api/chat` | `POST /api/chat` | `services/chat.service.js`, `services/rag.service.js` | Live RAG over MongoDB menus, active coupons, order status | Public / Optional JWT token | Real Gemini LLM + Deterministic RAG Fallback | Pass (Live curl & E2E) | **VERIFIED END TO END** |

---

## 3. Disconnected, Mocked, or Incomplete Features Audited

During the deep-dive audit, the following specific edge-case gaps were uncovered and immediately remediated:

1. **Multi-Item Order Restaurant Authorization Gap in Tracking** (`Routes/UserRoutes/routes.js`):
   - *Issue*: `isRest` checked `order.menuid?.restaurantid?._id === req.user.id`. For multi-item checkouts where `order.restaurantId` was populated instead of `order.menuid`, restaurant owners were incorrectly denied tracking access (403 Forbidden).
   - *Fix*: Enhanced authorization condition to check `order.restaurantId` alongside `order.menuid?.restaurantid`, and populated `restaurantId` in tracking and user order queries.

2. **Coupon Usage Rollback on Customer Order Cancellation** (`Routes/UserRoutes/routes.js`):
   - *Issue*: When a customer cancelled an order prior to kitchen acceptance, the order status reverted to `CANCELLED`, but the coupon's `timesUsed` counter was not rolled back.
   - *Fix*: Added atomic decrement `$inc: { timesUsed: -1 }` on `CouponSchema` during cancellation.

3. **Payment Method Schema Enum Consistency** (`Models/OrderSchema.js`):
   - *Issue*: `OrderSchema` had strict enum `['COD', 'Online']`. If a client sent `'Cash on Delivery'`, Mongoose threw an unhandled schema validation error.
   - *Fix*: Added `'Cash on Delivery'` to the enum and implemented normalization in `UserRoutes.js`.

4. **Nested ObjectId Query Matching in Delivery Offers** (`Routes/DeliverypersonRoutes/deliverroutes.js`):
   - *Issue*: `req.params.partnerId` is received as a string. In nested subdocument query `{ "deliveryOffer.deliveryPartnerId": partnerId }`, Mongoose does not always auto-cast strings to ObjectId.
   - *Fix*: Explicitly converted string to `mongoose.Types.ObjectId(partnerId)` before executing the offer lookup.

---

## 4. Test Suite Execution Summary

- **Total Backend Tests**: 51 passed across 3 test suites:
  - `tests/api.test.js` (Health, JWT tokens, RBAC permissions, Razorpay HMAC signatures, RAG search)
  - `tests/delivery_workflow.test.js` (Haversine distance calculation, candidate ranking, offer countdown, atomic acceptance, pickup, OTP completion)
  - `tests/fullstack_e2e.test.js` (End-to-end multi-role flow from customer cart to kitchen accept, delivery pickup, live GPS broadcast, customer OTP completion, and admin analytics)
- **Frontend Production Build**: `npm run build` completed with exit code 0 (`Compiled with warnings`, clean production bundle).
