import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CraveCartLogo from "./CraveCartLogo";

const RestaurantNavbar = () => {
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(
    Boolean(localStorage.getItem("token") && localStorage.getItem("role") === "restaurant")
  );

  return (
    <nav
      className="navbar navbar-expand-lg sticky-top border-bottom px-3 py-2"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderColor: "var(--border-subtle)",
        boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
        zIndex: 1030,
      }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Brand Logo with Kitchen Portal Badge */}
        <div className="d-flex align-items-center gap-2">
          <CraveCartLogo size="md" clickable={true} to="/restaurant/admin" />
          <span className="badge rounded-pill bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 py-1 px-2 d-none d-sm-inline-flex align-items-center gap-1 font-heading">
            <i className="bi bi-shop-window text-warning"></i> Kitchen Center
          </span>
        </div>

        {/* Toggler for mobile */}
        <button
          className="navbar-toggler border-0 shadow-none p-1 text-dark"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#restaurantNav"
          aria-controls="restaurantNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-2 text-dark"></i>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="restaurantNav">
          <ul className="navbar-nav ms-auto align-items-center gap-2 my-2 my-lg-0">
            {!isAuth ? (
              <>
                <li className="nav-item">
                  <Link
                    to="/restaurant/view"
                    className="btn btn-sm btn-crave-secondary rounded-pill px-4"
                  >
                    Merchant Log In
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    to="/restaurant/admin"
                    className={`nav-link fw-semibold px-3 py-2 rounded-pill transition-all d-flex align-items-center gap-1 ${
                      location.pathname === "/restaurant/admin"
                        ? "text-primary bg-light"
                        : "text-secondary"
                    }`}
                  >
                    <i className="bi bi-menu-button-wide"></i> Menu Manager
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/restaurant/admin/order"
                    className={`nav-link fw-semibold px-3 py-2 rounded-pill transition-all d-flex align-items-center gap-1 ${
                      location.pathname === "/restaurant/admin/order"
                        ? "text-primary bg-light"
                        : "text-secondary"
                    }`}
                  >
                    <i className="bi bi-fire text-danger"></i> Kitchen Orders
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 fw-semibold"
                    to="/restaurant/logout"
                    onClick={() => {
                      setIsAuth(false);
                    }}
                  >
                    <i className="bi bi-box-arrow-right"></i> Sign Out
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default RestaurantNavbar;
