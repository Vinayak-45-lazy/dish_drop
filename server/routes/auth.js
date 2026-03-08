// ===================================================
// DISHDROP — Auth Routes
// server/routes/auth.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  registerUser,
  getCurrentUser,
  updateProfile,
  addAddress,
  deleteAddress,
  deleteAccount,
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");
const { uploadProfilePhoto } = require("../middleware/uploadMiddleware");

// ===================================================
// PUBLIC ROUTES
// ===================================================

// Register new user
// POST /api/auth/register
router.post("/register", registerUser);

// ===================================================
// PROTECTED ROUTES (require login)
// ===================================================

// Get current user profile
// GET /api/auth/me
router.get("/me", verifyToken, getCurrentUser);

// Update profile (with optional profile photo)
// PATCH /api/auth/profile
router.patch(
  "/profile",
  verifyToken,
  uploadProfilePhoto,
  updateProfile
);

// Add delivery address
// POST /api/auth/address
router.post("/address", verifyToken, addAddress);

// Delete delivery address
// DELETE /api/auth/address/:addressId
router.delete("/address/:addressId", verifyToken, deleteAddress);

// Delete account
// DELETE /api/auth/account
router.delete("/account", verifyToken, deleteAccount);

module.exports = router;