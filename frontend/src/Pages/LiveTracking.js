import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LiveTrackingMap from "../components/LiveTrackingMap";
import api, { getSocket } from "../config/api";
import { toast, ToastContainer } from "react-toastify";

export default function LiveTracking() {
  const { orderId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchTrackingDetails = useCallback(() => {
    if (!orderId) return;

    api
      .get(`/user/order-tracking/${orderId}`)
      .then((res) => {
        setTrackingData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load live tracking details.");
        setLoading(false);
      });
  }, [orderId]);

  useEffect(() => {
    fetchTrackingDetails();

    const socket = getSocket();
    if (orderId) {
      socket.emit("join", `order_${orderId}`);

      socket.on("orderStatusUpdate", fetchTrackingDetails);
      socket.on("order:accepted", fetchTrackingDetails);
      socket.on("delivery:status_update", fetchTrackingDetails);
      socket.on("deliveryOrderUpdate", fetchTrackingDetails);
      socket.on("delivery:assigned", () => {
        toast.info("Delivery partner assigned to your order!");
        fetchTrackingDetails();
      });
      socket.on("delivery:partner_arrived", () => {
        toast.info("Delivery partner arrived at kitchen for pickup!");
        fetchTrackingDetails();
      });
      socket.on("delivery:picked_up", () => {
        toast.info("Food picked up by rider! On the way to you.");
        fetchTrackingDetails();
      });
      socket.on("delivery:delivered", () => {
        toast.success("Order delivered! Enjoy your meal!");
        fetchTrackingDetails();
      });
    }

    // Fallback polling every 5 seconds ensures customer screen never hangs on stale state
    const pollTimer = setInterval(() => {
      fetchTrackingDetails();
    }, 5000);

    return () => {
      clearInterval(pollTimer);
      if (orderId) {
        socket.emit("leave", `order_${orderId}`);
        socket.off("orderStatusUpdate");
        socket.off("order:accepted");
        socket.off("delivery:status_update");
        socket.off("deliveryOrderUpdate");
        socket.off("delivery:assigned");
        socket.off("delivery:partner_arrived");
        socket.off("delivery:picked_up");
        socket.off("delivery:delivered");
      }
    };
  }, [orderId, fetchTrackingDetails]);

  const handleCancelOrder = () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    api
      .post(`/user/order/cancel/${orderId}`)
      .then((res) => {
        toast.success(res.data.message || "Order cancelled successfully.");
        setCancelling(false);
        fetchTrackingDetails();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Cannot cancel order at this stage.");
        setCancelling(false);
      });
  };

  if (loading) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
        <div className="container py-5 text-center flex-grow-1">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading tracking details...</span>
          </div>
          <p className="mt-3 text-muted font-heading">Connecting to CraveCart real-time telemetry...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Navbar />
        <div className="container py-5 text-center flex-grow-1">
          <h4 className="fw-bold font-heading">Order Tracking Unavailable</h4>
          <p className="text-muted">We could not retrieve tracking data for order #{orderId}.</p>
          <Link to="/user/orders" className="btn btn-crave-primary rounded-pill px-4">
            View All Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const orderStatus = trackingData.orderStatus || trackingData.status;
  const deliveryStatus = trackingData.deliveryStatus || "NOT_REQUESTED";

  // Dual-track coordinated statuses
  const kitchenSteps = [
    { label: "Order Placed", active: true },
    { label: "Cooking", active: ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERED", "Preparing", "Ready for Pickup", "Out for Delivery", "Delivered"].includes(orderStatus) },
    { label: "Food Ready", active: ["READY_FOR_PICKUP", "PICKED_UP", "DELIVERED", "Ready for Pickup", "Out for Delivery", "Delivered"].includes(orderStatus) },
    { label: "Handed Over", active: ["PICKED_UP", "DELIVERED", "Out for Delivery", "Delivered"].includes(orderStatus) },
  ];

  const deliverySteps = [
    { label: "Finding Rider", active: ["SEARCHING", "OFFERED", "ASSIGNED", "ARRIVED_AT_RESTAURANT", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(deliveryStatus) },
    { label: "Rider Assigned", active: ["ASSIGNED", "ARRIVED_AT_RESTAURANT", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(deliveryStatus) },
    { label: "Out for Delivery", active: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(deliveryStatus) },
    { label: "Delivered", active: deliveryStatus === "DELIVERED" },
  ];

  const canCancel = orderStatus === "PLACED" || orderStatus === "Placed";

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-4 flex-grow-1">
        {/* Header Breadcrumb */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <Link to="/user/orders" className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1 mb-1">
              <i className="bi bi-arrow-left"></i> Back to Orders
            </Link>
            <h3 className="fw-bold font-heading text-dark mt-1 mb-0">Live Telemetry Order Tracker</h3>
            <span className="text-muted small">
              Order ID: <strong className="font-monospace">#{trackingData.orderId.slice(-6).toUpperCase()}</strong>
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            {canCancel && (
              <button
                className="btn btn-sm btn-outline-danger rounded-pill px-3"
                disabled={cancelling}
                onClick={handleCancelOrder}
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            <span
              className={`badge px-3 py-2 rounded-pill fs-6 font-heading ${
                orderStatus === "DELIVERED" || deliveryStatus === "DELIVERED"
                  ? "bg-success"
                  : deliveryStatus === "OUT_FOR_DELIVERY"
                  ? "bg-primary"
                  : orderStatus === "CANCELLED"
                  ? "bg-danger"
                  : "bg-warning text-dark"
              }`}
            >
              {orderStatus === "CANCELLED" ? "CANCELLED" : deliveryStatus === "OUT_FOR_DELIVERY" ? "Out for Delivery" : orderStatus}
            </span>
          </div>
        </div>

        {/* Dual Coordinated Steppers */}
        <div className="row g-3 mb-4">
          {/* Kitchen Pipeline */}
          <div className="col-lg-6">
            <div className="card shadow-xs border-0 rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold font-heading text-dark small text-uppercase d-flex align-items-center gap-1" style={{ letterSpacing: "0.5px" }}>
                  <i className="bi bi-fire text-danger"></i> Kitchen Pipeline
                </span>
                <span className="badge bg-light text-dark border rounded-pill font-heading">{orderStatus}</span>
              </div>
              <div className="row text-center g-1 mt-2">
                {kitchenSteps.map((step, idx) => (
                  <div key={idx} className="col-3">
                    <div
                      className={`rounded-circle mx-auto d-flex align-items-center justify-content-center mb-1 ${
                        step.active ? "bg-warning text-dark fw-bold" : "bg-light text-muted border"
                      }`}
                      style={{ width: "32px", height: "32px", fontSize: "12px" }}
                    >
                      {step.active ? <i className="bi bi-check-lg"></i> : idx + 1}
                    </div>
                    <span className={`small d-block ${step.active ? "fw-bold text-dark font-heading" : "text-muted"}`} style={{ fontSize: "11px" }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Logistics Pipeline */}
          <div className="col-lg-6">
            <div className="card shadow-xs border-0 rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold font-heading text-dark small text-uppercase d-flex align-items-center gap-1" style={{ letterSpacing: "0.5px" }}>
                  <i className="bi bi-bicycle text-primary"></i> Delivery Logistics
                </span>
                <span className="badge bg-primary text-white rounded-pill font-heading">{deliveryStatus}</span>
              </div>
              <div className="row text-center g-1 mt-2">
                {deliverySteps.map((step, idx) => (
                  <div key={idx} className="col-3">
                    <div
                      className={`rounded-circle mx-auto d-flex align-items-center justify-content-center mb-1 ${
                        step.active ? "bg-primary text-white fw-bold" : "bg-light text-muted border"
                      }`}
                      style={{ width: "32px", height: "32px", fontSize: "12px" }}
                    >
                      {step.active ? <i className="bi bi-check-lg"></i> : idx + 1}
                    </div>
                    <span className={`small d-block ${step.active ? "fw-bold text-dark font-heading" : "text-muted"}`} style={{ fontSize: "11px" }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery OTP Handover PIN Box */}
        {trackingData.deliveryOtp && deliveryStatus !== "DELIVERED" && orderStatus !== "CANCELLED" && (
          <div
            className="card border-0 shadow-xs rounded-4 p-3 mb-4"
            style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)", border: "1px solid #86EFAC" }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white p-2 rounded-circle shadow-xs text-success">
                  <i className="bi bi-shield-lock-fill fs-3"></i>
                </div>
                <div>
                  <h6 className="fw-bold font-heading mb-0 text-success">Delivery Handover PIN</h6>
                  <small className="text-muted">
                    Share this 4-digit verification code with your delivery partner only upon food reception.
                  </small>
                </div>
              </div>
              <div className="bg-white px-4 py-2 rounded-3 border border-success shadow-xs">
                <span className="fs-3 fw-bold text-success font-monospace" style={{ letterSpacing: "6px" }}>
                  {trackingData.deliveryOtp}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live Map */}
        <LiveTrackingMap
          orderId={trackingData.orderId}
          restaurantCoords={trackingData.restaurantCoordinates}
          customerCoords={trackingData.customerCoordinates}
          initialDeliveryCoords={trackingData.deliveryLocation}
          isSimulatedInitial={trackingData.isSimulated}
          restaurantName={trackingData.restaurant?.name || "Kitchen"}
          customerAddress={trackingData.address}
        />

        {/* Order Details & Delivery Partner Cards */}
        <div className="row g-4 mt-2">
          {/* Delivery Partner Details */}
          <div className="col-md-6">
            <div className="card shadow-xs border-0 rounded-4 p-3 h-100 bg-white">
              <h6 className="fw-bold font-heading mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-bicycle text-primary"></i> Assigned Delivery Partner
              </h6>
              {trackingData.deliveryPerson ? (
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                    style={{ width: "48px", height: "48px", fontSize: "20px" }}
                  >
                    <i className="bi bi-person-fill text-muted"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold font-heading">{trackingData.deliveryPerson.name}</h6>
                    <p className="text-muted small mb-0">
                      Vehicle: {trackingData.deliveryPerson.vehicleType || "Electric Bike"} | Rating: <i className="bi bi-star-fill text-warning"></i> {trackingData.deliveryPerson.rating || "4.8"}
                    </p>
                    {deliveryStatus === "ARRIVED_AT_RESTAURANT" && (
                      <span className="badge bg-info-subtle text-info border border-info rounded-pill mt-1">
                        At restaurant waiting for pickup
                      </span>
                    )}
                    {deliveryStatus === "OUT_FOR_DELIVERY" && (
                      <span className="badge bg-primary-subtle text-primary border border-primary rounded-pill mt-1">
                        On the way to your delivery address
                      </span>
                    )}
                  </div>
                </div>
              ) : deliveryStatus === "NOT_REQUESTED" || orderStatus === "PLACED" ? (
                <div className="py-2">
                  <span className="badge bg-warning-subtle text-dark border border-warning rounded-pill px-3 py-1 mb-1 d-inline-flex align-items-center gap-1 font-heading">
                    <span className="spinner-border spinner-border-sm text-warning" style={{ width: "10px", height: "10px" }} />
                    Awaiting Kitchen Acceptance
                  </span>
                  <p className="text-muted small mb-0 mt-1">
                    The restaurant is reviewing your order. Delivery partner dispatch starts automatically as soon as food preparation begins.
                  </p>
                </div>
              ) : deliveryStatus === "OFFERED" ? (
                <div className="py-2">
                  <span className="badge bg-info-subtle text-info border border-info rounded-pill px-3 py-1 mb-1 d-inline-flex align-items-center gap-1 font-heading">
                    <span className="spinner-grow spinner-grow-sm" style={{ width: "8px", height: "8px" }} />
                    Delivery Offer Dispatched
                  </span>
                  <p className="text-muted small mb-0 mt-1">
                    A trip offer was sent to the nearest available delivery partner. Awaiting rider confirmation...
                  </p>
                </div>
              ) : orderStatus === "CANCELLED" || orderStatus === "REJECTED" ? (
                <div className="py-2">
                  <span className="badge bg-danger-subtle text-danger border border-danger rounded-pill px-3 py-1 mb-1 font-heading">
                    Order {orderStatus === "CANCELLED" ? "Cancelled" : "Rejected"}
                  </span>
                  <p className="text-muted small mb-0 mt-1">
                    {trackingData.rejectionReason || "Order is no longer active."}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning rounded-pill px-3 py-1 mb-1 d-inline-flex align-items-center gap-1 font-heading">
                    <span className="spinner-grow spinner-grow-sm" style={{ width: "8px", height: "8px" }} />
                    Searching for Delivery Partner
                  </span>
                  <p className="text-muted small mb-0 mt-1">
                    Our smart dispatch engine is scoring nearby partners based on proximity and rating. An offer will be sent shortly.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Destination & Summary */}
          <div className="col-md-6">
            <div className="card shadow-xs border-0 rounded-4 p-3 h-100 bg-white">
              <h6 className="fw-bold font-heading mb-2 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-danger"></i> Destination & Billing
              </h6>
              <p className="text-muted small mb-2">{trackingData.address}</p>
              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                <span className="small text-muted">Total Paid ({trackingData.paymentmethod}):</span>
                <span className="fw-bold fs-5 text-primary font-heading">₹{trackingData.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
