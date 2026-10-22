import React, { useState } from "react";
import api from "../config/api";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

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

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

    api
      .post("/user/signin", user)
      .then((res) => {
        toast.success(res.data.message || "Registration Success! Please Login.");
        setTimeout(() => navigate("/user/login"), 1500);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Email already exists or server error.");
      });
  };

  return (
    <div className="login-page">
      <div className="container p-2 d-flex justify-content-center my-4">
        <form onSubmit={send} className="w-100 p-4 border bg-white shadow-xl rounded-4" style={{ maxWidth: "520px" }}>
          <div className="text-center mb-3">
            <h3 className="fw-bold mb-1">Create Account</h3>
            <p className="text-muted small">Join CraveCart for instant food delivery and hot offers</p>
          </div>

          <div className="row g-2 mb-2">
            <div className="col-12">
              <label className="form-label small fw-semibold">Full Name</label>
              <input type="text" className="form-control rounded-3" placeholder="Mahesh" onChange={update} name="name" required />
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold">Email Address</label>
              <input type="email" className="form-control rounded-3" placeholder="name@example.com" onChange={update} name="email" required />
              {errormsg.email && <div className="text-danger small">*Enter a valid email.</div>}
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold">Password</label>
              <input type="password" className="form-control rounded-3" placeholder="••••••••" onChange={update} name="password" required />
              {errormsg.password && (
                <div className="text-danger small">
                  *Must be 8+ chars with uppercase, lowercase, number & special char.
                </div>
              )}
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold">Phone Number</label>
              <input type="number" className="form-control rounded-3" placeholder="10-digit mobile number" onChange={update} name="phonenumber" required />
              {errormsg.phonenumber && <div className="text-danger small">*10 digits required.</div>}
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold">Delivery Address</label>
              <textarea className="form-control rounded-3" rows="2" onChange={update} name="address" placeholder="House/Flat, Street..." required />
            </div>

            <div className="col-6">
              <label className="form-label small fw-semibold">City</label>
              <input type="text" className="form-control rounded-3" placeholder="Bangalore" onChange={update} name="city" required />
            </div>

            <div className="col-6">
              <label className="form-label small fw-semibold">Pincode</label>
              <input type="number" className="form-control rounded-3" placeholder="560001" onChange={update} name="pincode" required />
              {errormsg.pincode && <div className="text-danger small">*Valid 6-digit pincode.</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary-crave w-100 py-2 fs-6 mt-3">
            Register Account
          </button>

          <div className="d-flex justify-content-center mt-3">
            <Link to="/user/login" className="small text-primary text-decoration-none fw-semibold">
              Already have an account? Log In
            </Link>
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
