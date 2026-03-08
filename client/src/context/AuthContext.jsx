// ===================================================
// DISHDROP — Auth Context
// client/src/context/AuthContext.jsx
// ===================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  auth,
  onAuthStateChanged,
  loginWithEmail,
  loginWithCustomToken,
  logout,
  resetPassword,
  getUserProfile,
} from "../services/firebase";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

// ===================================================
// CREATE CONTEXT
// ===================================================

const AuthContext = createContext(null);

// ===================================================
// AUTH PROVIDER
// ===================================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // -----------------------------------------------
  // FETCH USER PROFILE FROM FIRESTORE
  // -----------------------------------------------
  const fetchUserProfile = useCallback(async (uid) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error("❌ Fetch user profile error:", err.message);
      return null;
    }
  }, []);

  // -----------------------------------------------
  // LISTEN TO AUTH STATE CHANGES
  // -----------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // -----------------------------------------------
  // REGISTER
  // -----------------------------------------------
  const register = async (formData) => {
    try {
      setLoading(true);

      // Call backend to create user
      const response = await authAPI.register(formData);
      const { customToken, name, role } = response.data.data;

      // Sign in with custom token immediately
      const loginResult = await loginWithCustomToken(customToken);

      if (!loginResult.success) {
        toast.error(loginResult.message);
        return { success: false };
      }

      // Fetch profile
      await fetchUserProfile(loginResult.user.uid);

      toast.success(`Welcome to DishDrop, ${name}! 🎉`);
      return { success: true, role };
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------
  // LOGIN
  // -----------------------------------------------
  const login = async (email, password) => {
    try {
      setLoading(true);

      const result = await loginWithEmail(email, password);

      if (!result.success) {
        toast.error(result.message);
        return { success: false };
      }

      const profile = await fetchUserProfile(result.user.uid);

      toast.success(`Welcome back, ${profile?.name?.split(" ")[0]}! 👋`);
      return { success: true, role: profile?.role };
    } catch (err) {
      const message = err.message || "Login failed. Please try again.";
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------
  // LOGOUT
  // -----------------------------------------------
  const logoutUser = async () => {
    try {
      await logout();
      setUser(null);
      setUserProfile(null);
      toast.success("Logged out successfully.");
      return { success: true };
    } catch (err) {
      toast.error("Logout failed. Please try again.");
      return { success: false };
    }
  };

  // -----------------------------------------------
  // FORGOT PASSWORD
  // -----------------------------------------------
  const forgotPassword = async (email) => {
    try {
      const result = await resetPassword(email);
      if (result.success) {
        toast.success("Password reset email sent! Check your inbox.");
        return { success: true };
      } else {
        toast.error(result.message);
        return { success: false };
      }
    } catch (err) {
      toast.error("Failed to send reset email.");
      return { success: false };
    }
  };

  // -----------------------------------------------
  // UPDATE USER PROFILE IN CONTEXT
  // Called after profile update API call
  // -----------------------------------------------
  const refreshProfile = async () => {
    if (user?.uid) {
      const profile = await fetchUserProfile(user.uid);
      return profile;
    }
    return null;
  };

  // -----------------------------------------------
  // ROLE CHECKS
  // -----------------------------------------------
  const isCustomer = userProfile?.role === "customer";
  const isOwner = userProfile?.role === "restaurant_owner";
  const isAgent = userProfile?.role === "delivery_agent";
  const isAdmin = userProfile?.role === "admin";
  const isLoggedIn = !!user && !!userProfile;

  // -----------------------------------------------
  // CONTEXT VALUE
  // -----------------------------------------------
  const value = {
    // State
    user,
    userProfile,
    loading,
    authReady,
    isLoggedIn,

    // Role checks
    isCustomer,
    isOwner,
    isAgent,
    isAdmin,

    // Actions
    register,
    login,
    logout: logoutUser,
    forgotPassword,
    refreshProfile,
    fetchUserProfile,
  };

  // Don't render children until auth state is determined
  if (!authReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl font-black text-orange-500 mb-2">
            🍽️ DishDrop
          </div>
          <div className="text-gray-400 text-sm mb-6">
            Fresh. Fast. Delivered.
          </div>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===================================================
// CUSTOM HOOK
// ===================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;