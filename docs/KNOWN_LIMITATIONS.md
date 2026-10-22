# CraveCart V2 Known Limitations & External Configuration Checklist

## 1. External Services Requiring Account Credentials

The application includes working implementations and mockable sandbox engines for all external integrations. To enable live production capabilities with third-party providers, configure the following credentials:

| Service | Setting | Requirement | Development Sandbox Status |
|---|---|---|---|
| Razorpay Payment Gateway | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Active Razorpay merchant account | **Active in Test/Sandbox Mode** (Simulates order creation, checkout modal, and HMAC verification) |
| Transactional Email | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Production SMTP provider (e.g. SendGrid, SES, Brevo) | **Active in Mock Mode** (Logs emails to console / in-memory transporter without spamming real inboxes) |
| Map Vector Tiles | `REACT_APP_MAP_STYLE` | OpenMapTiles / MapTiler key (optional) | **Active using Free OpenStreetMap Demotiles** (`https://demotiles.maplibre.org/style.json`) |
| Google Gemini LLM API | `GEMINI_API_KEY` | Google AI Studio API key (optional) | **Active using Deterministic Live MongoDB + RAG Engine** (Answers queries directly from DB and knowledge docs) |

---

## 2. Technical Scope Boundaries & Notes

1. **Simulated GPS Movement**:
   - In development environments without physical delivery bikes driving on roads, delivery route simulation is available via the `/delivery/simulate/:orderId` endpoint.
   - Simulation intervals and steps can be configured in `backend/.env`. All simulated coordinates are visibly tagged with `DEMO / SIMULATED LOCATION` to prevent confusion.
2. **MongoDB Replica Set Transactions**:
   - Single-node local MongoDB setups do not support multi-document transactions. The order creation and payment flows are built with atomic document updates (`findByIdAndUpdate` with `$set` and `$push`) to run seamlessly on both standalone instances and replica-set Atlas deployments.
3. **CRA Webpack Warning**:
   - `react-scripts 5.0.1` displays a non-blocking compilation warning regarding caniuse-lite browser data age and expression dependencies. The production build finishes with exit code 0 and an optimized 439 kB gzipped bundle.
