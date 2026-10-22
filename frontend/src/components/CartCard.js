import React, { useState } from "react";
import { getImageUrl } from "../config/api";

export default function CartCard(props) {
  const { item, removeitem, handlequantityupdate } = props;
  const [qty, setQty] = useState(item.quantity || 1);

  const dishName = item.menuid?.name || "Delicious Dish";
  const restaurantName = item.menuid?.restaurantid?.name || "Kitchen";
  const dishPrice = item.price || item.menuid?.price || 0;
  const isVeg = item.menuid?.isVeg;
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
    <div className="card border-0 shadow-xs rounded-4 overflow-hidden p-3 bg-white crave-card">
      <div className="row g-0 align-items-center">
        {/* Thumbnail */}
        <div className="col-3 col-sm-2">
          <div className="position-relative rounded-3 overflow-hidden" style={{ height: "74px" }}>
            <img
              src={dishImage}
              className="w-100 h-100 object-fit-cover"
              alt={dishName}
              loading="lazy"
            />
            {isVeg !== undefined && (
              <div className="position-absolute top-0 start-0 m-1">
                {isVeg ? (
                  <span className="badge-veg bg-white shadow-xs p-0" style={{ width: "14px", height: "14px" }}>
                    <span className="veg-dot" style={{ width: "6px", height: "6px" }} />
                  </span>
                ) : (
                  <span className="badge-nonveg bg-white shadow-xs p-0" style={{ width: "14px", height: "14px" }}>
                    <span className="non-veg-dot" style={{ width: "6px", height: "6px" }} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Name and Restaurant */}
        <div className="col-5 col-sm-6 ps-3">
          <h6 className="fw-bold font-heading mb-0 text-truncate text-dark">{dishName}</h6>
          <small className="text-muted d-block text-truncate mb-1">{restaurantName}</small>
          <span className="fw-bold font-heading text-primary">₹{dishPrice}</span>
        </div>

        {/* Counter and Remove */}
        <div className="col-4 col-sm-4 d-flex align-items-center justify-content-end gap-2 pe-1">
          <div className="d-flex align-items-center border rounded-pill px-2 py-1 bg-light">
            <button
              className="btn btn-sm btn-link text-dark p-0 text-decoration-none fw-bold"
              style={{ width: "22px" }}
              onClick={() => updateQuantity(qty - 1)}
              aria-label="Decrease quantity"
            >
              <i className="bi bi-dash"></i>
            </button>
            <span className="px-2 fw-bold font-heading small text-dark">{qty}</span>
            <button
              className="btn btn-sm btn-link text-dark p-0 text-decoration-none fw-bold"
              style={{ width: "22px" }}
              onClick={() => updateQuantity(qty + 1)}
              aria-label="Increase quantity"
            >
              <i className="bi bi-plus"></i>
            </button>
          </div>

          <button
            className="btn btn-sm text-danger-emphasis bg-danger bg-opacity-10 rounded-circle border-0 p-2 d-flex align-items-center justify-content-center"
            style={{ width: "32px", height: "32px" }}
            title="Remove item"
            onClick={() => removeitem(item._id)}
            aria-label="Remove item"
          >
            <i className="bi bi-trash3" style={{ fontSize: "13px" }}></i>
          </button>
        </div>
      </div>
    </div>
  );
}
