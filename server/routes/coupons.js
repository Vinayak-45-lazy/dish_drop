// ===================================================
// DISHDROP — Coupon Routes
// server/routes/coupons.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  createCoupon,
  getAllCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStats,
} = require("../controllers/couponController");

const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin, isCustomer } = require("../middleware/roleMiddleware");

// ===================================================
// PUBLIC / CUSTOMER ROUTES
// ===================================================

// Validate a coupon code
// POST /api/coupons/validate
// Customer only — checks validity and calculates discount
// Must be before /:id to avoid conflict
router.post(
  "/validate",
  verifyToken,
  isCustomer,
  validateCoupon
);

// ===================================================
// ADMIN ONLY ROUTES
// ===================================================

// Get coupon stats
// GET /api/coupons/stats
// Must be before /:id
router.get(
  "/stats",
  verifyToken,
  isAdmin,
  getCouponStats
);

// Get all coupons
// GET /api/coupons
// Supports: ?isActive=true&limit=20&page=1
router.get(
  "/",
  verifyToken,
  isAdmin,
  getAllCoupons
);

// Create new coupon
// POST /api/coupons
router.post(
  "/",
  verifyToken,
  isAdmin,
  createCoupon
);

// Update coupon
// PATCH /api/coupons/:id
router.patch(
  "/:id",
  verifyToken,
  isAdmin,
  updateCoupon
);

// Toggle coupon active status
// PATCH /api/coupons/:id/toggle
router.patch(
  "/:id/toggle",
  verifyToken,
  isAdmin,
  toggleCouponStatus
);

// Delete coupon
// DELETE /api/coupons/:id
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  deleteCoupon
);

module.exports = router;