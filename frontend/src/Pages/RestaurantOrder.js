import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import RestaurantNavbar from "../components/RestaurantNavbar";
import { toast, ToastContainer } from "react-toastify";
import RestaurantOrderCard from "../components/RestaurantOrderCard";
import api, { getSocket } from "../config/api";

export default function RestaurantOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const restaurantId = localStorage.getItem("id");

  const loadRestaurantOrders = () => {
    if (!restaurantId) return;
    api
      .get(`/restaurant/order/${restaurantId}`)
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Network Error: " + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRestaurantOrders();

    const socket = getSocket();
    if (restaurantId) {
      socket.emit("join", `restaurant_${restaurantId}`);

      socket.on("updatingRestOrder", (newOrders) => {
        toast.info("🔔 New order received!");
        loadRestaurantOrders();
      });
    }

    return () => {
      if (restaurantId) {
        socket.emit("leave", `restaurant_${restaurantId}`);
        socket.off("updatingRestOrder");
      }
    };
  }, [restaurantId]);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <RestaurantNavbar />
      <div className="container py-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0">Incoming Orders Dashboard</h3>
            <p className="text-muted small mb-0">Manage kitchen preparation and dispatch status in real-time</p>
          </div>
          <span className="badge bg-primary px-3 py-2 rounded-pill">
            Active Orders: {orders.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Retrieving incoming orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center py-5 p-4 bg-white">
            <span style={{ fontSize: "52px" }}>👨‍🍳</span>
            <h4 className="mt-3 fw-bold">No orders right now</h4>
            <p className="text-muted">New customer orders will ring here automatically via live WebSocket updates.</p>
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="py-3 ps-3">#</th>
                    <th className="py-3">Food Item</th>
                    <th className="py-3">Customer</th>
                    <th className="py-3">Qty</th>
                    <th className="py-3">Total</th>
                    <th className="py-3">Update Status</th>
                    <th className="py-3">Payment</th>
                    <th className="py-3">Delivery Partner</th>
                    <th className="py-3">Date</th>
                    <th className="py-3 pe-3">Live Map</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <RestaurantOrderCard order={order} key={order._id} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
