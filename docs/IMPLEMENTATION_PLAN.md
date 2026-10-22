# CraveCart V2 Upgrade Implementation Plan

**Branch:** `upgrade/production-v2`  
**Execution Strategy:** Incremental, non-destructive, test-driven, backward-compatible.

---

## Progress Checklist

- [x] **Phase A: Repository Audit & Baseline Discovery**
  - [x] Inspect full codebase, models, routes, controllers, frontend pages, socket usage.
  - [x] Identify critical vulnerabilities, privacy leaks, and hardcoded secrets.
  - [x] Author `docs/UPGRADE_AUDIT.md`.
- [x] **Phase B: Branch Protection & Baseline Setup**
  - [x] Create and checkout branch `upgrade/production-v2`.
  - [x] Establish package dependencies & baseline tests for backend & frontend.
  - [x] Author `docs/IMPLEMENTATION_PLAN.md`.

---

- [x] **Phase C1: Unified Environment, Security & Authentication Architecture**
  - [x] Create `backend/.env.example` and `frontend/.env.example`.
  - [x] Support dynamic `MONGODB_URI` with graceful fallback for offline test mode in `dbconnect.js`.
  - [x] Unify JWT signing/verification in `auth.config.js` with backward-compatible secret acceptance.
  - [x] Implement central auth middleware (`auth.middleware.js`) with strict role-based access control (`user`, `restaurant`, `deliveryperson`, `admin`).
  - [x] Secure admin authentication with bcrypt hashing and legacy plaintext automatic migration in `Admin.js`.
  - [x] Protect against IDOR on user order/profile access and enforce tenant isolation.

- [x] **Phase C2: Scoped Socket.IO Rooms & Real-Time Tracking Engine**
  - [x] Authenticate WebSocket handshakes.
  - [x] Establish room architecture: `user_${userId}`, `restaurant_${restaurantId}`, `delivery_${deliveryId}`, `order_${orderId}`.
  - [x] Fix global broadcast data leak (`updatedOrder` / `updatingDelivery` limited strictly to authorized room participants).
  - [x] Implement live GPS update event (`delivery:location_update`) with server-side validation.
  - [x] Implement simulated delivery movement endpoint with interval controls and mandatory "SIMULATED / DEMO TRACKING" flag.

- [x] **Phase C3: Order Lifecycle State Machine, Offers & Razorpay Test Integration**
  - [x] Extend `OrderSchema` backward-compatibly to support multi-item cart orders, delivery coordinates, live tracking coordinates, coupon discounts, and order timeline logs.
  - [x] Create Coupon model & service with validation (minimum spend, discount limits, expiration).
  - [x] Install and configure Razorpay server SDK in test mode (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
  - [x] Implement `/payment/create-order` with server-authoritative price calculation.
  - [x] Implement `/payment/verify` with HMAC-SHA256 signature verification and webhook idempotency.
  - [x] Centralize order transition state machine (`Placed` -> `Confirmed` -> `Preparing` -> `Ready for Pickup` -> `Out for Delivery` -> `Delivered` / `Cancelled`).

- [x] **Phase C4: AI Assistant with Live Data Retrieval & RAG Pipeline**
  - [x] Build conversational chat service (`/api/chat`).
  - [x] Query intent classifier (Food search, Dietary preferences, Live order status, Active coupons, Restaurant info, FAQ policies).
  - [x] Implement authenticated live data resolver (queries MongoDB using authenticated user session).
  - [x] Implement RAG knowledge base for menu details, ingredients, allergens, FAQs, and policies.
  - [x] Implement deterministic fallback engine ensuring zero downtime when external LLM credentials are absent.

- [x] **Phase C5: Transactional Email & Notification Service**
  - [x] Create email notification provider service using Nodemailer (with Ethereal / test transporter).
  - [x] Implement responsive HTML & text templates for:
    - Welcome & registration
    - Order confirmation & receipt
    - Payment success
    - Order dispatch & delivery alerts
    - Cancellation / refund notifications
  - [x] Asynchronous notification triggers decoupled from order requests.

- [x] **Phase C6: Frontend Client Unification & Modern UI/UX Redesign**
  - [x] Centralize API client (`src/config/api.js`) to support dynamic environment URLs and WebSocket connections.
  - [x] Implement modern, responsive design system (`src/index.css`) with CSS custom properties, glassmorphism elements, vibrant food palette, polished cards, and mobile bottom bar navigation.
  - [x] Upgrade Customer Portal:
    - Interactive Hero banner & category filters.
    - Dish search with dietary filters (Veg/Non-Veg, rating, price).
    - Promotional coupon carousel & coupon applicator at checkout.
    - MapLibre GL JS live order tracking page (`/orders/track/:orderId`) with 3D buildings, route view, and simulation toggle.
    - Floating AI Chatbot widget (`AIChatWidget.js`) with instant order inquiries and food suggestions.
  - [x] Upgrade Restaurant Portal:
    - Order management with audio/visual status indicators.
    - Menu item availability toggle and real-time sync.
  - [x] Upgrade Delivery Partner Portal:
    - Availability status toggle.
    - Assigned orders list with one-click status transitions.
    - Live location broadcaster & simulator controls.
  - [x] Upgrade Admin Portal:
    - Platform KPIs and statistics.
    - Restaurant approval toggles.
    - Coupon creation and monitoring.

- [x] **Phase C7: SEO, Accessibility & Marketing Readiness**
  - [x] Add dynamic meta tags, OpenGraph tags, and semantic headings in `public/index.html`.
  - [x] Add `public/robots.txt` and `public/sitemap.xml`.
  - [x] Implement Schema.org JSON-LD structured data for Restaurants and Menus.
  - [x] Add ARIA accessibility attributes and visible keyboard focus states.

- [x] **Phase C8: Testing, Verification & Final Documentation**
  - [x] Implement backend test suite (`backend/tests/api.test.js`) covering Auth, Order State Machine, Coupon calculation, Payment signature verification, and Chatbot retrieval.
  - [x] Execute test runs: 14 passing tests, 0 failures.
  - [x] Execute production build for frontend: 439 kB optimized bundle compiled successfully.
  - [x] Author `docs/ARCHITECTURE.md`, `docs/ENVIRONMENT_SETUP.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, and `docs/KNOWN_LIMITATIONS.md`.
