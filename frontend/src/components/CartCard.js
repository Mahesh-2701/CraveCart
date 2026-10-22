import React, { useState } from "react";
import { getImageUrl } from "../config/api";

export default function CartCard(props) {
  const { item, removeitem, handlequantityupdate } = props;
  const [qty, setQty] = useState(item.quantity || 1);

  const dishName = item.menuid?.name || "Delicious Dish";
  const restaurantName = item.menuid?.restaurantid?.name || "Kitchen";
  const dishPrice = item.price || item.menuid?.price || 0;
  const dishImage = item.menuid?.image
    ? getImageUrl(item.menuid.image)
    : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";

  const updateQuantity = (newQty) => {
    if (newQty < 1) {
      removeitem(item._id);
      return;
    }
    setQty(newQty);
    handlequantityupdate(item._id, newQty);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden p-2">
      <div className="row g-0 align-items-center">
        {/* Thumbnail */}
        <div className="col-3 col-sm-2">
          <img
            src={dishImage}
            className="img-fluid rounded-3 w-100"
            alt={dishName}
            style={{ height: "70px", objectFit: "cover" }}
          />
        </div>

        {/* Name and Restaurant */}
        <div className="col-5 col-sm-6 ps-3">
          <h6 className="fw-bold mb-0 text-truncate">{dishName}</h6>
          <small className="text-muted d-block text-truncate">{restaurantName}</small>
          <span className="fw-semibold text-primary">₹{dishPrice}</span>
        </div>

        {/* Counter and Remove */}
        <div className="col-4 col-sm-4 d-flex align-items-center justify-content-end gap-2 pe-2">
          <div className="d-flex align-items-center border rounded-pill px-2 py-1 bg-light">
            <button
              className="btn btn-sm btn-link text-dark p-0 text-decoration-none fw-bold"
              style={{ width: "20px" }}
              onClick={() => updateQuantity(qty - 1)}
            >
              -
            </button>
            <span className="px-2 fw-bold small">{qty}</span>
            <button
              className="btn btn-sm btn-link text-dark p-0 text-decoration-none fw-bold"
              style={{ width: "20px" }}
              onClick={() => updateQuantity(qty + 1)}
            >
              +
            </button>
          </div>

          <button
            className="btn btn-sm text-danger border-0 p-1"
            title="Remove item"
            onClick={() => removeitem(item._id)}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
