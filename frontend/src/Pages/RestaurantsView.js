import React, { useState } from "react";
import RestaurantNavbar from "../components/RestaurantNavbar";
import Footer from "../components/Footer";
import RestaurantLogin from "../components/RestaurantLogin";
import RestaurantSignin from "../components/RestaurantSignin";

export default function RestaurantsSignup() {
  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup"

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <RestaurantNavbar />

      {/* Hero / Portal Header */}
      <section
        className="py-5 text-white position-relative"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="container py-4 text-center">
          <span className="badge rounded-pill bg-warning text-dark px-3 py-1 font-heading fw-bold mb-3">
            <i className="bi bi-shop me-1"></i> CRAVECART MERCHANT NETWORK
          </span>
          <h1 className="display-5 fw-extrabold font-heading text-white mb-2">
            Grow Your Kitchen with CraveCart
          </h1>
          <p className="lead text-light opacity-75 mx-auto mb-4" style={{ maxWidth: "600px" }}>
            Reach thousands of local food lovers, access real-time order dispatch, and manage your culinary menus with ease.
          </p>

          {/* Tab Switcher */}
          <div className="d-inline-flex bg-dark bg-opacity-50 p-1 rounded-pill border border-secondary border-opacity-50 shadow-md">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-4 py-2 font-heading fw-semibold transition-all ${
                activeTab === "login"
                  ? "btn-crave-primary text-white"
                  : "text-light opacity-75"
              }`}
              onClick={() => setActiveTab("login")}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Merchant Sign In
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-4 py-2 font-heading fw-semibold transition-all ${
                activeTab === "signup"
                  ? "btn-crave-primary text-white"
                  : "text-light opacity-75"
              }`}
              onClick={() => setActiveTab("signup")}
            >
              <i className="bi bi-plus-circle me-1"></i> Register New Kitchen
            </button>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-7">
            {activeTab === "login" ? (
              <RestaurantLogin />
            ) : (
              <RestaurantSignin onSuccess={() => setActiveTab("login")} />
            )}
          </div>
        </div>
      </section>

      {/* Why Partner Grid */}
      <section className="bg-white py-5 border-top">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold font-heading text-dark mb-2">Why Cook with CraveCart?</h2>
            <p className="text-muted small mx-auto" style={{ maxWidth: "540px" }}>
              Our technology platform connects culinary talent with high-frequency food orders.
            </p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-12 col-md-4">
              <div className="metric-icon-box bg-primary bg-opacity-10 text-primary mx-auto mb-3">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <h5 className="fw-bold font-heading text-dark mb-2">Grow Daily Sales</h5>
              <p className="text-muted small mb-0">
                Tap into an engaged community of neighborhood foodies seeking quality dining.
              </p>
            </div>

            <div className="col-12 col-md-4">
              <div className="metric-icon-box bg-warning bg-opacity-10 text-warning mx-auto mb-3">
                <i className="bi bi-speedometer2"></i>
              </div>
              <h5 className="fw-bold font-heading text-dark mb-2">Kitchen Display System</h5>
              <p className="text-muted small mb-0">
                Manage incoming orders, toggle store hours, and mark dishes ready in one click.
              </p>
            </div>

            <div className="col-12 col-md-4">
              <div className="metric-icon-box bg-success bg-opacity-10 text-success mx-auto mb-3">
                <i className="bi bi-bicycle"></i>
              </div>
              <h5 className="fw-bold font-heading text-dark mb-2">Automated Rider Dispatch</h5>
              <p className="text-muted small mb-0">
                Our smart assignment engine dispatches the closest rated driver as food prepares.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
