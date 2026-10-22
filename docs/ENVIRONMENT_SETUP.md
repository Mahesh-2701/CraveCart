# CraveCart V2 Environment & Configuration Setup Guide

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node.js v26)
- **NPM**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas cluster or local MongoDB instance (v6.0+)

---

## 2. Backend Environment Variables (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ajejyjz.mongodb.net/cravecart?retryWrites=true&w=majority

# JWT Token Secret
JWT_SECRET=cravecart_super_secure_jwt_secret_token_v2
JWT_EXPIRES_IN=24h

# Razorpay Test Mode Credentials
# Obtain free sandbox test keys from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_sampleKeyId
RAZORPAY_KEY_SECRET=sampleRazorpaySecretKey
RAZORPAY_WEBHOOK_SECRET=sampleWebhookSecret
RAZORPAY_MODE=test

# Transactional Email (Optional - falls back to Ethereal/mock transport)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=CraveCart Notifications <noreply@cravecart.local>

# Real-Time Tracking Simulation Speed
SIMULATION_INTERVAL_MS=2000

# Optional Google Gemini AI API Key (Falls back to deterministic RAG engine if omitted)
GEMINI_API_KEY=
```

---

## 3. Frontend Environment Variables (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
# Backend REST API endpoint
REACT_APP_API_URL=http://localhost:5000

# Socket.IO WebSocket Server endpoint
REACT_APP_WS_URL=http://localhost:5000

# Public Razorpay Test Key ID
REACT_APP_RAZORPAY_KEY_ID=rzp_test_sampleKeyId

# MapLibre Open-Data Vector Tiles
REACT_APP_MAP_STYLE=https://demotiles.maplibre.org/style.json
```

---

## 4. Local Installation & Launch Commands

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Run Automated Tests
```bash
# Execute Jest test suite on backend
cd ../backend
npm test
```

### Step 3: Run Development Servers
In Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server will listen on http://localhost:5000
```

In Terminal 2 (Frontend):
```bash
cd frontend
npm start
# Client will launch on http://localhost:3000
```
