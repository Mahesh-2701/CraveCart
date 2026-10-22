# CRAVECART PRODUCTION ARCHITECTURE DOCUMENTATION

## 1. System Overview

CraveCart is an enterprise-grade food delivery application architecture supporting four core actors through a single unified backend:
1. **Customers (Ordering Application)**: Restaurant/menu discovery, live dietary filters, coupon application, Razorpay payment processing, MapLibre 3D live order tracking with Canvas Radar fallback, 1-click reordering, and AI-assisted conversational ordering.
2. **Restaurant Owners (Kitchen Display System & Partner Portal)**: Operating status toggling, menu CRUD with dietary attributes & image uploading, real-time incoming order audio/visual alerts, order state progression (`Preparing` -> `Ready for Pickup`).
3. **Delivery Partners (Fleet Portal)**: Online/Offline availability toggle, candidate offer modal with 45s timer, dispatch status progression (`Arrived at Kitchen` -> `Picked Up` -> `Out for Delivery` -> `Delivered with OTP`), and authentic GPS telemetry broadcasting.
4. **Platform Administrators (Command Center)**: Platform KPIs, GMV metrics, restaurant vetting/activation toggles, fleet monitoring, manual trip overrides, and promotional coupon engine management.

---

## 2. Technical Stack

| Layer | Technology |
|---|---|
| **Frontend Client** | React 18, React Router DOM 7, Axios, Socket.IO Client 4.8 |
| **UI & Styling** | Custom CSS Design System (`index.css`), Google Fonts (Outfit & Plus Jakarta Sans), Bootstrap 5 |
| **Maps & Geospatial** | MapLibre GL JS, MapTiler Vector Tiles + Automated HTML5 Canvas Vector Radar Fallback |
| **Backend Runtime** | Node.js, Express.js 4/5 |
| **Real-time Engine** | Socket.IO 4.8 with authenticated handshakes and scoped room boundaries |
| **Database** | MongoDB Atlas via Mongoose 8 with indexed relational lookups |
| **Payment Gateway** | Razorpay Server SDK with server-authoritative pricing & HMAC-SHA256 signature verification |
| **Transactional Email** | Nodemailer with automatic fallback |
| **AI & Knowledge** | Hybrid Intent Classifier + Authenticated MongoDB Live Resolver + Keyword/Semantic RAG |
| **Testing** | Jest, Supertest (51 Automated Unit, Integration, & E2E Tests) |

---

## 3. Core Architecture Subsystems

### 3.1 Security & Authentication Architecture
- **Unified Token Engine (`backend/config/auth.config.js`)**: Single authoritative JWT signer with secret verification.
- **Role-Based Access Control (`backend/middleware/auth.middleware.js`)**:
  - `authenticate`: Validates `Authorization: Bearer <token>`
  - `authorizeRoles('user', 'restaurant', 'deliveryperson', 'admin')`: Enforces strict tenant separation.
  - `enforceOwnership('id')`: Prevents IDOR (Insecure Direct Object Reference) by ensuring customers only access their own orders and profiles.
- **Admin Password Encryption**: Automated migration of legacy admin credentials to bcrypt hashes upon first login.

### 3.2 Real-time Socket Room Isolation (`backend/services/socket.service.js`)
Dedicated scoped rooms protect private events:
- `user_${userId}`: Customer-only private events (`orderStatusChanged`, `orderPlaced`, `order:rejected`).
- `restaurant_${restaurantId}`: Kitchen order notifications (`newKitchenOrder`, `updatingRestOrder`).
- `delivery_${deliveryPersonId}`: Fleet dispatch assignments (`delivery:offer_received`, `delivery:assigned`).
- `order_${orderId}`: High-frequency live GPS tracking updates (`tracking:update`).

### 3.3 Swiggy-Style Decoupled Delivery Dispatch
- **Candidate Discovery**: Asynchronous Haversine distance ranking evaluating nearby active delivery partners.
- **Offer Timeout**: 45-second countdown timer for courier acceptance.
- **Atomic Claim Mechanism**: Conditional `findOneAndUpdate` prevents multiple couriers from accepting the same trip.
- **Customer Delivery PIN OTP**: Secure 4-digit PIN OTP generated at order creation; driver must input valid OTP to complete delivery.

### 3.4 AI Assistant with Live Data Retrieval & RAG
- The `/api/chat` assistant never invents unverified data.
- Intent classification queries live MongoDB Atlas collections for:
  - Menu items, prices, ingredients, and veg/non-veg tags.
  - Active restaurant hours and ratings.
  - Active coupons and discount rules.
  - Authenticated user order statuses.

### 3.5 Payment Integrity & Idempotency
- Price totals are strictly computed on the backend from authoritative database records.
- Razorpay order creation enforces minimum spend thresholds and maximum discount caps.
- Signatures are verified with HMAC-SHA256 before marking any order as `Paid`.
