import React, { useState } from "react";
import api from "../config/api";
import { ToastContainer, toast } from "react-toastify";

export default function RestaurantSignin({ onSuccess }) {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    phonenumber: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [file, setFile] = useState(null);
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

  const fileupdate = (event) => {
    setFile(event.target.files[0]);
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
    const formdata = new FormData();
    formdata.append("image", file);
    formdata.append("name", user.name);
    formdata.append("email", user.email);
    formdata.append("password", user.password);
    formdata.append("city", user.city);
    formdata.append("pincode", user.pincode);
    formdata.append("phonenumber", user.phonenumber);
    formdata.append("address", user.address);

    api
      .post("/restaurant/signin", formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setLoading(false);
        toast.success(res.data.message || "Registration successful! You can now log in.");
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.response?.data?.message || "Registration failed");
      });
  };

  return (
    <div className="card border-0 shadow-xs rounded-4 bg-white p-4 p-md-5">
      <div className="text-center mb-4">
        <div className="mx-auto text-primary mb-2 p-3 bg-primary bg-opacity-10 rounded-circle d-inline-flex">
          <i className="bi bi-file-earmark-plus fs-2"></i>
        </div>
        <h3 className="fw-bold font-heading text-dark mb-1">Partner Kitchen Onboarding</h3>
        <p className="text-muted small">Register your restaurant and begin reaching hungry local foodies</p>
      </div>

      <form onSubmit={send}>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="crave-label">Restaurant Brand Name</label>
            <input
              type="text"
              className="crave-input"
              placeholder="e.g. Empire Spice Kitchen"
              name="name"
              value={user.name}
              onChange={update}
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="crave-label">Business Email</label>
            <input
              type="email"
              className={`crave-input ${errormsg.email ? "border-danger" : ""}`}
              placeholder="partner@restaurant.com"
              name="email"
              value={user.email}
              onChange={update}
              required
            />
            {errormsg.email && <small className="text-danger">Invalid email format</small>}
          </div>

          <div className="col-12 col-md-6">
            <label className="crave-label">Kitchen Banner Image</label>
            <input
              type="file"
              className="crave-input"
              name="image"
              accept="image/*"
              onChange={fileupdate}
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="crave-label">Phone Contact (10 digits)</label>
            <input
              type="tel"
              className={`crave-input ${errormsg.phonenumber ? "border-danger" : ""}`}
              placeholder="9876543210"
              name="phonenumber"
              value={user.phonenumber}
              onChange={update}
              required
            />
            {errormsg.phonenumber && <small className="text-danger">Must be a 10-digit number</small>}
          </div>

          <div className="col-12">
            <label className="crave-label">Kitchen Pickup Address</label>
            <input
              type="text"
              className="crave-input"
              placeholder="Complete street address & locality"
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
            <label className="crave-label">Postal Pincode</label>
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

          <div className="col-12">
            <label className="crave-label">Secure Password</label>
            <input
              type="password"
              className={`crave-input ${errormsg.password ? "border-danger" : ""}`}
              placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special symbol"
              name="password"
              value={user.password}
              onChange={update}
              required
            />
            {errormsg.password && (
              <small className="text-danger">
                Password must have at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
              </small>
            )}
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
                  Submitting Application...
                </span>
              ) : (
                "Submit Restaurant Application"
              )}
            </button>
          </div>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
