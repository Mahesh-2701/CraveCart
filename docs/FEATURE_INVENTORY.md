# CRAVECART FEATURE INVENTORY

This document provides a comprehensive inventory of all user-facing and operational features within the CraveCart food delivery platform, classifying each feature by its verified implementation status.

---

## Classification Taxonomy
- **Working and verified**: Tested and verified end-to-end across Frontend, Backend, and MongoDB.
- **Present but incomplete**: Functional in parts but missing edge-case handling.
- **Present but broken**: Endpoint or UI component exists but fails on execution.
- **Present but insecure**: Lacks proper authorization or sanitization.
- **Missing**: Not implemented in the codebase.
- **Not applicable to the current product scope**: Feature outside platform design goals.
- **Blocked by an external dependency**: Implemented correctly but requires live production credentials.

---

## 1. Customer Discovery & Ordering Module

| Feature | Component / Route | Implementation Description | Status |
|---|---|---|---|
| User Registration | `UserSigin.js` / `POST /user/signin` | Validates email uniqueness, hashes password with Bcrypt | **Working and verified** |
| User Login | `UserLogin.js` / `POST /user/login` | Bcrypt password check, issues signed JWT token | **Working and verified** |
| Delivery Address Selector | `Navbar.js` | Top navbar location badge with locality picker & localStorage persistence | **Working and verified** |
| Restaurant Listing | `Restaraunts.js` / `GET /user/restaurants` | Fetches active restaurants with ratings, cuisine, and timings | **Working and verified** |
| Dish Catalog & Live Search | `Foods.js` / `GET /user/foods` | Real-time text search across names, ingredients, and categories | **Working and verified** |
| Dietary Pure Veg Filter | `Foods.js` | Toggles vegetarian filter with visual badge indicators | **Working and verified** |
| Category Quick Pills | `Foods.js` | Biryani, Pizza, Burger, Fast Food, Desserts category filters | **Working and verified** |
| Price & Rating Sorting | `Foods.js` | Price Low-to-High, High-to-Low, Top Rated sorting | **Working and verified** |
| Restaurant Profile & Menu | `RestaurantMenu.js` / `GET /user/restaurant/:id` | Renders restaurant information and categorized menu items | **Working and verified** |
| Add to Cart & Sync | `Card.js`, `Cart.js` / `POST /user/cart/:id` | Synced to MongoDB `carts` collection with quantity counters | **Working and verified** |
| Cart Item Removal | `Cart.js` / `DELETE /user/cartitemdelete/:id` | Deletes single item from user cart | **Working and verified** |
| Authoritative Pricing | `Cart.js` / `POST /user/order/:id` | Fetches item prices directly from MongoDB, overrides client input | **Working and verified** |
| Coupon Evaluation | `Cart.js` / `POST /coupons/apply` | Calculates percentage and flat discounts with min order limits | **Working and verified** |
| Order Creation | `Cart.js` / `POST /user/order/:id` | Creates order in `PLACED` status, generates 4-digit PIN OTP | **Working and verified** |
| Order History | `Orders.js` / `GET /user/orders/:id` | Displays past orders with status badges and restaurant information | **Working and verified** |
| One-Click Reorder | `Orders.js` | Adds all items from completed order back to cart with single click | **Working and verified** |
| Active Order Tracker Pill | `Navbar.js` | Header floating pill linking directly to active delivery in transit | **Working and verified** |
| Live Delivery Tracking Map | `LiveTrackingMap.js` | MapLibre GL with MapTiler API Key & Vector Radar Canvas fallback | **Working and verified** |
| Pre-Acceptance Order Cancellation | `Orders.js` / `POST /user/order/cancel/:id` | Allowed only when status is `PLACED`, rolls back coupon quota | **Working and verified** |

---

## 2. Restaurant Kitchen Display System (KDS) Module

| Feature | Component / Route | Implementation Description | Status |
|---|---|---|---|
| Restaurant Sign In & Upload | `RestaurantSignin.js` / `POST /restaurant/signin` | Multer image upload for storefront, saves profile | **Working and verified** |
| Restaurant Login | `UserLogin.js` / `POST /restaurant/login` | Issues restaurant role JWT token | **Working and verified** |
| Incoming Orders Display | `RestaurantOrder.js` / `GET /restaurant/order/:id` | Filtered strictly by authenticated `restaurantId` | **Working and verified** |
| Real-time Audio/Visual Alert | `RestaurantOrder.js` | Web Audio synthesizer chime and toast alert on new orders | **Working and verified** |
| Kitchen Order Acceptance | `RestaurantOrder.js` / `POST /restaurant/order/:id/accept` | Transitions status to `ACCEPTED` and triggers delivery dispatch | **Working and verified** |
| Kitchen Order Rejection | `RestaurantOrder.js` / `POST /restaurant/order/:id/reject` | Records rejection reason, sets status `REJECTED`, refunds payment | **Working and verified** |
| Mark Food Ready | `RestaurantOrder.js` / `POST /restaurant/order/:id/ready` | Signals driver that food is packed (`READY_FOR_PICKUP`) | **Working and verified** |
| Role Boundary Protection | `restaurantroutes.js` | Blocks kitchens from setting `Picked Up` or `Delivered` | **Working and verified** |
| Menu Item Upload | `RestaurantAdmin.js` / `POST /restaurant/menuupload` | Form with image upload, veg/non-veg toggle, and price | **Working and verified** |
| Menu Item Deletion | `RestaurantAdmin.js` / `DELETE /restaurant/deletemenu/:id` | Deletes dish with real-time broadcast to all clients | **Working and verified** |
| Restaurant Availability Toggle | `RestaurantAdmin.js` / `PATCH /restaurant/availability/:id` | Online/Offline toggle with real-time client sync | **Working and verified** |

