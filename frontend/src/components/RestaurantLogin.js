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

  const update = (event) => {
    setLogin({ ...login, [event.target.name]: event.target.value });
  };

  const send = (event) => {
    event.preventDefault();

    api
      .post("/restaurant/login", login)
      .then((res) => {
        toast.success(res.data.message);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("id", res.data.id);
        localStorage.setItem("name", res.data.name || "Kitchen");
        setTimeout(() => navigate("/restaurant/admin"), 1200);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Invalid credentials");
      });
  };

  return (
    <div className="login-page rounded-bottom-4">
      <div className="container d-flex justify-content-center">
        <form onSubmit={send} className="w-100 p-4 border shadow-xl bg-white rounded-4" style={{ maxWidth: "460px" }}>
          <div className="text-center mb-3">
            <h3 className="fw-bold mb-1">Kitchen Partner Portal</h3>
            <p className="text-muted small">Log in to manage orders, dishes, and inventory</p>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Registered Email</label>
            <input
              type="email"
              className="form-control rounded-3"
              placeholder="kitchen@example.com"
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
            Access Kitchen Dashboard
          </button>
        </form>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.75)),
                      url("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80")
                      no-repeat center center;
          background-size: cover;
        }
      `}</style>
    </div>
  );
}
