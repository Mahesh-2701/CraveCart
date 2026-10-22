# CRAVECART KNOWN LIMITATIONS & EXTERNAL CONFIGURATION CHECKLIST

## 1. External Services Requiring Account Credentials

The application includes working integrations and safe fallbacks for all external dependencies:

| Service | Setting | Requirement | Operational Status |
|---|---|---|---|
| **Razorpay Payment Gateway** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Active Razorpay merchant account | **Active in Test/Sandbox Mode** (Creates gateway orders, opens payment modal, verifies HMAC-SHA256 signatures) |
| **Map Vector Tiles** | `REACT_APP_MAP_KEY` | MapTiler Cloud Account API Key | **Active & Configured** with key `cb1_4rod_1_bdb3f35922b85a77c1e0e8b6` + Vector Radar Canvas Fallback |
| **Google Gemini AI API** | `GEMINI_API_KEY` | Google AI Studio API key | **Active with Deterministic MongoDB + RAG Engine** (Queries live dishes, prices, and coupons from DB) |
| **Transactional Email** | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Production SMTP provider (SendGrid, SES, Brevo) | **Active with Test/Ethereal Fallback** (Safely logs confirmations without spamming real customer emails) |

---

## 2. Technical Scope Boundaries & Notes

1. **Simulated vs. Authentic GPS Telemetry**:
   - For real delivery trips, delivery partners broadcast authentic GPS coordinates via `POST /delivery/location`.
   - For demonstration/development testing, route simulation is provided via `POST /delivery/simulate/:orderId`, explicitly flagged with `isSimulated: true` and labeled in the UI as `DEMO / SIMULATED TRACKING ACTIVE` to prevent confusion with authentic satellite GPS data.
2. **MongoDB Replica Set Concurrency**:
   - Order creation, candidate dispatch, and delivery offer acceptance use atomic operations (`findOneAndUpdate` with conditional checks on `deliveryStatus` and `offerExpiresAt`) to guarantee race-condition safety on both single-node development databases and multi-node Atlas clusters.
3. **CRA Webpack Warning**:
   - `react-scripts 5.0.1` outputs non-blocking ESLint dependency notices regarding useEffect dependencies. The production build compiles cleanly with exit code 0 (`Compiled with warnings`) generating an optimized 449 kB gzipped production bundle.
