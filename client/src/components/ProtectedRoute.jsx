// ===================================================
// DISHDROP — Protected Route Component
// client/src/components/ProtectedRoute.jsx
// ===================================================

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ===================================================
// PROTECTED ROUTE
// Redirects to login if not authenticated
// Redirects to correct dashboard if wrong role
// ===================================================

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isLoggedIn, userProfile, loading } = useAuth();
  const location = useLocation();

  // Still initializing auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500
            border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role if allowedRoles specified
  if (allowedRoles.length > 0 && userProfile?.role) {
    const hasAccess = allowedRoles.includes(userProfile.role);

    if (!hasAccess) {
      // Redirect to correct dashboard based on role
      const roleDashboards = {
        customer: "/",
        restaurant_owner: "/owner/dashboard",
        delivery_agent: "/agent/dashboard",
        admin: "/admin/dashboard",
      };

      const redirectTo = roleDashboards[userProfile.role] || "/";

      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};

// ===================================================
// GUEST ROUTE
// Redirects logged-in users away from auth pages
// ===================================================

export const GuestRoute = ({ children }) => {
  const { isLoggedIn, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-orange-500
          border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Already logged in — redirect to correct dashboard
  if (isLoggedIn && userProfile) {
    const roleDashboards = {
      customer: "/",
      restaurant_owner: "/owner/dashboard",
      delivery_agent: "/agent/dashboard",
      admin: "/admin/dashboard",
    };

    const redirectTo = roleDashboards[userProfile.role] || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;