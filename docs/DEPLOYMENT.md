# CRAVECART PRODUCTION DEPLOYMENT GUIDE

## 1. Deployment Topology

The CraveCart platform is architected for modern cloud deployment:
- **Frontend SPA**: Vercel, Netlify, or AWS S3 + CloudFront (React Static Bundle).
- **Backend API & WebSockets**: Render, Railway, AWS ECS, or DigitalOcean App Platform (Node.js runtime with persistent WebSocket support).
- **Database**: MongoDB Atlas M10+ replica set.

---

## 2. Vercel Deployment (Frontend)

1. Connect the GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`.
4. Output Directory: `build`.
5. Configure Environment Variables in Vercel Project Settings:
   - `REACT_APP_API_URL`: Your backend API URL (e.g. `https://api.cravecart.com`).
   - `REACT_APP_WS_URL`: Your WebSocket URL (e.g. `https://api.cravecart.com`).
   - `REACT_APP_RAZORPAY_KEY_ID`: Your Razorpay Key ID (`rzp_test_...` or live key).
   - `REACT_APP_MAP_KEY`: Your MapTiler API Key (e.g. `cb1_4rod_1_bdb3f35922b85a77c1e0e8b6`).
6. Enable Single Page Application routing with `frontend/vercel.json`:
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
   - `PORT`: `5000` or `10000`.
   - `MONGODB_URI`: Production MongoDB Atlas connection URI.
   - `JWT_SECRET`: High-entropy 64-character random string.
   - `RAZORPAY_KEY_ID`: Razorpay Key ID.
   - `RAZORPAY_KEY_SECRET`: Razorpay Key Secret.
   - `RAZORPAY_WEBHOOK_SECRET`: Webhook secret configured in Razorpay dashboard.
   - `CLIENT_ORIGIN`: Your production frontend URL (e.g. `https://cravecart.com`).
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Transactional email credentials.
7. Health Check Path: `/health`.

---

## 4. Razorpay Webhook Configuration

1. In Razorpay Dashboard -> Settings -> Webhooks, add endpoint:
   `https://<your-backend-url>/payment/webhook`
2. Subscribe to events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
3. Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET` on your server.
