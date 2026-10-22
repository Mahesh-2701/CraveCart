# CRAVECART COMPETITIVE PRODUCT BENCHMARK (SWIGGY & ZOMATO)

This document benchmarks CraveCart against the publicly observable product capabilities, interface patterns, and operational workflows of commercial food delivery leaders (Swiggy and Zomato).

---

## 1. Competitive Capability Comparison Matrix

| Product Capability | Observable Benchmark Behavior (Swiggy / Zomato) | Existing CraveCart Implementation | Gap or Weakness | Proposed Improvement | Implementation Priority | Dependencies | Verification Method |
|---|---|---|---|---|---|---|---|
| **Delivery Locality Selection** | Persistent header selector allowing customers to pick saved addresses or search neighborhoods. | Implemented in `Navbar.js` with quick-edit prompt and localStorage sync. | Mobile dropdown can be further refined with interactive modal. | Persistent locality indicator with instant neighborhood update. | P2 | React State & LocalStorage | Browser verification & click tests |
| **Dietary Pure Veg Filter** | High-visibility toggle switch instantly filtering menu to green veg-badge items only. | Implemented in `Foods.js` with green badge and SVG dot. | Fully aligned with benchmark. | Maintain state synchronization across route navigation. | P3 | React State & API filter | UI filter click & assertion |
| **Dish Search & Autocomplete** | Instant multi-attribute search across restaurant names, dishes, cuisines, and tags. | Implemented in `Foods.js` querying MongoDB with debounce and clear button. | Fuzzy matching can be extended with atlas search indexes. | Add search query parameter persistence in URL. | P2 | Express search endpoint | Live query tests |
| **Authoritative Pricing & Fees** | Server strictly determines item pricing, delivery fees, packaging fees, and taxes. | Implemented in `routes.js` and `paymentroutes.js`. Fetches live MongoDB item records. | No gap. Server pricing overrides client payloads. | Retain strict server-side calculation. | P0 | Mongoose models | Automated pricing test (`fullstack_e2e.test.js`) |
| **Promotions & Coupon Engine** | Real-time coupon validation enforcing minimum spends, discount percentages, and max ceilings. | Implemented in `couponroutes.js` and `CouponSchema.js` (`WELCOME50`, `CRAVE20`, etc.). | Fully verified. Rolls back quota on pre-kitchen cancellation. | Maintain atomic decrement on cancellation. | P1 | CouponSchema | Supertest e2e test |
| **Kitchen Order Acceptance** | Kitchen receives incoming tickets, accepts with preparation time, or rejects with reason. | Implemented in `RestaurantOrder.js` (`POST /restaurant/order/:id/accept`). | Rejection now triggers refund and notifies rooms. | Audio alert on new kitchen tickets. | P1 | Web Audio & Socket.IO | KDS acceptance test |
| **Decoupled Delivery Dispatch** | Kitchens do not pick riders. System dispatches nearest available partner based on GPS. | Implemented in `delivery.service.js` with Haversine ranking and 45s timer. | Concurrency protected via atomic `findOneAndUpdate`. | Automated redispatch upon timeout. | P0 | MongoDB atomic operations | Concurrency unit tests |
| **Delivery Offer Acceptance** | Driver receives trip offer with earnings and restaurant location, must explicitly accept. | Implemented in `DeliveryOrders.js` with 45s countdown modal. | Fully aligned with benchmark. | Background sweeper expires stale offers. | P1 | Socket.IO & Timer | Offer countdown test |
| **Live Order Tracking Map** | Interactive vector map displaying kitchen, delivery courier, and customer location. | Implemented in `LiveTrackingMap.js` (MapLibre GL + Radar Canvas fallback). | Prevents blank screens when WebGL is absent. | Keep map style switcher (Voyager, Streets, Satellite). | P2 | MapTiler API Key & Canvas | Browser rendering test |
| **Customer Delivery PIN OTP** | Courier must enter 4-digit customer OTP to prevent unauthorized delivery mark-as-done. | Implemented in `deliverroutes.js` (`POST /delivery/order/:orderId/complete`). | Prevents fraudulent delivery completions. | Enforce 4-digit PIN OTP before closing trip. | P1 | OrderSchema `deliveryOtp` | Invalid/valid OTP test |
| **One-Click Reorder** | Past orders page offers "Order Again" button to quickly refill cart. | Implemented in `Orders.js` (`handleReorder`). | Fully aligned with benchmark. | Pushes items into user's active cart. | P2 | React Router & Cart API | Browser click & cart redirect test |
| **Persistent Active Order Pill** | Swiggy/Zomato show a floating pill/banner in navbar if user has an active delivery in transit. | Implemented in `Navbar.js` linking directly to `/orders/track/:id`. | Fully aligned with benchmark. | Live status badge updates via Socket.IO. | P2 | Socket.IO `orderStatusChanged` | Active order test |
| **AI Food Assistant** | Natural language conversational bot answering food questions, recommendations, and status. | Implemented in `AIChatWidget.js` (`POST /api/chat`) with RAG and live MongoDB data. | Grounded in authentic database records. | Restrict private order lookups to authenticated tokens. | P1 | Chat service & RAG | AI endpoint verification test |

---

## 2. Key Differentiation & Architectural Decisions

1. **No Proprietary Vendor Lock-in**:
   - Swiggy and Zomato utilize proprietary microservices and paid third-party mapping suites (Google Maps / Mapbox).
   - CraveCart achieves equivalent interactive tracking using MapLibre GL JS and OpenStreetMap vector tiles, reinforced with an automated Canvas Vector Radar fallback.
2. **Deterministic RAG Fallback**:
   - When external LLM APIs experience rate-limits or missing keys, CraveCart falls back to an internal deterministic natural language resolver, guaranteeing 100% uptime for food queries.
3. **Decoupled Role Security**:
   - Kitchens, drivers, customers, and administrators each operate within strict role-based permission boundaries, preventing cross-tenant data leaks and unauthorized status mutations.
