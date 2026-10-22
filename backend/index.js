const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const dbconnect = require("./dbconnect");
const { initSocketIO } = require("./services/socket.service");

// Routes
const userrouter = require("./Routes/UserRoutes/routes");
const restRoute = require("./Routes/RestaurantRoutes/restaurantroutes");
const deliveryroute = require("./Routes/DeliverypersonRoutes/deliverroutes");
const adminRoute = require("./Routes/AdminRoutes/adminroutes");
const chatRouter = require("./Routes/ChatRoutes/chatroutes");
const paymentRouter = require("./Routes/PaymentRoutes/paymentroutes");
const couponRouter = require("./Routes/CouponRoutes/couponroutes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// Setup scoped rooms and tracking engine
initSocketIO(io);

// Static uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Establish Database Connection
dbconnect();

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Socket.IO instance to incoming requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    version: "2.0.0",
    service: "CraveCart API Engine",
    timestamp: new Date().toISOString(),
  });
});

// Application Routes
app.use("/user", userrouter);
app.use("/restaurant", restRoute);
app.use("/delivery", deliveryroute);
app.use("/admin", adminRoute);
app.use("/api/chat", chatRouter);
app.use("/payment", paymentRouter);
app.use("/coupons", couponRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.stack || err.message);
  res.status(500).json({ message: "Internal server error: " + err.message });
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => console.log(`CraveCart V2 Server Running at PORT ${PORT}`));
}

module.exports = { app, server, io };
