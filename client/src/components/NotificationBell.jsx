// ===================================================
// DISHDROP — Notification Bell Component
// client/src/components/NotificationBell.jsx
// ===================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX, FiPackage, FiTag, FiInfo } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { notificationAPI } from "../services/api";

const NotificationBell = () => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  // -----------------------------------------------
  // FETCH UNREAD COUNT (polled every 30 seconds)
  // -----------------------------------------------
  const fetchUnreadCount = useCallback(async () => {
    if (!userProfile?.uid) return;
    try {
      const res = await notificationAPI.getUnreadCount(userProfile.uid);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      // Silent fail — don't show error for background polling
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchUnreadCount]);

  // -----------------------------------------------
  // FETCH NOTIFICATIONS WHEN DROPDOWN OPENS
  // -----------------------------------------------
  const fetchNotifications = useCallback(async (pageNum = 1) => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const res = await notificationAPI.getAll(userProfile.uid, {
        limit: 10,
        page: pageNum,
      });
      const { data, totalPages } = res.data;

      if (pageNum === 1) {
        setNotifications(data);
      } else {
        setNotifications((prev) => [...prev, ...data]);
      }

      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error("❌ Fetch notifications error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen, fetchNotifications]);

  // -----------------------------------------------
  // CLOSE ON OUTSIDE CLICK
  // -----------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------------------------
  // MARK SINGLE AS READ
  // -----------------------------------------------
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId
            ? { ...n, isRead: true }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("❌ Mark as read error:", err.message);
    }
  };

  // -----------------------------------------------
  // MARK ALL AS READ
  // -----------------------------------------------
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("❌ Mark all as read error:", err.message);
    }
  };

  // -----------------------------------------------
  // DELETE NOTIFICATION
  // -----------------------------------------------
  const handleDelete = async (notificationId, isRead) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("❌ Delete notification error:", err.message);
    }
  };

  // -----------------------------------------------
  // GET NOTIFICATION ICON BY TYPE
  // -----------------------------------------------
  const getTypeIcon = (type) => {
    switch (type) {
      case "order_update":
        return <FiPackage className="text-orange-500" />;
      case "promo":
        return <FiTag className="text-green-500" />;
      default:
        return <FiInfo className="text-blue-500" />;
    }
  };

  // -----------------------------------------------
  // FORMAT TIME AGO
  // -----------------------------------------------
  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ---- BELL BUTTON ---- */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl hover:bg-gray-100
          transition-colors text-gray-600"
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
        >
          <FiBell className="text-xl" />
        </motion.div>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500
                text-white text-xs font-black rounded-full flex items-center
                justify-center shadow-sm"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ---- DROPDOWN ---- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white
              rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3
              border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FiBell className="text-orange-500" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold
                    px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-orange-500 font-medium hover:text-orange-600
                    transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                // Loading State
                <div className="py-8 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-orange-500
                    border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                // Empty State
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex
                    items-center justify-center">
                    <FiBell className="text-2xl text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    No notifications yet
                  </p>
                  <p className="text-xs text-gray-400">
                    We'll notify you about your orders
                  </p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.notificationId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-start gap-3 px-4 py-3
                        border-b border-gray-50 hover:bg-gray-50
                        transition-colors cursor-pointer group
                        ${!notification.isRead ? "bg-orange-50/40" : ""}`}
                      onClick={() =>
                        !notification.isRead &&
                        handleMarkAsRead(notification.notificationId)
                      }
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex
                        items-center justify-center flex-shrink-0 mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug line-clamp-1
                          ${!notification.isRead
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-700"}`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5
                          line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Unread dot + Delete */}
                      <div className="flex flex-col items-center gap-2
                        flex-shrink-0">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(
                              notification.notificationId,
                              notification.isRead
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100
                            transition-opacity p-1 hover:bg-red-50 rounded-lg"
                        >
                          <FiX className="text-red-400 text-xs" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <button
                      onClick={() => fetchNotifications(page + 1)}
                      disabled={loading}
                      className="w-full py-3 text-sm text-orange-500
                        font-medium hover:bg-orange-50 transition-colors
                        disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "Load more"}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;