---

## 3. Delivery Fleet Operations Module

| Feature | Component / Route | Implementation Description | Status |
|---|---|---|---|
| Delivery Partner Registration | `UserSigin.js` / `POST /delivery/signin` | Registers driver with vehicle details and phone | **Working and verified** |
| Delivery Partner Login | `UserLogin.js` / `POST /delivery/login` | Issues deliveryperson role JWT token | **Working and verified** |
| Online / Offline Availability | `DeliveryOrders.js` / `PATCH /delivery/availability/:id` | Toggles driver availability in dispatch pool | **Working and verified** |
| Dispatch Offer Modal | `DeliveryOrders.js` / `GET /delivery/offers/:partnerId` | 45-second countdown modal with earnings and distance | **Working and verified** |
| Atomic Offer Acceptance | `DeliveryOrders.js` / `POST /delivery/offers/:orderId/accept` | Conditional update preventing race conditions between drivers | **Working and verified** |
| Trip Offer Decline | `DeliveryOrders.js` / `POST /delivery/offers/:orderId/decline` | Records decline reason and redispatches to next candidate | **Working and verified** |
| Arrival at Kitchen Confirmation | `DeliveryOrders.js` / `POST /delivery/order/:orderId/arrived` | Transitions deliveryStatus to `ARRIVED_AT_RESTAURANT` | **Working and verified** |
| Package Pickup Confirmation | `DeliveryOrders.js` / `POST /delivery/order/:orderId/pickup` | Transitions orderStatus to `PICKED_UP`, delivery to `OUT_FOR_DELIVERY` | **Working and verified** |
| Live GPS Location Telemetry | `DeliveryOrders.js` / `POST /delivery/location` | Broadcasts lat/lng to Socket.IO room `order_<id>` | **Working and verified** |
| Customer 4-Digit OTP Verification | `DeliveryOrders.js` / `POST /delivery/order/:orderId/complete` | Validates customer PIN OTP before completing delivery | **Working and verified** |
| Earnings & Trip History | `DeliveryOrders.js` / `GET /delivery/order/:id` | Displays completed deliveries and accumulated payouts | **Working and verified** |

---

## 4. Platform Administration Module

| Feature | Component / Route | Implementation Description | Status |
|---|---|---|---|
| Admin Secure Login | `AdminLogin.js` / `POST /admin/login` | Dedicated admin authentication with Bcrypt validation | **Working and verified** |
| KPI Overview Dashboard | `AdminDashboard.js` / `GET /admin/dashboard` | Aggregates users, restaurants, drivers, orders, and total GMV | **Working and verified** |
| Dispatch Operations Monitor | `AdminDashboard.js` / `GET /admin/deliveries` | Real-time board showing searching, offered, and in-transit orders | **Working and verified** |
| Manual Driver Reassignment | `AdminDashboard.js` / `POST /admin/deliveries/:orderId/reassign` | Administrative driver reassignment with audit reason | **Working and verified** |
| Restaurant Vetting & Toggle | `AdminDashboard.js` / `PATCH /admin/restaurant/:id/toggle` | Activates or suspends restaurant accounts | **Working and verified** |
| Promotional Coupon Management | `AdminDashboard.js` / `POST /coupons` | Creates coupons with discount percentage, cap, and min order | **Working and verified** |

---

## 5. Payments, Notifications & AI Module

| Feature | Component / Route | Implementation Description | Status |
|---|---|---|---|
| Razorpay Gateway Order Init | `services/razorpay.service.js` | Server-side order creation with validated amounts | **Working and verified** |
| Payment Signature Verification | `services/razorpay.service.js` | HMAC-SHA256 signature verification | **Working and verified** |
| Webhook Handling | `paymentroutes.js` / `POST /payment/webhook` | Idempotent payment.captured handler | **Working and verified** |
| Transactional Order Confirmation Email | `services/email.service.js` | Nodemailer with automatic fallback | **Working and verified** |
| AI Chatbot & RAG Engine | `AIChatWidget.js` / `POST /api/chat` | Natural language search over live menus, coupons, and orders | **Working and verified** |
| Live Gemini API Generation | `services/chat.service.js` | Real multimodal reasoning when API key is active | **Blocked by an external dependency** (Fallback operates smoothly) |
| Production SMTP Delivery | `services/email.service.js` | Real customer inbox delivery when SMTP credentials are set | **Blocked by an external dependency** (Fallback operates smoothly) |
