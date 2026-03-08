// ===================================================
// DISHDROP — Express Server Entry Point
// server/index.js
// ===================================================

require("express-async-errors");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Route imports
const authRoutes = require("./routes/auth");
const restaurantRoutes = require("./routes/restaurants");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const ratingRoutes = require("./routes/ratings");
const agentRoutes = require("./routes/agents");
const couponRoutes = require("./routes/coupons");
const aiRoutes = require("./routes/ai");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");

// Cron jobs
const { initCronJobs } = require("./jobs/cronJobs");

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================================
// MIDDLEWARE
// ===================================================

// CORS — allow frontend origin
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===================================================
// HEALTH CHECK
// ===================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🍽️ DishDrop API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ===================================================
// ROUTES
// ===================================================

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// ===================================================
// 404 HANDLER
// ===================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ===================================================
// GLOBAL ERROR HANDLER
// ===================================================

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error(err.stack);

  // Firebase errors
  if (err.code && err.code.startsWith("auth/")) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ===================================================
// START SERVER
// ===================================================

app.listen(PORT, () => {
  console.log("🍽️  ================================");
  console.log(`🚀 DishDrop Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log("🍽️  ================================");

  // Initialize cron jobs
  initCronJobs();
  console.log("⏰ Cron jobs initialized");
});

module.exports = app;