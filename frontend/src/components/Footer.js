import React from "react";
import { Link } from "react-router-dom";
import CraveCartLogo from "./CraveCartLogo";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "#0B1120",
        color: "#94A3B8",
        borderTop: "1px solid #1E293B",
      }}
      className="mt-5 pt-5 pb-4"
    >
      <div className="container py-4">
        <div className="row gy-4 gx-lg-5">
          {/* Brand & mission */}
          <div className="col-12 col-lg-4">
            <div className="mb-3">
              <CraveCartLogo variant="white" size="md" />
            </div>
            <p className="small pe-lg-4" style={{ lineHeight: 1.7 }}>
              CraveCart delivers culinary excellence directly to your door. Discover
              top-rated local kitchens, track every stage of your order in real-time,
              and indulge in seamless food discovery.
            </p>
            <div className="d-flex align-items-center gap-2 mt-4 text-white small">
              <span className="badge rounded-pill bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-1">
                <i className="bi bi-shield-check me-1"></i> 100% Verified Kitchens
              </span>
              <span className="badge rounded-pill bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-1">
                <i className="bi bi-lightning-charge me-1"></i> Express Fleet
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-sm-4 col-lg-2">
            <h6 className="text-white fw-bold font-heading mb-3">Explore</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/" className="text-decoration-none text-secondary-hover text-light opacity-75">
                  Home Discovery
                </Link>
              </li>
              <li>
                <Link to="/foods" className="text-decoration-none text-light opacity-75">
                  Trending Dishes
                </Link>
              </li>
              <li>
                <Link to="/restaurants" className="text-decoration-none text-light opacity-75">
                  Top Restaurants
                </Link>
              </li>
              <li>
                <Link to="/user/orders" className="text-decoration-none text-light opacity-75">
                  Live Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Partner with us */}
          <div className="col-6 col-sm-4 col-lg-3">
            <h6 className="text-white fw-bold font-heading mb-3">Partnerships</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/restaurant/view" className="text-decoration-none text-light opacity-75 d-flex align-items-center gap-2">
                  <i className="bi bi-shop-window text-warning"></i> Merchant Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="text-decoration-none text-light opacity-75 d-flex align-items-center gap-2">
                  <i className="bi bi-bicycle text-primary"></i> Delivery Fleet Hub
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-decoration-none text-light opacity-75 d-flex align-items-center gap-2">
                  <i className="bi bi-shield-lock text-info"></i> Operations Command
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Trust & Safety */}
          <div className="col-12 col-sm-4 col-lg-3">
            <h6 className="text-white fw-bold font-heading mb-3">Trust & Support</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-3">
              <li>
                <span className="text-light opacity-75 d-flex align-items-center gap-2">
                  <i className="bi bi-headset text-success"></i> 24/7 AI & Support Helpdesk
                </span>
              </li>
              <li>
                <span className="text-light opacity-75 d-flex align-items-center gap-2">
                  <i className="bi bi-credit-card-2-front text-info"></i> Instant Razorpay & UPI
                </span>
              </li>
              <li>
                <span className="text-light opacity-75 d-flex align-items-center gap-2">
                  <i className="bi bi-geo-alt text-danger"></i> Live Telemetry Routing
                </span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: "#1E293B" }} />

        {/* Bottom bar */}
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-white small">
          <div className="opacity-75">
            © {new Date().getFullYear()} CraveCart Technologies, Inc. All rights reserved.
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="text-muted">Stay Connected:</span>
            <span className="badge bg-secondary p-2 rounded-circle">
              <i className="bi bi-instagram fs-6"></i>
            </span>
            <span className="badge bg-secondary p-2 rounded-circle">
              <i className="bi bi-twitter-x fs-6"></i>
            </span>
            <span className="badge bg-secondary p-2 rounded-circle">
              <i className="bi bi-linkedin fs-6"></i>
            </span>
            <span className="badge bg-secondary p-2 rounded-circle">
              <i className="bi bi-github fs-6"></i>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
