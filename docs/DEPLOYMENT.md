# CraveCart V2 Production Deployment Guide

## 1. Deployment Topology

The CraveCart platform is architected for standard cloud deployment:
- **Frontend SPA**: Vercel or Netlify (React Static Bundle).
- **Backend API & WebSockets**: Render, Railway, AWS ECS, or DigitalOcean App Platform (Node.js + persistent WebSocket support).
- **Database**: MongoDB Atlas M10+ replica set.

---

## 2. Vercel Deployment (Frontend)

1. Connect the GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`.
4. Output Directory: `build`.
5. Configure Environment Variables in Vercel Project Settings:
   - `REACT_APP_API_URL`: Your Render backend URL (e.g. `https://cravecart-api.onrender.com`).
   - `REACT_APP_WS_URL`: Your Render WebSocket URL (e.g. `https://cravecart-api.onrender.com`).
   - `REACT_APP_RAZORPAY_KEY_ID`: Your Razorpay test or live Key ID.
   - `REACT_APP_MAP_STYLE`: `https://demotiles.maplibre.org/style.json`.
6. Enable Single Page Application rewriting by adding `frontend/vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 3. Render Deployment (Backend)

1. Create a **Web Service** on Render connected to the repository.
2. Set Root Directory to `backend`.
3. Environment: `Node`.
4. Build Command: `npm install`.
5. Start Command: `node index.js`.
6. Configure Environment Variables in Render Dashboard:
   - `PORT`: 10000 (Render default) or 5000.
   - `MONGODB_URI`: Production MongoDB Atlas connection URI.
   - `JWT_SECRET`: High-entropy 64-character random string.
   - `RAZORPAY_KEY_ID`: `rzp_test_...`
   - `RAZORPAY_KEY_SECRET`: `...`
   - `RAZORPAY_WEBHOOK_SECRET`: Webhook secret set in Razorpay dashboard.
   - `CLIENT_ORIGIN`: Your Vercel frontend URL (e.g. `https://crave-cart.vercel.app`).
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Transactional email credentials (SendGrid, Postmark, AWS SES, or Brevo).
7. Health Check Path: `/health`.

---

## 4. Razorpay Webhook Configuration

1. In Razorpay Dashboard -> Settings -> Webhooks, add endpoint:
   `https://<your-render-backend-url>/payment/webhook`
2. Subscribe to events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
3. Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET` on your server.

---

## 5. Rollback Procedure

If a regression is observed in production:
1. Revert to previous deployment version in Vercel / Render dashboard with one click.
2. In Git: `git checkout main` and redeploy.
3. Database schemas in V2 are 100% backward-compatible and additive; older frontend versions can read the extended database documents without failure.
