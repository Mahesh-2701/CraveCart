import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getImageUrl } from "../config/api";
import { toast } from "react-toastify";

export default function RestaurantOrderCard({ index, order }) {
  const [status, setStatus] = useState(order.status);

  useEffect(() => {
    setStatus(order.status);
  }, [order.status]);

  function changestatus(id, newstatus) {
    api
      .patch(`/restaurant/order/statuschange/${id}`, { status: newstatus })
      .then((res) => {
        toast.success(res.data.message || "Order status updated!");
      })
      .catch((err) => {
        toast.error("Error occurred: " + (err.response?.data?.message || err.message));
      });
  }

  const dishName = order.menuid?.name || (order.items && order.items[0]?.name) || "Dish";
  const dishImg = order.menuid?.image
    ? getImageUrl(order.menuid.image)
    : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100";

  return (
    <tr>
      <td className="ps-3 fw-semibold">{index + 1}</td>
      <td>
        <div className="d-flex align-items-center">
          <img
            src={dishImg}
            alt={dishName}
            style={{
              width: "42px",
              height: "42px",
              objectFit: "cover",
              borderRadius: "8px",
              marginRight: "10px",
            }}
          />
          <div>
            <span className="fw-semibold text-dark">{dishName}</span>
            <small className="d-block text-muted">Order #{order._id.slice(-6).toUpperCase()}</small>
          </div>
        </div>
      </td>
      <td>{order.userid?.name || "Customer"}</td>
      <td>{order.quantity || 1}</td>
      <td className="fw-bold">₹{order.totalAmount || order.price}</td>
      <td>
        {status === "Delivered" ? (
          <span className="badge bg-success px-3 py-2 rounded-pill">Delivered</span>
        ) : (
          <select
            className="form-select form-select-sm rounded-pill shadow-none fw-semibold"
            value={status}
            onChange={(e) => {
              const val = e.target.value;
              setStatus(val);
              changestatus(order._id, val);
            }}
          >
            <option value="Preparing">Preparing</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Out for Delivery">Out For Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        )}
      </td>
      <td>
        <span className={`badge ${order.paymentmethod === "Online" ? "bg-primary" : "bg-secondary"}`}>
          {order.paymentmethod}
        </span>
      </td>
      <td>{order.deliverypersonid?.name || "Assigning..."}</td>
      <td className="text-muted small">{new Date(order.createdAt).toLocaleTimeString()}</td>
      <td className="pe-3">
        <Link
          to={`/orders/track/${order._id}`}
          className="btn btn-sm btn-outline-primary rounded-pill px-2 py-1"
          style={{ fontSize: "12px" }}
        >
          🗺️ Map View
        </Link>
      </td>
    </tr>
  );
}
