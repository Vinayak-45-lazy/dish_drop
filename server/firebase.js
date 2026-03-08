// ===================================================
// DISHDROP — Firebase Admin SDK Initialization
// server/firebase.js
// ===================================================

const admin = require("firebase-admin");
require("dotenv").config();

// Parse the private key properly
// (Render/Vercel sometimes escapes \n in env vars)
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

// Firestore instance
const db = admin.firestore();

// Firestore settings
db.settings({
  ignoreUndefinedProperties: true, // Prevents errors on undefined fields
});

// Auth instance
const auth = admin.auth();

module.exports = { admin, db, auth };