// ===================================================
// DISHDROP — Auth Middleware
// server/middleware/authMiddleware.js
// ===================================================

const { auth, db } = require("../firebase");

// ===================================================
// VERIFY FIREBASE TOKEN
// Extracts and verifies the Bearer token from headers
// Attaches user data to req.user for downstream use
// ===================================================

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No token provided.",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Token is empty.",
      });
    }

    // Verify token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);

    // Get full user profile from Firestore
    const userDoc = await db
      .collection("Users")
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    const userData = userDoc.data();

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      profilePhotoUrl: userData.profilePhotoUrl,
    };

    next();
  } catch (err) {
    // Token expired
    if (err.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // Token invalid
    if (err.code === "auth/argument-error" || err.code === "auth/invalid-id-token") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    console.error("❌ Auth middleware error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

// ===================================================
// OPTIONAL AUTH
// Attaches user if token present, but doesn't block
// Used for routes accessible to both guests and users
// ===================================================

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decodedToken = await auth.verifyIdToken(token);

    const userDoc = await db
      .collection("Users")
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) {
      req.user = null;
      return next();
    }

    const userData = userDoc.data();

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      profilePhotoUrl: userData.profilePhotoUrl,
    };

    next();
  } catch (err) {
    // If token is invalid just continue as guest
    req.user = null;
    next();
  }
};

module.exports = { verifyToken, optionalAuth };