// ===================================================
// DISHDROP — Navbar Component
// client/src/components/Navbar.jsx
// ===================================================

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiHome,
  FiList,
  FiPackage,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import {
  MdRestaurant,
  MdDeliveryDining,
  MdAdminPanelSettings,
} from "react-icons/md";
import { BsFire } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import NotificationBell from "./NotificationBell";
import CartDrawer from "./CartDrawer";

const Navbar = () => {
  const { userProfile, isLoggedIn, isCustomer, isOwner, isAgent, isAdmin, logout } =
    useAuth();
  const { totalItems, toggleCart, isCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileMenuRef = useRef(null);

  // -----------------------------------------------
  // SCROLL DETECTION
  // -----------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -----------------------------------------------
  // CLOSE PROFILE MENU ON OUTSIDE CLICK
  // -----------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // -----------------------------------------------
  // HANDLE LOGOUT
  // -----------------------------------------------
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // -----------------------------------------------
  // GET DASHBOARD LINK BASED ON ROLE
  // -----------------------------------------------
  const getDashboardLink = () => {
    if (isOwner) return "/owner/dashboard";
    if (isAgent) return "/agent/dashboard";
    if (isAdmin) return "/admin/dashboard";
    return "/profile";
  };

  // -----------------------------------------------
  // NAV LINKS BY ROLE
  // -----------------------------------------------
  const getNavLinks = () => {
    if (isOwner) {
      return [
        { to: "/owner/dashboard", label: "Dashboard", icon: <FiBarChart2 /> },
        { to: "/owner/menu", label: "Menu", icon: <MdRestaurant /> },
        { to: "/owner/orders", label: "Orders", icon: <FiPackage /> },
        { to: "/owner/analytics", label: "Analytics", icon: <FiBarChart2 /> },
      ];
    }
    if (isAgent) {
      return [
        { to: "/agent/dashboard", label: "Dashboard", icon: <FiHome /> },
        { to: "/agent/orders", label: "Orders", icon: <FiPackage /> },
      ];
    }
    if (isAdmin) {
      return [
        { to: "/admin/dashboard", label: "Dashboard", icon: <FiBarChart2 /> },
        { to: "/admin/restaurants", label: "Restaurants", icon: <MdRestaurant /> },
        { to: "/admin/orders", label: "Orders", icon: <FiPackage /> },
        { to: "/admin/agents", label: "Agents", icon: <MdDeliveryDining /> },
        { to: "/admin/coupons", label: "Coupons", icon: <FiSettings /> },
      ];
    }
    // Customer
    return [
      { to: "/", label: "Home", icon: <FiHome /> },
      { to: "/restaurants", label: "Restaurants", icon: <MdRestaurant /> },
      { to: "/orders", label: "Orders", icon: <FiPackage /> },
      { to: "/recommendations", label: "For You", icon: <BsFire /> },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white shadow-md"
            : "bg-white shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ---- LOGO ---- */}
            <Link
              to={isLoggedIn ? (isCustomer ? "/" : getDashboardLink()) : "/"}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center
                justify-center text-white text-lg font-black shadow-md">
                🍽️
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-black text-orange-500 tracking-tight">
                  Dish
                </span>
                <span className="text-xl font-black text-gray-800 tracking-tight">
                  Drop
                </span>
              </div>
            </Link>

            {/* ---- DESKTOP NAV LINKS ---- */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                    font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? "bg-orange-50 text-orange-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ---- RIGHT SECTION ---- */}
            <div className="flex items-center gap-2">

              {/* Notification Bell */}
              {isLoggedIn && <NotificationBell />}

              {/* Cart Button (customers only) */}
              {isCustomer && (
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-xl bg-orange-500 text-white
                    hover:bg-orange-600 transition-colors shadow-md"
                >
                  <FiShoppingCart className="text-xl" />
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400
                        text-gray-900 text-xs font-black rounded-full flex items-center
                        justify-center shadow-sm"
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </button>
              )}

              {/* Profile Menu */}
              {isLoggedIn ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1.5 rounded-xl
                      hover:bg-gray-100 transition-colors"
                  >
                    {userProfile?.profilePhotoUrl ? (
                      <img
                        src={userProfile.profilePhotoUrl}
                        alt={userProfile.name}
                        className="w-8 h-8 rounded-full object-cover border-2
                          border-orange-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex
                        items-center justify-center">
                        <span className="text-orange-500 font-bold text-sm">
                          {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium
                      text-gray-700 max-w-24 truncate">
                      {userProfile?.name?.split(" ")[0]}
                    </span>
                  </button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white
                          rounded-2xl shadow-xl border border-gray-100 overflow-hidden
                          z-50"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 bg-orange-50 border-b
                          border-orange-100">
                          <p className="font-semibold text-gray-900 truncate">
                            {userProfile?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {userProfile?.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100
                            text-orange-600 text-xs font-medium rounded-full capitalize">
                            {userProfile?.role?.replace("_", " ")}
                          </span>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          {isCustomer && (
                            <>
                              <Link
                                to="/profile"
                                className="flex items-center gap-3 px-4 py-2.5
                                  text-sm text-gray-700 hover:bg-gray-50
                                  transition-colors"
                              >
                                <FiUser className="text-gray-400" />
                                My Profile
                              </Link>
                              <Link
                                to="/orders"
                                className="flex items-center gap-3 px-4 py-2.5
                                  text-sm text-gray-700 hover:bg-gray-50
                                  transition-colors"
                              >
                                <FiPackage className="text-gray-400" />
                                My Orders
                              </Link>
                              <Link
                                to="/chat"
                                className="flex items-center gap-3 px-4 py-2.5
                                  text-sm text-gray-700 hover:bg-gray-50
                                  transition-colors"
                              >
                                <BsFire className="text-gray-400" />
                                AI Support
                              </Link>
                            </>
                          )}

                          {isOwner && (
                            <Link
                              to="/owner/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5
                                text-sm text-gray-700 hover:bg-gray-50
                                transition-colors"
                            >
                              <MdRestaurant className="text-gray-400" />
                              My Restaurant
                            </Link>
                          )}

                          {isAgent && (
                            <Link
                              to="/agent/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5
                                text-sm text-gray-700 hover:bg-gray-50
                                transition-colors"
                            >
                              <MdDeliveryDining className="text-gray-400" />
                              Agent Dashboard
                            </Link>
                          )}

                          {isAdmin && (
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5
                                text-sm text-gray-700 hover:bg-gray-50
                                transition-colors"
                            >
                              <MdAdminPanelSettings className="text-gray-400" />
                              Admin Panel
                            </Link>
                          )}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5
                              text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <FiLogOut />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700
                      hover:text-orange-500 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-semibold bg-orange-500
                      text-white rounded-xl hover:bg-orange-600 transition-colors
                      shadow-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100
                  transition-colors text-gray-600"
              >
                {isMobileMenuOpen ? (
                  <FiX className="text-xl" />
                ) : (
                  <FiMenu className="text-xl" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ---- MOBILE MENU ---- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? "bg-orange-50 text-orange-500"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}

                {!isLoggedIn && (
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      to="/login"
                      className="text-center py-2.5 rounded-xl border-2
                        border-gray-200 text-gray-700 font-medium text-sm"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="text-center py-2.5 rounded-xl bg-orange-500
                        text-white font-semibold text-sm"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5
                      rounded-xl text-sm font-medium text-red-500
                      hover:bg-red-50 transition-colors mt-2"
                  >
                    <FiLogOut />
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer so content doesn't hide behind fixed navbar */}
      <div className="h-16" />

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
};

export default Navbar;