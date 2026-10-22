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

      socket.on("updatingRestOrder", () => {
        toast.info("New kitchen order received!");
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
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <span className="badge rounded-pill bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-3 py-1 font-heading small mb-1">
              KITCHEN DISPLAY SYSTEM (KDS)
            </span>
            <h3 className="fw-bold font-heading text-dark mb-0">Incoming Orders Dashboard</h3>
            <p className="text-muted small mb-0">Manage kitchen preparation and dispatch status in real-time</p>
          </div>
          <span className="badge bg-primary px-3 py-2 rounded-pill font-heading">
            Active Orders: {orders.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted font-heading">Retrieving incoming kitchen orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card shadow-xs border-0 rounded-4 text-center py-5 p-4 bg-white my-4">
            <div className="mx-auto text-muted mb-3 p-3 bg-light rounded-circle" style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-cup-hot fs-1 text-warning"></i>
            </div>
            <h4 className="mt-2 fw-bold font-heading text-dark">No active orders right now</h4>
            <p className="text-muted small mx-auto" style={{ maxWidth: "400px" }}>
              New customer orders will ring here automatically via live WebSocket updates as soon as foodies checkout.
            </p>
          </div>
        ) : (
          <div className="card border-0 shadow-xs rounded-4 overflow-hidden bg-white">
            <div className="crave-table-container">
              <table className="crave-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Food Item</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Kitchen Action</th>
                    <th>Payment</th>
                    <th>Delivery Partner</th>
                    <th>Time</th>
                    <th className="text-end">Map</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <RestaurantOrderCard
                      order={order}
                      key={order._id}
                      index={index}
                      onRefresh={loadRestaurantOrders}
                    />
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
