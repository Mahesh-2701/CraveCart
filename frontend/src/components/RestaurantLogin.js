import React, { useState } from "react";
import api from "../config/api";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

export default function RestaurantLogin() {
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
      .post("/restaurant/login", login)
      .then((res) => {
        toast.success(res.data.message || "Login successful!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("id", res.data.id);
        localStorage.setItem("name", res.data.name || "Kitchen");
        setTimeout(() => navigate("/restaurant/admin"), 1000);
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.response?.data?.message || "Invalid credentials");
      });
  };

  return (
    <div className="card border-0 shadow-xs rounded-4 bg-white p-4 p-md-5">
      <div className="text-center mb-4">
        <div className="mx-auto text-primary mb-2 p-3 bg-primary bg-opacity-10 rounded-circle d-inline-flex">
          <i className="bi bi-shop-window fs-2"></i>
        </div>
        <h3 className="fw-bold font-heading text-dark mb-1">Kitchen Partner Log In</h3>
        <p className="text-muted small">Sign in to manage dishes, active kitchen orders, and store status</p>
      </div>

      <form onSubmit={send}>
        <div className="mb-3">
          <label className="crave-label">Registered Merchant Email</label>
          <div className="crave-search-bar">
            <i className="bi bi-envelope"></i>
            <input
              type="email"
              className="crave-input"
              placeholder="kitchen@example.com"
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
              Authenticating...
            </span>
          ) : (
            "Access Kitchen Dashboard"
          )}
        </button>
      </form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
