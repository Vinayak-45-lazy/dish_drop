// ===================================================
// DISHDROP — Axios API Service
// client/src/services/api.js
// ===================================================

import axios from "axios";
import { getIdToken } from "./firebase";
import toast from "react-hot-toast";

// ===================================================
// AXIOS INSTANCE
// ===================================================

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===================================================
// REQUEST INTERCEPTOR
// ===================================================

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("❌ Token attach error:", err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===================================================
// RESPONSE INTERCEPTOR
// ===================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config?.url?.includes("/auth/me")) {
        toast.error("Session expired. Please login again.");
      }
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to do that.");
    } else if (error.response?.status === 429) {
      toast.error("Too many requests. Please slow down.");
    } else if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    }
    return Promise.reject(error);
  }
);

// ===================================================
// AUTH API
// ===================================================

export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  getMe: () => api.get("/api/auth/me"),
  updateProfile: (data) => api.patch("/api/auth/profile", data),
  updateProfilePhoto: (data) =>
    api.patch("/api/auth/profile/photo", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  addAddress: (data) => api.post("/api/auth/address", data),
  deleteAddress: (index) => api.delete(`/api/auth/address/${index}`),
  deleteAccount: () => api.delete("/api/auth/account"),
};

// ===================================================
// RESTAURANT API
// ===================================================

export const restaurantAPI = {
  getAll: (params) => api.get("/api/restaurants", { params }),
  getById: (id) => api.get(`/api/restaurants/${id}`),
  getMyRestaurant: () => api.get("/api/restaurants/my"),
  getNearby: (params) => api.get("/api/restaurants/nearby", { params }),
  create: (data) =>
    api.post("/api/restaurants", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    api.patch(`/api/restaurants/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateStatus: (data) => api.patch("/api/restaurants/my/status", data),
  toggle: (id) => api.patch(`/api/restaurants/${id}/toggle`),
  getMenu: (id, params) => api.get(`/api/restaurants/${id}/menu`, { params }),
};

// ===================================================
// MENU API
// ===================================================

export const menuAPI = {
  getMyMenu: () => api.get("/api/menu/my"),
  getById: (id) => api.get(`/api/menu/${id}`),
  addItem: (data) =>
    api.post("/api/menu", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateItem: (id, data) =>
    api.patch(`/api/menu/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteItem: (id) => api.delete(`/api/menu/${id}`),
  toggle: (id) => api.patch(`/api/menu/${id}/toggle`),
};

// ===================================================
// ORDER API
// ===================================================

export const orderAPI = {
  create: (data) => api.post("/api/orders", data),
  getAll: (params) => api.get("/api/orders", { params }),
  getById: (id) => api.get(`/api/orders/${id}`),
  getMyOrders: (params) => api.get("/api/orders/my", { params }),
  getOwnerOrders: (params) => api.get("/api/orders/owner", { params }),
  getAgentOrders: (params) => api.get("/api/orders/agent", { params }),
  updateStatus: (id, status) =>
    api.patch(`/api/orders/${id}/status`, { status }),
  cancel: (id, reason) =>
    api.patch(`/api/orders/${id}/cancel`, { reason }),
  assignAgent: (id) => api.patch(`/api/orders/${id}/assign-agent`),
  getAgentLocation: (id) => api.get(`/api/orders/${id}/agent-location`),
  getAvailable: () => api.get("/api/orders/available"),
};

// ===================================================
// PAYMENT API
// ===================================================

export const paymentAPI = {
  createOrder: (data) => api.post("/api/payments/create-order", data),
  verify: (data) => api.post("/api/payments/verify", data),
  getDetails: (paymentId) => api.get(`/api/payments/${paymentId}`),
  refund: (data) => api.post("/api/payments/refund", data),
};

// ===================================================
// RATING API
// ===================================================

export const ratingAPI = {
  submit: (data) => api.post("/api/ratings", data),
  getRestaurantRatings: (id, params) =>
    api.get(`/api/ratings/restaurant/${id}`, { params }),
  getAgentRatings: (id, params) =>
    api.get(`/api/ratings/agent/${id}`, { params }),
  getOrderRating: (orderId) => api.get(`/api/ratings/order/${orderId}`),
};

// ===================================================
// AGENT API
// ===================================================

export const agentAPI = {
  getAll: (params) => api.get("/api/agents", { params }),
  getProfile: () => api.get("/api/agents/me"),
  getById: (id) => api.get(`/api/agents/${id}`),
  updateLocation: (data) => api.patch("/api/agents/me/location", data),
  updateAvailability: (data) =>
    api.patch("/api/agents/me/availability", data),
  updateOrderStatus: (orderId, status) =>
    api.patch(`/api/orders/${orderId}/status`, { status }),
  updateVehicle: (data) => api.patch("/api/agents/me/vehicle", data),
  getEarnings: () => api.get("/api/agents/me/earnings"),
};

// ===================================================
// COUPON API
// ===================================================

export const couponAPI = {
  getAll: (params) => api.get("/api/coupons", { params }),
  validate: (data) => api.post("/api/coupons/validate", data),
  create: (data) => api.post("/api/coupons", data),
  update: (id, data) => api.patch(`/api/coupons/${id}`, data),
  delete: (id) => api.delete(`/api/coupons/${id}`),
  toggle: (id, status) => api.patch(`/api/coupons/${id}/toggle`, { isActive: status }),
};

// ===================================================
// AI API
// ===================================================

export const aiAPI = {
  search: (data) => api.post("/api/ai/search", data),
  getRecommendations: () => api.post("/api/ai/recommend"),
  chat: (data) => api.post("/api/ai/chat", data),
};

// ===================================================
// NOTIFICATION API
// ===================================================

export const notificationAPI = {
 getAll: (userId, params) => api.get(`/api/notifications/${userId}`, { params }),
  getUnreadCount: (userId) => api.get(`/api/notifications/${userId}/unread-count`),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/api/notifications/read-all"),
  delete: (id) => api.delete(`/api/notifications/${id}`),
};

// ===================================================
// ADMIN API
// ===================================================

export const adminAPI = {
  getStats: () => api.get("/api/admin/stats"),
  getAllOrders: (params) => api.get("/api/admin/orders", { params }),
  cancelOrder: (id) => api.patch(`/api/admin/orders/${id}/cancel`),
  getAllRestaurants: (params) => api.get("/api/admin/restaurants", { params }),
  getPendingRestaurants: () => api.get("/api/admin/restaurants/pending"),
  approveRestaurant: (id) =>
    api.patch(`/api/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id) =>
    api.patch(`/api/admin/restaurants/${id}/reject`),
  toggleRestaurantOpen: (id, isOpen) =>
    api.patch(`/api/admin/restaurants/${id}/toggle`, { isOpen }),
  getAllAgents: (params) => api.get("/api/admin/agents", { params }),
  getFlaggedAgents: () => api.get("/api/admin/agents/flagged"),
  flagAgent: (id) => api.patch(`/api/admin/agents/${id}/flag`),
  unflagAgent: (id) => api.patch(`/api/admin/agents/${id}/unflag`),
  getCoupons: (params) => api.get("/api/admin/coupons", { params }),
  createCoupon: (data) => api.post("/api/admin/coupons", data),
  deleteCoupon: (id) => api.delete(`/api/admin/coupons/${id}`),
  toggleCoupon: (id, isActive) =>
    api.patch(`/api/admin/coupons/${id}/toggle`, { isActive }),
};

export default api;