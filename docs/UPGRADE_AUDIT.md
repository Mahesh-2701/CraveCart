# UPGRADE AUDIT: CraveCart Food Delivery Platform

**Version:** 2.0.0-audit  
**Date:** 2026-10-22  
**Branch:** `upgrade/production-v2`  
**Target:** Upgrade Existing Food Delivery Platform to Production-Oriented V2

---

## 1. Executive Summary

CraveCart is an existing full-stack food delivery application built on the MERN stack (MongoDB, Express, React, Node.js) with real-time bidirectional communication via Socket.IO. The platform connects four core user roles: Customers, Restaurant Owners, Delivery Partners, and Administrators.

While the existing system provides the foundational end-to-end user journeys (auth, menu creation, cart management, basic order dispatching, and socket-based status broadcast), several critical architectural, security, reliability, and UX deficiencies must be resolved to elevate it to a production-grade standard.

---

## 2. Existing Architecture & Inventory

### 2.1 Backend Architecture
- **Runtime & Framework:** Node.js v26 / Express.js 5.1.0 (with nodemon, dotenv, cors).
- **Database:** MongoDB Atlas via Mongoose 8.18.1 (`backend/dbconnect.js`).
- **File Uploads:** Multer 2.0.2 configured for restaurant images and menu item images stored in `backend/uploads/`.
- **Real-Time Engine:** Socket.IO 4.8.1 bound to HTTP server, attached to `req.io` in Express middleware.
- **Authentication & Roles:**
  - 4 separate collections & route modules:
    - User (`backend/Models/UserSchema.js`, `backend/Routes/UserRoutes/routes.js`)
    - Restaurant (`backend/Models/RestaurantSchema.js`, `backend/Routes/RestaurantRoutes/restaurantroutes.js`)
    - Delivery Person (`backend/Models/Deliveryperson.js`, `backend/Routes/DeliverypersonRoutes/deliverroutes.js`)
    - Admin (`backend/Models/Admin.js`, `backend/Routes/AdminRoutes/adminroutes.js`)
  - Order System (`backend/Models/OrderSchema.js`)
  - Cart System (`backend/Models/CartSchema.js`)
  - Menu Items (`backend/Models/Menuitems.js`)

### 2.2 Frontend Architecture
- **Framework:** React 19.1.1, React Router DOM 7.9.1.
- **Build System:** `react-scripts` 5.0.1 (Create React App template).
- **Styling:** Bootstrap 5.3.8 (via CDN in `public/index.html`), inline styles, and `react-toastify`.
- **State & Networking:** Axios for HTTP, `socket.io-client` 4.8.1, `localStorage` for tokens and user IDs.
- **Role Portals:**
  - Customer (`App.js`, `Foods.js`, `Restaraunts.js`, `Cart.js`, `Orders.js`, `UserProfile.js`)
  - Restaurant Owner (`RestaurantAdmin.js`, `RestaurantOrder.js`, `RestaurantsView.js`)
  - Delivery Partner (`DeliveryPerson.js`, `DeliveryPersonView.js`, `DeliveryOrders.js`)
  - Admin (`AdminLogin.js`, `AdminDashboard.js`)

---

## 3. Critical Issues & Vulnerabilities Identified

1. **Security & Authentication Flaws:**
   - **Secret Fragmentations & Hardcoding:** Each route file hardcodes its own JWT secret (`"asdfghjkl"`, `"mahiraji"`, `"rajimahi"`, `"mahesh"`), bypassing `.env.SECRET_TOKEN`.
   - **Plaintext Admin Passwords:** `AdminRoutes/adminroutes.js` compares `result.password == enteredpassword` directly without bcrypt hashing.
   - **Missing Role Validation in Middleware:** Middleware validates token signatures but does not strictly verify whether the caller possesses the required role (e.g., an ordinary user token can be sent to restaurant or admin routes).
   - **Flawed Async Middleware Execution:** In `deliverroutes.js` and `restaurantroutes.js`, `next()` was called outside or in parallel with `jwt.verify` callback, causing race conditions and header errors.
   - **Direct Database URI Hardcoded:** `backend/dbconnect.js` hardcodes a live MongoDB Atlas connection string instead of reading `process.env.MONGODB_URI` with a fallback.

2. **Real-time Data Privacy Leaks:**
   - **Global Broadcast of Order Data:** `req.io.emit("updatedOrder", result)` broadcasts one user's entire updated order history to **all** connected clients worldwide!
   - Lack of scoped socket rooms (`order_:id`, `user_:id`, `restaurant_:id`, `delivery_:id`).

3. **Frontend API Configuration:**
   - All frontend files hardcode `https://cravecart-5vz7.onrender.com`. Local development or private staging fails completely without manual code edits. Needs centralized `api.js` configuration respecting `REACT_APP_API_URL` and `REACT_APP_WS_URL`.

4. **Cart & Order Model Limitations:**
   - `OrderSchema` records only a single `menuid` per order document. Placing a multi-item cart order triggers parallel individual order creations in a loop (`cartItems.map(...)`) on the client.
   - Totals and discounts are calculated in the browser; no server-side validation or coupon engine exists.

