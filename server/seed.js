// ===================================================
// DISHDROP — Database Seeder
// server/seed.js
// Run with: node seed.js
// ===================================================

require("dotenv").config();
const { db, auth } = require("./firebase");
const { randomUUID: uuidv4 } = require("crypto");

console.log("🌱 DishDrop Database Seeder Starting...");

// ===================================================
// SAMPLE DATA
// ===================================================

const sampleUsers = [
  {
    email: "customer@dishdrop.com",
    password: "Test@123",
    name: "Arjun Kumar",
    phone: "9876543210",
    role: "customer",
  },
  {
    email: "owner@dishdrop.com",
    password: "Test@123",
    name: "Priya Sharma",
    phone: "9876543211",
    role: "restaurant_owner",
  },
  {
    email: "agent@dishdrop.com",
    password: "Test@123",
    name: "Ravi Delivery",
    phone: "9876543212",
    role: "delivery_agent",
    vehicleType: "bike",
    vehicleNumber: "KA01AB1234",
  },
  {
    email: "admin@dishdrop.com",
    password: "Test@123",
    name: "DishDrop Admin",
    phone: "9876543213",
    role: "admin",
  },
];

const sampleRestaurants = [
  {
    name: "Spice Garden",
    description:
      "Authentic North Indian cuisine with rich gravies and tandoor specialties.",
    cuisineTypes: ["north indian", "biryani", "tandoor"],
    address: "12, MG Road, Bangalore, Karnataka 560001",
    lat: 12.9716,
    lng: 77.5946,
    phone: "9876500001",
    openingTime: "10:00",
    closingTime: "23:00",
    avgDeliveryMinutes: 30,
    minimumOrderAmount: 150,
    deliveryFee: 30,
    coverImageUrl:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
  },
  {
    name: "Burger Barn",
    description:
      "Juicy gourmet burgers, crispy fries, and thick milkshakes.",
    cuisineTypes: ["burger", "american", "fast food"],
    address: "45, Koramangala, Bangalore, Karnataka 560034",
    lat: 12.9352,
    lng: 77.6245,
    phone: "9876500002",
    openingTime: "11:00",
    closingTime: "23:30",
    avgDeliveryMinutes: 25,
    minimumOrderAmount: 199,
    deliveryFee: 25,
    coverImageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  },
  {
    name: "Pizza Paradise",
    description:
      "Wood-fired pizzas with fresh toppings and house-made sauces.",
    cuisineTypes: ["pizza", "italian", "pasta"],
    address: "78, Indiranagar, Bangalore, Karnataka 560038",
    lat: 12.9784,
    lng: 77.6408,
    phone: "9876500003",
    openingTime: "11:30",
    closingTime: "23:00",
    avgDeliveryMinutes: 35,
    minimumOrderAmount: 249,
    deliveryFee: 40,
    coverImageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  },
  {
    name: "Biryani House",
    description:
      "Legendary dum biryani cooked slow with aromatic spices.",
    cuisineTypes: ["biryani", "south indian", "mughlai"],
    address: "23, Frazer Town, Bangalore, Karnataka 560005",
    lat: 12.9869,
    lng: 77.6101,
    phone: "9876500004",
    openingTime: "12:00",
    closingTime: "22:30",
    avgDeliveryMinutes: 40,
    minimumOrderAmount: 199,
    deliveryFee: 35,
    coverImageUrl:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
  },
  {
    name: "Healthy Bites",
    description:
      "Clean eating made delicious — salads, bowls, and smoothies.",
    cuisineTypes: ["healthy", "salads", "vegan"],
    address: "56, HSR Layout, Bangalore, Karnataka 560102",
    lat: 12.9116,
    lng: 77.6389,
    phone: "9876500005",
    openingTime: "08:00",
    closingTime: "21:00",
    avgDeliveryMinutes: 20,
    minimumOrderAmount: 199,
    deliveryFee: 20,
    coverImageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
  },
];

