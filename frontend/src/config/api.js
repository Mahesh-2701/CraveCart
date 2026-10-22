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

export const MAP_STYLE =
  process.env.REACT_APP_MAP_STYLE || "https://demotiles.maplibre.org/style.json";

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
