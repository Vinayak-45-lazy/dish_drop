// ===================================================
// DISHDROP — Auth Controller
// server/controllers/authController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { auth, db } = require("../firebase");
const { sendWelcomeEmail } = require("../services/emailService");
const { randomUUID } = require("crypto");

// ===================================================
// REGISTER USER
// POST /api/auth/register
// Creates Firebase Auth user + Firestore profile
// ===================================================

const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    role = "customer",
    vehicleType,
    vehicleNumber,
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password, and phone are required.",
    });
  }

  // Validate role
  const allowedRoles = ["customer", "restaurant_owner", "delivery_agent"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Must be customer, restaurant_owner, or delivery_agent.",
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
    });
  }

  // Create Firebase Auth user
  const firebaseUser = await auth.createUser({
    email,
    password,
    displayName: name,
  });

  const uid = firebaseUser.uid;
  const userId = uuidv4();
  const now = new Date();

  // Build base user profile
  const userProfile = {
    userId,
    uid,
    name,
    email,
    phone,
    role,
    profilePhotoUrl: "",
    addresses: [],
    defaultAddressIndex: 0,
    createdAt: now,
  };

  // Save user profile to Firestore
  await db.collection("Users").doc(uid).set(userProfile);

  // If delivery agent, create agent profile
  if (role === "delivery_agent") {
    if (!vehicleType || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type and vehicle number are required for delivery agents.",
      });
    }

    const agentId = uuidv4();
    const agentProfile = {
      agentId,
      userId: uid,
      name,
      phone,
      vehicleType,
      vehicleNumber,
      isAvailable: false,
      currentLat: 0,
      currentLng: 0,
      totalDeliveries: 0,
      avgRating: 0,
      totalRatings: 0,
      totalEarnings: 0,
      lateDeliveries: 0,
      flagStatus: "none",
      flagScore: 0,
      lastActiveAt: now,
      createdAt: now,
    };

    await db.collection("DeliveryAgentProfiles").doc(agentId).set(agentProfile);
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail({ name, email, role }).catch((err) =>
    console.error("Welcome email failed:", err.message)
  );

  // Create custom token for immediate login
  const customToken = await auth.createCustomToken(uid);

  return res.status(201).json({
    success: true,
    message: "Account created successfully!",
    data: {
      uid,
      name,
      email,
      role,
      phone,
      customToken,
    },
  });
};

// ===================================================
// GET CURRENT USER
// GET /api/auth/me
// Returns full user profile from Firestore
// ===================================================

const getCurrentUser = async (req, res) => {
  const uid = req.user.uid;

  const userDoc = await db.collection("Users").doc(uid).get();

  if (!userDoc.exists) {
    return res.status(404).json({
      success: false,
      message: "User profile not found.",
    });
  }

  const userData = userDoc.data();

  // If delivery agent, also fetch agent profile
  let agentProfile = null;
  if (userData.role === "delivery_agent") {
    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (!agentSnap.empty) {
      agentProfile = agentSnap.docs[0].data();
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      ...userData,
      agentProfile,
    },
  });
};

// ===================================================
// UPDATE PROFILE
// PATCH /api/auth/profile
// Updates user name, phone, addresses, profile photo
// ===================================================

const updateProfile = async (req, res) => {
  const uid = req.user.uid;
  const { name, phone, addresses, defaultAddressIndex } = req.body;

  const updates = {};

  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (defaultAddressIndex !== undefined) {
    updates.defaultAddressIndex = parseInt(defaultAddressIndex);
  }

  // Handle addresses (sent as JSON string from multipart)
  if (addresses) {
    try {
      updates.addresses =
        typeof addresses === "string" ? JSON.parse(addresses) : addresses;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid addresses format.",
      });
    }
  }

  // Handle profile photo upload
  if (req.file) {
    updates.profilePhotoUrl = req.file.path; // Cloudinary secure_url
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No fields to update.",
    });
  }

  updates.updatedAt = new Date();

  await db.collection("Users").doc(uid).update(updates);

  // If agent, also update name and phone in agent profile
  if (req.user.role === "delivery_agent" && (name || phone)) {
    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (!agentSnap.empty) {
      const agentUpdates = {};
      if (name) agentUpdates.name = name;
      if (phone) agentUpdates.phone = phone;
      await agentSnap.docs[0].ref.update(agentUpdates);
    }
  }

  // Fetch and return updated profile
  const updatedDoc = await db.collection("Users").doc(uid).get();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    data: updatedDoc.data(),
  });
};

// ===================================================
// ADD ADDRESS
// POST /api/auth/address
// Adds a new delivery address to user profile
// ===================================================

const addAddress = async (req, res) => {
  const uid = req.user.uid;
  const { label, fullAddress, lat, lng } = req.body;

  if (!label || !fullAddress || lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      message: "Label, fullAddress, lat, and lng are required.",
    });
  }

  const userDoc = await db.collection("Users").doc(uid).get();
  const userData = userDoc.data();
  const currentAddresses = userData.addresses || [];

  const newAddress = {
    id: uuidv4(),
    label,
    fullAddress,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
  };

  const updatedAddresses = [...currentAddresses, newAddress];

  await db.collection("Users").doc(uid).update({
    addresses: updatedAddresses,
  });

  return res.status(201).json({
    success: true,
    message: "Address added successfully!",
    data: newAddress,
  });
};

// ===================================================
// DELETE ADDRESS
// DELETE /api/auth/address/:addressId
// Removes an address from user profile
// ===================================================

const deleteAddress = async (req, res) => {
  const uid = req.user.uid;
  const { addressId } = req.params;

  const userDoc = await db.collection("Users").doc(uid).get();
  const userData = userDoc.data();
  const currentAddresses = userData.addresses || [];

  const updatedAddresses = currentAddresses.filter(
    (addr) => addr.id !== addressId
  );

  if (updatedAddresses.length === currentAddresses.length) {
    return res.status(404).json({
      success: false,
      message: "Address not found.",
    });
  }

  await db.collection("Users").doc(uid).update({
    addresses: updatedAddresses,
    defaultAddressIndex: 0,
  });

  return res.status(200).json({
    success: true,
    message: "Address deleted successfully!",
  });
};

// ===================================================
// DELETE ACCOUNT
// DELETE /api/auth/account
// Deletes Firebase Auth user + Firestore profile
// ===================================================

const deleteAccount = async (req, res) => {
  const uid = req.user.uid;

  // Delete from Firebase Auth
  await auth.deleteUser(uid);

  // Delete from Firestore
  await db.collection("Users").doc(uid).delete();

  // If agent, delete agent profile too
  if (req.user.role === "delivery_agent") {
    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (!agentSnap.empty) {
      await agentSnap.docs[0].ref.delete();
    }
  }

  return res.status(200).json({
    success: true,
    message: "Account deleted successfully.",
  });
};

module.exports = {
  registerUser,
  getCurrentUser,
  updateProfile,
  addAddress,
  deleteAddress,
  deleteAccount,
};
