// ===================================================
// DISHDROP — Role Middleware
// server/middleware/roleMiddleware.js
// ===================================================

// ===================================================
// REQUIRE ROLE
// Factory function — returns middleware that checks
// if req.user has one of the allowed roles
// Usage: requireRole("admin")
//        requireRole("customer", "admin")
// ===================================================

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // verifyToken must run before this middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is restricted to: ${allowedRoles.join(", ")}.`,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

// ===================================================
// ROLE SHORTCUTS
// Pre-built middleware for common role checks
// ===================================================

// Only customers
const isCustomer = requireRole("customer");

// Only restaurant owners
const isOwner = requireRole("restaurant_owner");

// Only delivery agents
const isAgent = requireRole("delivery_agent");

// Only admins
const isAdmin = requireRole("admin");

// Customers or admins
const isCustomerOrAdmin = requireRole("customer", "admin");

// Restaurant owners or admins
const isOwnerOrAdmin = requireRole("restaurant_owner", "admin");

// Delivery agents or admins
const isAgentOrAdmin = requireRole("delivery_agent", "admin");

// Any authenticated user (all roles allowed)
const isAnyRole = requireRole(
  "customer",
  "restaurant_owner",
  "delivery_agent",
  "admin"
);

module.exports = {
  requireRole,
  isCustomer,
  isOwner,
  isAgent,
  isAdmin,
  isCustomerOrAdmin,
  isOwnerOrAdmin,
  isAgentOrAdmin,
  isAnyRole,
};