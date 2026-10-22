import React, { useState } from "react";
import api from "../config/api";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

export default function UserLogin() {
  const navigate = useNavigate();

  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  const update = (event) => {
    setLogin({ ...login, [event.target.name]: event.target.value });
  };

  const send = (event) => {
    event.preventDefault();

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
        toast.error(err.response?.data?.message || "Invalid credentials.");
      });
  };

  return (
    <div className="login-page">
      <div className="container p-2 d-flex justify-content-center my-5">
        <form onSubmit={send} className="w-100 p-4 border bg-white shadow-xl rounded-4" style={{ maxWidth: "460px" }}>
          <div className="text-center mb-4">
            <h3 className="fw-bold mb-1">Welcome Back</h3>
            <p className="text-muted small">Log in to CraveCart to order your favorite meals</p>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control rounded-3"
              placeholder="name@example.com"
              onChange={update}
              name="email"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              className="form-control rounded-3"
              placeholder="••••••••"
              onChange={update}
              name="password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary-crave w-100 py-2 fs-6">
            Log In to CraveCart
          </button>

          <div className="d-flex justify-content-center mt-3">
            <Link to="/user/signup" className="small text-primary text-decoration-none fw-semibold">
              Don't have an account? Sign Up
            </Link>
          </div>

          <hr className="my-3 text-muted" />

          <div className="text-center">
            <div className="text-muted small mb-2 fw-semibold">Looking for Partner or Admin Portals?</div>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <Link to="/restaurant/login" className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1" style={{ fontSize: "12px" }}>
                🍽️ Restaurant
              </Link>
              <Link to="/delivery/login" className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1" style={{ fontSize: "12px" }}>
                🚴 Delivery
              </Link>
              <Link to="/admin" className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1" style={{ fontSize: "12px" }}>
                👑 Admin
              </Link>
            </div>
          </div>
        </form>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.7)),
                      url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80")
                      no-repeat center center;
          background-size: cover;
        }
      `}</style>
    </div>
  );
}
