import React, { useState } from "react";
import api from "../config/api";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import CraveCartLogo from "./CraveCartLogo";

export default function UserLogin() {
  const navigate = useNavigate();

  const [login, setLogin] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (event) => {
    setLogin({ ...login, [event.target.name]: event.target.value });
  };

  const send = (event) => {
    event.preventDefault();
    setLoading(true);

    api
      .post("/user/login", login)
      .then((res) => {
        toast.success(res.data.message || "Login Success!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("id", res.data.id);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name || res.data.email.split("@")[0]);
        localStorage.setItem("email", res.data.email);
        setTimeout(() => navigate("/"), 1000);
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.response?.data?.message || "Invalid credentials.");
      });
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 py-5 px-3"
      style={{
        background: "linear-gradient(180deg, #FFF6F2 0%, #F8FAFC 100%)",
      }}
    >
      <div className="w-100" style={{ maxWidth: "460px" }}>
        <div className="text-center mb-4">
          <CraveCartLogo size="lg" />
        </div>

        <form onSubmit={send} className="card border-0 shadow-xs rounded-4 bg-white p-4 p-md-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold font-heading text-dark mb-1">Welcome Back</h3>
            <p className="text-muted small">Log in to CraveCart to order your favorite dishes</p>
          </div>

          <div className="mb-3">
            <label className="crave-label">Email Address</label>
            <div className="crave-search-bar">
              <i className="bi bi-envelope"></i>
              <input
                type="email"
                className="crave-input"
                placeholder="name@example.com"
                onChange={update}
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
                onChange={update}
                name="password"
                value={login.password}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-crave-primary w-100 py-3 font-heading"
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" />
                Signing in...
              </span>
            ) : (
              "Log In to CraveCart"
            )}
          </button>

          <div className="text-center mt-3">
            <Link to="/user/signup" className="small text-primary text-decoration-none fw-semibold font-heading">
              Don't have an account? Sign Up
            </Link>
          </div>

          <hr className="my-4" />

          <div className="text-center">
            <div className="text-muted small mb-2 font-heading fw-semibold">Other Portals</div>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <Link
                to="/restaurant/login"
                className="btn btn-sm btn-crave-secondary rounded-pill px-3 py-1 font-heading"
                style={{ fontSize: "12px" }}
              >
                <i className="bi bi-shop text-warning me-1"></i> Kitchen
              </Link>
              <Link
                to="/delivery/login"
                className="btn btn-sm btn-crave-secondary rounded-pill px-3 py-1 font-heading"
                style={{ fontSize: "12px" }}
              >
                <i className="bi bi-bicycle text-primary me-1"></i> Driver
              </Link>
              <Link
                to="/admin"
                className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 font-heading"
                style={{ fontSize: "12px" }}
              >
                <i className="bi bi-shield-lock me-1"></i> Admin
              </Link>
            </div>
          </div>
        </form>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
