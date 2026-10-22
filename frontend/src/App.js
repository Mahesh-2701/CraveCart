import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Link, useNavigate } from "react-router-dom";
import AIChatWidget from "./components/AIChatWidget";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/foods?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/foods");
    }
  };

  const categories = [
    {
      name: "Biryani & Bowls",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60",
      query: "biryani",
    },
    {
      name: "Artisan Pizza",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60",
      query: "pizza",
    },
    {
      name: "Craft Burgers",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
      query: "burger",
    },
    {
      name: "South Indian",
      image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&auto=format&fit=crop&q=60",
      query: "dosa",
    },
    {
      name: "Desserts & Bakes",
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=60",
      query: "cake",
    },
    {
      name: "Fresh Beverages",
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60",
      query: "juice",
    },
  ];

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Navbar />

      {/* Hero Section */}
      <section className="position-relative overflow-hidden py-5 px-3" style={{ background: "linear-gradient(180deg, #FFF6F2 0%, #FFFFFF 100%)" }}>
        <div className="container py-lg-4">
          <div className="row align-items-center g-5">
            {/* Left Hero Content */}
            <div className="col-12 col-lg-7">
              <div className="d-inline-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill border shadow-xs mb-3">
                <span className="badge rounded-pill bg-primary px-2 py-1">FAST & FRESH</span>
                <span className="small text-muted fw-semibold">
                  Live Real-Time Order Tracking & Express Delivery
                </span>
              </div>
              <h1 className="display-4 fw-extrabold font-heading text-dark mb-3" style={{ lineHeight: 1.15 }}>
                Savor the Best Dishes <br />
                <span style={{ color: "var(--primary)" }}>Delivered in Minutes.</span>
              </h1>
              <p className="lead text-muted mb-4" style={{ maxWidth: "560px" }}>
                Explore thousands of chef-curated dishes and premium local restaurants.
                Fast delivery, live GPS tracking, and seamless checkout.
              </p>

              {/* Instant Search Bar */}
              <form onSubmit={handleSearchSubmit} className="d-flex align-items-center bg-white p-2 rounded-pill shadow-md border mb-4" style={{ maxWidth: "540px" }}>
                <i className="bi bi-search text-muted fs-5 ms-3 me-2"></i>
                <input
                  type="text"
                  className="form-control border-0 shadow-none px-2 py-2"
                  placeholder="Search for biryani, burgers, pizza or cuisine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: "0.95rem" }}
                />
                <button type="submit" className="btn btn-crave-primary rounded-pill px-4 py-2 ms-2">
                  Search
                </button>
              </form>

              {/* Quick Tags */}
              <div className="d-flex flex-wrap align-items-center gap-2 text-muted small">
                <span className="fw-semibold">Popular Now:</span>
                <button type="button" onClick={() => navigate("/foods?category=Biryani")} className="btn btn-sm btn-light border rounded-pill px-3 py-1 text-secondary">
                  Biryani
                </button>
                <button type="button" onClick={() => navigate("/foods?category=Pizza")} className="btn btn-sm btn-light border rounded-pill px-3 py-1 text-secondary">
                  Pizza
                </button>
                <button type="button" onClick={() => navigate("/foods?category=Burger")} className="btn btn-sm btn-light border rounded-pill px-3 py-1 text-secondary">
                  Burgers
                </button>
                <button type="button" onClick={() => navigate("/restaurants")} className="btn btn-sm btn-light border rounded-pill px-3 py-1 text-primary fw-semibold">
                  Top Restaurants →
                </button>
              </div>
            </div>

            {/* Right Hero Visual Cards */}
            <div className="col-12 col-lg-5 position-relative text-center">
              <div className="position-relative mx-auto" style={{ maxWidth: "420px" }}>
                {/* Main Hero Platter Image */}
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80"
                  alt="Delicious Bowl"
                  className="img-fluid rounded-5 shadow-xl animate-float"
                  style={{ width: "100%", height: "380px", objectFit: "cover" }}
                />

                {/* Floating Micro Badge: Fast Delivery */}
                <div
                  className="glass-panel position-absolute p-3 rounded-4 shadow-lg d-flex align-items-center gap-3"
                  style={{ bottom: "-15px", left: "-15px", border: "1px solid rgba(255,255,255,0.8)" }}
                >
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                    <i className="bi bi-stopwatch-fill fs-5"></i>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold font-heading text-dark">30 Mins</div>
                    <small className="text-muted">Average Delivery</small>
                  </div>
                </div>

                {/* Floating Micro Badge: 4.8 Rating */}
                <div
                  className="glass-panel position-absolute p-2 px-3 rounded-pill shadow-lg d-flex align-items-center gap-2"
                  style={{ top: "20px", right: "-15px" }}
                >
                  <i className="bi bi-star-fill text-warning"></i>
                  <span className="fw-bold text-dark font-heading">4.9 / 5.0</span>
                  <small className="text-muted">(10k+ reviews)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Discovery Carousel / Grid */}
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <span className="text-primary fw-bold text-uppercase small" style={{ letterSpacing: "1px" }}>
              Inspiration For Your First Order
            </span>
            <h2 className="fw-bold font-heading text-dark mt-1 mb-0">What's on your mind?</h2>
          </div>
          <Link to="/foods" className="btn btn-sm btn-crave-secondary rounded-pill px-3 d-none d-sm-inline-flex">
            Explore All Dishes <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>

        <div className="row g-3 row-cols-2 row-cols-md-3 row-cols-lg-6">
          {categories.map((cat, idx) => (
            <div key={idx} className="col">
              <Link
                to={`/foods?search=${encodeURIComponent(cat.query)}`}
                className="card h-100 border-0 bg-white shadow-xs rounded-4 text-center p-3 text-decoration-none crave-card-hover"
                style={{ transition: "all 0.25s ease" }}
              >
                <div className="rounded-circle overflow-hidden mx-auto mb-2 shadow-sm" style={{ width: "90px", height: "90px" }}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-100 h-100 object-fit-cover"
                    loading="lazy"
                  />
                </div>
                <h6 className="fw-semibold text-dark mb-0 font-heading" style={{ fontSize: "0.9rem" }}>
                  {cat.name}
                </h6>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features & Trust Bar */}
      <section className="bg-white py-5 border-top border-bottom">
        <div className="container">
          <div className="row g-4 text-center text-md-start">
            <div className="col-12 col-md-4 d-flex flex-column flex-md-row align-items-center gap-3">
              <div className="metric-icon-box bg-primary bg-opacity-10 text-primary flex-shrink-0">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div>
                <h5 className="fw-bold font-heading mb-1">Live Map Telemetry</h5>
                <p className="text-muted small mb-0">
                  Track your food order from kitchen preparation to driver pickup with high precision.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-4 d-flex flex-column flex-md-row align-items-center gap-3">
              <div className="metric-icon-box bg-success bg-opacity-10 text-success flex-shrink-0">
                <i className="bi bi-shield-check"></i>
              </div>
              <div>
                <h5 className="fw-bold font-heading mb-1">Verified Kitchens</h5>
                <p className="text-muted small mb-0">
                  Every restaurant complies with strict food hygiene standards and temperature checks.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-4 d-flex flex-column flex-md-row align-items-center gap-3">
              <div className="metric-icon-box bg-info bg-opacity-10 text-info flex-shrink-0">
                <i className="bi bi-wallet2"></i>
              </div>
              <div>
                <h5 className="fw-bold font-heading mb-1">Razorpay & UPI Instant</h5>
                <p className="text-muted small mb-0">
                  Seamless payment flow with instant webhook order confirmations and COD options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Banners (Dual Grid) */}
      <section className="container py-5 my-2">
        <div className="row g-4">
          {/* Restaurant Partner */}
          <div className="col-12 col-lg-6">
            <div
              className="p-4 p-md-5 rounded-4 text-white position-relative overflow-hidden h-100 d-flex flex-column justify-content-between shadow-md"
              style={{
                background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                minHeight: "280px",
              }}
            >
              <div>
                <span className="badge rounded-pill bg-warning text-dark px-3 py-1 fw-bold mb-3">
                  <i className="bi bi-shop me-1"></i> FOR RESTAURANTS
                </span>
                <h3 className="fw-bold font-heading text-white mb-2">Partner with CraveCart</h3>
                <p className="text-light opacity-75 mb-4" style={{ maxWidth: "420px" }}>
                  Supercharge your sales with our Kitchen Display System (KDS), menu manager,
                  and instant rider dispatch.
                </p>
              </div>
              <div>
                <Link to="/restaurant/view" className="btn btn-crave-primary rounded-pill px-4">
                  Merchant Portal <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Delivery Partner */}
          <div className="col-12 col-lg-6">
            <div
              className="p-4 p-md-5 rounded-4 text-white position-relative overflow-hidden h-100 d-flex flex-column justify-content-between shadow-md"
              style={{
                background: "linear-gradient(135deg, #FF5200 0%, #FF7A00 100%)",
                minHeight: "280px",
              }}
            >
              <div>
                <span className="badge rounded-pill bg-white text-primary px-3 py-1 fw-bold mb-3">
                  <i className="bi bi-bicycle me-1"></i> FOR RIDERS
                </span>
                <h3 className="fw-bold font-heading text-white mb-2">Ride & Earn with CraveCart</h3>
                <p className="text-white opacity-90 mb-4" style={{ maxWidth: "420px" }}>
                  Enjoy flexible delivery shifts, fair per-trip earnings, direct OTP handover,
                  and live GPS route assistance.
                </p>
              </div>
              <div>
                <Link to="/delivery" className="btn btn-crave-dark rounded-pill px-4">
                  Join Driver Fleet <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating AI Concierge */}
      <AIChatWidget />

      {/* Footer */}
      <Footer />
    </div>
  );
}
