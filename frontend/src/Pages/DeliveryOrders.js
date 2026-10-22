import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import DeliveryNavbar from "../components/DeliveryNavbar";
import api, { getSocket, getImageUrl } from "../config/api";
import { toast, ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const deliveryPersonId = localStorage.getItem("id");

  const loadDeliveryOrders = () => {
    if (!deliveryPersonId) return;
    api
      .get(`/delivery/order/${deliveryPersonId}`)
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to load assignments: " + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDeliveryOrders();

    // Check delivery partner availability
    if (deliveryPersonId) {
      api
        .get(`/delivery/view/${deliveryPersonId}`)
        .then((res) => {
          setIsAvailable(Boolean(res.data.isAvailable));
        })
        .catch(() => {});
    }

    const socket = getSocket();
    if (deliveryPersonId) {
      socket.emit("join", `delivery_${deliveryPersonId}`);

      socket.on("updatingDelivery", () => {
        toast.info("🛵 New delivery assignment received!");
        loadDeliveryOrders();
      });

      socket.on("deliveryOrderUpdate", () => {
        loadDeliveryOrders();
      });
    }

    return () => {
      if (deliveryPersonId) {
        socket.emit("leave", `delivery_${deliveryPersonId}`);
        socket.off("updatingDelivery");
        socket.off("deliveryOrderUpdate");
      }
    };
  }, [deliveryPersonId]);

  const toggleAvailability = () => {
    const nextState = !isAvailable;
    api
      .patch(`/delivery/availability/${deliveryPersonId}`, { isAvailable: nextState })
      .then((res) => {
        setIsAvailable(nextState);
        toast.success(res.data.message);
      })
      .catch((err) => toast.error("Error: " + (err.response?.data?.message || err.message)));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    api
      .patch(`/delivery/order/status/${orderId}`, { status: newStatus })
      .then((res) => {
        toast.success(res.data.message);
        loadDeliveryOrders();
      })
      .catch((err) => toast.error("Error updating status: " + (err.response?.data?.message || err.message)));
  };

  const startSimulation = (orderId) => {
    api
      .post(`/delivery/simulate/${orderId}`)
      .then((res) => {
        toast.info("🛵 " + res.data.message);
        loadDeliveryOrders();
      })
      .catch((err) => toast.error("Simulation error: " + (err.response?.data?.message || err.message)));
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <DeliveryNavbar />

      <div className="container py-4 flex-grow-1">
        {/* Availability Header */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h3 className="fw-bold mb-1">Delivery Partner Dispatch Portal</h3>
              <p className="text-muted small mb-0">Manage customer assignments and broadcast live GPS locations</p>
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className={`badge ${isAvailable ? "bg-success" : "bg-secondary"} px-3 py-2 rounded-pill`}>
                {isAvailable ? "● Online (Taking Deliveries)" : "○ Offline"}
              </span>
              <button
                className={`btn btn-sm rounded-pill px-3 ${isAvailable ? "btn-outline-danger" : "btn-success"}`}
                onClick={toggleAvailability}
              >
                {isAvailable ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Orders Table */}
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white p-3">
          <h5 className="fw-bold mb-3 ps-2">Assigned Deliveries ({orders.length})</h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 text-muted">Retrieving delivery assignments...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5">
              <span style={{ fontSize: "48px" }}>🛵</span>
              <h5 className="mt-3 fw-bold">No active deliveries</h5>
              <p className="text-muted">Turn your status Online to receive incoming nearby orders.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Dish / Order</th>
                    <th>Customer & Address</th>
                    <th>Restaurant</th>
                    <th>Price</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const dishName = order.menuid?.name || (order.items && order.items[0]?.name) || "Dish";
                    const dishImg = order.menuid?.image ? getImageUrl(order.menuid.image) : "";

                    return (
                      <tr key={order._id}>
                        <td className="fw-semibold">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            {dishImg && (
                              <img
                                src={dishImg}
                                alt={dishName}
                                style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px", marginRight: "10px" }}
                              />
                            )}
                            <div>
                              <span className="fw-bold text-dark">{dishName}</span>
                              <small className="d-block text-muted">#{order._id.slice(-6).toUpperCase()}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold">{order.userid?.name || "Customer"}</span>
                          <small className="d-block text-muted text-truncate" style={{ maxWidth: "200px" }}>
                            📍 {order.address}
                          </small>
                        </td>
                        <td>{order.menuid?.restaurantid?.name || "Kitchen"}</td>
                        <td className="fw-bold">₹{order.totalAmount || order.price}</td>
                        <td>
                          <span
                            className={`badge px-3 py-2 rounded-pill ${
                              order.status === "Delivered"
                                ? "bg-success"
                                : order.status === "Out for Delivery"
                                ? "bg-primary"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {order.status === "Preparing" && (
                              <button
                                className="btn btn-sm btn-primary rounded-pill px-3"
                                onClick={() => updateOrderStatus(order._id, "Out for Delivery")}
                              >
                                Picked Up 🛵
                              </button>
                            )}

                            {order.status === "Out for Delivery" && (
                              <>
                                <button
                                  className="btn btn-sm btn-success rounded-pill px-3"
                                  onClick={() => updateOrderStatus(order._id, "Delivered")}
                                >
                                  Delivered ✓
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-warning text-dark rounded-pill px-2"
                                  title="Test route simulator"
                                  onClick={() => startSimulation(order._id)}
                                >
                                  ⚡ Demo GPS
                                </button>
                              </>
                            )}

                            <Link
                              to={`/orders/track/${order._id}`}
                              className="btn btn-sm btn-outline-secondary rounded-pill px-2"
                            >
                              Map View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
