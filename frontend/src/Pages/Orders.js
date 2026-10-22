import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import api, { getSocket, getImageUrl } from "../config/api";
import AIChatWidget from "../components/AIChatWidget";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("id");

  const handleReorder = (order) => {
    if (!userId) {
      toast.error("Please sign in to reorder.");
      return;
    }
    const itemsToReorder =
      order.items && order.items.length > 0
        ? order.items
        : order.menuid
        ? [{ menuid: order.menuid, quantity: order.quantity || 1, price: order.price }]
        : [];

    if (itemsToReorder.length === 0) {
      toast.error("Unable to find menu items for reordering.");
      return;
    }

    Promise.all(
      itemsToReorder.map((item) =>
        api.post(`/user/cart/${userId}`, {
          menuid: item.menuid?._id || item.menuid,
          quantity: item.quantity || 1,
          price: item.price,
        })
      )
    )
      .then(() => {
        toast.success("Dishes added to cart!");
        navigate("/user/cart");
      })
      .catch((err) => {
        toast.error("Failed to reorder: " + (err.response?.data?.message || err.message));
      });
  };

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
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1 fw-bold small">
              ORDER TIMELINE
            </span>
            <h2 className="fw-bold font-heading text-dark mt-1 mb-0">Your Order History</h2>
            <p className="text-muted small mb-0">Track live deliveries and revisit your previous dining experiences</p>
          </div>
          <Link to="/foods" className="btn btn-sm btn-crave-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1">
            <i className="bi bi-plus-lg"></i>
            <span>Order More Dishes</span>
          </Link>
        </div>

        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4].map((n) => (
              <div className="col-12 col-lg-6" key={n}>
                <div className="card border-0 shadow-xs rounded-4 p-3 bg-white">
                  <div className="row g-0">
                    <div className="col-4">
                      <div className="skeleton rounded-3 h-100" style={{ minHeight: "140px" }}></div>
                    </div>
                    <div className="col-8 ps-3">
                      <div className="skeleton rounded-pill mb-2" style={{ height: "20px", width: "60%" }}></div>
                      <div className="skeleton rounded-pill mb-2" style={{ height: "14px", width: "40%" }}></div>
                      <div className="skeleton rounded-pill mb-3" style={{ height: "14px", width: "80%" }}></div>
                      <div className="skeleton rounded-pill" style={{ height: "30px", width: "50%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="card shadow-xs border-0 rounded-4 text-center py-5 p-4 bg-white my-4">
            <div className="mx-auto text-muted mb-3 p-3 bg-light rounded-circle" style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-box-seam fs-1 text-primary"></i>
            </div>
            <h4 className="mt-2 fw-bold font-heading text-dark">No orders placed yet</h4>
            <p className="text-muted small mx-auto" style={{ maxWidth: "380px" }}>
              Your culinary journey begins with your first order. Explore our menu to discover top-rated dishes!
            </p>
            <div>
              <Link to="/foods" className="btn btn-crave-primary px-4 py-2 mt-2">
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
                  <div className="card border-0 shadow-xs rounded-4 overflow-hidden h-100 crave-card bg-white">
                    <div className="row g-0 h-100">
                      <div className="col-sm-4 position-relative">
                        <img
                          src={orderImg}
                          className="img-fluid h-100 w-100 object-fit-cover"
                          alt={dishName}
                          style={{ minHeight: "170px" }}
                        />
                        {isActive && (
                          <span
                            className="badge bg-danger position-absolute top-0 start-0 m-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-1 font-heading"
                            style={{ fontSize: "10px" }}
                          >
                            <span className="spinner-grow spinner-grow-sm" style={{ width: "6px", height: "6px" }} />
                            LIVE TRIP
                          </span>
                        )}
                      </div>

                      <div className="col-sm-8 d-flex flex-column justify-content-between p-3">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <h5 className="fw-bold font-heading mb-0 text-dark">{dishName}</h5>
                              <small className="text-muted">{restaurantName}</small>
                            </div>
                            <span
                              className={`badge px-2 py-1 rounded-pill font-heading ${
                                order.status === "Delivered"
                                  ? "bg-success bg-opacity-10 text-success border border-success"
                                  : order.status === "Out for Delivery"
                                  ? "bg-primary bg-opacity-10 text-primary border border-primary"
                                  : "bg-warning bg-opacity-10 text-warning border border-warning"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <p className="text-muted small mb-2" style={{ fontSize: "0.8rem" }}>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          <div className="small text-muted mb-2">
                            <span>Qty: <strong className="text-dark">{order.quantity || 1}</strong></span> |{" "}
                            <span>Total: <strong className="text-primary font-heading">₹{order.totalAmount || order.price}</strong></span> |{" "}
                            <span>Payment: <strong className="text-dark">{order.paymentmethod}</strong></span>
                          </div>

                          <div className="small text-truncate text-muted d-flex align-items-center gap-1">
                            <i className="bi bi-geo-alt text-danger"></i>
                            <span>{order.address}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <span className="small text-muted font-monospace">
                            #{order._id.slice(-6).toUpperCase()}
                          </span>
                          <div className="d-flex gap-2">
                            {(order.status === "Placed" || order.orderStatus === "PLACED") && (
                              <button
                                className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to cancel this order?")) {
                                    api.post(`/user/order/cancel/${order._id}`)
                                      .then((res) => {
                                        toast.success(res.data.message || "Order cancelled");
                                        loadOrders();
                                      })
                                      .catch((err) => toast.error(err.response?.data?.message || "Cannot cancel"));
                                  }
                                }}
                              >
                                Cancel Order
                              </button>
                            )}
                            {order.status === "Delivered" && (
                              <button
                                className="btn btn-sm btn-outline-primary rounded-pill px-3 font-heading fw-semibold d-inline-flex align-items-center gap-1"
                                onClick={() => handleReorder(order)}
                                title="Add items from this order to cart"
                              >
                                <i className="bi bi-arrow-repeat"></i>
                                <span>Order Again</span>
                              </button>
                            )}
                            <Link
                              to={`/orders/track/${order._id}`}
                              className={`btn btn-sm rounded-pill px-3 font-heading fw-semibold d-inline-flex align-items-center gap-1 ${
                                isActive ? "btn-crave-primary" : "btn-crave-secondary"
                              }`}
                            >
                              <i className={isActive ? "bi bi-compass-fill" : "bi bi-map"}></i>
                              <span>{isActive ? "Track Live Map" : "View Details"}</span>
                            </Link>
                          </div>
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