5. **Missing Features Mandated by V2:**
   - **Razorpay Integration:** No payment gateway server SDK or client checkout; orders directly mark "COD" or "Online" without signature validation or webhooks.
   - **MapLibre GL JS & Live Tracking:** No interactive maps or live GPS/simulated delivery tracking exists.
   - **AI/RAG Chatbot:** No conversational assistant with authenticated data access or vector knowledge base.
   - **Email & Notification Service:** No transactional email provider, templates, or delivery status notifications.
   - **Offers & Coupon Engine:** No promo codes, discounts, or minimum order checks.
   - **SEO, Metadata & Discovery:** Default CRA metadata ("Web site created using create-react-app"), lack of OpenGraph, structured schema, or sitemaps.

---

## 4. Proposed Improvements & Upgrades

1. **Unified Secure Backend Architecture:**
   - Centralize environment configuration (`dotenv`, `process.env.PORT`, `process.env.MONGODB_URI`, `process.env.JWT_SECRET`).
   - Secure and unify authentication: standard bcrypt verification across all roles (including Admin), unified JWT signing, centralized `authenticate` and `authorizeRole(...)` middleware.
   - Introduce order ownership checks preventing IDOR (Insecure Direct Object Reference).

2. **Scoped Socket Rooms & Real-time Tracking:**
   - Authenticated WebSocket handshake.
   - Join client to rooms: `user_${userId}`, `restaurant_${restaurantId}`, `delivery_${deliveryPersonId}`, `order_${orderId}`.
   - Emit location updates, status changes, and audio/visual toast notifications only to authorized participants.

3. **Full Razorpay Test-Mode Integration:**
   - Server-side Razorpay order creation (`/payment/create-order`) with authoritative pricing.
   - Client-side Razorpay modal trigger with test key.
   - Server-side signature verification (`/payment/verify`) with HMAC SHA256 and webhook deduplication.

4. **MapLibre GL JS & Delivery Tracking (Live + Demo Simulator):**
   - Free OpenStreetMap-compatible vector tile style.
   - Interactive 3D pitch/bearing map showing restaurant location, customer destination, and delivery partner location.
   - Server-side location update API + simulation mode endpoint (`/delivery/simulate/:orderId`) with clearly labeled "SIMULATED / DEMO TRACKING" UI tag.

5. **AI Food Assistant with RAG & Live MongoDB Integration:**
   - Hybrid architecture:
     - Intent parser: Detects queries for order status, menu items, restaurants, dietary preferences (veg/non-veg), budget meals, and active coupons.
     - Authenticated live data resolver: Directly queries MongoDB with user context (session `userId`) for real-time prices, availability, and user order status.
     - RAG Knowledge Base: Searchable knowledge store for FAQs, delivery policies, dietary details, allergens, and restaurant descriptions.
     - Deterministic fallback + LLM provider abstraction (Gemini / local / mockable fallback) ensuring 100% reliability even without external API keys.

6. **Transactional Email Engine:**
   - Nodemailer-based email service with support for Ethereal test accounts, standard SMTP, and mock test transports.
   - Responsive HTML & text templates for order confirmation, payment receipt, status updates, and dispatch notifications.

7. **Advanced Search, Filters, and Offers Engine:**
   - Debounced search across restaurant names, cuisines, and dish names.
   - Filter by Vegetarian/Non-Vegetarian, price range, ratings, and open status.
   - Coupon system with models, admin management, promo validation (`WELCOME50`, `CRAVE20`), minimum spends, and discount caps.

8. **Design System & UI/UX Elevation:**
   - Mobile-first responsive layout, modern aesthetic with rich typography, glassmorphism accents, polished restaurant cards, badges, loading skeletons, and interactive state management.
   - Unified API config across all frontend components.

---

## 5. Compatibility Constraints & Risk Matrix

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| Legacy single-item `OrderSchema` structure | High | Extend `OrderSchema` backward-compatibly with `items: [...]`, while retaining `menuid`, `price`, `quantity` for existing DB records. |
| Existing plaintext admin passwords | Medium | Add migration fallback in admin login: if plaintext matches, hash with bcrypt immediately and update record. |
| Hardcoded Render backend URLs | High | Refactor frontend API utility to read `REACT_APP_API_URL || "http://localhost:5000"`, keeping production URLs configurable without breaking local dev. |
| React 19 dependency constraints | Medium | Ensure all newly added frontend libraries (e.g. MapLibre GL) are compatible with React 19 or wrapper-free. |

---

## 6. Implementation Sequence

- **Phase 1:** Baseline verification & Environment unification.
- **Phase 2:** Core Security, Centralized Auth & Model Extensions.
- **Phase 3:** Frontend API client unification & shared UI design system.
- **Phase 4:** Order state machine, coupon engine & Razorpay test-mode integration.
- **Phase 5:** MapLibre GL live tracking & simulation engine with Socket.IO rooms.
- **Phase 6:** AI Chatbot with live data tools & RAG knowledge retrieval.
- **Phase 7:** Email notification engine & templates.
- **Phase 8:** SEO, accessibility, performance, and validation testing.
- **Phase 9:** Documentation & Deployment guides.
