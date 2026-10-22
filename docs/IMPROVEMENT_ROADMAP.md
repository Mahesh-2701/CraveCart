# CRAVECART STRATEGIC IMPROVEMENT ROADMAP

**Version**: 2.0.0  
**Status**: Production-Ready Enhancement  

---

## 1. Roadmap Milestones & Phases

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Security & Identity Foundation (Completed)                   │
├────────────────────────────────────────────────────────────────────────┤
│ • Unified JWT Auth & Stateless verification                            │
│ • Role-Based Access Control (Customer, Restaurant, Rider, Admin)       │
│ • IDOR & Cross-tenant data leak protection in order tracking           │
│ • Bcrypt password encryption & schema sanitization                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│ Phase 2: Decoupled Order & Logistics Workflow (Completed)             │
├────────────────────────────────────────────────────────────────────────┤
│ • Swiggy-style Candidate Discovery & Haversine Distance Ranking        │
│ • 45-Second Trip Offer Countdown Timer with atomic claim lock          │
│ • Customer 4-digit PIN OTP verification before delivery completion     │
│ • Role-boundary enforcement preventing restaurants from marking transit│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│ Phase 3: Commercial UI/UX & Brand Modernization (Completed)           │
├────────────────────────────────────────────────────────────────────────┤
│ • Restored classic #FF6F00 orange circular brand emblem                │
│ • Eliminated non-standard "V2" & "OPS" badges across all portals       │
│ • Resilient MapLibre GL map with Canvas Vector Radar Fallback          │
│ • Header Delivery Location Selector & Active Order Live Tracker Pill   │
│ • Customer 1-Click "Order Again" (Reorder) action in Order History     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│ Phase 4: Full-Stack Verification & Quality Assurance (Completed)      │
├────────────────────────────────────────────────────────────────────────┤
│ • 51 passing automated backend tests across 3 comprehensive suites     │
│ • Zero-error optimized React production build                          │
│ • Comprehensive feature traceability matrix in documentation           │
│ • SEO & marketing metadata with OpenGraph & Schema.org JSON-LD         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Immediate Operational Deliverables

- **Backend**:
  - Authoritative pricing engine in `routes.js` and `paymentroutes.js`.
  - Atomic delivery offer acceptance preventing race conditions.
  - Automatic coupon usage counter rollback upon pre-kitchen order cancellation.
  - Real-time scoped Socket.IO events (`user_*`, `restaurant_*`, `delivery_*`, `order_*`).
- **Frontend**:
  - Live Delivery Tracking Map with MapTiler API Key integration and Canvas Radar Fallback.
  - Dietary Pure Veg toggle and category filter pills (`Biryani`, `Pizza`, `Burger`, etc.).
  - Reorder button on completed orders.
  - Mobile responsive layouts across 320px to 1920px viewports.

---

## 3. Future Expansion Initiatives (Post v2.0)

1. **Multi-Stop Batching**: Enable single delivery partners to pick up orders from adjacent restaurants for nearby customer drop-offs.
2. **Push Notifications**: Progressive Web App (PWA) push notifications for background lock-screen delivery updates.
3. **Advanced Customer Reviews & Photo Uploads**: Allow customers to submit dish-specific ratings and photos after verified deliveries.
