import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute, { GuestRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import RestaurantList from "./pages/RestaurantList";
import RestaurantDetail from "./pages/RestaurantDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import OrderTracking from "./pages/OrderTracking";
import CustomerProfile from "./pages/CustomerProfile";
import AIRecommendations from "./pages/AIRecommendations";
import AIChatSupport from "./pages/AIChatSupport";
import RestaurantOwnerDashboard from "./pages/RestaurantOwnerDashboard";
import ManageMenu from "./pages/ManageMenu";
import OwnerOrders from "./pages/OwnerOrders";
import OwnerAnalytics from "./pages/OwnerAnalytics";
import DeliveryAgentDashboard from "./pages/DeliveryAgentDashboard";
import AgentOrderView from "./pages/AgentOrderView";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminOrders from "./pages/AdminOrders";
import AdminAgents from "./pages/AdminAgents";
import AdminCoupons from "./pages/AdminCoupons";
import NotFound from "./pages/NotFound";

const Layout = ({ children }) => {
  const location = useLocation();
  const noLayoutPages = ["/login", "/register"];
  const showLayout = !noLayoutPages.includes(location.pathname);
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showLayout && <Navbar />}
      <main className="flex-1">{children}</main>
      {showLayout && <Footer />}
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<RestaurantList />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/cart" element={<Cart />} />

        <Route path="/checkout" element={<ProtectedRoute allowedRoles={["customer"]}><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={["customer"]}><OrderHistory /></ProtectedRoute>} />
        <Route path="/orders/:id/track" element={<ProtectedRoute allowedRoles={["customer"]}><OrderTracking /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerProfile /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute allowedRoles={["customer"]}><AIRecommendations /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute allowedRoles={["customer"]}><AIChatSupport /></ProtectedRoute>} />

        <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={["restaurant_owner"]}><RestaurantOwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/menu" element={<ProtectedRoute allowedRoles={["restaurant_owner"]}><ManageMenu /></ProtectedRoute>} />
        <Route path="/owner/orders" element={<ProtectedRoute allowedRoles={["restaurant_owner"]}><OwnerOrders /></ProtectedRoute>} />
        <Route path="/owner/analytics" element={<ProtectedRoute allowedRoles={["restaurant_owner"]}><OwnerAnalytics /></ProtectedRoute>} />

        <Route path="/agent/dashboard" element={<ProtectedRoute allowedRoles={["delivery_agent"]}><DeliveryAgentDashboard /></ProtectedRoute>} />
        <Route path="/agent/orders" element={<ProtectedRoute allowedRoles={["delivery_agent"]}><AgentOrderView /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/restaurants" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRestaurants /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/agents" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAgents /></ProtectedRoute>} />
        <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCoupons /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const toastStyle = {
  background: "#1a1a1a",
  color: "#ffffff",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: "500",
  padding: "12px 16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 3000,
              style: toastStyle,
              success: { iconTheme: { primary: "#FF4500", secondary: "#ffffff" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#ffffff" } },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;