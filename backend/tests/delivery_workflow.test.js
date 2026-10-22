const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../index");
const { signToken } = require("../config/auth.config");
const {
  calculateDistance,
  rankEligibleDeliveryPartners,
  acceptDeliveryOffer,
  declineDeliveryOffer,
  markArrivedAtRestaurant,
  confirmPickup,
  confirmDeliveryCompletion,
} = require("../services/delivery.service");
const Order = require("../Models/OrderSchema");
const DeliveryPerson = require("../Models/Deliveryperson");
const Restaurant = require("../Models/RestaurantSchema");
const User = require("../Models/UserSchema");

describe("Swiggy-Style Food Delivery Orchestration & Concurrency Test Suite", () => {
  let customerToken, restaurantToken, partnerAToken, partnerBToken, adminToken;
  let customerId, restaurantId, partnerAId, partnerBId;
  let testOrder;

  beforeAll(async () => {
    // Generate synthetic IDs and Auth tokens
    customerId = new mongoose.Types.ObjectId().toString();
    restaurantId = new mongoose.Types.ObjectId().toString();
    partnerAId = new mongoose.Types.ObjectId().toString();
    partnerBId = new mongoose.Types.ObjectId().toString();

    // Seed test riders into database
    await DeliveryPerson.create([
      {
        _id: partnerAId,
        name: "Test Rider A",
        email: `riderA_${Date.now()}@cravecart.test`,
        password: "hash",
        phonenumber: "9876543210",
        vehicleType: "Electric Bike",
        isAvailable: true,
        rating: 4.8,
        currentLocation: { lat: 12.972, lng: 77.595, updatedAt: new Date() },
      },
      {
        _id: partnerBId,
        name: "Test Rider B",
        email: `riderB_${Date.now()}@cravecart.test`,
        password: "hash",
        phonenumber: "9876543211",
        vehicleType: "Motorbike",
        isAvailable: true,
        rating: 4.5,
        currentLocation: { lat: 12.920, lng: 77.550, updatedAt: new Date() },
      },
    ]);

    customerToken = signToken({ id: customerId, role: "user" });
    restaurantToken = signToken({ id: restaurantId, role: "restaurant" });
    partnerAToken = signToken({ id: partnerAId, role: "delivery" });
    partnerBToken = signToken({ id: partnerBId, role: "delivery" });
    adminToken = signToken({ id: "admin_master", role: "admin" });
  });

  describe("1. Candidate Ranking & Haversine Distance Engine", () => {
    it("should calculate correct Haversine distance in kilometers", () => {
      // Bangalore MG Road to Indiranagar (~4.7 km)
      const dist = calculateDistance(12.9716, 77.5946, 12.9784, 77.6408);
      expect(dist).toBeGreaterThan(4);
      expect(dist).toBeLessThan(6);
    });

    it("should rank closer, highly-rated partners ahead of distant or overloaded candidates", async () => {
      const candidates = [
        {
          _id: partnerAId,
          name: "Rider Closer",
          isAvailable: true,
          rating: 4.8,
          currentLocation: { lat: 12.972, lng: 77.595, updatedAt: new Date() },
        },
        {
          _id: partnerBId,
          name: "Rider Farther",
          isAvailable: true,
          rating: 4.2,
          currentLocation: { lat: 12.910, lng: 77.520, updatedAt: new Date() },
        },
      ];

      const restaurantCoords = { lat: 12.9716, lng: 77.5946 };
      const ranked = await rankEligibleDeliveryPartners(candidates, restaurantCoords);

      expect(ranked.length).toBe(2);
      expect(ranked[0]._id.toString()).toBe(partnerAId.toString());
      expect(ranked[0].distanceKm).toBeLessThan(ranked[1].distanceKm);
      expect(ranked[0].dispatchScore).toBeGreaterThan(ranked[1].dispatchScore);
    });

    it("should filter out offline partners from ranking", async () => {
      const candidates = [
        {
          _id: partnerAId,
          isAvailable: false,
          rating: 4.9,
          currentLocation: { lat: 12.972, lng: 77.595, updatedAt: new Date() },
        },
      ];

      const ranked = await rankEligibleDeliveryPartners(candidates, { lat: 12.972, lng: 77.595 });
      expect(ranked.length).toBe(0);
    });
  });

  describe("2. Order Creation & Decoupled State Machine", () => {
    it("should create orders with PLACED and NOT_REQUESTED without pre-allocating a rider", async () => {
      testOrder = new Order({
        userid: customerId,
        restaurantId: restaurantId,
        price: 350,
        totalAmount: 350,
        address: "123 Indiranagar 100ft Rd, Bangalore",
        customerLatitude: 12.9784,
        customerLongitude: 77.6408,
        restaurantCoordinates: { lat: 12.9716, lng: 77.5946 },
        paymentmethod: "COD",
        orderStatus: "PLACED",
        deliveryStatus: "NOT_REQUESTED",
        deliverypersonid: null,
      });

      await testOrder.save();

      expect(testOrder._id).toBeDefined();
      expect(testOrder.orderStatus).toBe("PLACED");
      expect(testOrder.deliveryStatus).toBe("NOT_REQUESTED");
      expect(testOrder.deliverypersonid).toBeNull();
      expect(testOrder.deliveryOtp).toBeDefined();
      expect(testOrder.deliveryOtp.length).toBe(4);
    });

    it("should allow customer to cancel order while orderStatus is PLACED", async () => {
      const cancellableOrder = new Order({
        userid: customerId,
        restaurantId: restaurantId,
        price: 200,
        totalAmount: 200,
        address: "Test Address",
        orderStatus: "PLACED",
        deliveryStatus: "NOT_REQUESTED",
        paymentmethod: "COD",
      });
      await cancellableOrder.save();

      const res = await request(app)
        .post(`/user/order/cancel/${cancellableOrder._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      if (res.status !== 200) {
        console.log("CANCEL FAILURE RESPONSE:", res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("CANCELLED");
      expect(res.body.order.deliveryStatus).toBe("CANCELLED");
    });
  });

  describe("3. Restaurant Authority & Strict State Boundaries", () => {
    it("should block restaurants from marking orders as 'Out for Delivery' or 'Delivered'", async () => {
      const res = await request(app)
        .patch(`/restaurant/order/statuschange/${testOrder._id}`)
        .set("Authorization", `Bearer ${restaurantToken}`)
        .send({ status: "Out for Delivery" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Kitchens cannot mark delivery transit/i);
    });

    it("should allow restaurant to accept order and start preparation", async () => {
      const res = await request(app)
        .post(`/restaurant/order/${testOrder._id}/accept`)
        .set("Authorization", `Bearer ${restaurantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("ACCEPTED");
      // Delivery status transitions to SEARCHING as candidate discovery is triggered
      expect(res.body.order.deliveryStatus).toBe("SEARCHING");
    });

    it("should disallow customer cancellation once kitchen begins preparation", async () => {
      const res = await request(app)
        .post(`/user/order/cancel/${testOrder._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be cancelled because the kitchen has already accepted/i);
    });
  });

  describe("4. Delivery Partner Dispatch, Offer & Concurrency Safety", () => {
    it("should issue a time-bounded delivery offer to candidate partner", async () => {
      const now = new Date();
      const expires = new Date(now.getTime() + 60000);
      const partnerObjId = new mongoose.Types.ObjectId(partnerAId);

      await Order.findByIdAndUpdate(testOrder._id, {
        $set: {
          deliveryStatus: "OFFERED",
          deliveryOffer: {
            deliveryPartnerId: partnerObjId,
            offerCreatedAt: now,
            offerExpiresAt: expires,
            offerState: "PENDING",
            attemptCount: 1,
          },
        },
      });

      const res = await request(app)
        .get(`/delivery/offers/${partnerAId}`)
        .set("Authorization", `Bearer ${partnerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.hasOffer).toBe(true);
      expect(res.body.offer.orderId.toString()).toBe(testOrder._id.toString());
      expect(res.body.offer.remainingSeconds).toBeGreaterThan(0);
    });

    it("should prevent unauthorized or competing partners from accepting someone else's offer", async () => {
      // Partner B tries to accept Partner A's pending offer
      const res = await request(app)
        .post(`/delivery/offers/${testOrder._id}/accept`)
        .set("Authorization", `Bearer ${partnerBToken}`)
        .send({ deliveryPartnerId: partnerBId });

      expect([400, 409]).toContain(res.status);
    });

    it("should atomically accept offer and assign delivery exclusively to Partner A", async () => {
      const now = new Date();
      const expires = new Date(now.getTime() + 60000);
      const partnerObjId = new mongoose.Types.ObjectId(partnerAId);

      await Order.findByIdAndUpdate(testOrder._id, {
        $set: {
          deliveryStatus: "OFFERED",
          deliveryOffer: {
            deliveryPartnerId: partnerObjId,
            offerCreatedAt: now,
            offerExpiresAt: expires,
            offerState: "PENDING",
            attemptCount: 1,
          },
        },
      });

      const res = await request(app)
        .post(`/delivery/offers/${testOrder._id}/accept`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId });

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("ASSIGNED");
      const assignedRiderId = res.body.order.deliverypersonid?._id || res.body.order.deliverypersonid;
      expect(assignedRiderId.toString()).toBe(partnerAId.toString());
    });

    it("should reject concurrent secondary acceptance attempts (Double Booking Prevention)", async () => {
      // Partner A or anyone else tries to accept again
      const res = await request(app)
        .post(`/delivery/offers/${testOrder._id}/accept`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId });

      // Because offer is already accepted / not PENDING, returns conflict
      expect([400, 409]).toContain(res.status);
    });
  });

  describe("5. Delivery Partner Lifecycle: Arrived, Pickup & OTP Completion", () => {
    it("should record partner arrival at restaurant", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/arrived`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId });

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("ARRIVED_AT_RESTAURANT");
    });

    it("should prevent delivery completion before food has been picked up", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/complete`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId, otp: testOrder.deliveryOtp });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/before being picked up/i);
    });

    it("should allow partner to confirm food pickup once kitchen marks ready", async () => {
      // Restaurant marks food ready
      await Order.findByIdAndUpdate(testOrder._id, {
        $set: { orderStatus: "READY_FOR_PICKUP", status: "Ready for Pickup" },
      });

      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/pickup`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId });

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("OUT_FOR_DELIVERY");
      expect(res.body.order.orderStatus).toBe("PICKED_UP");
    });

    it("should reject delivery completion with an invalid customer OTP", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/complete`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId, otp: "9999" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid delivery OTP/i);
    });

    it("should successfully complete delivery when valid customer OTP is supplied", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/complete`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId, otp: testOrder.deliveryOtp });

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("DELIVERED");
      expect(res.body.order.orderStatus).toBe("DELIVERED");
    });

    it("should handle duplicate completion requests idempotently", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/complete`)
        .set("Authorization", `Bearer ${partnerAToken}`)
        .send({ deliveryPartnerId: partnerAId, otp: testOrder.deliveryOtp });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Order delivered successfully/i);
    });
  });

  describe("6. Admin Observability & Operational Overrides", () => {
    it("should provide admins with a comprehensive delivery monitor feed", async () => {
      const res = await request(app)
        .get("/admin/deliveries")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(Array.isArray(res.body.deliveries)).toBe(true);
    });
  });

  afterAll(async () => {
    if (testOrder && testOrder._id) {
      await Order.deleteOne({ _id: testOrder._id });
    }
    await DeliveryPerson.deleteMany({ _id: { $in: [partnerAId, partnerBId] } });
  });
});
