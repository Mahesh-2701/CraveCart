const request = require("supertest");
const { app } = require("../index");
const { signToken, verifyToken } = require("../config/auth.config");
const { verifyPaymentSignature } = require("../services/razorpay.service");
const { searchKnowledgeBase } = require("../services/rag.service");

describe("CraveCart V2 Core Backend Test Suite", () => {
  describe("1. System Health & Environment", () => {
    it("should return 200 OK from /health endpoint", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.version).toBe("2.0.0");
    });

    it("should return 404 for unknown endpoints", async () => {
      const res = await request(app).get("/api/nonexistent-route");
      expect(res.status).toBe(404);
    });
  });

  describe("2. Authentication & JWT Engine", () => {
    it("should sign and verify valid JWT tokens", () => {
      const payload = { id: "user_test_123", email: "test@cravecart.local", role: "user" };
      const token = signToken(payload);
      expect(typeof token).toBe("string");

      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it("should block unauthenticated access to protected user profile routes", async () => {
      const res = await request(app).get("/user/view/user_test_123");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    it("should block unauthenticated access to protected admin dashboard", async () => {
      const res = await request(app).get("/admin/dashboard");
      expect(res.status).toBe(401);
    });

    it("should block customer tokens from accessing admin-only dashboard", async () => {
      const customerToken = signToken({ id: "cust_123", role: "user" });
      const res = await request(app)
        .get("/admin/dashboard")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

  describe("3. Razorpay Payment Signature Verification", () => {
    it("should verify valid sandbox payment signatures", () => {
      const orderId = "order_test_12345";
      const paymentId = "pay_test_67890";
      // Test signature accepted by mock engine
      const isValid = verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: "mock_signature_valid",
      });
      expect(isValid).toBe(true);
    });

    it("should reject tampered or invalid signatures", () => {
      const isValid = verifyPaymentSignature({
        razorpayOrderId: "order_real_12345",
        razorpayPaymentId: "pay_real_67890",
        razorpaySignature: "invalid_tampered_signature_xyz",
      });
      expect(isValid).toBe(false);
    });
  });

  describe("4. RAG Knowledge Base Retrieval", () => {
    it("should retrieve delivery policies when searching for delivery", () => {
      const results = searchKnowledgeBase("how fast is food delivery and what is the fee");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toMatch(/Delivery/i);
    });

    it("should retrieve cancellation policies when asked about refunds", () => {
      const results = searchKnowledgeBase("can I cancel my order and get a refund");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toMatch(/Refund/i);
    });
  });

  describe("5. AI Chatbot API", () => {
    it("should return helpful responses to general food questions without requiring auth", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "What coupons are available?" });
      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(res.body.suggestions).toBeDefined();
    });

    it("should request login if an unauthenticated user asks about their order status", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "Where is my order?" });
      expect(res.status).toBe(200);
      expect(res.body.reply).toMatch(/log in/i);
    });
  });

  describe("6. Coupons & Offers API", () => {
    it("should list available coupons", async () => {
      const res = await request(app).get("/coupons");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should reject invalid coupon codes", async () => {
      const res = await request(app)
        .post("/coupons/apply")
        .send({ code: "INVALID_CODE_999", subtotal: 300 });
      expect(res.status).toBe(404);
      expect(res.body.valid).toBe(false);
    });
  });

  afterAll(async () => {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  });
});

