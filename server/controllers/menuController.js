// ===================================================
// DISHDROP — Menu Controller
// server/controllers/menuController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");
const { deleteImageByUrl } = require("../services/cloudinaryService");


// ===================================================
// GET MENU BY RESTAURANT ID
// GET /api/restaurants/:id/menu
// Public — returns all available menu items
// ===================================================

const getMenuByRestaurant = async (req, res) => {
  try {
    const { id: restaurantId } = req.params;
    const { category, isVeg, isAvailable = "true" } = req.query;

    let query = db
      .collection("MenuItems")
      .where("restaurantId", "==", restaurantId);

    // Filter by availability
    if (isAvailable !== "all") {
      query = query.where("isAvailable", "==", isAvailable === "true");
    }

    // Filter by veg/non-veg
    if (isVeg !== undefined) {
      query = query.where("isVeg", "==", isVeg === "true");
    }

    const snapshot = await query.orderBy("category").get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        categories: [],
        total: 0,
      });
    }

    let items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by category (client-side after Firestore query)
    if (category) {
      items = items.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Group items by category
    const grouped = items.reduce((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    const categories = Object.keys(grouped).sort();

    return res.status(200).json({
      success: true,
      data: items,
      grouped,
      categories,
      total: items.length,
    });
  } catch (err) {
    console.error("❌ Get menu error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu items.",
    });
  }
};

// ===================================================
// GET SINGLE MENU ITEM
// GET /api/menu/:id
// Public
// ===================================================

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const itemDoc = await db.collection("MenuItems").doc(id).get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: itemDoc.id, ...itemDoc.data() },
    });
  } catch (err) {
    console.error("❌ Get menu item error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu item.",
    });
  }
};

// ===================================================
// CREATE MENU ITEM
// POST /api/menu
// Restaurant Owner only
// ===================================================

const createMenuItem = async (req, res) => {
  try {
    const uid = req.user.uid;

    const {
      restaurantId,
      name,
      description,
      price,
      discountedPrice,
      category,
      isVeg,
      spiceLevel = "mild",
      tags,
    } = req.body;

    // Validate required fields
    if (!restaurantId || !name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID, name, price, and category are required.",
      });
    }

    // Verify ownership
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(restaurantId)
      .get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    if (restaurantDoc.data().ownerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to add items to this restaurant.",
      });
    }

    // Handle image upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Menu item image is required.",
      });
    }

    const imageUrl = req.file.path; // Cloudinary secure_url

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags =
          typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = tags.split(",").map((t) => t.trim().toLowerCase());
      }
    }

    // Validate spice level
    const validSpiceLevels = ["mild", "medium", "hot", "extra-hot"];
    const validatedSpiceLevel = validSpiceLevels.includes(spiceLevel)
      ? spiceLevel
      : "mild";

    const itemId = uuidv4();
    const now = new Date();

    const menuItem = {
      itemId,
      restaurantId,
      name,
      description: description || "",
      price: parseFloat(price),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : parseFloat(price),
      category,
      imageUrl,
      isVeg: isVeg === "true" || isVeg === true,
      isAvailable: true,
      spiceLevel: validatedSpiceLevel,
      tags: parsedTags,
      avgRating: 0,
      totalOrders: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("MenuItems").doc(itemId).set(menuItem);

    return res.status(201).json({
      success: true,
      message: "Menu item added successfully!",
      data: menuItem,
    });
  } catch (err) {
    console.error("❌ Create menu item error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create menu item.",
    });
  }
};

