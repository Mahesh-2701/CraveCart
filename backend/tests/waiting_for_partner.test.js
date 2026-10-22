const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../index");
const { signToken } = require("../config/auth.config");
const {
  dispatchNextCandidate,
  processPendingDispatches,
  checkAndExpireOffers,
  acceptDeliveryOffer,
  declineDeliveryOffer,
  rankEligibleDeliveryPartners,
} = require("../services/delivery.service");
const Order = require("../Models/OrderSchema");
const DeliveryPerson = require("../Models/Deliveryperson");

const User = require("../Models/UserSchema");

describe("Waiting for Partner & End-to-End Delivery Flow Test Suite", () => {
  let customerToken, restaurantToken, partnerAToken, partnerBToken, adminToken;
  let customerId, restaurantId, partnerAId, partnerBId;
  let sampleOrder;

  beforeAll(async () => {
    customerId = new mongoose.Types.ObjectId().toString();
    restaurantId = new mongoose.Types.ObjectId().toString();
    partnerAId = new mongoose.Types.ObjectId().toString();
    partnerBId = new mongoose.Types.ObjectId().toString();

    // Seed test customer
    await User.create({
      _id: customerId,
      name: "Waiting Test Customer",
      email: `wait_cust_${Date.now()}@cravecart.test`,
      password: "hash",
      phonenumber: "9000000000",
      address: "77 Residency Road, Bangalore",
    });

    // Seed test riders
    await DeliveryPerson.create([
      {
        _id: partnerAId,
        name: "Speedy Partner A",
        email: `speedyA_${Date.now()}@cravecart.test`,
        password: "hash",
        phonenumber: "9111111111",
        vehicleType: "Electric Scooter",
        isAvailable: true,
        rating: 4.9,
        currentLocation: { lat: 12.972, lng: 77.595, updatedAt: new Date() },
      },
      {
        _id: partnerBId,
        name: "Express Partner B",
        email: `expressB_${Date.now()}@cravecart.test`,
        password: "hash",
        phonenumber: "9222222222",
        vehicleType: "Motorcycle",
        isAvailable: true,
        rating: 4.7,
        currentLocation: { lat: 12.975, lng: 77.600, updatedAt: new Date() },
      },
    ]);

    customerToken = signToken({ id: customerId, role: "user" });
    restaurantToken = signToken({ id: restaurantId, role: "restaurant" });
    partnerAToken = signToken({ id: partnerAId, role: "delivery" });
    partnerBToken = signToken({ id: partnerBId, role: "delivery" });
    adminToken = signToken({ id: "admin_test", role: "admin" });
  });

  afterAll(async () => {
    await User.findByIdAndDelete(customerId);
    await DeliveryPerson.deleteMany({ _id: { $in: [partnerAId, partnerBId] } });
    if (sampleOrder?._id) {
      await Order.findByIdAndDelete(sampleOrder._id);
    }
  });

  describe("1. Order Placement & State Machine Initialization", () => {
    it("should initialize order with PLACED and NOT_REQUESTED", async () => {
      sampleOrder = new Order({
        userid: customerId,
        restaurantId: restaurantId,
        price: 499,
        totalAmount: 499,
        address: "77 Residency Road, Bangalore",
        paymentmethod: "COD",
        orderStatus: "PLACED",
        deliveryStatus: "NOT_REQUESTED",
        deliverypersonid: null,
        restaurantCoordinates: { lat: 12.9716, lng: 77.5946 },
      });
      await sampleOrder.save();

      expect(sampleOrder._id).toBeDefined();
      expect(sampleOrder.orderStatus).toBe("PLACED");
      expect(sampleOrder.deliveryStatus).toBe("NOT_REQUESTED");
      expect(sampleOrder.deliverypersonid).toBeNull();
    });

    it("tracking endpoint should return NOT_REQUESTED for newly placed orders", async () => {
      const res = await request(app)
        .get(`/user/order-tracking/${sampleOrder._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orderStatus).toBe("PLACED");
      expect(res.body.deliveryStatus).toBe("NOT_REQUESTED");
      expect(res.body.deliveryPerson).toBeNull();
    });
  });

  describe("2. Restaurant Acceptance & Dispatch Trigger", () => {
    it("restaurant accept should transition status to ACCEPTED and SEARCHING", async () => {
      const res = await request(app)
        .post(`/restaurant/order/${sampleOrder._id}/accept`)
        .set("Authorization", `Bearer ${restaurantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("ACCEPTED");
      // Initially SEARCHING or OFFERED
      expect(["SEARCHING", "OFFERED"]).toContain(res.body.order.deliveryStatus);
    });
  });

  describe("3. Dispatch Engine & Queue Processing for SEARCHING orders", () => {
    it("dispatchNextCandidate should successfully find candidates and dispatch offer", async () => {
      // Ensure order is in SEARCHING
      await Order.findByIdAndUpdate(sampleOrder._id, {
        $set: {
          deliveryStatus: "SEARCHING",
          "deliveryOffer.offerState": "NONE",
          "deliveryOffer.deliveryPartnerId": null,
        },
      });

      const dispatchResult = await dispatchNextCandidate(sampleOrder._id, null);
      expect(dispatchResult.success).toBe(true);
      expect(dispatchResult.status).toBe("OFFERED");

      const refreshed = await Order.findById(sampleOrder._id);
      expect(refreshed.deliveryStatus).toBe("OFFERED");
      expect(refreshed.deliveryOffer.offerState).toBe("PENDING");
      expect(refreshed.deliveryOffer.deliveryPartnerId).toBeDefined();
    });

    it("candidate should see the active offer via GET /delivery/offers/:partnerId", async () => {
      const currentOrder = await Order.findById(sampleOrder._id);
      const offeredPartnerId = currentOrder.deliveryOffer.deliveryPartnerId.toString();
      const token = signToken({ id: offeredPartnerId, role: "delivery" });

      const res = await request(app)
        .get(`/delivery/offers/${offeredPartnerId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.hasOffer).toBe(true);
      expect(res.body.offer.orderId.toString()).toBe(sampleOrder._id.toString());
      expect(res.body.offer.remainingSeconds).toBeGreaterThan(0);
    });

    it("cooldown should cycle/reset when all available riders have timed out", async () => {
      const orderWithDeclines = {
        _id: new mongoose.Types.ObjectId(),
        restaurantCoordinates: { lat: 12.9716, lng: 77.5946 },
        declinedPartners: [
          { partnerId: new mongoose.Types.ObjectId(partnerAId), declinedAt: new Date(), reason: "Offer timed out" },
          { partnerId: new mongoose.Types.ObjectId(partnerBId), declinedAt: new Date(), reason: "Offer timed out" },
        ],
      };

      const candidates = await rankEligibleDeliveryPartners(orderWithDeclines);
      // Because all online partners were in timeout cooldown, the cycle guard reset it
      expect(candidates.length).toBeGreaterThan(0);
    });
  });

  describe("4. Partner Acceptance & Atomic Concurrency Guard", () => {
    it("prevention of concurrent acceptance by competing partner", async () => {
      const currentOrder = await Order.findById(sampleOrder._id);
      const offeredPartnerId = currentOrder.deliveryOffer.deliveryPartnerId.toString();
      const unauthorizedPartnerId = new mongoose.Types.ObjectId().toString();
      const unauthorizedToken = signToken({ id: unauthorizedPartnerId, role: "delivery" });

      const res = await request(app)
        .post(`/delivery/offers/${sampleOrder._id}/accept`)
        .set("Authorization", `Bearer ${unauthorizedToken}`)
        .send({ deliveryPartnerId: unauthorizedPartnerId });

      expect([400, 409]).toContain(res.status);
    });

    it("assigned partner successfully accepts offer atomically", async () => {
      const currentOrder = await Order.findById(sampleOrder._id);
      const offeredPartnerId = currentOrder.deliveryOffer.deliveryPartnerId.toString();
      const authorizedToken = signToken({ id: offeredPartnerId, role: "delivery" });

      const res = await request(app)
        .post(`/delivery/offers/${sampleOrder._id}/accept`)
        .set("Authorization", `Bearer ${authorizedToken}`)
        .send({ deliveryPartnerId: offeredPartnerId });

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("ASSIGNED");
      expect(res.body.order.deliverypersonid._id.toString()).toBe(offeredPartnerId);
    });
  });

  describe("5. Manual & Authorized Retry Dispatch Endpoints", () => {
    it("restaurant can re-trigger partner dispatch via POST /order/:id/retry-dispatch", async () => {
      const res = await request(app)
        .post(`/restaurant/order/${sampleOrder._id}/retry-dispatch`)
        .set("Authorization", `Bearer ${restaurantToken}`);

      expect(res.status).toBe(200);
    });

    it("delivery route provides POST /delivery/dispatch/:orderId endpoint", async () => {
      const res = await request(app)
        .post(`/delivery/dispatch/${sampleOrder._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
