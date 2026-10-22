import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import api, { getSocket, getImageUrl } from "../config/api";
import AIChatWidget from "../components/AIChatWidget";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("id");

  const loadOrders = () => {
    if (!userId) return;
    api
      .get(`/user/orders/${userId}`)
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load orders: " + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();

    const socket = getSocket();
    if (userId) {
      socket.emit("join", `user_${userId}`);

      socket.on("orderStatusChanged", (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
        toast.info(`Order #${updatedOrder._id.slice(-6).toUpperCase()} is now ${updatedOrder.status}!`);
      });

      socket.on("orderPlaced", (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
      });
    }

    return () => {
      if (userId) {
        socket.emit("leave", `user_${userId}`);
        socket.off("orderStatusChanged");
        socket.off("orderPlaced");
      }
    };
  }, [userId]);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <section className="container py-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Your Order History</h2>
            <p className="text-muted small mb-0">Track live deliveries and view past meals</p>
          </div>
          <Link to="/foods" className="btn btn-outline-primary rounded-pill px-3">
            + Order More Food
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Retrieving your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center py-5 p-4">
            <span style={{ fontSize: "54px" }}>📦</span>
            <h4 className="mt-3 fw-bold">No orders placed yet</h4>
            <p className="text-muted">You haven't ordered anything delicious yet. Let's fix that!</p>
            <div>
              <Link to="/foods" className="btn btn-primary-crave px-4 py-2 mt-2">
                Explore Menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {orders.map((order) => {
              const isActive = ["Preparing", "Ready for Pickup", "Out for Delivery"].includes(order.status);
              const dishName = order.menuid?.name || (order.items && order.items[0]?.name) || "Food Order";
              const restaurantName = order.menuid?.restaurantid?.name || "Kitchen Partner";
              const orderImg = order.menuid?.image
                ? getImageUrl(order.menuid.image)
                : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";

              return (
                <div className="col-12 col-lg-6" key={order._id}>
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 food-card-v2">
                    <div className="row g-0 h-100">
                      <div className="col-sm-4 position-relative">
                        <img
                          src={orderImg}
                          className="img-fluid h-100 w-100"
                          alt={dishName}
                          style={{ objectFit: "cover", minHeight: "170px" }}
                        />
                        {isActive && (
                          <span
                            className="badge bg-danger position-absolute top-0 start-0 m-2 rounded-pill shadow-sm"
                            style={{ fontSize: "11px" }}
                          >
                            ● LIVE
                          </span>
                        )}
                      </div>

                      <div className="col-sm-8 d-flex flex-column justify-content-between p-3">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <h5 className="fw-bold mb-0">{dishName}</h5>
                              <small className="text-muted">{restaurantName}</small>
                            </div>
                            <span
                              className={`badge px-2 py-1 rounded-pill ${
                                order.status === "Delivered"
                                  ? "bg-success"
                                  : order.status === "Out for Delivery"
                                  ? "bg-primary"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <p className="text-muted small mb-2">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          <div className="small text-muted mb-2">
                            <span>Qty: <strong>{order.quantity || 1}</strong></span> |{" "}
                            <span>Total: <strong className="text-primary">₹{order.totalAmount || order.price}</strong></span> |{" "}
                            <span>Payment: <strong>{order.paymentmethod}</strong></span>
                          </div>

                          <div className="small text-truncate text-muted">
                            📍 {order.address}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                          <span className="small text-muted">
                            Order #{order._id.slice(-6).toUpperCase()}
                          </span>
                          <Link
                            to={`/orders/track/${order._id}`}
                            className={`btn btn-sm rounded-pill px-3 ${
                              isActive ? "btn-primary-crave" : "btn-outline-secondary"
                            }`}
                          >
                            {isActive ? "🛵 Track Live Map" : "View Details & Map"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AIChatWidget />
      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
