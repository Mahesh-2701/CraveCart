const express = require("express");
const deliverySchema = require("../../Models/Deliveryperson");
const orderSchema = require("../../Models/OrderSchema");
const { signToken } = require("../../config/auth.config");
const { authenticate, authorizeRoles } = require("../../middleware/auth.middleware");
const { startDeliverySimulation, stopDeliverySimulation } = require("../../services/socket.service");
const { sendStatusUpdate } = require("../../services/email.service");

const deliveryroute = express.Router();
deliveryroute.use(express.json());

/**
 * Delivery Person Registration
 */
deliveryroute.post("/signin", async (req, res) => {
  const deliveryperson = { ...req.body };

  try {
    const existing = await deliverySchema.findOne({ email: deliveryperson.email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered for delivery partner." });
    }

    const created = await deliverySchema.create({ ...deliveryperson });
    return res.status(200).json({ message: "Registration Success", id: created._id });
  } catch (err) {
    return res.status(500).json({ message: "Registration Failed: " + err.message });
  }
});

/**
 * Delivery Person Login
 */
deliveryroute.post("/login", async (req, res) => {
  const enteredemail = (req.body.email || "").trim().toLowerCase();
  const enteredpassword = req.body.password;

  try {
    const result = await deliverySchema.findOne({ email: enteredemail });

    if (result) {
      const isMatch = await result.comparepassword(enteredpassword);

      if (isMatch) {
        const token = signToken({
          email: result.email,
          id: result._id,
          role: result.role || "deliveryperson",
        });

        return res.status(200).json({
          message: "Login Success",
          email: result.email,
          id: result._id,
          name: result.name,
          role: result.role || "deliveryperson",
          token: token,
        });
      } else {
        return res.status(400).json({ message: "Invalid Password Credentials" });
      }
    } else {
      return res.status(400).json({ message: "Invalid Email Credentials" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Server Error " + err.message });
  }
});

/**
 * Display Delivery Person Profile
 */
deliveryroute.get("/view/:id", authenticate, async (req, res) => {
  const delpersonid = req.params.id;

  try {
    const result = await deliverySchema.findById(delpersonid).select("-password");
    if (!result) return res.status(404).json({ message: "Delivery partner not found." });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server Error : " + err.message });
  }
});

/**
 * Update Delivery Person Profile
 */
deliveryroute.put("/update/:id", authenticate, async (req, res) => {
  const delperson = { ...req.body };
  const delpersonid = req.params.id;

  try {
    await deliverySchema.findByIdAndUpdate(delpersonid, { ...delperson });
    return res.status(200).json({ message: "Update Success Please Login to Continue" });
  } catch (err) {
    return res.status(500).json({ message: "Error Try Again Later : " + err.message });
  }
});

/**
 * Toggle Delivery Partner Availability
 */
deliveryroute.patch("/availability/:id", authenticate, async (req, res) => {
  const delpersonid = req.params.id;
  const { isAvailable } = req.body;

  try {
    const updated = await deliverySchema.findByIdAndUpdate(
      delpersonid,
      { $set: { isAvailable: Boolean(isAvailable) } },
      { new: true }
    );
    return res.status(200).json({
      message: `Status updated: You are now ${updated.isAvailable ? "Online (Accepting Orders)" : "Offline"}`,
      isAvailable: updated.isAvailable,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update availability: " + err.message });
  }
});

/**
 * Assigned Order History for Delivery Partner
 */
deliveryroute.get("/order/:id", authenticate, async (req, res) => {
  const deliverypersonid = req.params.id;

  try {
    const result = await orderSchema
      .find({ deliverypersonid: deliverypersonid })
      .populate("userid", "-password")
      .populate({ path: "menuid", populate: { path: "restaurantid" } })
      .populate("deliverypersonid", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server Error " + err.message });
  }
});

/**
 * Delivery Status Transition (e.g. Out for Delivery, Delivered)
 */
deliveryroute.patch("/order/status/:orderId", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await orderSchema
      .findByIdAndUpdate(
        orderId,
        {
          $set: { status },
          $push: {
            statusHistory: {
              status,
              timestamp: new Date(),
              comment: `Status updated to ${status} by delivery partner.`,
              updatedBy: "delivery_partner",
            },
          },
        },
        { new: true }
      )
      .populate("userid", "-password")
      .populate("deliverypersonid")
      .populate({ path: "menuid", populate: { path: "restaurantid" } });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (req.io) {
      req.io.to(`user_${updatedOrder.userid._id}`).emit("orderStatusChanged", updatedOrder);
      req.io.to(`order_${orderId}`).emit("status:update", { orderId, status });
    }

    sendStatusUpdate(updatedOrder, updatedOrder.userid, status);

    return res.status(200).json({ message: "Order status updated successfully", order: updatedOrder });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update status: " + err.message });
  }
});

/**
 * Development / Demonstration Delivery Route Simulation Endpoint
 */
deliveryroute.post("/simulate/:orderId", authenticate, async (req, res) => {
  const { orderId } = req.params;
  const { intervalMs = 2000, stepCount = 15 } = req.body;

  try {
    const order = await orderSchema.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const startCoords = order.restaurantCoordinates || { lat: 12.9650, lng: 77.5880 };
    const endCoords = order.customerCoordinates || { lat: 12.9780, lng: 77.6010 };

    startDeliverySimulation(orderId, startCoords, endCoords, stepCount, intervalMs);

    return res.status(200).json({
      message: "Delivery simulation started successfully. Listening on room 'order_" + orderId + "'.",
      isSimulated: true,
      simulationNotice: "DEMO / SIMULATED TRACKING ACTIVE",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to start simulation: " + err.message });
  }
});

/**
 * Stop Delivery Simulation
 */
deliveryroute.post("/simulate-stop/:orderId", authenticate, (req, res) => {
  const { orderId } = req.params;
  stopDeliverySimulation(orderId);
  return res.status(200).json({ message: "Delivery simulation stopped." });
});

module.exports = deliveryroute;
