import React, { useState } from "react";
import api from "../config/api";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import CraveCartLogo from "../components/CraveCartLogo";

export default function AdminLogin() {
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
      .post("/admin/login", login)
      .then((res) => {
        toast.success(res.data.message || "Admin authorization granted");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("id", res.data.id);
        localStorage.setItem("role", res.data.role);
        setTimeout(() => navigate("/admin/dashboard"), 1000);
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.response?.data?.message || "Invalid administrative credentials");
      });
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{
        background: "linear-gradient(135deg, #0B1120 0%, #1E293B 100%)",
      }}
    >
      <div className="w-100" style={{ maxWidth: "440px" }}>
        <div className="text-center mb-4">
          <CraveCartLogo variant="white" size="lg" clickable={false} />
        </div>

        <form
          onSubmit={send}
          className="glass-panel-dark p-4 p-md-5 border-0 shadow-2xl rounded-4"
        >
          <div className="text-center mb-4">
            <div
              className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#EF4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <i className="bi bi-shield-lock-fill fs-4"></i>
            </div>
            <h3 className="fw-bold font-heading text-white mb-1">Platform Admin</h3>
            <p className="text-light opacity-75 small">Secure operations & dispatch management</p>
          </div>

          <div className="mb-3">
            <label className="crave-label text-light opacity-75">Admin Email</label>
            <div className="crave-search-bar">
              <i className="bi bi-person-fill-lock text-light opacity-50"></i>
              <input
                type="email"
                className="crave-input bg-dark text-white border-secondary"
                placeholder="admin@cravecart.com"
                onChange={update}
                name="email"
                value={login.email}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="crave-label text-light opacity-75">Access Key / Password</label>
            <div className="crave-search-bar">
              <i className="bi bi-key-fill text-light opacity-50"></i>
              <input
                type="password"
                className="crave-input bg-dark text-white border-secondary"
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
            className="btn btn-warning text-dark w-100 py-3 font-heading fw-bold shadow-md"
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" />
                Verifying Credentials...
              </span>
            ) : (
              "Sign In to Operations Console"
            )}
          </button>

          <div className="text-center mt-4">
            <Link to="/" className="text-light opacity-75 small text-decoration-none">
              <i className="bi bi-arrow-left me-1"></i> Return to Public Site
            </Link>
          </div>
        </form>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
