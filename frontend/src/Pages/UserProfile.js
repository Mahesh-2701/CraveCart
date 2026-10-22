import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import api from "../config/api";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Navbar from "../components/Navbar";

export default function UserProfile() {
  const navigate = useNavigate();
  const userid = localStorage.getItem("id");

  const [delperson, setDelperson] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    address: "",
    phonenumber: "",
    city: "",
    pincode: "",
  });

  const [errormsg, setErrormsg] = useState({
    phonenumber: false,
    pincode: false,
  });

  useEffect(() => {
    if (userid) {
      api
        .get("/user/view/" + userid)
        .then((res) => setDelperson({ ...res.data }))
        .catch((err) =>
          toast.error("Network Error: " + (err.response?.data?.message || err.message))
        );
    }
  }, [userid]);

  const update = (event) => {
    setDelperson({ ...delperson, [event.target.name]: event.target.value });
  };

  const handleupdate = (eve) => {
    eve.preventDefault();

    if (!/^\d{10}$/.test(delperson.phonenumber)) {
      return setErrormsg((prev) => ({ ...prev, phonenumber: true }));
    } else {
      setErrormsg((prev) => ({ ...prev, phonenumber: false }));
    }

    if (!/^\d{6}$/.test(delperson.pincode)) {
      return setErrormsg((prev) => ({ ...prev, pincode: true }));
    } else {
      setErrormsg((prev) => ({ ...prev, pincode: false }));
    }

    api
      .put("/user/update/" + userid, delperson)
      .then((res) => {
        toast.success(res.data.message || "Profile updated successfully! Please re-login.");
        localStorage.removeItem("id");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setTimeout(() => navigate("/user/login"), 1500);
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="row g-4">
          {/* Left Column - Profile Avatar Card */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white crave-card">
              <div
                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center shadow-sm"
                style={{
                  width: "90px",
                  height: "90px",
                  background: "linear-gradient(135deg, #FF5200 0%, #FF7A00 100%)",
                  color: "#FFFFFF",
                  fontSize: "36px",
                  fontWeight: "bold",
                }}
              >
                {delperson.name ? delperson.name[0].toUpperCase() : "U"}
              </div>
              <h4 className="fw-bold font-heading text-dark mb-1">{delperson.name || "Customer Account"}</h4>
              <p className="text-muted small mb-3">{delperson.email}</p>
              <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 font-heading small">
                <i className="bi bi-shield-check me-1"></i> Verified Foodie
              </span>

              <hr className="my-4" />

              <div className="text-start small text-muted">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-telephone text-primary"></i>
                  <span>{delperson.phonenumber || "No phone added"}</span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-geo-alt text-danger"></i>
                  <span>{delperson.city || "Bangalore"}, {delperson.pincode || "560001"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Edit Form */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-xs rounded-4 p-4 p-md-5 bg-white">
              <div className="d-flex align-items-center gap-2 mb-4">
                <span className="badge rounded-circle bg-primary bg-opacity-10 text-primary p-2">
                  <i className="bi bi-gear-fill fs-5"></i>
                </span>
                <div>
                  <h3 className="mb-0 fw-bold font-heading text-dark">Profile Settings</h3>
                  <small className="text-muted">Update your personal contact and delivery details</small>
                </div>
              </div>

              <form onSubmit={handleupdate}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="crave-label">Full Name</label>
                    <input
                      type="text"
                      className="crave-input"
                      name="name"
                      value={delperson.name}
                      onChange={update}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="crave-label">Email Address</label>
                    <input
                      type="email"
                      className="crave-input bg-light"
                      name="email"
                      value={delperson.email}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="crave-label">Phone Number (10 digits)</label>
                    <input
                      type="tel"
                      className={`crave-input ${errormsg.phonenumber ? "border-danger" : ""}`}
                      name="phonenumber"
                      value={delperson.phonenumber}
                      onChange={update}
                      required
                    />
                    {errormsg.phonenumber && (
                      <small className="text-danger mt-1 d-block">
                        Please enter a valid 10-digit mobile number.
                      </small>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="crave-label">Password</label>
                    <input
                      type="password"
                      className="crave-input"
                      name="password"
                      placeholder="Leave unchanged or enter new"
                      value={delperson.password}
                      onChange={update}
                    />
                  </div>

                  <div className="col-12">
                    <label className="crave-label">Default Delivery Street Address</label>
                    <textarea
                      className="crave-input"
                      rows="3"
                      name="address"
                      value={delperson.address}
                      onChange={update}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="crave-label">City</label>
                    <input
                      type="text"
                      className="crave-input"
                      name="city"
                      value={delperson.city}
                      onChange={update}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="crave-label">Pincode (6 digits)</label>
                    <input
                      type="text"
                      className={`crave-input ${errormsg.pincode ? "border-danger" : ""}`}
                      name="pincode"
                      value={delperson.pincode}
                      onChange={update}
                      required
                    />
                    {errormsg.pincode && (
                      <small className="text-danger mt-1 d-block">
                        Please enter a valid 6-digit postal pincode.
                      </small>
                    )}
                  </div>

                  <div className="col-12 mt-4">
                    <button type="submit" className="btn btn-crave-primary rounded-pill px-5 py-2 font-heading">
                      Save Profile Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
