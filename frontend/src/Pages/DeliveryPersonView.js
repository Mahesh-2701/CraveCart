import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import api from "../config/api";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import DeliveryNavbar from "../components/DeliveryNavbar";

export default function DeliveryPersonView() {
  const navigate = useNavigate();
  const deliverypersonid = localStorage.getItem("id");

  const [delperson, setDelperson] = useState({
    _id: "",
    id: "",
    name: "",
    email: "",
    password: "",
    address: "",
    phonenumber: "",
    vehicleType: "Electric Bike",
    rating: 4.8,
  });

  const [errormsg, setErrormsg] = useState({
    phonenumber: false,
  });

  useEffect(() => {
    if (deliverypersonid) {
      api
        .get("/delivery/view/" + deliverypersonid)
        .then((res) => setDelperson({ ...res.data }))
        .catch((err) =>
          toast.error("Network Error " + (err.response?.data?.message || err.message))
        );
    }
  }, [deliverypersonid]);

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

    api
      .put("/delivery/update/" + deliverypersonid, delperson)
      .then((res) => {
        toast.success(res.data.message || "Profile updated! Please re-login.");
        localStorage.removeItem("id");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setTimeout(() => navigate("/delivery"), 1500);
      })
      .catch((err) =>
        toast.error("Network Error: " + (err.response?.data?.message || err.message))
      );
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <DeliveryNavbar />

      <div className="container py-5 flex-grow-1">
        <div className="row g-4">
          {/* Driver Fleet Identity Card */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-xs rounded-4 p-4 text-center bg-white crave-card">
              <div
                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center shadow-sm"
                style={{
                  width: "90px",
                  height: "90px",
                  background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                  color: "#FFFFFF",
                  fontSize: "36px",
                  fontWeight: "bold",
                }}
              >
                <i className="bi bi-bicycle"></i>
              </div>
              <h4 className="fw-bold font-heading text-dark mb-1">{delperson.name || "Fleet Partner"}</h4>
              <p className="text-muted small mb-3">{delperson.email}</p>

              <div className="d-flex justify-content-center gap-2 mb-3">
                <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 font-heading small">
                  <i className="bi bi-shield-check me-1"></i> Active Fleet Member
                </span>
                <span className="badge rounded-pill bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-3 py-1 font-heading small">
                  <i className="bi bi-star-fill text-warning me-1"></i> 4.8 Rating
                </span>
              </div>

              <hr className="my-4" />

              <div className="text-start small text-muted">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-person-badge text-primary"></i>
                  <span>Partner ID: <strong>{delperson.id || delperson._id?.slice(-6).toUpperCase()}</strong></span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-telephone text-success"></i>
                  <span>{delperson.phonenumber || "No phone registered"}</span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-geo-alt text-danger"></i>
                  <span>{delperson.address || "Base Operations Zone"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Settings Card */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-xs rounded-4 p-4 p-md-5 bg-white">
              <div className="d-flex align-items-center gap-2 mb-4">
                <span className="badge rounded-circle bg-primary bg-opacity-10 text-primary p-2">
                  <i className="bi bi-gear-fill fs-5"></i>
                </span>
                <div>
                  <h3 className="mb-0 fw-bold font-heading text-dark">Driver Account Settings</h3>
                  <small className="text-muted">Update contact information, emergency phone, and vehicle base</small>
                </div>
              </div>

              <form onSubmit={handleupdate}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="crave-label">Rider Full Name</label>
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
                    <label className="crave-label">Fleet Email</label>
                    <input
                      type="email"
                      className="crave-input bg-light"
                      name="email"
                      value={delperson.email}
                      readOnly
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="crave-label">Mobile Contact (10 digits)</label>
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
                        Please enter a valid 10-digit phone number.
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
                    <label className="crave-label">Home Base / Delivery Operating Address</label>
                    <textarea
                      className="crave-input"
                      rows="3"
                      name="address"
                      value={delperson.address}
                      onChange={update}
                      required
                    />
                  </div>

                  <div className="col-12 mt-4">
                    <button type="submit" className="btn btn-crave-primary rounded-pill px-5 py-2 font-heading">
                      Save Driver Settings
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
