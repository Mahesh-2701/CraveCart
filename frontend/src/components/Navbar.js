import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api, { getSocket } from "../config/api";
import CraveCartLogo from "./CraveCartLogo";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuth, setIsAuth] = useState(
    Boolean(localStorage.getItem("token") && localStorage.getItem("role") === "user")
  );
  const userName = localStorage.getItem("name") || "Account";
  const [cartCount, setCartCount] = useState(0);
  const [userLocation, setUserLocation] = useState(
    localStorage.getItem("address") || "Indiranagar, Bangalore"
  );
  const [activeOrder, setActiveOrder] = useState(null);

  const userId = localStorage.getItem("id");

  const handleLocationPrompt = () => {
    const entered = window.prompt("Enter delivery address / neighborhood:", userLocation);
    if (entered && entered.trim()) {
      const cleanLoc = entered.trim();
      localStorage.setItem("address", cleanLoc);
      setUserLocation(cleanLoc);
    }
  };

  useEffect(() => {
    if (isAuth && userId) {
      // 1. Fetch cart count
      api
        .get(`/user/cartdisplay/${userId}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setCartCount(res.data.length);
          }
        })
        .catch(() => {});

      // 2. Fetch active order for live tracking badge
      api
        .get(`/user/orders/${userId}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            const active = res.data.find((o) =>
              ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "Out for Delivery"].includes(
                o.status
              )
            );
            setActiveOrder(active || null);
          }
        })
        .catch(() => {});

      // 3. Socket real-time updates for active order
      const socket = getSocket();
      socket.emit("join", `user_${userId}`);

      socket.on("orderStatusChanged", (updated) => {
        if (
          ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "Out for Delivery"].includes(
            updated.status
          )
        ) {
          setActiveOrder(updated);
        } else {
          setActiveOrder(null);
        }
      });

      return () => {
        socket.emit("leave", `user_${userId}`);
        socket.off("orderStatusChanged");
      };
    }
  }, [isAuth, userId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    setIsAuth(false);
    navigate("/");
  };

  return (
    <>
      {/* Top Navbar */}
      <nav
        className="navbar navbar-expand-lg sticky-top border-bottom px-3 py-2"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
          zIndex: 1030,
        }}
      >
        <div className="container d-flex justify-content-between align-items-center">
          {/* Brand Logo & Location Pill */}
          <div className="d-flex align-items-center gap-3">
            <CraveCartLogo size="md" />

            {/* Swiggy/Zomato style Location Selector */}
            <div
              className="d-none d-md-flex align-items-center gap-2 px-3 py-1 bg-light rounded-pill border border-light cursor-pointer transition-all"
              style={{ cursor: "pointer", fontSize: "0.85rem" }}
              onClick={handleLocationPrompt}
              title="Click to update delivery location"
            >
              <i className="bi bi-geo-alt-fill text-primary"></i>
              <span className="fw-bold text-dark text-truncate" style={{ maxWidth: "150px" }}>
                {userLocation.split(",")[0] || "Select Area"}
              </span>
              <span className="text-muted small text-truncate" style={{ maxWidth: "120px" }}>
                {userLocation.split(",").slice(1).join(",") || "Bangalore"}
              </span>
              <i className="bi bi-chevron-down text-muted" style={{ fontSize: "10px" }}></i>
            </div>
          </div>

          {/* Active Order Pill in Header */}
          {activeOrder && (
            <Link
              to={`/orders/track/${activeOrder._id}`}
              className="d-none d-lg-flex align-items-center gap-2 px-3 py-1 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill text-decoration-none transition-all"
              style={{ fontSize: "0.8rem" }}
            >
              <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: "8px", height: "8px" }} />
              <span className="fw-bold">Active Order: {activeOrder.status}</span>
              <i className="bi bi-arrow-right"></i>
            </Link>
          )}

          {/* Quick Cart button for mobile header */}
          <div className="d-flex align-items-center d-lg-none gap-2">
            {isAuth && (
              <Link
                to="/user/cart"
                className="btn btn-sm btn-crave-secondary rounded-pill px-3 position-relative"
                aria-label="View Cart"
              >
                <i className="bi bi-cart3 text-primary fs-6"></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              className="navbar-toggler border-0 shadow-none p-1 text-dark"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <i className="bi bi-list fs-2 text-dark"></i>
            </button>
          </div>

          {/* Navbar Links */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto align-items-center gap-1 my-2 my-lg-0">
              <li className="nav-item">
                <Link
                  to="/"
                  className={`nav-link fw-semibold px-3 py-2 rounded-pill transition-all ${
                    location.pathname === "/"
                      ? "text-primary bg-light"
                      : "text-secondary"
                  }`}
                >
                  <i className="bi bi-house-door me-1"></i> Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/foods"
                  className={`nav-link fw-semibold px-3 py-2 rounded-pill transition-all ${
                    location.pathname === "/foods"
                      ? "text-primary bg-light"
                      : "text-secondary"
                  }`}
                >
                  <i className="bi bi-egg-fried me-1"></i> Dishes
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/restaurants"
                  className={`nav-link fw-semibold px-3 py-2 rounded-pill transition-all ${
                    location.pathname === "/restaurants"
                      ? "text-primary bg-light"
                      : "text-secondary"
                  }`}
                >
                  <i className="bi bi-shop me-1"></i> Restaurants
                </Link>
              </li>
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle fw-semibold px-3 py-2 text-secondary"
                  href="#portals"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-grid me-1"></i> Partner Portals
                </a>
                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 mt-2">
                  <li>
                    <Link
                      className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2"
                      to="/restaurant/login"
                    >
                      <span className="p-2 bg-light text-primary rounded-3">
                        <i className="bi bi-shop-window"></i>
                      </span>
                      <div>
                        <div className="fw-semibold">Restaurant Partner</div>
                        <small className="text-muted">Manage menus & live orders</small>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2"
                      to="/delivery/login"
                    >
                      <span className="p-2 bg-light text-primary rounded-3">
                        <i className="bi bi-bicycle"></i>
                      </span>
                      <div>
                        <div className="fw-semibold">Delivery Partner</div>
                        <small className="text-muted">Accept trips & deliver orders</small>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider my-2" />
                  </li>
                  <li>
                    <Link
                      className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2"
                      to="/admin"
                    >
                      <span className="p-2 bg-light text-dark rounded-3">
                        <i className="bi bi-shield-lock-fill"></i>
                      </span>
                      <div>
                        <div className="fw-semibold">Platform Admin</div>
                        <small className="text-muted">System operations & dispatch</small>
                      </div>
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>

            {/* Right Side User Profile & Actions */}
            <div className="d-flex align-items-center gap-2 pt-2 pt-lg-0">
              {!isAuth ? (
                <>
                  <Link
                    to="/user/login"
                    className="btn btn-sm btn-crave-secondary rounded-pill px-4"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/user/signup"
                    className="btn btn-sm btn-crave-primary rounded-pill px-4"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/user/cart"
                    className="btn btn-sm btn-crave-secondary rounded-pill px-3 position-relative d-none d-lg-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-cart3 text-primary fs-6"></i>
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="badge rounded-pill bg-danger px-2 py-1 ms-1">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/user/orders"
                    className="btn btn-sm btn-light border rounded-pill px-3 fw-semibold text-secondary d-inline-flex align-items-center gap-1"
                  >
                    <i className="bi bi-receipt"></i>
                    <span>Orders</span>
                  </Link>

                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-light border rounded-pill px-3 dropdown-toggle fw-semibold text-dark d-inline-flex align-items-center gap-2"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bi bi-person-circle text-primary fs-6"></i>
                      <span>{userName.split(" ")[0]}</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 mt-2">
                      <li>
                        <Link
                          className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2"
                          to="/user/update"
                        >
                          <i className="bi bi-gear text-muted"></i> Account Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2"
                          to="/user/orders"
                        >
                          <i className="bi bi-bag-check text-muted"></i> Order History
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider my-2" />
                      </li>
                      <li>
                        <button
                          className="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2 text-danger fw-semibold"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right"></i> Log Out
                        </button>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <Link
          to="/"
          className={`bottom-nav-item ${location.pathname === "/" ? "active" : ""}`}
        >
          <i className="bi bi-house-door-fill"></i>
          <span>Home</span>
        </Link>
        <Link
          to="/foods"
          className={`bottom-nav-item ${location.pathname === "/foods" ? "active" : ""}`}
        >
          <i className="bi bi-egg-fried"></i>
          <span>Dishes</span>
        </Link>
        <Link
          to="/restaurants"
          className={`bottom-nav-item ${
            location.pathname === "/restaurants" ? "active" : ""
          }`}
        >
          <i className="bi bi-shop"></i>
          <span>Restaurants</span>
        </Link>
        {isAuth && (
          <>
            <Link
              to="/user/cart"
              className={`bottom-nav-item position-relative ${
                location.pathname === "/user/cart" ? "active" : ""
              }`}
            >
              <i className="bi bi-cart3"></i>
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "9px" }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/user/orders"
              className={`bottom-nav-item ${
                location.pathname === "/user/orders" ? "active" : ""
              }`}
            >
              <i className="bi bi-receipt"></i>
              <span>Orders</span>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
