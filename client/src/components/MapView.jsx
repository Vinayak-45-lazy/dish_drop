// ===================================================
// DISHDROP — Map View Component
// client/src/components/MapView.jsx
// ===================================================

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// ===================================================
// FIX LEAFLET DEFAULT ICON
// Required when using with webpack/CRA
// ===================================================

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ===================================================
// CUSTOM ICONS
// ===================================================

const createCustomIcon = (emoji, size = 40) => {
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        border: 3px solid #FF4500;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: ${size * 0.45}px;
          line-height: 1;
        ">${emoji}</span>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const restaurantIcon = createCustomIcon("🍽️", 44);
const agentIcon = createCustomIcon("🛵", 44);
const customerIcon = createCustomIcon("🏠", 40);

// ===================================================
// AUTO-FIT BOUNDS COMPONENT
// Adjusts map view to show all markers
// ===================================================

const AutoFitBounds = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      const validPositions = positions.filter(
        (p) => p && p[0] !== 0 && p[1] !== 0
      );
      if (validPositions.length === 0) return;

      if (validPositions.length === 1) {
        map.setView(validPositions[0], 15);
      } else {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [positions, map]);

  return null;
};

// ===================================================
// CENTER UPDATER
// Re-centers map when agent moves
// ===================================================

const CenterUpdater = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.panTo(center, { animate: true, duration: 1 });
    }
  }, [center, map]);

  return null;
};

// ===================================================
// MAIN MAP VIEW COMPONENT
// ===================================================

const MapView = ({
  restaurantLat,
  restaurantLng,
  restaurantName,
  customerLat,
  customerLng,
  customerAddress,
  agentLat,
  agentLng,
  agentName,
  showRoute = true,
  height = "350px",
  zoom = 13,
}) => {
  const hasRestaurant = restaurantLat && restaurantLng;
  const hasCustomer = customerLat && customerLng;
  const hasAgent = agentLat && agentLng && agentLat !== 0 && agentLng !== 0;

  // Default center — Bangalore
  const defaultCenter = [12.9716, 77.5946];

  const center = hasRestaurant
    ? [restaurantLat, restaurantLng]
    : hasCustomer
    ? [customerLat, customerLng]
    : defaultCenter;

  // Build positions array for AutoFitBounds
  const positions = [
    hasRestaurant ? [restaurantLat, restaurantLng] : null,
    hasCustomer ? [customerLat, customerLng] : null,
    hasAgent ? [agentLat, agentLng] : null,
  ].filter(Boolean);

  // Route polyline points
  const routePoints = [];
  if (hasAgent && hasRestaurant) {
    routePoints.push([agentLat, agentLng], [restaurantLat, restaurantLng]);
  }
  if (hasRestaurant && hasCustomer) {
    routePoints.push([restaurantLat, restaurantLng], [customerLat, customerLng]);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-md"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        {/* ---- TILE LAYER ---- */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ---- AUTO FIT BOUNDS ---- */}
        {positions.length > 0 && (
          <AutoFitBounds positions={positions} />
        )}

        {/* ---- CENTER UPDATER (follows agent) ---- */}
        {hasAgent && (
          <CenterUpdater center={[agentLat, agentLng]} />
        )}

        {/* ---- RESTAURANT MARKER ---- */}
        {hasRestaurant && (
          <Marker
            position={[restaurantLat, restaurantLng]}
            icon={restaurantIcon}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-gray-900 text-sm">
                  {restaurantName || "Restaurant"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Pickup Point</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ---- CUSTOMER MARKER ---- */}
        {hasCustomer && (
          <Marker
            position={[customerLat, customerLng]}
            icon={customerIcon}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-gray-900 text-sm">
                  Your Location
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {customerAddress || "Delivery Address"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ---- AGENT MARKER ---- */}
        {hasAgent && (
          <Marker
            position={[agentLat, agentLng]}
            icon={agentIcon}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-gray-900 text-sm">
                  {agentName || "Delivery Agent"}
                </p>
                <p className="text-xs text-orange-500 mt-0.5 font-medium">
                  On the way to you
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ---- ROUTE POLYLINE ---- */}
        {showRoute && routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#FF4500",
              weight: 3,
              opacity: 0.7,
              dashArray: "8, 8",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;