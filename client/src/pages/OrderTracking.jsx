import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiPhone, FiArrowLeft, FiRefreshCw, FiX } from "react-icons/fi";
import { MdDeliveryDining, MdRestaurant } from "react-icons/md";
import { orderAPI } from "../services/api";
import OrderStatusStepper from "../components/OrderStatusStepper";
import MapView from "../components/MapView";
import RatingModal from "../components/RatingModal";
import { FullPageSpinner } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const MapSection = ({ order, agentLocation }) => {
  const addr = order.deliveryAddress || {};
  const props = {
    restaurantLat: order.restaurantLat || null,
    restaurantLng: order.restaurantLng || null,
    restaurantName: order.restaurantName || "",
    customerLat: addr.lat || null,
    customerLng: addr.lng || null,
    agentLat: agentLocation ? agentLocation.lat : null,
    agentLng: agentLocation ? agentLocation.lng : null,
    height: "300px",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdDeliveryDining className="text-orange-500" />
          <span className="font-bold text-gray-900 text-sm">Live Tracking</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>
      <MapView
        restaurantLat={props.restaurantLat}
        restaurantLng={props.restaurantLng}
        restaurantName={props.restaurantName}
        customerLat={props.customerLat}
        customerLng={props.customerLng}
        agentLat={props.agentLat}
        agentLng={props.agentLng}
        height={props.height}
      />
    </div>
  );
};

const AgentSection = ({ order }) => {
  const name = order.agentName || "";
  const initial = name ? name.charAt(0).toUpperCase() : "A";
  const phone = order.agentPhone || "";
  const vehicle = (order.agentVehicleType || "bike") + (order.agentVehicleNumber ? " - " + order.agentVehicleNumber : "");
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Your Delivery Agent
      </p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-black text-lg">{initial}</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{vehicle}</p>
        </div>
        <AgentCallButton phone={phone} />
      </div>
    </div>
  );
};

const AgentCallButton = ({ phone }) => {
  if (!phone) return null;
  const telHref = "tel:" + phone;
  const cls = "w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors";
  return (
    <a href={telHref} className={cls}>
      <FiPhone className="text-sm" />
    </a>
  );
};    
const CancelModal = ({ reasons, cancelReason, setCancelReason, onClose, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10">
        <h3 className="font-bold text-gray-900 text-lg mb-2">Cancel Order?</h3>
        <p className="text-gray-500 text-sm mb-4">Please tell us why.</p>
        <div className="space-y-2 mb-4">
          {reasons.map((reason) => {
            const selected = cancelReason === reason;
            const cls = "w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium " +
              (selected ? "border-red-400 bg-red-50 text-red-600" : "border-gray-200 text-gray-600");
            return (
              <button key={reason} onClick={() => setCancelReason(reason)} className={cls}>
                {reason}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">
            Keep Order
          </button>
          <button onClick={onConfirm} disabled={loading || !cancelReason} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 text-sm">
            {loading ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeliveredSection = ({ onRate }) => {
  return (
    <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
      <div className="text-4xl mb-2">🎉</div>
      <h3 className="font-bold text-green-800 text-lg">Order Delivered!</h3>
      <p className="text-green-600 text-sm mt-1">Enjoy your meal!</p>
      <button onClick={onRate} className="mt-4 px-6 py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm">
        Rate Your Order
      </button>
    </div>
  );
};

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentLocation, setAgentLocation] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [ratingShown, setRatingShown] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getById(id);
      const data = res.data.data;
      setOrder(data);
      if (data.deliveryAgentId) startPolling();
      if (data.status === "delivered" && !ratingShown) {
        setShowRating(true);
        setRatingShown(true);
      }
    } catch (err) {
      toast.error("Order not found.");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentLocation = async () => {
    try {
      const res = await orderAPI.getAgentLocation(id);
      const loc = res.data.data;
      if (loc && loc.lat && loc.lng) {
        setAgentLocation({ lat: loc.lat, lng: loc.lng });
      }
    } catch (err) {}
  };

  const startPolling = () => {
    if (pollRef.current) return;
    fetchAgentLocation();
    pollRef.current = setInterval(fetchAgentLocation, 10000);
  };

  const handleCancel = async () => {
    if (!cancelReason) { toast.error("Please select a reason."); return; }
    try {
      setCancelLoading(true);
      await orderAPI.cancel(id, cancelReason);
      toast.success("Order cancelled.");
      setShowCancelModal(false);
      fetchOrder();
    } catch (err) {
      toast.error("Cannot cancel this order.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return <FullPageSpinner message="Loading your order..." />;
  if (!order) return null;

  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const canCancel = order.status === "placed" || order.status === "confirmed";
  const hasAgent = Boolean(order.deliveryAgentId);
  const hasAgentName = Boolean(order.agentName);
  const addr = order.deliveryAddress || {};
  const items = order.items || [];
  const total = order.totalAmount ? order.totalAmount.toFixed(0) : "0";
  const shortId = id ? id.slice(-8).toUpperCase() : "";

  const REASONS = [
    "Changed my mind",
    "Ordered by mistake",
    "Taking too long",
    "Found better option",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <FiArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Track Order</h1>
              <p className="text-xs text-gray-400 font-mono">{"#" + shortId}</p>
            </div>
          </div>
          <button onClick={fetchOrder} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className="text-sm text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">

          <OrderStatusStepper
            status={order.status}
            placedAt={order.createdAt}
            estimatedDeliveryMinutes={order.estimatedDeliveryMinutes || 35}
          />

          {hasAgent && !isCancelled && <MapSection order={order} agentLocation={agentLocation} />}

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MdRestaurant className="text-orange-400 text-xl" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{order.restaurantName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{items.length + " items • Rs." + total}</p>
              </div>
              <Link to={"/restaurants/" + order.restaurantId} className="text-xs text-orange-500 font-semibold">
                View Menu
              </Link>
            </div>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600">
                  <span>{item.name + " x" + item.quantity}</span>
                  <span className="font-medium">{"Rs." + (item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-500">{"Rs." + total}</span>
              </div>
            </div>
          </div>

          {hasAgent && hasAgentName && <AgentSection order={order} />}

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivering To</p>
            <p className="font-semibold text-gray-800 text-sm">{addr.label || "Home"}</p>
            <p className="text-gray-500 text-sm mt-0.5">{(addr.addressLine || "") + ", " + (addr.city || "")}</p>
          </div>

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-3 border-2 border-red-200 text-red-400 font-semibold rounded-xl hover:bg-red-50 text-sm flex items-center justify-center gap-2"
            >
              <FiX className="text-sm" />
              Cancel Order
            </button>
          )}

          {isDelivered && <DeliveredSection onRate={() => setShowRating(true)} />}

        </div>
      </div>

      {showCancelModal && (
        <CancelModal
          reasons={REASONS}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
          loading={cancelLoading}
        />
      )}

      {showRating && (
        <RatingModal
          order={order}
          onClose={() => setShowRating(false)}
          onSuccess={() => setShowRating(false)}
        />
      )}

    </div>
  );
};

export default OrderTracking;