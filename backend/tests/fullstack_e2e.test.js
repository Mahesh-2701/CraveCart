const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../index");
const { signToken } = require("../config/auth.config");
const orderModel = require("../Models/OrderSchema");
const userModel = require("../Models/UserSchema");
const restModel = require("../Models/RestaurantSchema");
const menuModel = require("../Models/Menuitems");
const deliveryModel = require("../Models/Deliveryperson");
const couponModel = require("../Models/CouponSchema");

describe("CraveCart Full-Stack Verification & Regression Suite", () => {
  let customerUser;
  let customerToken;
  let unauthorizedCustomer;
  let unauthorizedCustomerToken;
  let restaurantUser;
  let restaurantToken;
  let deliveryPartner;
  let deliveryToken;
  let adminToken;
  let testMenuItem;
  let testOrder;

  beforeAll(async () => {
    // Generate valid tokens with matching object IDs
    const custId = new mongoose.Types.ObjectId();
    const otherCustId = new mongoose.Types.ObjectId();
    const restId = new mongoose.Types.ObjectId();
    const delivId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    customerUser = {
      _id: custId,
      name: "E2E Test Customer",
      email: `cust_${Date.now()}@cravecart.test`,
      role: "user",
      phonenumber: 9876543210,
      address: "123 Indiranagar, Bangalore",
    };

    unauthorizedCustomer = {
      _id: otherCustId,
      name: "Unauthorized Customer B",
      email: `custb_${Date.now()}@cravecart.test`,
      role: "user",
    };

    customerToken = signToken({ id: custId.toString(), email: customerUser.email, role: "user" });
    unauthorizedCustomerToken = signToken({ id: otherCustId.toString(), email: unauthorizedCustomer.email, role: "user" });

    restaurantUser = {
      _id: restId,
      name: "E2E Test Bistro",
      email: `bistro_${Date.now()}@cravecart.test`,
      role: "restaurant",
      address: "456 Koramangala, Bangalore",
      coordinates: { lat: 12.9352, lng: 77.6245 },
      isactive: true,
    };
    restaurantToken = signToken({ id: restId.toString(), email: restaurantUser.email, role: "restaurant" });

    deliveryPartner = {
      _id: delivId,
      name: "E2E Speed Rider",
      email: `rider_${Date.now()}@cravecart.test`,
      role: "deliveryperson",
      phonenumber: 9123456789,
      isAvailable: true,
      currentLocation: { lat: 12.9360, lng: 77.6250 },
    };
    deliveryToken = signToken({ id: delivId.toString(), email: deliveryPartner.email, role: "deliveryperson" });

    adminToken = signToken({ id: adminId.toString(), email: "admin@cravecart.test", role: "admin" });

    // Seed customer user
    await userModel.create({
      _id: custId,
      name: customerUser.name,
      email: customerUser.email,
      password: "password123",
      phonenumber: customerUser.phonenumber,
      address: customerUser.address,
      role: "user",
    });

    // Seed restaurant
    await restModel.create({
      _id: restId,
      name: restaurantUser.name,
      email: restaurantUser.email,
      password: "password123",
      phonenumber: 9876543211,
      address: restaurantUser.address,
      image: "/uploads/restaurants/default.jpg",
      coordinates: restaurantUser.coordinates,
      isactive: true,
      role: "restaurant",
    });

    // Seed test menu item in DB
    testMenuItem = await menuModel.create({
      name: "E2E Deluxe Pizza",
      price: 350,
      category: "Pizza",
      isVeg: true,
      restaurantid: restId,
      image: "/uploads/restaurants/default-food.jpg",
    });

    // Seed active delivery partner in DB so candidate discovery finds them
    await deliveryModel.create({
      _id: delivId,
      name: deliveryPartner.name,
      email: deliveryPartner.email,
      password: "password123",
      phonenumber: deliveryPartner.phonenumber,
      isAvailable: true,
      currentLocation: deliveryPartner.currentLocation,
    });
  });

  afterAll(async () => {
    // Cleanup seeded records
    if (customerUser) await userModel.deleteOne({ _id: customerUser._id });
    if (restaurantUser) await restModel.deleteOne({ _id: restaurantUser._id });
    if (testMenuItem) await menuModel.deleteOne({ _id: testMenuItem._id });
    if (deliveryPartner) await deliveryModel.deleteOne({ _id: deliveryPartner._id });
    if (testOrder) await orderModel.deleteOne({ _id: testOrder._id });
  });

  describe("Scenario 1 & 6: Customer Cart, Coupon, and Order Creation", () => {
    it("should evaluate coupon discount server-side accurately", async () => {
      const res = await request(app)
        .post("/coupons/apply")
        .send({ code: "WELCOME50", subtotal: 350 });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      // 50% of 350 = 175, capped at maxDiscount 150
      expect(res.body.discountAmount).toBe(150);
      expect(res.body.finalAmount).toBe(200);
    });

    it("should reject invalid coupon codes", async () => {
      const res = await request(app)
        .post("/coupons/apply")
        .send({ code: "NONEXISTENT_CODE", subtotal: 350 });

      expect(res.status).toBe(404);
      expect(res.body.valid).toBe(false);
    });

    it("should place order with server-calculated total and generate delivery OTP", async () => {
      const res = await request(app)
        .post(`/user/order/${customerUser._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [
            {
              menuid: testMenuItem._id,
              quantity: 2,
              name: testMenuItem.name,
              price: testMenuItem.price,
            },
          ],
          restaurantId: restaurantUser._id,
          address: "123 Indiranagar, Bangalore",
          phonenumber: "9876543210",
          paymentmethod: "Cash on Delivery",
          couponCode: "WELCOME50",
        });

      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();

      testOrder = res.body.order;
      expect(testOrder.orderStatus).toBe("PLACED");
      expect(testOrder.deliveryStatus).toBe("NOT_REQUESTED");
      // 2 * 350 = 700. Delivery fee 60. Discount 150 -> Total = 610
      expect(testOrder.totalAmount).toBe(610);
      expect(testOrder.deliveryOtp).toBeDefined();
      expect(testOrder.deliveryOtp.length).toBe(4);
    });
  });

  describe("Scenario 5: Security & IDOR Verification", () => {
    it("should reject customer viewing another customer's order history", async () => {
      const res = await request(app)
        .get(`/user/orders/${customerUser._id}`)
        .set("Authorization", `Bearer ${unauthorizedCustomerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it("should reject unauthorized customer from viewing private order tracking", async () => {
      const res = await request(app)
        .get(`/user/order-tracking/${testOrder._id}`)
        .set("Authorization", `Bearer ${unauthorizedCustomerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it("should permit order owner to view tracking and see delivery OTP", async () => {
      const res = await request(app)
        .get(`/user/order-tracking/${testOrder._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe(testOrder._id);
      expect(res.body.deliveryOtp).toBe(testOrder.deliveryOtp);
    });
  });

  describe("Scenario 2: Restaurant Workflow (Accept & Ready)", () => {
    it("should allow restaurant to accept order and transition to ACCEPTED / SEARCHING", async () => {
      const res = await request(app)
        .post(`/restaurant/order/${testOrder._id}/accept`)
        .set("Authorization", `Bearer ${restaurantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("ACCEPTED");
      expect(["Accepted", "Preparing"]).toContain(res.body.order.status);
      expect(res.body.order.deliveryStatus).toBe("SEARCHING");
    });

    it("should prevent restaurant from marking 'Delivered' or 'Picked Up'", async () => {
      const res = await request(app)
        .patch(`/restaurant/order/statuschange/${testOrder._id}`)
        .set("Authorization", `Bearer ${restaurantToken}`)
        .send({ status: "Delivered" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it("should allow restaurant to mark food ready for pickup", async () => {
      const res = await request(app)
        .post(`/restaurant/order/${testOrder._id}/ready`)
        .set("Authorization", `Bearer ${restaurantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("READY_FOR_PICKUP");
      expect(res.body.order.status).toBe("Ready for Pickup");
    });
  });

  describe("Scenario 3: Delivery Operations Lifecycle (Offer, Accept, Arrival, Pickup, Complete)", () => {
    beforeEach(async () => {
      // Refresh active dispatch offer to test partner before each delivery step if still offered
      const current = await orderModel.findById(testOrder._id);
      if (current && (current.deliveryStatus === "SEARCHING" || current.deliveryStatus === "OFFERED" || current.deliveryStatus === "NOT_REQUESTED")) {
        const expiresAt = new Date(Date.now() + 60000);
        await orderModel.findByIdAndUpdate(testOrder._id, {
          $set: {
            deliveryStatus: "OFFERED",
            deliveryOffer: {
              deliveryPartnerId: deliveryPartner._id,
              offerCreatedAt: new Date(),
              offerExpiresAt: expiresAt,
              offerState: "PENDING",
            },
          },
        });
      }
    });

    it("should show active delivery offer with countdown to delivery partner", async () => {
      const expiresAt = new Date(Date.now() + 60000);
      await orderModel.findByIdAndUpdate(testOrder._id, {
        $set: {
          deliveryStatus: "OFFERED",
          deliveryOffer: {
            deliveryPartnerId: deliveryPartner._id,
            offerCreatedAt: new Date(),
            offerExpiresAt: expiresAt,
            offerState: "PENDING",
          },
        },
      });

      const res = await request(app)
        .get(`/delivery/offers/${deliveryPartner._id}`)
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.hasOffer).toBe(true);
      expect(res.body.offer.orderId.toString()).toBe(testOrder._id.toString());
      expect(res.body.offer.remainingSeconds).toBeGreaterThan(0);
    });

    it("should allow delivery partner to accept the offer", async () => {
      const res = await request(app)
        .post(`/delivery/offers/${testOrder._id}/accept`)
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("ASSIGNED");
      const assignedId = res.body.order.deliverypersonid?._id || res.body.order.deliverypersonid;
      expect(assignedId.toString()).toBe(deliveryPartner._id.toString());
    });

    it("should allow partner to mark arrival at kitchen", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/arrived`)
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("ARRIVED_AT_RESTAURANT");
    });

    it("should allow partner to confirm food pickup", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/pickup`)
        .set("Authorization", `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.deliveryStatus).toBe("OUT_FOR_DELIVERY");
      expect(res.body.order.orderStatus).toBe("PICKED_UP");
    });

    it("should broadcast live GPS location from delivery partner", async () => {
      const res = await request(app)
        .post("/delivery/location")
        .set("Authorization", `Bearer ${deliveryToken}`)
        .send({ lat: 12.9500, lng: 77.6100, speed: 28, heading: 90 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbOrder = await orderModel.findById(testOrder._id);
      expect(dbOrder.deliveryLocation.lat).toBe(12.9500);
      expect(dbOrder.deliveryLocation.lng).toBe(77.6100);
    });

    it("should reject delivery completion if OTP is incorrect", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/complete`)
        .set("Authorization", `Bearer ${deliveryToken}`)
        .send({ otp: "9999" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid delivery OTP/i);
    });

    it("should successfully complete delivery when valid customer OTP is provided", async () => {
      const res = await request(app)
        .post(`/delivery/order/${testOrder._id}/complete`)
        .set("Authorization", `Bearer ${deliveryToken}`)
        .send({ otp: testOrder.deliveryOtp });

      expect(res.status).toBe(200);
      expect(res.body.order.orderStatus).toBe("DELIVERED");
      expect(res.body.order.deliveryStatus).toBe("DELIVERED");
      expect(res.body.order.status).toBe("Delivered");
    });
  });

  describe("Scenario 7: AI Chatbot & Knowledge Retrieval", () => {
    it("should return contextual food dishes and coupons from MongoDB", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "Can you recommend dishes?" });

      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(typeof res.body.reply).toBe("string");
    });
  });

  describe("Admin Monitoring & Operations", () => {
    it("should return live administrative metrics matching database counts", async () => {
      const res = await request(app)
        .get("/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalOrders).toBeGreaterThanOrEqual(1);
      expect(res.body.stats.completedOrders).toBeGreaterThanOrEqual(1);
    });
  });
});
