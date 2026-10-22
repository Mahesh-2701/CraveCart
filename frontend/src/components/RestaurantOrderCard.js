import React, { useState } from "react";
import { Link } from "react-router-dom";
import api, { getImageUrl } from "../config/api";
import { toast } from "react-toastify";

export default function RestaurantOrderCard({ index, order, onRefresh }) {
  const [loadingAction, setLoadingAction] = useState(false);

  const orderState = order.orderStatus || (order.status === "Preparing" ? "PREPARING" : "PLACED");
  const deliveryState = order.deliveryStatus || (order.deliverypersonid ? "ASSIGNED" : orderState === "PLACED" ? "NOT_REQUESTED" : "SEARCHING");

  const handleAccept = () => {
    setLoadingAction(true);
    api
      .post(`/restaurant/order/${order._id}/accept`)
      .then((res) => {
        toast.success(res.data.message || "Order accepted! Dispatching delivery offer...");
        if (onRefresh) onRefresh();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to accept order.");
      })
      .finally(() => setLoadingAction(false));
  };

  const handleReject = () => {
    const reason = window.prompt("Reason for rejecting order:", "Kitchen busy / Items out of stock");
    if (!reason) return;

    setLoadingAction(true);
    api
      .post(`/restaurant/order/${order._id}/reject`, { reason })
      .then((res) => {
        toast.info("Order rejected.");
        if (onRefresh) onRefresh();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to reject order.");
      })
      .finally(() => setLoadingAction(false));
  };

  const handleMarkReady = () => {
    setLoadingAction(true);
    api
      .post(`/restaurant/order/${order._id}/ready`)
      .then((res) => {
        toast.success("Food marked ready for pickup! Delivery partner notified.");
        if (onRefresh) onRefresh();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to update food status.");
      })
      .finally(() => setLoadingAction(false));
  };

  const dishName = order.menuid?.name || (order.items && order.items[0]?.name) || "Dish";
  const dishImg = order.menuid?.image
    ? getImageUrl(order.menuid.image)
    : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100";

  return (
    <tr>
      <td className="ps-3 text-muted small">{index + 1}</td>
      <td>
        <div className="d-flex align-items-center">
          <img
            src={dishImg}
            alt={dishName}
            className="rounded-3 shadow-xs object-fit-cover me-2"
            style={{
              width: "44px",
              height: "44px",
            }}
          />
          <div>
            <span className="fw-semibold font-heading text-dark d-block">{dishName}</span>
            <small className="text-muted font-monospace">#{order._id.slice(-6).toUpperCase()}</small>
          </div>
        </div>
      </td>
      <td>{order.userid?.name || "Customer"}</td>
      <td className="fw-bold font-heading">{order.quantity || 1}</td>
      <td className="fw-bold font-heading text-primary">₹{order.totalAmount || order.price}</td>

      {/* Kitchen Actions (Strict separation of concerns) */}
      <td>
        {orderState === "PLACED" && (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-success rounded-pill px-3 font-heading fw-semibold d-inline-flex align-items-center gap-1"
              disabled={loadingAction}
              onClick={handleAccept}
            >
              <i className="bi bi-check-lg"></i> Accept
            </button>
            <button
              className="btn btn-sm btn-outline-danger rounded-pill px-2"
              disabled={loadingAction}
              onClick={handleReject}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}

        {(orderState === "ACCEPTED" || orderState === "PREPARING") && (
          <button
            className="btn btn-sm btn-warning rounded-pill px-3 fw-semibold font-heading text-dark shadow-xs d-inline-flex align-items-center gap-1"
            disabled={loadingAction}
            onClick={handleMarkReady}
          >
            <i className="bi bi-fire"></i> Mark Ready
          </button>
        )}

        {orderState === "READY_FOR_PICKUP" && (
          <span className="badge bg-info bg-opacity-10 text-info border border-info px-3 py-2 rounded-pill font-heading">
            Packed & Ready
          </span>
        )}

        {orderState === "PICKED_UP" && (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 rounded-pill font-heading">
            Handed Over to Rider
          </span>
        )}

        {orderState === "DELIVERED" && (
          <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill font-heading">
            Delivered
          </span>
        )}

        {orderState === "REJECTED" && (
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-2 rounded-pill font-heading">
            Rejected
          </span>
        )}

        {orderState === "CANCELLED" && (
          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary px-3 py-2 rounded-pill font-heading">
            Cancelled
          </span>
        )}
      </td>

      <td>
        <span className={`badge rounded-pill px-2 py-1 font-heading ${order.paymentmethod === "Online" ? "bg-primary" : "bg-secondary"}`}>
          {order.paymentmethod}
        </span>
      </td>

      {/* Delivery Orchestration Status (Read-Only to Restaurant) */}
      <td>
        {deliveryState === "NOT_REQUESTED" && (
          <span className="badge bg-light text-muted border rounded-pill">Not Requested</span>
        )}
        {deliveryState === "SEARCHING" && (
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning rounded-pill d-inline-flex align-items-center gap-1">
              <span className="spinner-grow spinner-grow-sm" style={{ width: "6px", height: "6px" }} />
              Finding Rider...
            </span>
            <button
              className="btn btn-outline-warning btn-sm py-0 px-2 rounded-pill"
              style={{ fontSize: "10px" }}
              title="Retry Finding Delivery Partner"
              onClick={() => {
                api.post(`/restaurant/order/${order._id}/retry-dispatch`)
                  .then(() => toast.info("Dispatch re-triggered! Searching for partners..."))
                  .catch((e) => toast.error(e.response?.data?.message || "Failed"));
              }}
            >
              <i className="bi bi-arrow-repeat"></i>
            </button>
          </div>
        )}
        {deliveryState === "OFFERED" && (
          <span className="badge bg-info bg-opacity-10 text-info border border-info rounded-pill">Contacting Rider...</span>
        )}
        {deliveryState === "ASSIGNED" && (
          <span className="fw-semibold text-dark small d-inline-flex align-items-center gap-1">
            <i className="bi bi-bicycle text-primary"></i> {order.deliverypersonid?.name || "Assigned"}
          </span>
        )}
        {deliveryState === "ARRIVED_AT_RESTAURANT" && (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary rounded-pill">
            <i className="bi bi-geo-alt me-1"></i> Rider at Door
          </span>
        )}
        {deliveryState === "OUT_FOR_DELIVERY" && (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary rounded-pill">
            <i className="bi bi-bicycle me-1"></i> Out for Delivery
          </span>
        )}
        {deliveryState === "DELIVERED" && (
          <span className="badge bg-success bg-opacity-10 text-success border border-success rounded-pill">
            Delivered
          </span>
        )}
      </td>

      <td className="text-muted small">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td className="pe-3 text-end">
        <Link
          to={`/orders/track/${order._id}`}
          className="btn btn-sm btn-crave-secondary rounded-pill px-3 py-1 font-heading"
          style={{ fontSize: "12px" }}
        >
          <i className="bi bi-map me-1"></i> Map
        </Link>
      </td>
    </tr>
  );
}
