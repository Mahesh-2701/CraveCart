import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, getSocket } from "../config/api";

const LiveTrackingMap = ({
  orderId,
  restaurantCoords = { lat: 12.9650, lng: 77.5880 },
  customerCoords = { lat: 12.9780, lng: 77.6010 },
  initialDeliveryCoords = { lat: 12.9680, lng: 77.5920 },
  isSimulatedInitial = false,
  restaurantName = "Restaurant",
  customerAddress = "Delivery Location",
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const deliveryMarkerRef = useRef(null);

  const [deliveryPos, setDeliveryPos] = useState(initialDeliveryCoords);
  const [isSimulated, setIsSimulated] = useState(isSimulatedInitial);
  const [etaMinutes, setEtaMinutes] = useState(25);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center between restaurant and customer
    const centerLng = (restaurantCoords.lng + customerCoords.lng) / 2;
    const centerLat = (restaurantCoords.lat + customerCoords.lat) / 2;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [centerLng, centerLat],
      zoom: 13,
      pitch: 45, // 3D perspective
      bearing: -10,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // 1. Restaurant Marker
      const restEl = document.createElement("div");
      restEl.className = "marker-pin marker-restaurant";
      restEl.innerHTML = "🍳";
      new maplibregl.Marker({ element: restEl })
        .setLngLat([restaurantCoords.lng, restaurantCoords.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${restaurantName}</strong><br/>Pickup Point`))
        .addTo(map);

      // 2. Customer Destination Marker
      const custEl = document.createElement("div");
      custEl.className = "marker-pin marker-customer";
      custEl.innerHTML = "🏠";
      new maplibregl.Marker({ element: custEl })
        .setLngLat([customerCoords.lng, customerCoords.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>Delivery Destination</strong><br/>${customerAddress}`))
        .addTo(map);

      // 3. Live Delivery Partner Marker
      const delEl = document.createElement("div");
      delEl.className = "marker-pin marker-delivery";
      delEl.innerHTML = "🛵";
      const delMarker = new maplibregl.Marker({ element: delEl })
        .setLngLat([initialDeliveryCoords.lng, initialDeliveryCoords.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML("<strong>Delivery Partner</strong><br/>On the way"))
        .addTo(map);

      deliveryMarkerRef.current = delMarker;

      // Draw simple route line between coordinates
      try {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [restaurantCoords.lng, restaurantCoords.lat],
                [initialDeliveryCoords.lng, initialDeliveryCoords.lat],
                [customerCoords.lng, customerCoords.lat],
              ],
            },
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#FF5200",
            "line-width": 4,
            "line-dasharray": [2, 1],
          },
        });
      } catch (err) {
        // Line rendering fallback
      }
    });

    // Setup Socket.IO subscription
    const socket = getSocket();
    if (orderId) {
      socket.emit("join", `order_${orderId}`);

      socket.on("tracking:update", (data) => {
        if (data.lat && data.lng) {
          setDeliveryPos({ lat: data.lat, lng: data.lng });
          setIsSimulated(Boolean(data.isSimulated));
          if (data.estimatedMinutes) setEtaMinutes(data.estimatedMinutes);
          setLastUpdate(new Date().toLocaleTimeString());

          if (deliveryMarkerRef.current) {
            deliveryMarkerRef.current.setLngLat([data.lng, data.lat]);
          }
        }
      });
    }

    return () => {
      if (orderId) {
        socket.emit("leave", `order_${orderId}`);
        socket.off("tracking:update");
      }
      map.remove();
    };
  }, [orderId]);

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden my-3">
      {/* Simulation Banner Notice */}
      {isSimulated && (
        <div className="simulation-banner">
          <span className="badge bg-warning text-dark me-2">DEMO MODE</span>
          ⚠️ <strong>Simulated Live GPS:</strong> Coordinates are currently rendered via the development route simulator.
        </div>
      )}

      {/* Live Status Bar */}
      <div className="p-3 bg-white border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-primary px-3 py-2 rounded-pill">
            🛵 Live Tracking
          </span>
          <span className="text-muted small">
            Estimated Arrival: <strong>~{etaMinutes} mins</strong>
          </span>
        </div>
        <div className="text-muted small">
          GPS: <span className="font-monospace">{deliveryPos.lat?.toFixed(4)}, {deliveryPos.lng?.toFixed(4)}</span> | Last Signal: <span>{lastUpdate}</span>
        </div>
      </div>

      {/* MapLibre Map Canvas */}
      <div ref={mapContainerRef} className="maplibre-container" style={{ minHeight: "420px" }} />

      {/* Legend & Controls Footer */}
      <div className="p-3 bg-light d-flex flex-wrap justify-content-between align-items-center gap-3 small text-muted">
        <div className="d-flex align-items-center gap-3">
          <span><span className="badge bg-danger rounded-circle p-1">🍳</span> Restaurant</span>
          <span><span className="badge bg-primary rounded-circle p-1">🛵</span> Delivery Partner</span>
          <span><span className="badge bg-success rounded-circle p-1">🏠</span> Your Address</span>
        </div>
        <div className="small">
          Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
