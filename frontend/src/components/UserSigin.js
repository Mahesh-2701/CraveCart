import React, { useState } from "react";
import api from "../config/api";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import CraveCartLogo from "./CraveCartLogo";

export default function UserSigin() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    phonenumber: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);

  const [errormsg, setErrormsg] = useState({
    email: false,
    password: false,
    phonenumber: false,
    pincode: false,
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

    if (!/^\d{6}$/.test(user.pincode)) {
      return setErrormsg((prev) => ({ ...prev, pincode: true }));
    } else {
      setErrormsg((prev) => ({ ...prev, pincode: false }));
    }

    setLoading(true);
    api
      .post("/user/signin", user)
      .then((res) => {
        setLoading(false);
        toast.success(res.data.message || "Registration Success! Please Login.");
        setTimeout(() => navigate("/user/login"), 1200);
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.response?.data?.message || "Email already exists or server error.");
      });
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 py-5 px-3"
      style={{
        background: "linear-gradient(180deg, #FFF6F2 0%, #F8FAFC 100%)",
      }}
    >
      <div className="w-100" style={{ maxWidth: "560px" }}>
        <div className="text-center mb-4">
          <CraveCartLogo size="lg" />
        </div>

        <form onSubmit={send} className="card border-0 shadow-xs rounded-4 bg-white p-4 p-md-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold font-heading text-dark mb-1">Create Foodie Account</h3>
            <p className="text-muted small">Join CraveCart for express meals, live GPS tracking, and exclusive discounts</p>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
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
                placeholder="name@example.com"
                name="email"
                value={user.email}
                onChange={update}
                required
              />
              {errormsg.email && <small className="text-danger">Invalid email address</small>}
            </div>

            <div className="col-12 col-md-6">
              <label className="crave-label">Password</label>
              <input
                type="password"
                className={`crave-input ${errormsg.password ? "border-danger" : ""}`}
                placeholder="••••••••"
                name="password"
                value={user.password}
                onChange={update}
                required
              />
              {errormsg.password && (
                <small className="text-danger d-block">
                  Min 8 chars, 1 uppercase, 1 digit, 1 symbol.
                </small>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="crave-label">Phone Number (10 digits)</label>
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
              <label className="crave-label">Delivery Street Address</label>
              <input
                type="text"
                className="crave-input"
                placeholder="House/flat, street, landmarks"
                name="address"
                value={user.address}
                onChange={update}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="crave-label">City</label>
              <input
                type="text"
                className="crave-input"
                placeholder="Bangalore"
                name="city"
                value={user.city}
                onChange={update}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="crave-label">Pincode</label>
              <input
                type="text"
                className={`crave-input ${errormsg.pincode ? "border-danger" : ""}`}
                placeholder="560001"
                name="pincode"
                value={user.pincode}
                onChange={update}
                required
              />
              {errormsg.pincode && <small className="text-danger">Must be 6 digits</small>}
            </div>

            <div className="col-12 mt-4">
              <button
                type="submit"
                className="btn btn-crave-primary w-100 py-3 font-heading"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Profile...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </div>

          <div className="text-center mt-3">
            <Link to="/user/login" className="small text-primary text-decoration-none fw-semibold font-heading">
              Already have an account? Log In
            </Link>
          </div>
        </form>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
