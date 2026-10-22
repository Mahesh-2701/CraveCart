import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LiveTrackingMap from "../components/LiveTrackingMap";
import api from "../config/api";
import { toast } from "react-toastify";

export default function LiveTracking() {
  const { orderId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading tracking details...</span>
          </div>
          <p className="mt-3 text-muted">Connecting to delivery satellite...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div>
        <Navbar />
        <div className="container py-5 text-center">
          <h4>Order Tracking Unavailable</h4>
          <p className="text-muted">We could not retrieve tracking data for order #{orderId}.</p>
          <Link to="/user/orders" className="btn btn-outline-primary rounded-pill px-4">
            View All Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const steps = [
    { title: "Order Placed", active: true },
    { title: "Preparing", active: ["Preparing", "Ready for Pickup", "Out for Delivery", "Delivered"].includes(trackingData.status) },
    { title: "Out for Delivery", active: ["Out for Delivery", "Delivered"].includes(trackingData.status) },
    { title: "Delivered", active: trackingData.status === "Delivered" },
  ];

  return (
    <div>
      <Navbar />

      <div className="container py-4">
        {/* Header Breadcrumb */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <Link to="/user/orders" className="text-decoration-none text-muted small">
              ← Back to Orders
            </Link>
            <h3 className="fw-bold mt-1">Live Order Tracking</h3>
            <span className="text-muted small">
              Order ID: <strong>#{trackingData.orderId.slice(-6).toUpperCase()}</strong>
            </span>
          </div>

          <span
            className={`badge px-3 py-2 rounded-pill fs-6 ${
              trackingData.status === "Delivered"
                ? "bg-success"
                : trackingData.status === "Out for Delivery"
                ? "bg-primary"
                : "bg-warning text-dark"
            }`}
          >
            {trackingData.status}
          </span>
        </div>

        {/* Status Stepper */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
          <div className="row text-center g-2">
            {steps.map((step, idx) => (
              <div key={idx} className="col-3">
                <div
                  className={`rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2 ${
                    step.active ? "bg-primary text-white" : "bg-light text-muted border"
                  }`}
                  style={{ width: "36px", height: "36px", fontWeight: "bold" }}
                >
                  {step.active ? "✓" : idx + 1}
                </div>
                <span className={`small fw-semibold ${step.active ? "text-dark" : "text-muted"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

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
          {/* Delivery Partner */}
          <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
              <h6 className="fw-bold mb-3">🛵 Delivery Partner</h6>
              {trackingData.deliveryPerson ? (
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle bg-primary-light d-flex align-items-center justify-content-center"
                    style={{ width: "48px", height: "48px", fontSize: "24px" }}
                  >
                    👤
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{trackingData.deliveryPerson.name}</h6>
                    <p className="text-muted small mb-0">
                      Vehicle: {trackingData.deliveryPerson.vehicleType || "Bike"} | Rating: ★ {trackingData.deliveryPerson.rating || "4.8"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted small mb-0">
                  A delivery partner will be assigned once preparation is near completion.
                </p>
              )}
            </div>
          </div>

          {/* Delivery Address & Summary */}
          <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
              <h6 className="fw-bold mb-2">📍 Destination & Summary</h6>
              <p className="text-muted small mb-2">{trackingData.address}</p>
              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                <span className="small text-muted">Total Paid ({trackingData.paymentmethod}):</span>
                <span className="fw-bold fs-5 text-primary">₹{trackingData.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
