// ===================================================
// DISHDROP — Coupon Controller
// server/controllers/couponController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");


// ===================================================
// CREATE COUPON
// POST /api/coupons
// Admin only
// ===================================================

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount = 0,
      maxDiscountAmount,
      usageLimit = 100,
      expiresAt,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Code, discountType, discountValue, and expiresAt are required.",
      });
    }

    // Validate discount type
    if (!["flat", "percent"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "discountType must be 'flat' or 'percent'.",
      });
    }

    // Validate percent range
    if (discountType === "percent") {
      const percent = parseFloat(discountValue);
      if (percent <= 0 || percent > 100) {
        return res.status(400).json({
          success: false,
          message: "Percent discount must be between 1 and 100.",
        });
      }
    }

    // Validate flat discount
    if (discountType === "flat" && parseFloat(discountValue) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Flat discount must be greater than 0.",
      });
    }

    // Check if coupon code already exists
    const existingSnap = await db
      .collection("Coupons")
      .where("code", "==", code.toUpperCase())
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${code.toUpperCase()}' already exists.`,
      });
    }

    // Validate expiry date
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "expiresAt must be a valid future date.",
      });
    }

    const couponId = uuidv4();
    const now = new Date();

    const coupon = {
      couponId,
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: parseFloat(minOrderAmount),
      maxDiscountAmount: maxDiscountAmount
        ? parseFloat(maxDiscountAmount)
        : null,
      usageLimit: parseInt(usageLimit),
      usedCount: 0,
      expiresAt: expiryDate,
      isActive: true,
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("Coupons").doc(couponId).set(coupon);

    return res.status(201).json({
      success: true,
      message: `Coupon '${coupon.code}' created successfully!`,
      data: coupon,
    });
  } catch (err) {
    console.error("❌ Create coupon error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create coupon.",
    });
  }
};

// ===================================================
// GET ALL COUPONS
// GET /api/coupons
// Admin only
// ===================================================

const getAllCoupons = async (req, res) => {
  try {
    const { isActive, limit = 20, page = 1 } = req.query;

    let query = db.collection("Coupons").orderBy("createdAt", "desc");

    if (isActive !== undefined) {
      query = db
        .collection("Coupons")
        .where("isActive", "==", isActive === "true")
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
      });
    }

    let coupons = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      expiresAt:
        doc.data().expiresAt?.toDate?.()?.toISOString() ||
        doc.data().expiresAt,
      createdAt:
        doc.data().createdAt?.toDate?.()?.toISOString() ||
        doc.data().createdAt,
    }));

    // Add computed fields
    coupons = coupons.map((coupon) => ({
      ...coupon,
      isExpired: new Date(coupon.expiresAt) <= new Date(),
      usagePercent:
        coupon.usageLimit > 0
          ? Math.round((coupon.usedCount / coupon.usageLimit) * 100)
          : 0,
      remainingUses: Math.max(0, coupon.usageLimit - coupon.usedCount),
    }));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = coupons.length;
    const paginated = coupons.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get all coupons error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons.",
    });
  }
};

// ===================================================
// VALIDATE COUPON
// POST /api/coupons/validate
// Customer only — checks if coupon is valid
// and calculates discount amount
// ===================================================