const sampleMenuItems = {
  "Spice Garden": [
    {
      name: "Butter Chicken",
      description: "Tender chicken in creamy tomato-butter gravy",
      price: 280,
      discountedPrice: 249,
      category: "Main Course",
      isVeg: false,
      spiceLevel: "medium",
      tags: ["chicken", "curry", "popular", "north indian"],
      imageUrl:
        "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600",
    },
    {
      name: "Paneer Tikka Masala",
      description: "Grilled cottage cheese in spiced masala gravy",
      price: 260,
      discountedPrice: 229,
      category: "Main Course",
      isVeg: true,
      spiceLevel: "medium",
      tags: ["paneer", "vegetarian", "curry"],
      imageUrl:
        "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600",
    },
    {
      name: "Garlic Naan",
      description: "Soft leavened bread with garlic and butter",
      price: 60,
      discountedPrice: 60,
      category: "Breads",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["bread", "naan", "tandoor"],
      imageUrl:
        "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600",
    },
    {
      name: "Dal Makhani",
      description: "Slow-cooked black lentils in buttery tomato sauce",
      price: 220,
      discountedPrice: 199,
      category: "Main Course",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["dal", "lentils", "vegetarian", "popular"],
      imageUrl:
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
    },
    {
      name: "Chicken Biryani",
      description: "Fragrant basmati rice with spiced chicken",
      price: 320,
      discountedPrice: 289,
      category: "Rice & Biryani",
      isVeg: false,
      spiceLevel: "hot",
      tags: ["biryani", "rice", "chicken", "popular"],
      imageUrl:
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600",
    },
    {
      name: "Gulab Jamun",
      description: "Soft milk-solid balls soaked in rose sugar syrup",
      price: 80,
      discountedPrice: 80,
      category: "Desserts",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["dessert", "sweet", "indian"],
      imageUrl:
        "https://images.unsplash.com/photo-1666256366208-80f5d4bb0c21?w=600",
    },
  ],
  "Burger Barn": [
    {
      name: "Classic Smash Burger",
      description: "Double smash patty with cheddar, lettuce, and special sauce",
      price: 299,
      discountedPrice: 269,
      category: "Burgers",
      isVeg: false,
      spiceLevel: "mild",
      tags: ["burger", "beef", "popular", "classic"],
      imageUrl:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
    },
    {
      name: "Crispy Chicken Burger",
      description: "Fried chicken fillet with coleslaw and sriracha mayo",
      price: 259,
      discountedPrice: 239,
      category: "Burgers",
      isVeg: false,
      spiceLevel: "medium",
      tags: ["burger", "chicken", "crispy"],
      imageUrl:
        "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600",
    },
    {
      name: "Veggie Burger",
      description: "Grilled veggie patty with fresh veggies and chipotle sauce",
      price: 219,
      discountedPrice: 199,
      category: "Burgers",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["burger", "vegetarian", "healthy"],
      imageUrl:
        "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600",
    },
    {
      name: "Loaded Fries",
      description: "Crispy fries topped with cheese sauce and jalapeños",
      price: 149,
      discountedPrice: 129,
      category: "Sides",
      isVeg: true,
      spiceLevel: "hot",
      tags: ["fries", "sides", "cheesy", "popular"],
      imageUrl:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600",
    },
    {
      name: "Chocolate Milkshake",
      description: "Thick and creamy chocolate milkshake",
      price: 149,
      discountedPrice: 149,
      category: "Beverages",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["milkshake", "chocolate", "drinks", "cold"],
      imageUrl:
        "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600",
    },
  ],
  "Pizza Paradise": [
    {
      name: "Margherita Pizza",
      description: "Classic tomato sauce, fresh mozzarella, basil",
      price: 299,
      discountedPrice: 269,
      category: "Pizzas",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["pizza", "vegetarian", "classic", "italian"],
      imageUrl:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
    },
    {
      name: "Pepperoni Pizza",
      description: "Loaded with spicy pepperoni and mozzarella",
      price: 349,
      discountedPrice: 319,
      category: "Pizzas",
      isVeg: false,
      spiceLevel: "medium",
      tags: ["pizza", "pepperoni", "popular", "spicy"],
      imageUrl:
        "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600",
    },
    {
      name: "BBQ Chicken Pizza",
      description: "Smoky BBQ sauce, grilled chicken, red onions",
      price: 369,
      discountedPrice: 339,
      category: "Pizzas",
      isVeg: false,
      spiceLevel: "mild",
      tags: ["pizza", "chicken", "bbq", "popular"],
      imageUrl:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
    },
    {
      name: "Pasta Arrabiata",
      description: "Penne in spicy tomato sauce with garlic and chilli",
      price: 249,
      discountedPrice: 229,
      category: "Pasta",
      isVeg: true,
      spiceLevel: "hot",
      tags: ["pasta", "italian", "spicy", "vegetarian"],
      imageUrl:
        "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600",
    },
    {
      name: "Garlic Bread",
      description: "Toasted ciabatta with garlic butter and herbs",
      price: 129,
      discountedPrice: 109,
      category: "Sides",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["bread", "garlic", "sides", "italian"],
      imageUrl:
        "https://images.unsplash.com/photo-1619985632461-f33748ef4b07?w=600",
    },
  ],
  "Biryani House": [
    {
      name: "Hyderabadi Chicken Biryani",
      description: "Slow-cooked dum biryani with tender chicken pieces",
      price: 349,
      discountedPrice: 319,
      category: "Biryani",
      isVeg: false,
      spiceLevel: "hot",
      tags: ["biryani", "chicken", "hyderabadi", "popular"],
      imageUrl:
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600",
    },
    {
      name: "Mutton Biryani",
      description: "Rich mutton biryani with caramelized onions",
      price: 399,
      discountedPrice: 369,
      category: "Biryani",
      isVeg: false,
      spiceLevel: "hot",
      tags: ["biryani", "mutton", "rich", "premium"],
      imageUrl:
        "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600",
    },
    {
      name: "Veg Biryani",
      description: "Fragrant basmati with seasonal vegetables and saffron",
      price: 249,
      discountedPrice: 229,
      category: "Biryani",
      isVeg: true,
      spiceLevel: "medium",
      tags: ["biryani", "vegetarian", "saffron"],
      imageUrl:
        "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600",
    },
    {
      name: "Raita",
      description: "Cool yogurt with cucumber, tomato, and mint",
      price: 60,
      discountedPrice: 60,
      category: "Sides",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["raita", "yogurt", "sides", "cooling"],
      imageUrl:
        "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600",
    },
    {
      name: "Haleem",
      description: "Slow-cooked mutton and wheat stew — a classic",
      price: 299,
      discountedPrice: 279,
      category: "Starters",
      isVeg: false,
      spiceLevel: "medium",
      tags: ["haleem", "mutton", "stew", "traditional"],
      imageUrl:
        "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=600",
    },
  ],
  "Healthy Bites": [
    {
      name: "Quinoa Power Bowl",
      description: "Quinoa, roasted veggies, avocado, and tahini dressing",
      price: 299,
      discountedPrice: 279,
      category: "Bowls",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["healthy", "quinoa", "vegan", "bowl", "popular"],
      imageUrl:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    },
    {
      name: "Caesar Salad",
      description: "Romaine lettuce, parmesan, croutons, Caesar dressing",
      price: 249,
      discountedPrice: 229,
      category: "Salads",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["salad", "healthy", "caesar", "vegetarian"],
      imageUrl:
        "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600",
    },
    {
      name: "Grilled Chicken Wrap",
      description: "Grilled chicken, lettuce, tomato in whole wheat wrap",
      price: 269,
      discountedPrice: 249,
      category: "Wraps",
      isVeg: false,
      spiceLevel: "mild",
      tags: ["wrap", "chicken", "healthy", "grilled"],
      imageUrl:
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600",
    },
    {
      name: "Green Detox Smoothie",
      description: "Spinach, apple, ginger, cucumber, lemon",
      price: 179,
      discountedPrice: 159,
      category: "Beverages",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["smoothie", "detox", "healthy", "green", "vegan"],
      imageUrl:
        "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600",
    },
    {
      name: "Acai Berry Bowl",
      description: "Frozen acai blend topped with granola and fresh fruits",
      price: 329,
      discountedPrice: 299,
      category: "Bowls",
      isVeg: true,
      spiceLevel: "mild",
      tags: ["acai", "bowl", "vegan", "healthy", "breakfast"],
      imageUrl:
        "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600",
    },
  ],
};

