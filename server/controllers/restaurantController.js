// ===================================================
// DISHDROP — Restaurant Controller
// server/controllers/restaurantController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");
const { deleteImageByUrl } = require("../services/cloudinaryService");
const { clearScreenDown } = require("readline");
const { start } = require("repl");


// ===================================================
// GET ALL RESTAURANTS
// GET /api/restaurants
// Public — supports filters: cuisine, isOpen, search
// ===================================================

const getAllRestaurants = async (req, res) => {
  try {
    const {
      cuisine,
      isOpen,
      sortBy = "avgRating",
      limit = 20,
      page = 1,
    } = req.query;

    let query = db
      .collection("Restaurants")
      .where("isApproved", "==", true);

    // Filter by open status
    if (isOpen === "true") {
      query = query.where("isOpen", "==", true);
    }

    // Filter by cuisine type
    if (cuisine) {
      query = query.where(
        "cuisineTypes",
        "array-contains",
        cuisine.toLowerCase()
      );
    }

    // Sorting
    const validSortFields = [
      "avgRating",
      "totalOrders",
      "avgDeliveryMinutes",
      "createdAt",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "avgRating";
    const sortDirection = sortBy === "avgDeliveryMinutes" ? "asc" : "desc";

    query = query.orderBy(sortField, sortDirection);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: "No restaurants found.",
      });
    }

    let restaurants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const total = restaurants.length;
    restaurants = restaurants.slice(startIndex, startIndex + limitNum);

    return res.status(200).json({
      success: true,
      data: restaurants,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get all restaurants error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants.",
    });
  }
};

// ===================================================
// GET RESTAURANT BY ID
// GET /api/restaurants/:id
// Public
// ===================================================

const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurantDoc = await db.collection("Restaurants").doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const restaurant = restaurantDoc.data();

    // Block unapproved restaurants from public view
    if (!restaurant.isApproved && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This restaurant is pending approval.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: restaurantDoc.id, ...restaurant },
    });
  } catch (err) {
    console.error("❌ Get restaurant by ID error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant.",
    });
  }
};

// ===================================================
// CREATE RESTAURANT
// POST /api/restaurants
// Restaurant Owner only
// ===================================================

const createRestaurant = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Check if owner already has a restaurant
    const existingSnap = await db
      .collection("Restaurants")
      .where("ownerId", "==", uid)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a registered restaurant. Contact admin to add more.",
      });
    }

    const {
      name,
      description,
      cuisineTypes,
      address,
      lat,
      lng,
      phone,
      openingTime,
      closingTime,
      minimumOrderAmount = 0,
      deliveryFee = 0,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      !cuisineTypes ||
      !address ||
      !lat ||
      !lng ||
      !phone ||
      !openingTime ||
      !closingTime
    ) {
      return res.status(400).json({
        success: false,
        message: "All restaurant details are required.",
      });
    }

    // Handle cover image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Restaurant cover image is required.",
      });
    }

    const coverImageUrl = req.file.path; // Cloudinary secure_url

    // Parse cuisine types
    let parsedCuisines = cuisineTypes;
    if (typeof cuisineTypes === "string") {
      try {
        parsedCuisines = JSON.parse(cuisineTypes);
      } catch {
        parsedCuisines = cuisineTypes.split(",").map((c) => c.trim().toLowerCase());
      }
    }

    const restaurantId = uuidv4();
    const now = new Date();

    const restaurant = {
      restaurantId,
      ownerId: uid,
      ownerName: req.user.name,
      name,
      description,
      cuisineTypes: parsedCuisines,
      coverImageUrl,
      address,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      phone,
      openingTime,
      closingTime,
      isOpen: false,
      isApproved: false, // Requires admin approval
      avgRating: 0,
      totalRatings: 0,
      totalOrders: 0,
      avgDeliveryMinutes: 30,
      minimumOrderAmount: parseFloat(minimumOrderAmount),
      deliveryFee: parseFloat(deliveryFee),
      flagStatus: "none",
      flagScore: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("Restaurants").doc(restaurantId).set(restaurant);

    return res.status(201).json({
      success: true,
      message:
        "Restaurant registered successfully! Awaiting admin approval.",
      data: restaurant,
    });
  } catch (err) {
    console.error("❌ Create restaurant error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to register restaurant.",
    });
  }
};

// ===================================================
// UPDATE RESTAURANT
// PATCH /api/restaurants/:id
// Restaurant Owner or Admin
// ===================================================

