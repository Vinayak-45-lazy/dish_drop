// ===================================================
// DISHDROP — Cloudinary Service
// server/services/cloudinaryService.js
// ===================================================

const cloudinary = require("cloudinary").v2;
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
// DELETE IMAGE BY URL
// Extracts public_id from Cloudinary URL and deletes
// Used when replacing or removing images
// ===================================================

const deleteImageByUrl = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
      return { success: false, message: "Not a Cloudinary URL" };
    }

    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/public_id.ext
    const urlParts = imageUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) {
      return { success: false, message: "Invalid Cloudinary URL format" };
    }

    // Get everything after 'upload/v{version}/'
    const afterUpload = urlParts.slice(uploadIndex + 2).join("/");

    // Remove file extension
    const publicId = afterUpload.replace(/\.[^/.]+$/, "");

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      return { success: true, message: "Image deleted successfully" };
    } else {
      return { success: false, message: "Image not found or already deleted" };
    }
  } catch (err) {
    console.error("❌ Cloudinary delete error:", err.message);
    return { success: false, message: err.message };
  }
};

// ===================================================
// DELETE IMAGE BY PUBLIC ID
// Directly deletes using known public_id
// ===================================================

const deleteImageByPublicId = async (publicId) => {
  try {
    if (!publicId) {
      return { success: false, message: "No public_id provided" };
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      return { success: true, message: "Image deleted successfully" };
    } else {
      return { success: false, message: "Image not found or already deleted" };
    }
  } catch (err) {
    console.error("❌ Cloudinary delete error:", err.message);
    return { success: false, message: err.message };
  }
};

// ===================================================
// GET OPTIMIZED IMAGE URL
// Returns a transformed Cloudinary URL on the fly
// ===================================================

const getOptimizedUrl = (imageUrl, options = {}) => {
  try {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
      return imageUrl;
    }

    const {
      width = 800,
      height = 600,
      crop = "fill",
      quality = "auto:good",
      format = "auto",
    } = options;

    // Insert transformation into existing Cloudinary URL
    const transformation = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
    const optimized = imageUrl.replace("/upload/", `/upload/${transformation}/`);

    return optimized;
  } catch (err) {
    console.error("❌ Cloudinary URL optimization error:", err.message);
    return imageUrl;
  }
};

// ===================================================
// UPLOAD BASE64 IMAGE
// For cases where we need to upload programmatically
// (not via multer middleware)
// ===================================================

const uploadBase64Image = async (base64String, folder = "dishdrop/misc") => {
  try {
    if (!base64String) {
      throw new Error("No image data provided");
    }

    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        {
          quality: "auto:good",
          fetch_format: "auto",
        },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.error("❌ Cloudinary base64 upload error:", err.message);
    return {
      success: false,
      url: null,
      publicId: null,
      message: err.message,
    };
  }
};

// ===================================================
// GET CLOUDINARY USAGE STATS
// Useful for admin dashboard monitoring
// ===================================================

const getUsageStats = async () => {
  try {
    const result = await cloudinary.api.usage();
    return {
      success: true,
      credits: result.credits,
      storage: result.storage,
      bandwidth: result.bandwidth,
      requests: result.requests,
      transformations: result.transformations,
    };
  } catch (err) {
    console.error("❌ Cloudinary usage stats error:", err.message);
    return { success: false, message: err.message };
  }
};

module.exports = {
  deleteImageByUrl,
  deleteImageByPublicId,
  getOptimizedUrl,
  uploadBase64Image,
  getUsageStats,
  cloudinary,
};
