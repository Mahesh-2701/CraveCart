import React from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../config/api";

export default function CardRestaurant(props) {
  const {
    name,
    image,
    address,
    available,
    cuisine = "North Indian, Fast Food",
    rating = 4.3,
    deliveryTimeMinutes = 30,
  } = props;

  return (
    <div className="card food-card-v2 h-100 shadow-sm border-0 position-relative">
      <div className="position-relative" style={{ height: "180px", overflow: "hidden" }}>
        <img
          src={getImageUrl(image, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500")}
          className="w-100 h-100 object-fit-cover"
          alt={name}
          style={{ objectFit: "cover" }}
          loading="lazy"
        />

        {/* Status Badge */}
        <div className="position-absolute top-0 start-0 m-2">
          {available ? (
            <span className="badge bg-success shadow-sm">● OPEN NOW</span>
          ) : (
            <span className="badge bg-secondary shadow-sm">CLOSED</span>
          )}
        </div>

        {/* Rating Pill */}
        <div className="position-absolute bottom-0 end-0 m-2">
          <span className="rating-pill shadow-sm">
            ★ {rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <h5 className="fw-bold mb-1 text-truncate" title={name}>
            {name}
          </h5>
          <p className="text-muted small mb-1 text-truncate">{cuisine}</p>
          <p className="text-muted small mb-2 text-truncate" style={{ fontSize: "0.8rem" }}>
            📍 {address}
          </p>
        </div>

        <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
          <span className="small text-muted">
            🕒 ~{deliveryTimeMinutes} mins
          </span>
          <Link
            to={`/foods?search=${encodeURIComponent(name)}`}
            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
          >
            View Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