// ===================================================
// UPDATE MENU ITEM
// PATCH /api/menu/:id
// Restaurant Owner only
// ===================================================

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const itemDoc = await db.collection("MenuItems").doc(id).get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    const item = itemDoc.data();

    // Verify ownership via restaurant
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(item.restaurantId)
      .get();

    if (!restaurantDoc.exists || restaurantDoc.data().ownerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this menu item.",
      });
    }

    const {
      name,
      description,
      price,
      discountedPrice,
      category,
      isVeg,
      isAvailable,
      spiceLevel,
      tags,
    } = req.body;

    const updates = { updatedAt: new Date() };

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price) updates.price = parseFloat(price);
    if (discountedPrice !== undefined)
      updates.discountedPrice = parseFloat(discountedPrice);
    if (category) updates.category = category;
    if (isVeg !== undefined)
      updates.isVeg = isVeg === "true" || isVeg === true;
    if (isAvailable !== undefined)
      updates.isAvailable = isAvailable === "true" || isAvailable === true;

    if (spiceLevel) {
      const validSpiceLevels = ["mild", "medium", "hot", "extra-hot"];
      updates.spiceLevel = validSpiceLevels.includes(spiceLevel)
        ? spiceLevel
        : "mild";
    }

    if (tags) {
      try {
        updates.tags =
          typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch {
        updates.tags = tags.split(",").map((t) => t.trim().toLowerCase());
      }
    }

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (item.imageUrl) {
        await deleteImageByUrl(item.imageUrl);
      }
      updates.imageUrl = req.file.path;
    }

    await db.collection("MenuItems").doc(id).update(updates);

    const updatedDoc = await db.collection("MenuItems").doc(id).get();

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully!",
      data: updatedDoc.data(),
    });
  } catch (err) {
    console.error("❌ Update menu item error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update menu item.",
    });
  }
};

// ===================================================
// DELETE MENU ITEM
// DELETE /api/menu/:id
// Restaurant Owner only
// ===================================================

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const itemDoc = await db.collection("MenuItems").doc(id).get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    const item = itemDoc.data();

    // Verify ownership
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(item.restaurantId)
      .get();

    if (!restaurantDoc.exists || restaurantDoc.data().ownerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this menu item.",
      });
    }

    // Delete image from Cloudinary
    if (item.imageUrl) {
      await deleteImageByUrl(item.imageUrl);
    }

    // Delete from Firestore
    await db.collection("MenuItems").doc(id).delete();

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully!",
    });
  } catch (err) {
    console.error("❌ Delete menu item error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete menu item.",
    });
  }
};

// ===================================================
// TOGGLE ITEM AVAILABILITY
// PATCH /api/menu/:id/toggle
// Restaurant Owner only
// ===================================================

const toggleItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const itemDoc = await db.collection("MenuItems").doc(id).get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    const item = itemDoc.data();

    // Verify ownership
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(item.restaurantId)
      .get();

    if (!restaurantDoc.exists || restaurantDoc.data().ownerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this item.",
      });
    }

    const newAvailability = !item.isAvailable;

    await db.collection("MenuItems").doc(id).update({
      isAvailable: newAvailability,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Item is now ${newAvailability ? "available ✅" : "unavailable ❌"}`,
      data: { isAvailable: newAvailability },
    });
  } catch (err) {
    console.error("❌ Toggle item availability error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle item availability.",
    });
  }
};

// ===================================================
// BULK UPDATE AVAILABILITY
// PATCH /api/menu/bulk-toggle
// Restaurant Owner — toggle all items in a category
// ===================================================

const bulkToggleAvailability = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { restaurantId, category, isAvailable } = req.body;

    if (!restaurantId || isAvailable === undefined) {
      return res.status(400).json({
        success: false,
        message: "restaurantId and isAvailable are required.",
      });
    }

    // Verify ownership
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(restaurantId)
      .get();

    if (!restaurantDoc.exists || restaurantDoc.data().ownerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this restaurant's menu.",
      });
    }

    let query = db
      .collection("MenuItems")
      .where("restaurantId", "==", restaurantId);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No menu items found.",
      });
    }

    // Batch update
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isAvailable: isAvailable === "true" || isAvailable === true,
        updatedAt: new Date(),
      });
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: `Updated ${snapshot.size} items successfully!`,
      updatedCount: snapshot.size,
    });
  } catch (err) {
    console.error("❌ Bulk toggle availability error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk update menu items.",
    });
  }
};

module.exports = {
  getMenuByRestaurant,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  bulkToggleAvailability,
};
