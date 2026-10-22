# CRAVECART ARCHITECTURE AUDIT REPORT

**Date**: October 22, 2026  
**Target**: Full-Stack Architecture, Modular Boundaries, State Management & Real-Time Engine  

---

## 1. Architectural Style & Boundaries

CraveCart is engineered as a **cohesive modular monolith**:
- **API Runtime**: Express.js server exposing RESTful endpoints partitioned by functional bounded contexts (`/user`, `/restaurant`, `/delivery`, `/admin`, `/payment`, `/coupons`, `/api/chat`).
- **Data Persistence**: MongoDB Atlas accessed via Mongoose schemas with indexed lookup keys.
- **Real-Time Layer**: Socket.IO server co-located with Express on the HTTP listener, orchestrating scoped rooms.
- **Client Application**: React 18 Single Page Application consuming REST endpoints via Axios and real-time events via Socket.IO client.

### Evaluation of Modular Boundaries
1. **Authentication & Authorization (`backend/config/auth.config.js`, `backend/middleware/auth.middleware.js`)**:
   - Centralized JWT issuance and verification.
   - Clean middleware pipeline: `authenticate` -> `authorizeRoles` -> `enforceOwnership`.
2. **Order Lifecycle Engine (`backend/Models/OrderSchema.js`, `backend/services/delivery.service.js`)**:
   - Independent state machines for kitchen preparation (`orderStatus`) and delivery transit (`deliveryStatus`).
   - Prevents conflation of food preparation states with logistics transit states.
3. **Delivery Dispatch Engine (`backend/services/delivery.service.js`)**:
   - Encapsulates geospatial ranking, countdown expiry, atomic acceptance, and OTP verification in dedicated service methods outside of route controllers.
4. **Payment Gateway Abstraction (`backend/services/razorpay.service.js`)**:
   - Decoupled gateway interface handling order creation, key exposure, and HMAC SHA256 crypto calculations.
5. **Conversational AI & Retrieval (`backend/services/chat.service.js`, `backend/services/rag.service.js`)**:
   - Hybrid routing separating dynamic operational queries from static policy document search.

---

## 2. Real-Time Socket Architecture & Tenant Isolation

Previous implementations suffered from global broadcasts (`io.emit`), risking data leakage between distinct customers and restaurants. CraveCart implements strict room partitioning:

| Room Name | Target Actor | Emitted Events | Purpose |
|---|---|---|---|
| `user_${userId}` | Customer | `orderStatusChanged`, `orderPlaced`, `order:rejected` | Private notifications of order milestones |
| `restaurant_${restaurantId}` | Kitchen | `newKitchenOrder`, `updatingRestOrder`, `order:cancelled` | Real-time incoming ticket alerts for chefs |
| `delivery_${partnerId}` | Courier | `delivery:offer_received`, `delivery:assigned`, `order:ready` | Targeted dispatch offers with timer countdowns |
| `order_${orderId}` | Order Participants | `tracking:update`, `order:accepted`, `order:ready`, `delivery:status_update` | High-frequency live GPS telemetry streaming |

---

## 3. Database Schema Design & Indexing

The schema architecture in `backend/Models/` supports relational integrity inside MongoDB:

1. **`UserSchema`**:
   - Unique sparse index on `email`.
   - Bcrypt pre-save hook for automatic password hashing.
2. **`RestaurantSchema`**:
   - Unique index on `name` and `email`.
   - Embedded `coordinates: { lat, lng }` enabling fast spatial calculations.
   - Dietary and operational flags (`isactive`, `cuisine`, `costForTwo`).
3. **`Menuitems`**:
   - Referenced `restaurantid` linking dishes to kitchen partners.
   - Indexed fields: `name`, `category`, `isVeg`, `price`.
4. **`OrderSchema`**:
   - Dual lifecycle state machines (`orderStatus`, `deliveryStatus`).
   - Multi-item array schema (`items: [orderItemSchema]`) preserving item names, prices, and quantities at order time.
   - Subdocuments for `deliveryOffer`, `declinedPartners`, and `deliveryTimeline`.
   - Customer 4-digit PIN OTP field (`deliveryOtp`).
5. **`CouponSchema`**:
   - Unique uppercase index on `code`.
   - Built-in methods for server-side discount and cap validation.

---

## 4. Security & Hardening Assessment

- **Injection Prevention**: Mongoose ODM with typed schema casting protects against SQL/NoSQL injection.
- **Insecure Direct Object Reference (IDOR)**:
  - `enforceOwnership('id')` ensures users cannot inspect or mutate other users' carts, profiles, or orders.
  - Tracking endpoint `GET /user/order-tracking/:orderId` validates that the requesting token belongs to the order owner, assigned driver, authorized restaurant, or administrator.
- **Payment Verification**: Client cannot mark orders as paid without valid server-calculated Razorpay HMAC signatures.
- **Secrets Management**: No secret keys, database credentials, or API tokens are exposed in public client bundles or documentation.

---

## 5. Architectural Recommendations

1. **Keep the Modular Monolith**: Given the current user volume and deployment model, a modular monolith remains simpler, faster, and more maintainable than a distributed microservices setup.
2. **Preserve Backward Compatibility**: Continue supporting legacy route schemas while encouraging modern multi-item arrays across the API.
