// ===================================================
// DISHDROP — Firebase Client SDK
// client/src/services/firebase.js
// ===================================================

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// ===================================================
// FIREBASE CONFIGURATION
// ===================================================

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// ===================================================
// INITIALIZE FIREBASE
// ===================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================================================
// AUTH HELPERS
// ===================================================

// Sign in with email and password
const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (err) {
    return { success: false, message: getAuthErrorMessage(err.code) };
  }
};

// Sign in with custom token (after registration)
const loginWithCustomToken = async (customToken) => {
  try {
    const userCredential = await signInWithCustomToken(auth, customToken);
    return { success: true, user: userCredential.user };
  } catch (err) {
    return { success: false, message: getAuthErrorMessage(err.code) };
  }
};

// Sign out
const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// Send password reset email
const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    return { success: false, message: getAuthErrorMessage(err.code) };
  }
};

// Get current user's ID token for API calls
const getIdToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken(true); // Force refresh
    return token;
  } catch (err) {
    console.error("❌ Get ID token error:", err.message);
    return null;
  }
};

// ===================================================
// FIRESTORE HELPERS
// ===================================================

// Get user profile from Firestore
const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "Users", uid));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  } catch (err) {
    console.error("❌ Get user profile error:", err.message);
    return null;
  }
};

// Listen to real-time order updates
const listenToOrder = (orderId, callback) => {
  const orderRef = doc(db, "Orders", orderId);
  return onSnapshot(orderRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  });
};

// Listen to real-time notifications
const listenToNotifications = (userId, callback) => {
  const q = query(
    collection(db, "Notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(notifications);
  });
};

// ===================================================
// AUTH ERROR MESSAGES
// Human-friendly Firebase error messages
// ===================================================

const getAuthErrorMessage = (code) => {
  const messages = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/invalid-custom-token": "Invalid authentication token.",
  };

  return messages[code] || "Authentication failed. Please try again.";
};

// ===================================================
// EXPORTS
// ===================================================

export {
  app,
  auth,
  db,
  // Auth helpers
  loginWithEmail,
  loginWithCustomToken,
  logout,
  resetPassword,
  getIdToken,
  onAuthStateChanged,
  // Firestore helpers
  getUserProfile,
  listenToOrder,
  listenToNotifications,
  serverTimestamp,
  // Firestore methods (re-exported for use in components)
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
};

export default app;