import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, MAP_STYLES_PRESETS, MAP_KEY, getSocket } from "../config/api";

const isWebGLSupported = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
};

// Calculate Haversine distance in KM
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
  const fallbackCanvasRef = useRef(null);
  const mapRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const restMarkerRef = useRef(null);
  const custMarkerRef = useRef(null);
  const simulationTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Active Style Preset
  const [selectedStyle, setSelectedStyle] = useState("voyager");
  const [hasWebGLError, setHasWebGLError] = useState(!isWebGLSupported());

  // Coordinates with safe fallbacks (Central Bangalore / user location)
  const safeRest = useMemo(
    () => ({
      lat: Number(restaurantCoords?.lat) || 12.9749,
      lng: Number(restaurantCoords?.lng) || 77.6053,
    }),
    [restaurantCoords?.lat, restaurantCoords?.lng]
  );

  const safeCust = useMemo(
    () => ({
      lat: Number(customerCoords?.lat) || 12.9345,
      lng: Number(customerCoords?.lng) || 77.6256,
    }),
    [customerCoords?.lat, customerCoords?.lng]
  );

  const safeDelivery = useMemo(
    () => ({
      lat: Number(initialDeliveryCoords?.lat) || (safeRest.lat + safeCust.lat) / 2,
      lng: Number(initialDeliveryCoords?.lng) || (safeRest.lng + safeCust.lng) / 2,
    }),
    [initialDeliveryCoords?.lat, initialDeliveryCoords?.lng, safeRest.lat, safeRest.lng, safeCust.lat, safeCust.lng]
  );

  const [deliveryPos, setDeliveryPos] = useState(safeDelivery);
  const [isSimulated, setIsSimulated] = useState(isSimulatedInitial);
  const [etaMinutes, setEtaMinutes] = useState(20);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);
  const [distanceKm, setDistanceKm] = useState(2.8);

  // Sync initial delivery coords
  useEffect(() => {
    setDeliveryPos(safeDelivery);
    const d = calculateHaversineKm(safeDelivery.lat, safeDelivery.lng, safeCust.lat, safeCust.lng);
    setDistanceKm(Number(d.toFixed(1)));
  }, [safeDelivery, safeCust]);

  // Update Route Polyline in MapLibre
  const updateRouteLine = useCallback(
    (map, currentPos) => {
      if (!map) return;
      try {
        const source = map.getSource("route");
        if (source) {
          source.setData({
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
        }
      } catch (err) {
        console.warn("Route line update error:", err.message);
      }
    },
    [safeRest.lat, safeRest.lng, safeCust.lat, safeCust.lng]
  );

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (hasWebGLError || !mapContainerRef.current) return;

    let isSubscribed = true;
    const centerLng = (safeRest.lng + safeCust.lng) / 2;
    const centerLat = (safeRest.lat + safeCust.lat) / 2;

    const stylePreset = MAP_STYLES_PRESETS[selectedStyle] || MAP_STYLE;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: stylePreset,
        center: [centerLng, centerLat],
        zoom: 13,
        pitch: 25,
        bearing: 0,
        attributionControl: true,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

      // Handle map errors safely without crash
      map.on("error", (e) => {
        console.warn("MapLibre tile/style error notice:", e?.error?.message || e);
      });

      map.on("load", () => {
        if (!isSubscribed) return;
        map.resize();

        try {
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([safeRest.lng, safeRest.lat]);
          bounds.extend([safeCust.lng, safeCust.lat]);
          bounds.extend([safeDelivery.lng, safeDelivery.lat]);
          map.fitBounds(bounds, { padding: 70, maxZoom: 15 });
        } catch (err) {
          console.warn("Bounds fitting warning:", err.message);
        }

        // 1. Restaurant Marker
        const restEl = document.createElement("div");
        restEl.className = "marker-pin marker-restaurant shadow-md";
        restEl.style.width = "40px";
        restEl.style.height = "40px";
        restEl.style.borderRadius = "50%";
        restEl.style.display = "flex";
        restEl.style.alignItems = "center";
        restEl.style.justifyContent = "center";
        restEl.style.backgroundColor = "#FF5200";
        restEl.style.color = "#FFFFFF";
        restEl.style.fontSize = "18px";
        restEl.style.border = "3px solid white";
        restEl.style.boxShadow = "0 4px 12px rgba(255, 82, 0, 0.4)";
        restEl.innerHTML = `<i class="bi bi-shop"></i>`;

        restMarkerRef.current = new maplibregl.Marker({ element: restEl, anchor: "bottom" })
          .setLngLat([safeRest.lng, safeRest.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family: sans-serif; font-size: 13px; padding: 4px;"><strong>${restaurantName}</strong><br/><span style="color: #64748B;">Kitchen Pickup Point</span></div>`
            )
          )
          .addTo(map);

        // 2. Customer Destination Marker
        const custEl = document.createElement("div");
        custEl.className = "marker-pin marker-customer shadow-md";
        custEl.style.width = "40px";
        custEl.style.height = "40px";
        custEl.style.borderRadius = "50%";
        custEl.style.display = "flex";
        custEl.style.alignItems = "center";
        custEl.style.justifyContent = "center";
        custEl.style.backgroundColor = "#10B981";
        custEl.style.color = "#FFFFFF";
        custEl.style.fontSize = "18px";
        custEl.style.border = "3px solid white";
        custEl.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
        custEl.innerHTML = `<i class="bi bi-house-door-fill"></i>`;

        custMarkerRef.current = new maplibregl.Marker({ element: custEl, anchor: "bottom" })
          .setLngLat([safeCust.lng, safeCust.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family: sans-serif; font-size: 13px; padding: 4px;"><strong>Delivery Destination</strong><br/><span style="color: #64748B;">${customerAddress}</span></div>`
            )
          )
          .addTo(map);

        // 3. Live Delivery Partner Marker
        const delEl = document.createElement("div");
        delEl.className = "marker-pin marker-delivery shadow-lg";
        delEl.style.width = "46px";
        delEl.style.height = "46px";
        delEl.style.borderRadius = "50%";
        delEl.style.display = "flex";
        delEl.style.alignItems = "center";
        delEl.style.justifyContent = "center";
        delEl.style.backgroundColor = "#2563EB";
        delEl.style.color = "#FFFFFF";
        delEl.style.fontSize = "22px";
        delEl.style.border = "3px solid white";
        delEl.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.45)";
        delEl.innerHTML = `<i class="bi bi-bicycle"></i>`;

        deliveryMarkerRef.current = new maplibregl.Marker({ element: delEl, anchor: "center" })
          .setLngLat([safeDelivery.lng, safeDelivery.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family: sans-serif; font-size: 13px; padding: 4px;"><strong>Express Rider</strong><br/><span style="color: #2563EB; font-weight: bold;">En Route</span></div>`
            )
          )
          .addTo(map);

        // 4. Interactive Route Line
        try {
          if (!map.getSource("route")) {
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

            // Glow path
            map.addLayer({
              id: "route-glow",
              type: "line",
              source: "route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#FF5200",
                "line-width": 8,
                "line-opacity": 0.3,
              },
            });

            // Foreground path
            map.addLayer({
              id: "route-line",
              type: "line",
              source: "route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#FF5200",
                "line-width": 4,
                "line-dasharray": [2, 2],
              },
            });
          }
        } catch (err) {
          console.warn("Route init:", err.message);
        }
      });

      // Timed layout triggers to eliminate zero-height canvas issues
      const rAF = window.requestAnimationFrame(() => map.resize());
      const t1 = setTimeout(() => map.resize(), 150);
      const t2 = setTimeout(() => map.resize(), 600);

      // ResizeObserver to automatically resize canvas whenever container layout changes
      let resizeObs = null;
      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObs = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        });
        resizeObs.observe(mapContainerRef.current);
      }

      return () => {
        isSubscribed = false;
        window.cancelAnimationFrame(rAF);
        clearTimeout(t1);
        clearTimeout(t2);
        if (resizeObs) resizeObs.disconnect();
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      console.warn("MapLibre GL initialization failed; activating Vector Canvas fallback:", err.message);
      setHasWebGLError(true);
    }
  }, [selectedStyle, hasWebGLError, safeRest, safeCust, safeDelivery, restaurantName, customerAddress]);

  // Real-Time Socket.io GPS Listener
  useEffect(() => {
    const socket = getSocket();
    if (orderId && socket) {
      socket.emit("join", `order_${orderId}`);

      const handleDeliveryUpdate = (coords) => {
        if (coords && coords.lat && coords.lng) {
          const newPos = { lat: Number(coords.lat), lng: Number(coords.lng) };
          setDeliveryPos(newPos);
          setLastUpdate(new Date().toLocaleTimeString());

          const d = calculateHaversineKm(newPos.lat, newPos.lng, safeCust.lat, safeCust.lng);
          setDistanceKm(Number(d.toFixed(1)));
          setEtaMinutes(Math.max(1, Math.round(d * 4)));

          if (deliveryMarkerRef.current) {
            deliveryMarkerRef.current.setLngLat([newPos.lng, newPos.lat]);
          }
          if (mapRef.current) {
            updateRouteLine(mapRef.current, newPos);
          }
        }
      };

      socket.on("deliveryLocationUpdate", handleDeliveryUpdate);
      socket.on("delivery:location_update", handleDeliveryUpdate);

      return () => {
        socket.emit("leave", `order_${orderId}`);
        socket.off("deliveryLocationUpdate", handleDeliveryUpdate);
        socket.off("delivery:location_update", handleDeliveryUpdate);
      };
    }
  }, [orderId, safeCust, updateRouteLine]);

  // Client Simulation Engine (Smooth Interpolation)
  const toggleClientSimulation = () => {
    if (isLiveSimulating) {
      clearInterval(simulationTimerRef.current);
      setIsLiveSimulating(false);
      return;
    }

    setIsLiveSimulating(true);
    setIsSimulated(true);

    let progress = 0;
    const totalSteps = 80;
    const intervalMs = 700;

    simulationTimerRef.current = setInterval(() => {
      progress += 1;
      if (progress > totalSteps) {
        progress = 0;
      }

      const fraction = progress / totalSteps;
      const interpLat = safeRest.lat + (safeCust.lat - safeRest.lat) * fraction;
      const interpLng = safeRest.lng + (safeCust.lng - safeRest.lng) * fraction;

      const newPos = { lat: interpLat, lng: interpLng };
      setDeliveryPos(newPos);

      const d = calculateHaversineKm(interpLat, interpLng, safeCust.lat, safeCust.lng);
      setDistanceKm(Number(d.toFixed(1)));
      setEtaMinutes(Math.max(1, Math.round(20 * (1 - fraction))));
      setLastUpdate(new Date().toLocaleTimeString());

      if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.setLngLat([interpLng, interpLat]);
      }
      if (mapRef.current) {
        updateRouteLine(mapRef.current, newPos);
      }
    }, intervalMs);
  };

  const resetPosition = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      setIsLiveSimulating(false);
    }
    setDeliveryPos(safeDelivery);
    const d = calculateHaversineKm(safeDelivery.lat, safeDelivery.lng, safeCust.lat, safeCust.lng);
    setDistanceKm(Number(d.toFixed(1)));
    setEtaMinutes(20);

    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLngLat([safeDelivery.lng, safeDelivery.lat]);
    }
    if (mapRef.current) {
      updateRouteLine(mapRef.current, safeDelivery);
      try {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([safeRest.lng, safeRest.lat]);
        bounds.extend([safeCust.lng, safeCust.lat]);
        bounds.extend([safeDelivery.lng, safeDelivery.lat]);
        mapRef.current.fitBounds(bounds, { padding: 70, maxZoom: 15 });
      } catch (err) {}
    }
  };

  // High-Precision Fallback Canvas Renderer (Runs if WebGL is unavailable)
  useEffect(() => {
    if (!hasWebGLError || !fallbackCanvasRef.current) return;
    const canvas = fallbackCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pulse = 0;
    const render = () => {
      pulse = (pulse + 0.04) % (Math.PI * 2);
      const w = canvas.width;
      const h = canvas.height;

      // Dark sleek radar background
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Landmarks on Canvas
      const restX = w * 0.22;
      const restY = h * 0.35;
      const custX = w * 0.78;
      const custY = h * 0.65;

      // Calculate fraction based on deliveryPos
      const latRange = safeCust.lat - safeRest.lat || 1;
      const fraction = Math.min(1, Math.max(0, (deliveryPos.lat - safeRest.lat) / latRange));
      const riderX = restX + (custX - restX) * fraction;
      const riderY = restY + (custY - restY) * fraction;

      // Route Glow
      ctx.strokeStyle = "rgba(255, 82, 0, 0.25)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(restX, restY);
      ctx.lineTo(riderX, riderY);
      ctx.lineTo(custX, custY);
      ctx.stroke();

      // Dashed Route
      ctx.strokeStyle = "#FF5200";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(restX, restY);
      ctx.lineTo(riderX, riderY);
      ctx.lineTo(custX, custY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 1. Restaurant Pin
      ctx.fillStyle = "#FF5200";
      ctx.beginPath();
      ctx.arc(restX, restY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("KITCHEN", restX - 24, restY - 20);

      // 2. Customer Home Pin
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(custX, custY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("DESTINATION", custX - 34, custY + 28);

      // 3. Delivery Rider Pulsing Pin
      const pulseRadius = 14 + Math.sin(pulse) * 6;
      ctx.fillStyle = "rgba(37, 99, 235, 0.3)";
      ctx.beginPath();
      ctx.arc(riderX, riderY, pulseRadius + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2563EB";
      ctx.beginPath();
      ctx.arc(riderX, riderY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#60A5FA";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(`RIDER (${distanceKm} km)`, riderX - 35, riderY - 24);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [hasWebGLError, deliveryPos, safeRest, safeCust, distanceKm]);

  return (
    <div className="card shadow-xs border-0 rounded-4 overflow-hidden my-3 bg-white">
      {/* Simulation / Key Notice Bar */}
      <div
        className="p-2 px-3 text-dark d-flex align-items-center justify-content-between flex-wrap gap-2"
        style={{
          background: hasWebGLError ? "#EFF6FF" : "#FEF3C7",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          fontSize: "12.5px",
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${hasWebGLError ? "bg-primary" : "bg-warning"} text-dark font-heading`}>
            {hasWebGLError ? "VECTOR RADAR GPS" : isSimulated ? "SIMULATED TELEMETRY" : "LIVE SATELLITE GPS"}
          </span>
          <span className="text-secondary">
            {hasWebGLError
              ? "Universal vector canvas active with high-precision telemetry interpolation."
              : "Live coordinate stream connected with authenticated tile layer."}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill bg-white border text-dark font-monospace small px-2 py-1">
            <i className="bi bi-key-fill text-warning me-1"></i>
            KEY: {MAP_KEY.slice(0, 6)}...{MAP_KEY.slice(-4)}
          </span>
        </div>
      </div>

      {/* Live Status Header Bar */}
      <div className="p-3 bg-white border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-primary px-3 py-2 rounded-pill font-heading d-inline-flex align-items-center gap-1">
            <i className="bi bi-bicycle"></i> Live Express Rider
          </span>
          <span className="text-muted small">
            Distance: <strong className="text-dark font-heading">{distanceKm} km</strong> • ETA:{" "}
            <strong className="text-dark font-heading">~{etaMinutes} mins</strong>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Map Style Selector */}
          {!hasWebGLError && (
            <div className="btn-group btn-group-sm rounded-pill p-1 bg-light border">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-2 py-0 font-heading ${
                  selectedStyle === "voyager" ? "btn-white shadow-xs fw-bold" : "text-muted"
                }`}
                onClick={() => setSelectedStyle("voyager")}
              >
                Voyager
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-2 py-0 font-heading ${
                  selectedStyle === "streets" ? "btn-white shadow-xs fw-bold" : "text-muted"
                }`}
                onClick={() => setSelectedStyle("streets")}
              >
                Streets
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-2 py-0 font-heading ${
                  selectedStyle === "satellite" ? "btn-white shadow-xs fw-bold" : "text-muted"
                }`}
                onClick={() => setSelectedStyle("satellite")}
              >
                Satellite
              </button>
            </div>
          )}

          {/* Simulation Toggle */}
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 font-heading fw-semibold d-inline-flex align-items-center gap-1 ${
              isLiveSimulating ? "btn-danger" : "btn-crave-secondary"
            }`}
            onClick={toggleClientSimulation}
          >
            <i className={isLiveSimulating ? "bi bi-pause-fill" : "bi bi-play-fill"}></i>
            <span>{isLiveSimulating ? "Pause Trip" : "Simulate Rider Movement"}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-light border rounded-pill px-3 text-muted d-inline-flex align-items-center gap-1"
            title="Recenter and reset coordinates"
            onClick={resetPosition}
          >
            <i className="bi bi-arrow-clockwise"></i> Reset
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div
        className="position-relative"
        style={{
          width: "100%",
          height: "460px",
          minHeight: "460px",
          backgroundColor: "#0F172A",
          overflow: "hidden",
        }}
      >
        {!hasWebGLError ? (
          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: "100%",
              minHeight: "460px",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        ) : (
          <canvas
            ref={fallbackCanvasRef}
            width={900}
            height={460}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        )}
      </div>

      {/* Legend & Telemetry Footer */}
      <div className="p-3 bg-light border-top d-flex flex-wrap justify-content-between align-items-center gap-3 small text-muted">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span className="d-inline-flex align-items-center gap-1">
            <span
              className="badge bg-primary rounded-circle p-1"
              style={{ width: "8px", height: "8px" }}
            ></span>
            <i className="bi bi-shop text-primary"></i> <strong>{restaurantName}</strong>
          </span>
          <span className="d-inline-flex align-items-center gap-1">
            <span
              className="badge bg-primary rounded-circle p-1"
              style={{ width: "8px", height: "8px", backgroundColor: "#2563EB" }}
            ></span>
            <i className="bi bi-bicycle text-primary" style={{ color: "#2563EB" }}></i>{" "}
            <strong>Delivery Partner</strong>
          </span>
          <span className="d-inline-flex align-items-center gap-1">
            <span
              className="badge bg-success rounded-circle p-1"
              style={{ width: "8px", height: "8px" }}
            ></span>
            <i className="bi bi-house-door text-success"></i> <strong>{customerAddress}</strong>
          </span>
        </div>

        <div className="small font-monospace text-muted d-flex align-items-center gap-2">
          <span>
            LAT: {deliveryPos.lat?.toFixed(4)}, LNG: {deliveryPos.lng?.toFixed(4)}
          </span>
          <span>•</span>
          <span>Ping: {lastUpdate}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
