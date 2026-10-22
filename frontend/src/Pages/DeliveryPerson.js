import React, { useState } from "react";
import api from "../config/api";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Footer from "../components/Footer";
import DeliveryNavbar from "../components/DeliveryNavbar";

export default function DeliveryPerson() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup"

  // Login state
  const [login, setLogin] = useState({
    email: "",
    password: "",
  });
  const [loadingLogin, setLoadingLogin] = useState(false);

  const updatelogin = (event) => {
    setLogin({ ...login, [event.target.name]: event.target.value });
  };

  const sendlogin = (event) => {
    event.preventDefault();
    setLoadingLogin(true);

    api
      .post("/delivery/login", login)
      .then((res) => {
        toast.success(res.data.message || "Welcome back, Driver!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("id", res.data.id);
        localStorage.setItem("name", res.data.name || "Delivery Partner");
        setTimeout(() => navigate("/delivery/order"), 1000);
      })
      .catch((err) => {
        setLoadingLogin(false);
        toast.error(err.response?.data?.message || "Invalid credentials");
      });
  };

  // Signin/Registration state
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    phonenumber: "",
    address: "",
  });
  const [loadingSignup, setLoadingSignup] = useState(false);

  const [errormsg, setErrormsg] = useState({
    email: false,
    password: false,
    phonenumber: false,
  });

  const update = (event) => {
    setUser({ ...user, [event.target.name]: event.target.value });
  };

  const send = (event) => {
    event.preventDefault();

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      return setErrormsg((prev) => ({ ...prev, email: true }));
    } else {
      setErrormsg((prev) => ({ ...prev, email: false }));
    }

    if (!strongPasswordRegex.test(user.password)) {
      return setErrormsg((prev) => ({ ...prev, password: true }));
    } else {
      setErrormsg((prev) => ({ ...prev, password: false }));
    }

    if (!/^\d{10}$/.test(user.phonenumber)) {
      return setErrormsg((prev) => ({ ...prev, phonenumber: true }));
    } else {
      setErrormsg((prev) => ({ ...prev, phonenumber: false }));
    }

    setLoadingSignup(true);
    api
      .post("/delivery/signin", user)
      .then((res) => {
        setLoadingSignup(false);
        toast.success(res.data.message || "Registration Success! Please login.");
        setActiveTab("login");
      })
      .catch((err) => {
        setLoadingSignup(false);
        toast.error("Email Already Exists Or " + (err.response?.data?.message || err.message));
      });
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <DeliveryNavbar />

      {/* Hero Header */}
      <section
        className="py-5 text-white position-relative"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="container py-4 text-center">
          <span className="badge rounded-pill bg-primary px-3 py-1 font-heading fw-bold mb-3">
            <i className="bi bi-bicycle me-1"></i> CRAVECART DRIVER FLEET
          </span>
          <h1 className="display-5 fw-extrabold font-heading text-white mb-2">
            Deliver Happiness, Earn on Your Terms
          </h1>
          <p className="lead text-light opacity-75 mx-auto mb-4" style={{ maxWidth: "600px" }}>
            Accept trips near you with autonomous dispatch, earn transparent per-order payouts, and work whenever you choose.
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
              <i className="bi bi-box-arrow-in-right me-1"></i> Driver Sign In
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
              <i className="bi bi-person-plus me-1"></i> Join as Driver Partner
            </button>
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-7 col-xl-6">
            {activeTab === "login" ? (
              <div className="card border-0 shadow-xs rounded-4 bg-white p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="mx-auto text-primary mb-2 p-3 bg-primary bg-opacity-10 rounded-circle d-inline-flex">
                    <i className="bi bi-bicycle fs-2"></i>
                  </div>
                  <h3 className="fw-bold font-heading text-dark mb-1">Driver Partner Log In</h3>
                  <p className="text-muted small">Sign in to go online and receive live delivery requests</p>
                </div>

                <form onSubmit={sendlogin}>
                  <div className="mb-3">
                    <label className="crave-label">Fleet Email</label>
                    <div className="crave-search-bar">
                      <i className="bi bi-envelope"></i>
                      <input
                        type="email"
                        className="crave-input"
                        placeholder="driver@example.com"
                        onChange={updatelogin}
                        name="email"
                        value={login.email}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="crave-label">Password</label>
                    <div className="crave-search-bar">
                      <i className="bi bi-lock"></i>
                      <input
                        type="password"
                        className="crave-input"
                        placeholder="••••••••"
                        onChange={updatelogin}
                        name="password"
                        value={login.password}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-crave-primary w-100 py-3 font-heading"
                    disabled={loadingLogin}
                  >
                    {loadingLogin ? (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Entering Dispatch Hub...
                      </span>
                    ) : (
                      "Go to Trips Hub"
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="card border-0 shadow-xs rounded-4 bg-white p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="mx-auto text-primary mb-2 p-3 bg-primary bg-opacity-10 rounded-circle d-inline-flex">
                    <i className="bi bi-person-badge fs-2"></i>
                  </div>
                  <h3 className="fw-bold font-heading text-dark mb-1">Driver Onboarding Form</h3>
                  <p className="text-muted small">Submit your details to join CraveCart's express rider fleet</p>
                </div>

                <form onSubmit={send}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="crave-label">Full Name</label>
                      <input
                        type="text"
                        className="crave-input"
                        placeholder="e.g. Ramesh Kumar"
                        name="name"
                        value={user.name}
                        onChange={update}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="crave-label">Email Address</label>
                      <input
                        type="email"
                        className={`crave-input ${errormsg.email ? "border-danger" : ""}`}
                        placeholder="driver@gmail.com"
                        name="email"
                        value={user.email}
                        onChange={update}
                        required
                      />
                      {errormsg.email && <small className="text-danger">Invalid email format</small>}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="crave-label">Mobile Contact (10 digits)</label>
                      <input
                        type="tel"
                        className={`crave-input ${errormsg.phonenumber ? "border-danger" : ""}`}
                        placeholder="9876543210"
                        name="phonenumber"
                        value={user.phonenumber}
                        onChange={update}
                        required
                      />
                      {errormsg.phonenumber && <small className="text-danger">Must be 10 digits</small>}
                    </div>

                    <div className="col-12">
                      <label className="crave-label">Home Base / Operating Address</label>
                      <input
                        type="text"
                        className="crave-input"
                        placeholder="Street locality or city zone"
                        name="address"
                        value={user.address}
                        onChange={update}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="crave-label">Create Password</label>
                      <input
                        type="password"
                        className={`crave-input ${errormsg.password ? "border-danger" : ""}`}
                        placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 symbol"
                        name="password"
                        value={user.password}
                        onChange={update}
                        required
                      />
                      {errormsg.password && (
                        <small className="text-danger">
                          Password requires at least 8 chars, 1 uppercase, 1 digit, and 1 special symbol.
                        </small>
                      )}
                    </div>

                    <div className="col-12 mt-4">
                      <button
                        type="submit"
                        className="btn btn-crave-primary w-100 py-3 font-heading"
                        disabled={loadingSignup}
                      >
                        {loadingSignup ? (
                          <span>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Registering Partner...
                          </span>
                        ) : (
                          "Submit Driver Application"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Driver Benefits Bar */}
      <section className="bg-white py-5 border-top">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-12 col-md-4">
              <div className="metric-icon-box bg-success bg-opacity-10 text-success mx-auto mb-3">
                <i className="bi bi-cash-coin"></i>
              </div>
              <h5 className="fw-bold font-heading text-dark mb-2">Instant Trip Payouts</h5>
              <p className="text-muted small mb-0">
                Guaranteed base pay plus distance incentives for every completed customer drop.
              </p>
            </div>

            <div className="col-12 col-md-4">
              <div className="metric-icon-box bg-primary bg-opacity-10 text-primary mx-auto mb-3">
                <i className="bi bi-clock-history"></i>
              </div>
              <h5 className="fw-bold font-heading text-dark mb-2">Work Flexible Shifts</h5>
              <p className="text-muted small mb-0">
                Log online whenever convenient; choose part-time evening runs or full-day schedules.
              </p>
            </div>

            <div className="col-12 col-md-4">
              <div className="metric-icon-box bg-info bg-opacity-10 text-info mx-auto mb-3">
                <i className="bi bi-shield-check"></i>
              </div>
              <h5 className="fw-bold font-heading text-dark mb-2">Driver Safety & Support</h5>
              <p className="text-muted small mb-0">
                Secure 4-digit handover OTP verification ensures fair trip delivery completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
