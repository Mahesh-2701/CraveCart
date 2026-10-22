const { verifyToken } = require("../config/auth.config");
const orderModel = require("../Models/OrderSchema");

let ioInstance = null;
const activeSimulations = new Map();

function initSocketIO(io) {
  ioInstance = io;

  io.use((socket, next) => {
    // Optional token authentication on handshake
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const payload = verifyToken(token);
        socket.user = payload;
      } catch (err) {
        // Allow unauthenticated connection for public food/menu broadcasts,
        // but restrict private rooms to authenticated users.
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    // Join specific scoped rooms
    socket.on("join", (room) => {
      if (typeof room === "string" && room.trim()) {
        socket.join(room);
      }
    });

    socket.on("leave", (room) => {
      if (typeof room === "string") {
        socket.leave(room);
      }
    });

    // Authenticated delivery person real-time GPS broadcast
    socket.on("delivery:location_update", async (data) => {
      try {
        const { orderId, lat, lng, heading = 0, speed = 0 } = data;
        if (!orderId || typeof lat !== "number" || typeof lng !== "number") return;

        const updatePayload = {
          orderId,
          lat,
          lng,
          heading,
          speed,
          updatedAt: new Date().toISOString(),
          isSimulated: false,
        };

        // Broadcast specifically to the order tracking room
        io.to(`order_${orderId}`).emit("tracking:update", updatePayload);

        // Update database asynchronously
        await orderModel.findByIdAndUpdate(orderId, {
          $set: {
            "deliveryLocation.lat": lat,
            "deliveryLocation.lng": lng,
            "deliveryLocation.heading": heading,
            "deliveryLocation.speed": speed,
            "deliveryLocation.updatedAt": new Date(),
            isSimulated: false,
          },
        });
      } catch (err) {
        console.error("Error in delivery:location_update:", err.message);
      }
    });

    socket.on("disconnect", () => {
      // Cleanup on socket disconnect
    });
  });

  return io;
}

// Start simulated delivery movement for demonstration / development
function startDeliverySimulation(orderId, startCoords, endCoords, stepCount = 20, intervalMs = 2000) {
  if (!ioInstance) return null;

  stopDeliverySimulation(orderId);

  const startLat = startCoords?.lat || 12.9650;
  const startLng = startCoords?.lng || 77.5880;
  const endLat = endCoords?.lat || 12.9780;
  const endLng = endCoords?.lng || 77.6010;

  let currentStep = 0;

  const timer = setInterval(async () => {
    currentStep++;
    const progress = Math.min(1, currentStep / stepCount);
    const currentLat = startLat + (endLat - startLat) * progress;
    const currentLng = startLng + (endLng - startLng) * progress;

    const remainingEta = Math.max(1, Math.round((1 - progress) * 20));

    const payload = {
      orderId,
      lat: parseFloat(currentLat.toFixed(6)),
      lng: parseFloat(currentLng.toFixed(6)),
      heading: 45,
      speed: 25,
      isSimulated: true, // MANDATORY: Explicitly labeled
      simulationNotice: "DEMO / SIMULATED LOCATION (Development Mode)",
      progressPercent: Math.round(progress * 100),
      estimatedMinutes: remainingEta,
      updatedAt: new Date().toISOString(),
    };

    ioInstance.to(`order_${orderId}`).emit("tracking:update", payload);

    try {
      await orderModel.findByIdAndUpdate(orderId, {
        $set: {
          "deliveryLocation.lat": payload.lat,
          "deliveryLocation.lng": payload.lng,
          "deliveryLocation.updatedAt": new Date(),
          isSimulated: true,
          estimatedDeliveryMinutes: remainingEta,
        },
      });
    } catch (e) {
      // Continue simulation
    }

    if (progress >= 1) {
      stopDeliverySimulation(orderId);
      ioInstance.to(`order_${orderId}`).emit("tracking:completed", {
        orderId,
        message: "Simulated delivery reached destination.",
        isSimulated: true,
      });
    }
  }, intervalMs);

  activeSimulations.set(orderId.toString(), timer);
  return true;
}

function stopDeliverySimulation(orderId) {
  const key = orderId.toString();
  if (activeSimulations.has(key)) {
    clearInterval(activeSimulations.get(key));
    activeSimulations.delete(key);
    return true;
  }
  return false;
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initSocketIO,
  getIO,
  startDeliverySimulation,
  stopDeliverySimulation,
};
