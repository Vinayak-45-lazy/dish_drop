// ===================================================
// DISHDROP — Upload Middleware (Cloudinary + Multer)
// server/middleware/uploadMiddleware.js
// ===================================================

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

// ===================================================
// CLOUDINARY CONFIGURATION
// ===================================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===================================================
// FILE FILTER
// Only allow image files
// ===================================================

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed."),
      false
    );
  }
};

// ===================================================
// STORAGE — Restaurant Cover Images
// Folder: dishdrop/restaurants
// ===================================================

const restaurantStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dishdrop/restaurants",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 800,
        height: 500,
        crop: "fill",
        gravity: "auto",
        quality: "auto:good",
      },
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const name = file.originalname.split(".")[0].replace(/\s+/g, "-");
      return `restaurant-${name}-${timestamp}`;
    },
  },
});

// ===================================================
// STORAGE — Menu Item Images
// Folder: dishdrop/menu
// ===================================================

const menuStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dishdrop/menu",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 600,
        height: 600,
        crop: "fill",
        gravity: "auto",
        quality: "auto:good",
      },
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const name = file.originalname.split(".")[0].replace(/\s+/g, "-");
      return `menu-${name}-${timestamp}`;
    },
  },
});

// ===================================================
// STORAGE — User Profile Photos
// Folder: dishdrop/profiles
// ===================================================

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dishdrop/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 300,
        height: 300,
        crop: "fill",
        gravity: "face",
        quality: "auto:good",
      },
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const uid = req.user?.uid || "unknown";
      return `profile-${uid}-${timestamp}`;
    },
  },
});

// ===================================================
// MULTER UPLOAD INSTANCES
// ===================================================

// Restaurant cover image upload (single file)
const uploadRestaurantImage = multer({
  storage: restaurantStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single("coverImage");

// Menu item image upload (single file)
const uploadMenuImage = multer({
  storage: menuStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single("itemImage");

// Profile photo upload (single file)
const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB max
  },
}).single("profilePhoto");

// ===================================================
// WRAPPED MIDDLEWARE WITH ERROR HANDLING
// Wraps multer to properly pass errors to Express
// ===================================================

const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum allowed size is 5MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed.",
      });
    }

    next();
  });
};

// ===================================================
// EXPORTS
// ===================================================

module.exports = {
  uploadRestaurantImage: handleUpload(uploadRestaurantImage),
  uploadMenuImage: handleUpload(uploadMenuImage),
  uploadProfilePhoto: handleUpload(uploadProfilePhoto),
  cloudinary,
};