const sampleCoupons = [
  {
    code: "WELCOME50",
    discountType: "flat",
    discountValue: 50,
    minOrderAmount: 199,
    maxDiscountAmount: null,
    usageLimit: 1000,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  {
    code: "SAVE20",
    discountType: "percent",
    discountValue: 20,
    minOrderAmount: 299,
    maxDiscountAmount: 100,
    usageLimit: 500,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
  },
  {
    code: "FLAT100",
    discountType: "flat",
    discountValue: 100,
    minOrderAmount: 499,
    maxDiscountAmount: null,
    usageLimit: 200,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
];

// ===================================================
// SEED FUNCTIONS
// ===================================================

const seedUsers = async () => {
  console.log("\n👤 Seeding users...");
  const createdUsers = [];

  for (const user of sampleUsers) {
    try {
      // Create Firebase Auth user
      let firebaseUser;
      try {
        firebaseUser = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.name,
        });
      } catch (err) {
        if (err.code === "auth/email-already-exists") {
          firebaseUser = await auth.getUserByEmail(user.email);
          console.log(`  ⚠️  User exists, using existing: ${user.email}`);
        } else {
          throw err;
        }
      }

      const uid = firebaseUser.uid;
      const userId = uuidv4();
      const now = new Date();

      const userProfile = {
        userId,
        uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhotoUrl: "",
        addresses:
          user.role === "customer"
            ? [
                {
                  id: uuidv4(),
                  label: "Home",
                  fullAddress: "123, HSR Layout, Bangalore, Karnataka 560102",
                  lat: 12.9116,
                  lng: 77.6389,
                },
              ]
            : [],
        defaultAddressIndex: 0,
        createdAt: now,
      };

      await db.collection("Users").doc(uid).set(userProfile);
      createdUsers.push({ ...userProfile, password: user.password });

      // Create agent profile if delivery agent
      if (user.role === "delivery_agent") {
        const agentId = uuidv4();
        await db.collection("DeliveryAgentProfiles").doc(agentId).set({
          agentId,
          userId: uid,
          name: user.name,
          phone: user.phone,
          vehicleType: user.vehicleType || "bike",
          vehicleNumber: user.vehicleNumber || "KA01XX0000",
          isAvailable: true,
          currentLat: 12.9352,
          currentLng: 77.6245,
          totalDeliveries: 45,
          avgRating: 4.5,
          totalRatings: 38,
          totalEarnings: 5400,
          lateDeliveries: 2,
          flagStatus: "none",
          flagScore: 0,
          lastActiveAt: now,
          createdAt: now,
        });
        console.log(`  ✅ Agent profile created: ${user.name}`);
      }

      console.log(`  ✅ User created: ${user.email} (${user.role})`);
    } catch (err) {
      console.error(`  ❌ Failed to create user ${user.email}:`, err.message);
    }
  }

  return createdUsers;
};

