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
    <div className="card crave-card h-100 shadow-xs border-0 position-relative">
      <div className="position-relative" style={{ height: "190px", overflow: "hidden" }}>
        <img
          src={getImageUrl(image, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500")}
          className="w-100 h-100 object-fit-cover"
          alt={name}
          style={{ transition: "transform 0.4s ease" }}
          loading="lazy"
        />

        {/* Status Badge */}
        <div className="position-absolute top-0 start-0 m-2">
          {available ? (
            <span className="badge rounded-pill bg-success text-white shadow-sm px-2 py-1 font-heading small">
              <span className="spinner-grow spinner-grow-sm me-1" style={{ width: "6px", height: "6px" }} />
              OPEN
            </span>
          ) : (
            <span className="badge rounded-pill bg-dark bg-opacity-75 text-white shadow-sm px-2 py-1 font-heading small">
              OFFLINE
            </span>
          )}
        </div>

        {/* Rating Pill */}
        <div className="position-absolute bottom-0 end-0 m-2">
          <span className="rating-pill shadow-sm">
            <i className="bi bi-star-fill" style={{ fontSize: "10px" }}></i>
            {rating ? rating.toFixed(1) : "4.3"}
          </span>
        </div>
      </div>

      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <h5 className="fw-bold font-heading mb-1 text-truncate text-dark" title={name}>
            {name}
          </h5>
          <p className="text-muted small mb-1 text-truncate">{cuisine}</p>
          <p className="text-muted small mb-2 text-truncate d-flex align-items-center gap-1" style={{ fontSize: "0.82rem" }}>
            <i className="bi bi-geo-alt text-danger"></i>
            <span>{address}</span>
          </p>
        </div>

        <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
          <span className="small text-muted d-inline-flex align-items-center gap-1">
            <i className="bi bi-clock text-primary"></i>
            <span>~{deliveryTimeMinutes} mins</span>
          </span>
          <Link
            to={`/foods?search=${encodeURIComponent(name)}`}
            className="btn btn-sm btn-crave-secondary rounded-pill px-3 fw-semibold text-primary"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