const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const role = req.user.role;

    const restaurantDoc = await db.collection("Restaurants").doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const restaurant = restaurantDoc.data();

    // Only owner or admin can update
    if (role !== "admin" && restaurant.ownerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this restaurant.",
      });
    }

    const {
      name,
      description,
      cuisineTypes,
      address,
      lat,
      lng,
      phone,
      openingTime,
      closingTime,
      minimumOrderAmount,
      deliveryFee,
      isOpen,
    } = req.body;

    const updates = { updatedAt: new Date() };

    if (name) updates.name = name;
    if (description) updates.description = description;
    if (address) updates.address = address;
    if (lat) updates.lat = parseFloat(lat);
    if (lng) updates.lng = parseFloat(lng);
    if (phone) updates.phone = phone;
    if (openingTime) updates.openingTime = openingTime;
    if (closingTime) updates.closingTime = closingTime;
    if (minimumOrderAmount !== undefined)
      updates.minimumOrderAmount = parseFloat(minimumOrderAmount);
    if (deliveryFee !== undefined)
      updates.deliveryFee = parseFloat(deliveryFee);
    if (isOpen !== undefined)
      updates.isOpen = isOpen === "true" || isOpen === true;

    // Handle cuisine types
    if (cuisineTypes) {
      let parsedCuisines = cuisineTypes;
      if (typeof cuisineTypes === "string") {
        try {
          parsedCuisines = JSON.parse(cuisineTypes);
        } catch {
          parsedCuisines = cuisineTypes
            .split(",")
            .map((c) => c.trim().toLowerCase());
        }
      }
      updates.cuisineTypes = parsedCuisines;
    }

    // Handle new cover image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (restaurant.coverImageUrl) {
        await deleteImageByUrl(restaurant.coverImageUrl);
      }
      updates.coverImageUrl = req.file.path;
    }

    await db.collection("Restaurants").doc(id).update(updates);

    const updatedDoc = await db.collection("Restaurants").doc(id).get();

    return res.status(200).json({
      success: true,
      message: "Restaurant updated successfully!",
      data: updatedDoc.data(),
    });
  } catch (err) {
    console.error("❌ Update restaurant error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update restaurant.",
    });
  }
};

// ===================================================
// GET MY RESTAURANT
// GET /api/restaurants/my
// Restaurant Owner only — returns their restaurant
// ===================================================

const getMyRestaurant = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snap = await db
      .collection("Restaurants")
      .where("ownerId", "==", uid)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({
        success: false,
        message: "You have not registered a restaurant yet.",
      });
    }

    const restaurantDoc = snap.docs[0];

    return res.status(200).json({
      success: true,
      data: { id: restaurantDoc.id, ...restaurantDoc.data() },
    });
  } catch (err) {
    console.error("❌ Get my restaurant error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your restaurant.",
    });
  }
};

// ===================================================
// TOGGLE RESTAURANT OPEN/CLOSE
// PATCH /api/restaurants/:id/toggle
// Restaurant Owner only
// ===================================================

const toggleRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const restaurantDoc = await db.collection("Restaurants").doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const restaurant = restaurantDoc.data();

    if (restaurant.ownerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to toggle this restaurant.",
      });
    }

    if (!restaurant.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Restaurant must be approved before going online.",
      });
    }

    const newStatus = !restaurant.isOpen;

    await db.collection("Restaurants").doc(id).update({
      isOpen: newStatus,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Restaurant is now ${newStatus ? "OPEN 🟢" : "CLOSED 🔴"}`,
      data: { isOpen: newStatus },
    });
  } catch (err) {
    console.error("❌ Toggle restaurant status error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle restaurant status.",
    });
  }
};

// ===================================================
// GET NEARBY RESTAURANTS
// GET /api/restaurants/nearby?lat=&lng=&radius=
// Public — returns restaurants within radius (km)
// ===================================================

const getNearbyRestaurants = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required.",
      });
    }

    const customerLat = parseFloat(lat);
    const customerLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const snap = await db
      .collection("Restaurants")
      .where("isApproved", "==", true)
      .where("isOpen", "==", true)
      .get();

    if (snap.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Haversine distance filter
    const toRad = (val) => (val * Math.PI) / 180;
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const nearby = snap.docs
      .map((doc) => {
        const r = doc.data();
        const distance = haversine(customerLat, customerLng, r.lat, r.lng);
        return { id: doc.id, ...r, distanceKm: Math.round(distance * 10) / 10 };
      })
      .filter((r) => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      data: nearby,
      total: nearby.length,
    });
  } catch (err) {
    console.error("❌ Get nearby restaurants error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby restaurants.",
    });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getMyRestaurant,
  toggleRestaurantStatus,
  getNearbyRestaurants,
};
