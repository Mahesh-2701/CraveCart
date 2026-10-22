import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, getSocket } from "../config/api";

const LiveTrackingMap = ({
  orderId,
  restaurantCoords,
  customerCoords,
  initialDeliveryCoords,
  isSimulatedInitial = false,
  restaurantName = "Kitchen Partner",
  customerAddress = "Delivery Location",
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const simulationTimerRef = useRef(null);

  // Fallback coordinates (Central Bangalore)
  const safeRest = {
    lat: Number(restaurantCoords?.lat) || 12.9784,
    lng: Number(restaurantCoords?.lng) || 77.6408,
  };
  const safeCust = {
    lat: Number(customerCoords?.lat) || 12.9345,
    lng: Number(customerCoords?.lng) || 77.6256,
  };
  const safeDelivery = {
    lat: Number(initialDeliveryCoords?.lat) || (safeRest.lat + safeCust.lat) / 2,
    lng: Number(initialDeliveryCoords?.lng) || (safeRest.lng + safeCust.lng) / 2,
  };

  const [deliveryPos, setDeliveryPos] = useState(safeDelivery);
  const [isSimulated, setIsSimulated] = useState(isSimulatedInitial);
  const [etaMinutes, setEtaMinutes] = useState(20);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  // Update Route Polyline
  const updateRouteLine = useCallback((map, currentPos) => {
    if (!map || !map.getSource("route")) return;
    map.getSource("route").setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [safeRest.lng, safeRest.lat],
          [currentPos.lng, currentPos.lat],
          [safeCust.lng, safeCust.lat],
        ],
      },
    });
  }, [safeRest.lat, safeRest.lng, safeCust.lat, safeCust.lng]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Calculate center
    const centerLng = (safeRest.lng + safeCust.lng) / 2;
    const centerLat = (safeRest.lat + safeCust.lat) / 2;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [centerLng, centerLat],
      zoom: 13,
      pitch: 35,
      bearing: 0,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      // Force canvas layout recalculation to prevent blank/zero-height container
      map.resize();

      // Fit bounds to include all 3 key landmarks nicely
      try {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([safeRest.lng, safeRest.lat]);
        bounds.extend([safeCust.lng, safeCust.lat]);
        bounds.extend([safeDelivery.lng, safeDelivery.lat]);
        map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
      } catch (err) {
        console.warn("Bounds fitting error:", err.message);
      }

      // 1. Restaurant Marker
      const restEl = document.createElement("div");
      restEl.className = "marker-pin marker-restaurant shadow";
      restEl.style.width = "40px";
      restEl.style.height = "40px";
      restEl.style.borderRadius = "50%";
      restEl.style.display = "flex";
      restEl.style.alignItems = "center";
      restEl.style.justifyContent = "center";
      restEl.style.backgroundColor = "#FF5200";
      restEl.style.color = "#FFFFFF";
      restEl.style.fontSize = "20px";
      restEl.style.border = "3px solid white";
      restEl.style.cursor = "pointer";
      restEl.innerHTML = "🍳";

      new maplibregl.Marker({ element: restEl, anchor: "bottom" })
        .setLngLat([safeRest.lng, safeRest.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div style="font-family: sans-serif; font-size: 13px;"><strong>${restaurantName}</strong><br/><span style="color: #666;">Pickup Location</span></div>`
          )
        )
        .addTo(map);

      // 2. Customer Destination Marker
      const custEl = document.createElement("div");
      custEl.className = "marker-pin marker-customer shadow";
      custEl.style.width = "40px";
      custEl.style.height = "40px";
      custEl.style.borderRadius = "50%";
      custEl.style.display = "flex";
      custEl.style.alignItems = "center";
      custEl.style.justifyContent = "center";
      custEl.style.backgroundColor = "#10B981";
      custEl.style.color = "#FFFFFF";
      custEl.style.fontSize = "20px";
      custEl.style.border = "3px solid white";
      custEl.style.cursor = "pointer";
      custEl.innerHTML = "🏠";

      new maplibregl.Marker({ element: custEl, anchor: "bottom" })
        .setLngLat([safeCust.lng, safeCust.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div style="font-family: sans-serif; font-size: 13px;"><strong>Delivery Address</strong><br/><span style="color: #666;">${customerAddress}</span></div>`
          )
        )
        .addTo(map);

      // 3. Live Delivery Partner Marker
      const delEl = document.createElement("div");
      delEl.className = "marker-pin marker-delivery shadow";
      delEl.style.width = "44px";
      delEl.style.height = "44px";
      delEl.style.borderRadius = "50%";
      delEl.style.display = "flex";
      delEl.style.alignItems = "center";
      delEl.style.justifyContent = "center";
      delEl.style.backgroundColor = "#3B82F6";
      delEl.style.color = "#FFFFFF";
      delEl.style.fontSize = "22px";
      delEl.style.border = "3px solid white";
      delEl.style.cursor = "pointer";
      delEl.innerHTML = "🛵";

      const delMarker = new maplibregl.Marker({ element: delEl, anchor: "center" })
        .setLngLat([safeDelivery.lng, safeDelivery.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div style="font-family: sans-serif; font-size: 13px;"><strong>Delivery Partner</strong><br/><span style="color: #3B82F6; font-weight: bold;">En Route</span></div>`
          )
        )
        .addTo(map);

      deliveryMarkerRef.current = delMarker;

      // 4. Interactive Route Line
      try {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [safeRest.lng, safeRest.lat],
                [safeDelivery.lng, safeDelivery.lat],
                [safeCust.lng, safeCust.lat],
              ],
            },
          },
        });

        // Background line glow
        map.addLayer({
          id: "route-glow",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#FF5200",
            "line-width": 8,
            "line-opacity": 0.35,
          },
        });

        // Foreground dotted route
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#FF5200",
            "line-width": 4,
            "line-dasharray": [2, 1],
          },
        });
      } catch (err) {
        console.warn("Route layer setup warning:", err.message);
      }
    });

    // Resize handlers to guarantee it never stays blank
    const resizeTimeout = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 200);

    const handleWindowResize = () => {
      if (mapRef.current) mapRef.current.resize();
    };
    window.addEventListener("resize", handleWindowResize);

    // Socket.IO Subscription
    const socket = getSocket();
    if (orderId) {
      socket.emit("join", `order_${orderId}`);

      socket.on("tracking:update", (data) => {
        if (data && data.lat && data.lng) {
          const newPos = { lat: Number(data.lat), lng: Number(data.lng) };
          setDeliveryPos(newPos);
          setIsSimulated(Boolean(data.isSimulated));
          if (data.estimatedMinutes) setEtaMinutes(data.estimatedMinutes);
          setLastUpdate(new Date().toLocaleTimeString());

          if (deliveryMarkerRef.current) {
            deliveryMarkerRef.current.setLngLat([newPos.lng, newPos.lat]);
          }
          if (mapRef.current) {
            updateRouteLine(mapRef.current, newPos);
          }
        }
      });
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleWindowResize);
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
      if (orderId) {
        socket.emit("leave", `order_${orderId}`);
        socket.off("tracking:update");
      }
      map.remove();
    };
  }, [orderId, safeRest.lat, safeRest.lng, safeCust.lat, safeCust.lng, safeDelivery.lat, safeDelivery.lng, restaurantName, customerAddress, updateRouteLine]);

  // Client-side instant route simulator for testing & demos
  const toggleClientSimulation = () => {
    if (isLiveSimulating) {
      clearInterval(simulationTimerRef.current);
      setIsLiveSimulating(false);
      return;
    }

    setIsLiveSimulating(true);
    setIsSimulated(true);

    let step = 0;
    const totalSteps = 40;

    simulationTimerRef.current = setInterval(() => {
      step = (step + 1) % (totalSteps + 1);
      const ratio = step / totalSteps;

      // Linear interpolation between restaurant and customer
      const lat = safeRest.lat + (safeCust.lat - safeRest.lat) * ratio;
      const lng = safeRest.lng + (safeCust.lng - safeRest.lng) * ratio;
      const newPos = { lat, lng };

      setDeliveryPos(newPos);
      setEtaMinutes(Math.max(2, Math.round(25 * (1 - ratio))));
      setLastUpdate(new Date().toLocaleTimeString());

      if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.setLngLat([lng, lat]);
      }
      if (mapRef.current) {
        updateRouteLine(mapRef.current, newPos);
        // Pan smoothly with the delivery partner
        mapRef.current.easeTo({ center: [lng, lat], duration: 800 });
      }
    }, 1200);
  };

  const resetPosition = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      setIsLiveSimulating(false);
    }
    setDeliveryPos(safeDelivery);
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLngLat([safeDelivery.lng, safeDelivery.lat]);
    }
    if (mapRef.current) {
      updateRouteLine(mapRef.current, safeDelivery);
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([safeRest.lng, safeRest.lat]);
      bounds.extend([safeCust.lng, safeCust.lat]);
      bounds.extend([safeDelivery.lng, safeDelivery.lat]);
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden my-3">
      {/* Simulation Banner Notice */}
      {isSimulated && (
        <div
          className="p-2 px-3 text-dark d-flex align-items-center justify-content-between"
          style={{ background: "#FEF3C7", borderBottom: "1px solid #FDE68A", fontSize: "13px" }}
        >
          <div>
            <span className="badge bg-warning text-dark me-2">DEMO / SIMULATED</span>
            <strong>Simulated GPS:</strong> Demonstrating delivery movement along route with real-time vector map.
          </div>
          <span className="text-muted small">Speed: 25 km/h</span>
        </div>
      )}

      {/* Live Status Header Bar */}
      <div className="p-3 bg-white border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-primary px-3 py-2 rounded-pill fs-6">
            🛵 Live Tracking
          </span>
          <span className="text-muted small">
            Estimated Arrival: <strong>~{etaMinutes} mins</strong>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Interactive Simulation Controls */}
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-semibold ${
              isLiveSimulating ? "btn-danger" : "btn-outline-primary"
            }`}
            onClick={toggleClientSimulation}
          >
            {isLiveSimulating ? "⏸ Pause Demo" : "▶ Simulate GPS Movement"}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-light border rounded-pill px-2 text-muted"
            title="Recenter and reset coordinates"
            onClick={resetPosition}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* MapLibre Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "460px",
          minHeight: "460px",
          position: "relative",
          backgroundColor: "#f0f4f8",
        }}
      />

      {/* Legend & Telemetry Footer */}
      <div className="p-3 bg-light border-top d-flex flex-wrap justify-content-between align-items-center gap-3 small text-muted">
        <div className="d-flex align-items-center gap-3">
          <span className="d-flex align-items-center gap-1">
            <span style={{ fontSize: "16px" }}>🍳</span> <strong>{restaurantName}</strong>
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ fontSize: "16px" }}>🛵</span> <strong>Delivery Rider</strong>
          </span>
          <span className="d-flex align-items-center gap-1">
            <span style={{ fontSize: "16px" }}>🏠</span> <strong>Customer</strong>
          </span>
        </div>

        <div className="small font-monospace text-muted">
          GPS: {deliveryPos.lat?.toFixed(4)}, {deliveryPos.lng?.toFixed(4)} | Last Signal: {lastUpdate}
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
