// ===================================================
// DISHDROP — Payment Routes
// server/routes/payments.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment,
} = require("../controllers/paymentController");

const { verifyToken } = require("../middleware/authMiddleware");
const { isCustomer, isAdmin } = require("../middleware/roleMiddleware");

// ===================================================
// PAYMENT ROUTES
// ===================================================

// Create Razorpay order
// POST /api/payments/create-order
// Customer only — initiates payment flow
router.post(
  "/create-order",
  verifyToken,
  isCustomer,
  createPaymentOrder
);

// Verify Razorpay payment signature
// POST /api/payments/verify
// Customer only — called after successful payment
router.post(
  "/verify",
  verifyToken,
  isCustomer,
  verifyPayment
);

// Get payment details from Razorpay
// GET /api/payments/:razorpayPaymentId
// Admin only
router.get(
  "/:razorpayPaymentId",
  verifyToken,
  isAdmin,
  getPaymentDetails
);

// Refund payment
// POST /api/payments/refund
// Admin only
router.post(
  "/refund",
  verifyToken,
  isAdmin,
  refundPayment
);

module.exports = router;