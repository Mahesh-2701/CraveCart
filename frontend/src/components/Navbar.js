import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../config/api";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuth, setIsAuth] = useState(
    Boolean(localStorage.getItem("token") && localStorage.getItem("role") === "user")
  );
  const userName = localStorage.getItem("name") || "Account";
  const [cartCount, setCartCount] = useState(0);

  const userId = localStorage.getItem("id");

  useEffect(() => {
    if (isAuth && userId) {
      api
        .get(`/user/cartdisplay/${userId}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setCartCount(res.data.length);
          }
        })
        .catch(() => {});
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
      <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom shadow-sm px-3 py-2">
        <div className="container d-flex justify-content-between align-items-center">
          {/* Brand Logo */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #FF5200 0%, #FF7A00 100%)",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "20px",
              }}
            >
              C
            </div>
            <div>
              <span className="fw-bold fs-4 text-dark" style={{ letterSpacing: "-0.5px" }}>
                Crave<span className="text-primary">Cart</span>
              </span>
              <span className="badge bg-light text-muted border ms-2 small" style={{ fontSize: "10px" }}>
                V2.0
              </span>
            </div>
          </Link>

          {/* Quick Cart button for mobile header */}
          <div className="d-flex align-items-center d-lg-none gap-2">
            {isAuth && (
              <Link to="/user/cart" className="btn btn-sm btn-outline-primary rounded-pill px-3 position-relative">
                🛒
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              className="navbar-toggler border-0 shadow-none"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>
          </div>

          {/* Navbar Links */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto align-items-center gap-1">
              <li className="nav-item">
                <Link
                  to="/"
                  className={`nav-link fw-semibold px-3 ${location.pathname === "/" ? "text-primary" : ""}`}
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/foods"
                  className={`nav-link fw-semibold px-3 ${location.pathname === "/foods" ? "text-primary" : ""}`}
                >
                  Dishes
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/restaurants"
                  className={`nav-link fw-semibold px-3 ${location.pathname === "/restaurants" ? "text-primary" : ""}`}
                >
                  Restaurants
                </Link>
              </li>
            </ul>

            {/* Right Side User Profile & Actions */}
            <div className="d-flex align-items-center gap-2">
              {!isAuth ? (
                <>
                  <Link to="/user/login" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                    Log In
                  </Link>
                  <Link to="/user/signup" className="btn btn-sm btn-primary-crave px-3">
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/user/cart"
                    className="btn btn-sm btn-outline-primary rounded-pill px-3 position-relative d-none d-lg-inline-flex align-items-center gap-1"
                  >
                    <span>🛒 Cart</span>
                    {cartCount > 0 && (
                      <span className="badge rounded-pill bg-danger ms-1">{cartCount}</span>
                    )}
                  </Link>

                  <Link to="/user/orders" className="btn btn-sm btn-light border rounded-pill px-3 fw-semibold">
                    Orders
                  </Link>

                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-light border rounded-pill px-3 dropdown-toggle fw-semibold"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      👤 {userName.split(" ")[0]}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                      <li>
                        <Link className="dropdown-item" to="/user/update">
                          Profile Settings
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/user/orders">
                          My Orders
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                          Log Out
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
        <Link to="/" className={`bottom-nav-item ${location.pathname === "/" ? "active" : ""}`}>
          <span style={{ fontSize: "18px" }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/foods" className={`bottom-nav-item ${location.pathname === "/foods" ? "active" : ""}`}>
          <span style={{ fontSize: "18px" }}>🍔</span>
          <span>Dishes</span>
        </Link>
        <Link
          to="/restaurants"
          className={`bottom-nav-item ${location.pathname === "/restaurants" ? "active" : ""}`}
        >
          <span style={{ fontSize: "18px" }}>🏬</span>
          <span>Restaurants</span>
        </Link>
        {isAuth && (
          <>
            <Link
              to="/user/cart"
              className={`bottom-nav-item position-relative ${location.pathname === "/user/cart" ? "active" : ""}`}
            >
              <span style={{ fontSize: "18px" }}>🛒</span>
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
              className={`bottom-nav-item ${location.pathname === "/user/orders" ? "active" : ""}`}
            >
              <span style={{ fontSize: "18px" }}>📦</span>
              <span>Orders</span>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
