import React, { useState } from "react";
import api from "../config/api";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

export default function AdminLogin() {
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
      .post("/admin/login", login)
      .then((res) => {
        toast.success(res.data.message || "Admin authorization granted");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("id", res.data.id);
        localStorage.setItem("role", res.data.role);
        setTimeout(() => navigate("/admin/dashboard"), 1000);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Invalid administrative credentials");
      });
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
      }}
    >
      <div className="container p-3 d-flex justify-content-center">
        <form
          onSubmit={send}
          className="w-100 p-4 border-0 shadow-2xl rounded-4 text-white"
          style={{ maxWidth: "440px", background: "rgba(30, 41, 59, 0.85)", backdropFilter: "blur(12px)" }}
        >
          <div className="text-center mb-4">
            <span className="badge bg-danger rounded-circle p-3 fs-5 mb-2">🛡️</span>
            <h3 className="fw-bold mb-1">CraveCart Administration</h3>
            <p className="text-muted small">Enter your administrative credentials to continue</p>
          </div>

          <div className="mb-3">
            <label className="form-label small text-light fw-semibold">Admin Email</label>
            <input
              type="email"
              className="form-control rounded-3 bg-dark text-white border-secondary"
              placeholder="admin@cravecart.com"
              onChange={update}
              name="email"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small text-light fw-semibold">Admin Password</label>
            <input
              type="password"
              className="form-control rounded-3 bg-dark text-white border-secondary"
              placeholder="••••••••"
              onChange={update}
              name="password"
              required
            />
          </div>

          <button type="submit" className="btn btn-warning w-100 py-2 fs-6 fw-bold">
            Sign In to Command Center
          </button>
        </form>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
