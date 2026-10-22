import axios from "axios";
import { io } from "socket.io-client";

// Detect API URL dynamically from environment or fallback to localhost
export const API_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://cravecart-5vz7.onrender.com");

export const WS_URL =
  process.env.REACT_APP_WS_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://cravecart-5vz7.onrender.com");

// Map API Key & Multiple High-Reliability Map Styles
export const MAP_KEY =
  process.env.REACT_APP_MAP_KEY || "cb1_4rod_1_bdb3f35922b85a77c1e0e8b6";

// High-resolution Street Map style for MapLibre GL
export const MAP_STYLE = {
  version: 8,
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${MAP_KEY}`,
        `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${MAP_KEY}`,
        `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${MAP_KEY}`,
        `https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=${MAP_KEY}`,
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

// Alternative satellite & street styles for live switcher
export const MAP_STYLES_PRESETS = {
  voyager: MAP_STYLE,
  streets: {
    version: 8,
    sources: {
      "esri-streets": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Tiles &copy; Esri, DeLorme, NAVTEQ",
      },
    },
    layers: [{ id: "esri-streets-layer", type: "raster", source: "esri-streets" }],
  },
  satellite: {
    version: 8,
    sources: {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
      },
    },
    layers: [{ id: "esri-satellite-layer", type: "raster", source: "esri-satellite" }],
  },
};


// Centralized Axios instance
export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Singleton Socket.IO instance
let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const token = localStorage.getItem("token");
    socketInstance = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
  }
  return socketInstance;
};

// Image URL formatter supporting local uploads, relative paths, and remote URLs
export const getImageUrl = (imagePath, fallback = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500") => {
  if (!imagePath) return fallback;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${API_URL}${cleanPath}`;
};

export default api;