const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || orderAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required.",
      });
    }

    const parsedOrderAmount = parseFloat(orderAmount);

    if (isNaN(parsedOrderAmount) || parsedOrderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    // Find coupon by code
    const couponSnap = await db
      .collection("Coupons")
      .where("code", "==", code.toUpperCase())
      .limit(1)
      .get();

    if (couponSnap.empty) {
      return res.status(404).json({
        success: false,
        message: `Coupon '${code.toUpperCase()}' not found.`,
      });
    }

    const couponDoc = couponSnap.docs[0];
    const coupon = couponDoc.data();

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is no longer active.",
      });
    }

    // Check expiry
    const expiresAt =
      coupon.expiresAt?.toDate?.() || new Date(coupon.expiresAt);
    if (expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired.",
      });
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit.",
      });
    }

    // Check minimum order amount
    if (parsedOrderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}.`,
      });
    }

    // -----------------------------------------------
    // CALCULATE DISCOUNT
    // -----------------------------------------------
    let discountAmount = 0;

    if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "percent") {
      discountAmount = (parsedOrderAmount * coupon.discountValue) / 100;

      // Apply max discount cap for percent type
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, parsedOrderAmount);
    discountAmount = Math.round(discountAmount * 100) / 100;

    const finalAmount = Math.round((parsedOrderAmount - discountAmount) * 100) / 100;

    return res.status(200).json({
      success: true,
      message: `Coupon applied! You save ₹${discountAmount} 🎉`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        originalAmount: parsedOrderAmount,
        finalAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        expiresAt: expiresAt.toISOString(),
        remainingUses: coupon.usageLimit - coupon.usedCount,
      },
    });
  } catch (err) {
    console.error("❌ Validate coupon error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to validate coupon.",
    });
  }
};

// ===================================================
// UPDATE COUPON
// PATCH /api/coupons/:id
// Admin only
// ===================================================

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      expiresAt,
      isActive,
    } = req.body;

    const couponDoc = await db.collection("Coupons").doc(id).get();

    if (!couponDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    const updates = { updatedAt: new Date() };

    if (discountValue !== undefined)
      updates.discountValue = parseFloat(discountValue);
    if (minOrderAmount !== undefined)
      updates.minOrderAmount = parseFloat(minOrderAmount);
    if (maxDiscountAmount !== undefined)
      updates.maxDiscountAmount = parseFloat(maxDiscountAmount);
    if (usageLimit !== undefined)
      updates.usageLimit = parseInt(usageLimit);
    if (isActive !== undefined)
      updates.isActive = isActive === true || isActive === "true";

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiry date.",
        });
      }
      updates.expiresAt = expiryDate;
    }

    await db.collection("Coupons").doc(id).update(updates);

    const updatedDoc = await db.collection("Coupons").doc(id).get();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully!",
      data: updatedDoc.data(),
    });
  } catch (err) {
    console.error("❌ Update coupon error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update coupon.",
    });
  }
};

// ===================================================
// DELETE COUPON
// DELETE /api/coupons/:id
// Admin only
// ===================================================

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const couponDoc = await db.collection("Coupons").doc(id).get();

    if (!couponDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    await db.collection("Coupons").doc(id).delete();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully!",
    });
  } catch (err) {
    console.error("❌ Delete coupon error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon.",
    });
  }
};

// ===================================================
// TOGGLE COUPON STATUS
// PATCH /api/coupons/:id/toggle
// Admin only
// ===================================================

const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const couponDoc = await db.collection("Coupons").doc(id).get();

    if (!couponDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    const coupon = couponDoc.data();
    const newStatus = !coupon.isActive;

    await db.collection("Coupons").doc(id).update({
      isActive: newStatus,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Coupon is now ${newStatus ? "active ✅" : "inactive ❌"}`,
      data: { isActive: newStatus },
    });
  } catch (err) {
    console.error("❌ Toggle coupon status error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle coupon status.",
    });
  }
};

// ===================================================
// GET COUPON STATS
// GET /api/coupons/stats
// Admin only
// ===================================================

const getCouponStats = async (req, res) => {
  try {
    const snapshot = await db.collection("Coupons").get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          active: 0,
          expired: 0,
          totalUsage: 0,
          totalDiscountGiven: 0,
        },
      });
    }

    const coupons = snapshot.docs.map((doc) => doc.data());
    const now = new Date();

    let active = 0;
    let expired = 0;
    let totalUsage = 0;

    coupons.forEach((c) => {
      const expiresAt = c.expiresAt?.toDate?.() || new Date(c.expiresAt);
      if (c.isActive && expiresAt > now) active++;
      else expired++;
      totalUsage += c.usedCount || 0;
    });

    // Calculate total discount given from orders
    const ordersSnap = await db
      .collection("Orders")
      .where("couponCode", "!=", "")
      .get();

    const totalDiscountGiven = ordersSnap.docs.reduce(
      (sum, doc) => sum + (doc.data().discount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        total: coupons.length,
        active,
        expired,
        totalUsage,
        totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      },
    });
  } catch (err) {
    console.error("❌ Get coupon stats error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon stats.",
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStats,
};
