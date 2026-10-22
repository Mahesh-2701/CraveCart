import React, { useEffect, useState, useRef } from "react";
import Footer from "../components/Footer";
import DeliveryNavbar from "../components/DeliveryNavbar";
import api, { getSocket, getImageUrl } from "../config/api";
import { toast, ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeOffer, setActiveOffer] = useState(null);
  const [remainingSecs, setRemainingSecs] = useState(0);

  // OTP Modal State
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [completing, setCompleting] = useState(false);

  const deliveryPersonId = localStorage.getItem("id");
  const timerRef = useRef(null);

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

  const loadActiveOffers = () => {
    if (!deliveryPersonId) return;
    api
      .get(`/delivery/offers/${deliveryPersonId}`)
      .then((res) => {
        if (res.data.hasOffer && res.data.offer) {
          setActiveOffer(res.data.offer);
          setRemainingSecs(res.data.offer.remainingSeconds || 45);
        } else {
          setActiveOffer(null);
        }
      })
      .catch(() => {});
  };

  // Offer countdown timer effect
  useEffect(() => {
    if (activeOffer && remainingSecs > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSecs((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setActiveOffer(null);
            loadActiveOffers();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeOffer, remainingSecs]);

  useEffect(() => {
    loadDeliveryOrders();
    loadActiveOffers();

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

      // High-priority delivery offer received via dispatch engine
      socket.on("delivery:offer_received", (data) => {
        toast.info(`New Delivery Offer from ${data.restaurantName || "Restaurant"}!`);
        setActiveOffer(data);
        setRemainingSecs(data.remainingSeconds || 45);
      });

      socket.on("delivery:offer_expired", () => {
        toast.warn("Offer expired. Looking for new trips...");
        setActiveOffer(null);
      });

      const onAssignmentConfirmed = () => {
        toast.success("Delivery confirmed and assigned to you!");
        setActiveOffer(null);
        loadDeliveryOrders();
      };

      socket.on("delivery:assignment_confirmed", onAssignmentConfirmed);
      socket.on("updatingDelivery", onAssignmentConfirmed);
      socket.on("delivery:assigned", onAssignmentConfirmed);

      socket.on("deliveryOrderUpdate", () => {
        loadDeliveryOrders();
      });

      socket.on("order:ready", () => {
        toast.info("Restaurant marked the food READY for pickup!");
        loadDeliveryOrders();
      });
    }

    // Background poll for offers every 8s if online
    const offerPoll = setInterval(() => {
      if (isAvailable) {
        loadActiveOffers();
      }
    }, 8000);

    return () => {
      clearInterval(offerPoll);
      if (deliveryPersonId) {
        socket.emit("leave", `delivery_${deliveryPersonId}`);
        socket.off("delivery:offer_received");
        socket.off("delivery:offer_expired");
        socket.off("delivery:assignment_confirmed");
        socket.off("updatingDelivery");
        socket.off("delivery:assigned");
        socket.off("deliveryOrderUpdate");
        socket.off("order:ready");
      }
    };
  }, [deliveryPersonId, isAvailable]);

  const toggleAvailability = () => {
    const nextState = !isAvailable;
    api
      .patch(`/delivery/availability/${deliveryPersonId}`, { isAvailable: nextState })
      .then((res) => {
        setIsAvailable(nextState);
        toast.success(res.data.message);
        if (!nextState) setActiveOffer(null);
        else loadActiveOffers();
      })
      .catch((err) => toast.error("Error: " + (err.response?.data?.message || err.message)));
  };

  const handleAcceptOffer = (orderId) => {
    api
      .post(`/delivery/offers/${orderId}/accept`, { deliveryPartnerId: deliveryPersonId })
      .then((res) => {
        toast.success(res.data.message || "Offer accepted!");
        setActiveOffer(null);
        loadDeliveryOrders();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to accept offer. It may have expired.");
        setActiveOffer(null);
        loadActiveOffers();
      });
  };

  const handleDeclineOffer = (orderId) => {
    api
      .post(`/delivery/offers/${orderId}/decline`, { deliveryPartnerId: deliveryPersonId, reason: "Declined by rider" })
      .then((res) => {
        toast.info("Offer declined. Passing to next candidate.");
        setActiveOffer(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Error declining offer");
        setActiveOffer(null);
      });
  };

  const handleArrivedAtRestaurant = (orderId) => {
    api
      .post(`/delivery/order/${orderId}/arrived`, { deliveryPartnerId: deliveryPersonId })
      .then((res) => {
        toast.success(res.data.message || "Arrival recorded.");
        loadDeliveryOrders();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const handleConfirmPickup = (orderId) => {
    api
      .post(`/delivery/order/${orderId}/pickup`, { deliveryPartnerId: deliveryPersonId })
      .then((res) => {
        toast.success(res.data.message || "Food picked up! Heading to customer.");
        loadDeliveryOrders();
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const handleCompleteDelivery = () => {
    if (!otpModalOrder) return;
    setCompleting(true);
    api
      .post(`/delivery/order/${otpModalOrder._id}/complete`, {
        deliveryPartnerId: deliveryPersonId,
        otp: enteredOtp.trim(),
      })
      .then((res) => {
        toast.success(res.data.message || "Order delivered successfully!");
        setOtpModalOrder(null);
        setEnteredOtp("");
        setCompleting(false);
        loadDeliveryOrders();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Delivery completion failed. Check OTP.");
        setCompleting(false);
      });
  };

  const startSimulation = (orderId) => {
    api
      .post(`/delivery/simulate/${orderId}`)
      .then((res) => {
        toast.info(res.data.message);
        loadDeliveryOrders();
      })
      .catch((err) => toast.error("Simulation error: " + (err.response?.data?.message || err.message)));
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <DeliveryNavbar />

      <div className="container py-4 flex-grow-1">
        {/* Availability Header */}
        <div className="card shadow-xs border-0 rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-1 font-heading small mb-1">
                <i className="bi bi-bicycle me-1"></i> DRIVER OPERATIONS
              </span>
              <h3 className="fw-bold font-heading text-dark mb-1">Delivery Partner Dispatch Hub</h3>
              <p className="text-muted small mb-0">Autonomous dispatch, explicit trip offers & multi-stage delivery execution</p>
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className={`badge px-3 py-2 rounded-pill font-heading fs-6 d-inline-flex align-items-center gap-2 ${isAvailable ? "bg-success" : "bg-secondary"}`}>
                <span className="spinner-grow spinner-grow-sm" style={{ width: "6px", height: "6px" }} />
                {isAvailable ? "Online (Taking Trips)" : "Offline (Paused)"}
              </span>
              <button
                className={`btn rounded-pill px-4 fw-semibold font-heading ${isAvailable ? "btn-outline-danger" : "btn-crave-primary"}`}
                onClick={toggleAvailability}
              >
                {isAvailable ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Incoming Offer Card */}
        {activeOffer && isAvailable && (
          <div
            className="card border-0 shadow-xl rounded-4 p-4 mb-4"
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              color: "#FFFFFF",
              borderLeft: "6px solid #FF5200",
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div>
                <span className="badge bg-danger rounded-pill px-3 py-1 mb-2 text-uppercase fw-bold font-heading" style={{ letterSpacing: "1px" }}>
                  <i className="bi bi-lightning-charge-fill me-1"></i> New Delivery Trip Offer
                </span>
                <h4 className="fw-bold font-heading mb-0 text-white">{activeOffer.restaurantName}</h4>
                <p className="text-white-50 small mb-0">
                  <i className="bi bi-geo-alt me-1"></i> {activeOffer.restaurantAddress}
                </p>
              </div>

              {/* Animated Countdown Timer */}
              <div className="text-end">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 border border-2 border-warning"
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#F59E0B",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  {remainingSecs}s
                </div>
                <small className="text-white-50 font-heading">Acceptance Window</small>
              </div>
            </div>

            <div className="row g-3 my-2 py-3 rounded-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="col-12 col-sm-4 text-center border-end border-secondary">
                <small className="text-white-50 d-block font-heading">Deliver To</small>
                <strong className="text-white text-truncate d-block px-2">{activeOffer.customerAddress || "Customer Address"}</strong>
              </div>
              <div className="col-12 col-sm-4 text-center border-end border-secondary">
                <small className="text-white-50 d-block font-heading">Order Value</small>
                <strong className="text-white font-heading">₹{activeOffer.totalAmount}</strong>
              </div>
              <div className="col-12 col-sm-4 text-center">
                <small className="text-white-50 d-block font-heading">Estimated Rider Earnings</small>
                <strong className="text-warning fs-5 font-heading">₹{activeOffer.estimatedPayout || 65}</strong>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 mt-3">
              <button
                className="btn btn-outline-light rounded-pill px-4 py-2 font-heading"
                onClick={() => handleDeclineOffer(activeOffer.orderId)}
              >
                Decline
              </button>
              <button
                className="btn btn-crave-primary rounded-pill px-5 py-2 fw-bold font-heading shadow-md"
                onClick={() => handleAcceptOffer(activeOffer.orderId)}
              >
                <i className="bi bi-check-lg me-1"></i> Accept Trip (+₹{activeOffer.estimatedPayout || 65})
              </button>
            </div>
          </div>
        )}

        {/* Assigned Orders Table */}
        <div className="card shadow-xs border-0 rounded-4 overflow-hidden bg-white p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold font-heading text-dark mb-0">Assigned Trips & Active Lifecycle ({orders.length})</h5>
              <small className="text-muted">Lifecycle: Arrive at Kitchen → Confirm Pickup → OTP Handover</small>
            </div>
            <button
              className="btn btn-sm btn-crave-secondary rounded-pill px-3 font-heading d-inline-flex align-items-center gap-1"
              onClick={loadDeliveryOrders}
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh Trips
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 text-muted font-heading">Retrieving trip assignments...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5">
              <div className="mx-auto text-muted mb-3 p-3 bg-light rounded-circle" style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="bi bi-bicycle fs-1 text-primary"></i>
              </div>
              <h5 className="mt-2 fw-bold font-heading text-dark">No active trips</h5>
              <p className="text-muted small mx-auto" style={{ maxWidth: "380px" }}>
                Ensure your driver status is set to "Online" above to receive incoming delivery requests in your zone.
              </p>
            </div>
          ) : (
            <div className="crave-table-container">
              <table className="crave-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dish / Order</th>
                    <th>Customer & Address</th>
                    <th>Restaurant</th>
                    <th>Earnings</th>
                    <th>Kitchen State</th>
                    <th>Delivery State</th>
                    <th className="text-end">Rider Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const dishName = order.menuid?.name || (order.items && order.items[0]?.name) || "Dish";
                    const dishImg = order.menuid?.image ? getImageUrl(order.menuid.image) : "";
                    const kitchenState = order.orderStatus || (order.status === "Delivered" ? "DELIVERED" : order.status === "Ready for Pickup" ? "READY_FOR_PICKUP" : "PREPARING");
                    const deliveryState = order.deliveryStatus || (order.status === "Delivered" ? "DELIVERED" : order.status === "Out for Delivery" ? "OUT_FOR_DELIVERY" : "ASSIGNED");

                    const isFoodReady = kitchenState === "READY_FOR_PICKUP" || kitchenState === "PICKED_UP" || kitchenState === "DELIVERED" || order.status === "Ready for Pickup";

                    return (
                      <tr key={order._id}>
                        <td className="text-muted small">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            {dishImg && (
                              <img
                                src={dishImg}
                                alt={dishName}
                                className="rounded-3 shadow-xs object-fit-cover me-2"
                                style={{ width: "42px", height: "42px" }}
                              />
                            )}
                            <div>
                              <span className="fw-bold font-heading text-dark d-block">{dishName}</span>
                              <small className="text-muted font-monospace">#{order._id.slice(-6).toUpperCase()}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold text-dark">{order.userid?.name || "Customer"}</span>
                          <small className="d-block text-muted text-truncate" style={{ maxWidth: "200px" }}>
                            <i className="bi bi-geo-alt text-danger me-1"></i> {order.address}
                          </small>
                        </td>
                        <td>
                          <span className="fw-semibold text-dark">{order.menuid?.restaurantid?.name || "Kitchen"}</span>
                          <small className="d-block text-muted text-truncate" style={{ maxWidth: "160px" }}>
                            {order.menuid?.restaurantid?.address || "Pickup Point"}
                          </small>
                        </td>
                        <td className="fw-bold font-heading text-success">
                          ₹{Math.round(45 + (order.deliveryFee || 50) * 0.7)}
                        </td>
                        <td>
                          <span
                            className={`badge px-2 py-1 rounded-pill font-heading ${
                              kitchenState === "READY_FOR_PICKUP"
                                ? "bg-success bg-opacity-10 text-success border border-success"
                                : kitchenState === "PREPARING"
                                ? "bg-warning bg-opacity-10 text-dark border border-warning"
                                : "bg-light text-dark border"
                            }`}
                          >
                            {kitchenState}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge px-2 py-1 rounded-pill font-heading ${
                              deliveryState === "DELIVERED"
                                ? "bg-success"
                                : deliveryState === "OUT_FOR_DELIVERY"
                                ? "bg-primary"
                                : deliveryState === "ARRIVED_AT_RESTAURANT"
                                ? "bg-info text-dark"
                                : "bg-secondary"
                            }`}
                          >
                            {deliveryState}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end flex-wrap gap-1">
                            {/* Stage 1: Rider assigned -> Needs to arrive at restaurant */}
                            {deliveryState === "ASSIGNED" && (
                              <button
                                className="btn btn-sm btn-info text-white rounded-pill px-3 fw-semibold font-heading"
                                onClick={() => handleArrivedAtRestaurant(order._id)}
                              >
                                <i className="bi bi-geo-alt me-1"></i> Arrived
                              </button>
                            )}

                            {/* Stage 2: Rider arrived at restaurant -> Can pick up once food is ready */}
                            {deliveryState === "ARRIVED_AT_RESTAURANT" && (
                              isFoodReady ? (
                                <button
                                  className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold font-heading shadow-xs"
                                  onClick={() => handleConfirmPickup(order._id)}
                                >
                                  <i className="bi bi-box-seam me-1"></i> Pick Up Food
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-warning text-dark rounded-pill px-3 font-heading"
                                  disabled
                                  title="Food is still being prepared by restaurant"
                                >
                                  <span className="spinner-border spinner-border-sm me-1" /> Cooking...
                                </button>
                              )
                            )}

                            {/* Stage 3: Out for delivery -> Enter OTP and complete */}
                            {(deliveryState === "OUT_FOR_DELIVERY" || deliveryState === "PICKED_UP") && (
                              <>
                                <button
                                  className="btn btn-sm btn-success rounded-pill px-3 fw-semibold font-heading shadow-xs"
                                  onClick={() => {
                                    setOtpModalOrder(order);
                                    setEnteredOtp("");
                                  }}
                                >
                                  <i className="bi bi-check-lg me-1"></i> Handover PIN
                                </button>
                                <button
                                  className="btn btn-sm btn-crave-secondary rounded-pill px-2 font-heading"
                                  title="Broadcast simulated GPS route"
                                  onClick={() => startSimulation(order._id)}
                                >
                                  <i className="bi bi-broadcast text-warning me-1"></i> Demo GPS
                                </button>
                              </>
                            )}

                            {deliveryState === "DELIVERED" && (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-1 rounded-pill font-heading">
                                Completed
                              </span>
                            )}

                            <Link
                              to={`/orders/track/${order._id}`}
                              className="btn btn-sm btn-light border rounded-pill px-3 font-heading"
                            >
                              <i className="bi bi-map"></i>
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

      {/* Delivery Confirmation OTP Modal */}
      {otpModalOrder && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-xl p-4 bg-white">
              <div className="modal-header border-0 pb-0">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                    <i className="bi bi-shield-lock-fill fs-5"></i>
                  </div>
                  <h5 className="modal-title fw-bold font-heading text-dark">Confirm Delivery Handover</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setOtpModalOrder(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body text-center py-4">
                <p className="text-muted small mb-3">
                  Ask customer <strong>{otpModalOrder.userid?.name || "Customer"}</strong> for their 4-digit verification PIN displayed on their live tracking screen.
                </p>

                <div className="d-flex justify-content-center mb-3">
                  <input
                    type="text"
                    maxLength="6"
                    className="form-control text-center fs-2 fw-bold font-monospace rounded-3 border-primary"
                    style={{ width: "220px", letterSpacing: "8px" }}
                    placeholder="••••"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    autoFocus
                  />
                </div>
                <small className="text-muted d-block">
                  Order #{otpModalOrder._id.slice(-6).toUpperCase()} • {otpModalOrder.address}
                </small>
              </div>
              <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-crave-secondary rounded-pill px-4"
                  onClick={() => setOtpModalOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success rounded-pill px-4 fw-bold font-heading"
                  disabled={completing}
                  onClick={handleCompleteDelivery}
                >
                  {completing ? "Verifying PIN..." : "Confirm Handover"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