const seedRestaurants = async (ownerUid) => {
  console.log("\n🍽️  Seeding restaurants...");
  const createdRestaurants = [];

  for (const restaurant of sampleRestaurants) {
    try {
      const restaurantId = uuidv4();
      const now = new Date();

      const restaurantData = {
        restaurantId,
        ownerId: ownerUid,
        ownerName: "Priya Sharma",
        name: restaurant.name,
        description: restaurant.description,
        cuisineTypes: restaurant.cuisineTypes,
        coverImageUrl: restaurant.coverImageUrl,
        address: restaurant.address,
        lat: restaurant.lat,
        lng: restaurant.lng,
        phone: restaurant.phone,
        openingTime: restaurant.openingTime,
        closingTime: restaurant.closingTime,
        isOpen: true,
        isApproved: true,
        avgRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        totalRatings: Math.floor(Math.random() * 200) + 50,
        totalOrders: Math.floor(Math.random() * 500) + 100,
        avgDeliveryMinutes: restaurant.avgDeliveryMinutes,
        minimumOrderAmount: restaurant.minimumOrderAmount,
        deliveryFee: restaurant.deliveryFee,
        flagStatus: "none",
        flagScore: 0,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection("Restaurants")
        .doc(restaurantId)
        .set(restaurantData);

      createdRestaurants.push(restaurantData);
      console.log(`  ✅ Restaurant created: ${restaurant.name}`);
    } catch (err) {
      console.error(
        `  ❌ Failed to create restaurant ${restaurant.name}:`,
        err.message
      );
    }
  }

  return createdRestaurants;
};

const seedMenuItems = async (restaurants) => {
  console.log("\n🍕 Seeding menu items...");
  let totalItems = 0;

  for (const restaurant of restaurants) {
    const items = sampleMenuItems[restaurant.name];
    if (!items) continue;

    for (const item of items) {
      try {
        const itemId = uuidv4();
        const now = new Date();

        await db.collection("MenuItems").doc(itemId).set({
          itemId,
          restaurantId: restaurant.restaurantId,
          name: item.name,
          description: item.description,
          price: item.price,
          discountedPrice: item.discountedPrice,
          category: item.category,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          isAvailable: true,
          spiceLevel: item.spiceLevel,
          tags: item.tags,
          avgRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          totalOrders: Math.floor(Math.random() * 300) + 20,
          createdAt: now,
          updatedAt: now,
        });

        totalItems++;
      } catch (err) {
        console.error(`  ❌ Failed to create item ${item.name}:`, err.message);
      }
    }

    console.log(
      `  ✅ Menu items added for: ${restaurant.name} (${items.length} items)`
    );
  }

  console.log(`  📊 Total menu items created: ${totalItems}`);
};

const seedCoupons = async (adminUid) => {
  console.log("\n🎟️  Seeding coupons...");

  for (const coupon of sampleCoupons) {
    try {
      const couponId = uuidv4();

      await db.collection("Coupons").doc(couponId).set({
        couponId,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        usageLimit: coupon.usageLimit,
        usedCount: 0,
        expiresAt: coupon.expiresAt,
        isActive: true,
        createdBy: adminUid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`  ✅ Coupon created: ${coupon.code}`);
    } catch (err) {
      console.error(
        `  ❌ Failed to create coupon ${coupon.code}:`,
        err.message
      );
    }
  }
};

// ===================================================
// MAIN SEED FUNCTION
// ===================================================

const seed = async () => {
  try {
    console.log("🔥 Connecting to Firebase...");

    // Step 1: Seed users
    const createdUsers = await seedUsers();

    // Get owner and admin UIDs
    const ownerUser = await auth.getUserByEmail("owner@dishdrop.com");
    const adminUser = await auth.getUserByEmail("admin@dishdrop.com");

    // Step 2: Seed restaurants
    const createdRestaurants = await seedRestaurants(ownerUser.uid);

    // Step 3: Seed menu items
    await seedMenuItems(createdRestaurants);

    // Step 4: Seed coupons
    await seedCoupons(adminUser.uid);

    // ===================================================
    // SUMMARY
    // ===================================================

    console.log("\n🎉 ================================");
    console.log("✅ DishDrop Database Seeded Successfully!");
    console.log("🎉 ================================\n");

    console.log("📋 TEST ACCOUNTS:");
    console.log("─────────────────────────────────────");
    console.log("👤 Customer:  customer@dishdrop.com / Test@123");
    console.log("🍽️  Owner:     owner@dishdrop.com / Test@123");
    console.log("🛵 Agent:     agent@dishdrop.com / Test@123");
    console.log("👑 Admin:     admin@dishdrop.com / Test@123");
    console.log("─────────────────────────────────────");
    console.log("\n🎟️  COUPON CODES:");
    console.log("─────────────────────────────────────");
    console.log("WELCOME50 — ₹50 off on orders above ₹199");
    console.log("SAVE20    — 20% off (max ₹100) on orders above ₹299");
    console.log("FLAT100   — ₹100 off on orders above ₹499");
    console.log("─────────────────────────────────────");
    console.log("\n💳 RAZORPAY TEST CARD:");
    console.log("─────────────────────────────────────");
    console.log("Card: 4111 1111 1111 1111");
    console.log("Date: Any future date");
    console.log("CVV:  Any 3 digits");
    console.log("─────────────────────────────────────\n");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeding failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

// Run seeder
seed();