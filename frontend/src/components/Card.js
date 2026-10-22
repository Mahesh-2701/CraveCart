import React from "react";
import api, { getImageUrl } from "../config/api";
import { toast } from "react-toastify";

export default function Card(props) {
  const {
    id,
    name,
    image,
    description,
    price,
    restaurant,
    restaurantname,
    isVeg = false,
    rating = 4.2,
    isRestaurantActive = true,
  } = props;

  const isAvailable = restaurant !== undefined ? restaurant : isRestaurantActive;

  const addtocart = () => {
    const userId = localStorage.getItem("id");
    if (!userId) {
      toast.error("Please log in to your CraveCart account to add items.");
      return;
    }

    const cartitem = {
      userid: userId,
      menuid: id,
      price: price,
    };

    api
      .post("/user/addtocart", cartitem)
      .then((res) => {
        toast.success(res.data.message || `Added ${name} to cart!`);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to add item to cart.");
      });
  };

  return (
    <div className="card crave-card h-100 position-relative shadow-xs border-0">
      {/* Image Container with Badges */}
      <div className="position-relative" style={{ height: "190px", overflow: "hidden" }}>
        <img
          src={getImageUrl(image)}
          className="w-100 h-100 object-fit-cover"
          alt={name}
          style={{ transition: "transform 0.4s ease" }}
          loading="lazy"
        />

        {/* Dietary Badge */}
        <div className="position-absolute top-0 start-0 m-2">
          {isVeg ? (
            <span className="badge-veg bg-white shadow-sm" title="Pure Vegetarian">
              <span className="veg-dot" />
            </span>
          ) : (
            <span className="badge-nonveg bg-white shadow-sm" title="Non-Vegetarian">
              <span className="non-veg-dot" />
            </span>
          )}
        </div>

        {/* Rating Pill */}
        <div className="position-absolute bottom-0 end-0 m-2">
          <span className="rating-pill shadow-sm">
            <i className="bi bi-star-fill" style={{ fontSize: "10px" }}></i>
            {rating ? rating.toFixed(1) : "4.2"}
          </span>
        </div>

        {/* Overlay when closed / unavailable */}
        {!isAvailable && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center text-white px-2 text-center"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(2px)",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            <i className="bi bi-moon-stars me-1"></i> Kitchen Currently Offline
          </div>
        )}
      </div>

      {/* Body */}
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <h6 className="fw-bold font-heading mb-1 text-truncate text-dark" title={name}>
            {name}
          </h6>
          {restaurantname && (
            <p className="text-muted small mb-1 text-truncate d-flex align-items-center gap-1">
              <i className="bi bi-shop text-primary" style={{ fontSize: "11px" }}></i>
              <span>{restaurantname}</span>
            </p>
          )}
          {description && (
            <p className="text-muted small mb-2 text-truncate" style={{ fontSize: "0.82rem" }}>
              {description}
            </p>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
          <span className="fw-bold fs-5 text-dark font-heading">₹{price}</span>
          {isAvailable ? (
            <button
              className="btn btn-sm btn-crave-secondary fw-bold px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1 text-primary border-primary"
              onClick={addtocart}
            >
              <i className="bi bi-plus-lg"></i> ADD
            </button>
          ) : (
            <span className="badge bg-light text-muted border">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}
