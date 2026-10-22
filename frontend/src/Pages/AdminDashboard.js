import React, { useEffect, useState } from "react";
import api, { getImageUrl } from "../config/api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import CraveCartLogo from "../components/CraveCartLogo";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    user: [],
    restaurant: [],
    deliveryman: [],
    menu: [],
    orders: [],
    coupons: [],
    stats: {},
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // New coupon state
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    title: "",
    discountType: "percentage",
    discountValue: 20,
    maxDiscount: 100,
    minOrderAmount: 199,
  });

  const loadDashboard = () => {
    api
      .get("/admin/dashboard")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load dashboard data");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleRestaurant = (id) => {
    api
      .patch(`/admin/restaurant/${id}/toggle`)
      .then((res) => {
        toast.success(res.data.message);
        loadDashboard();
      })
      .catch((err) => toast.error("Error: " + (err.response?.data?.message || err.message)));
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    api
      .post("/coupons", newCoupon)
      .then(() => {
        toast.success("Coupon created successfully!");
        setNewCoupon({
          code: "",
          title: "",
          discountType: "percentage",
          discountValue: 20,
          maxDiscount: 100,
          minOrderAmount: 199,
        });
        loadDashboard();
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to create coupon"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    navigate("/admin/login");
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* Admin Top Header */}
      <nav
        className="navbar navbar-dark sticky-top px-4 py-3 border-bottom shadow-sm"
        style={{ backgroundColor: "#0B1120", borderColor: "#1E293B" }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <CraveCartLogo variant="white" size="sm" clickable={false} />
            <span className="badge rounded-pill bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2 py-1 font-heading small">
              <i className="bi bi-shield-lock-fill me-1"></i> OPS COMMAND
            </span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light opacity-75 small d-none d-sm-inline font-heading">
              Superadmin Portal
            </span>
            <button
              className="btn btn-sm btn-outline-danger rounded-pill px-3 font-heading d-inline-flex align-items-center gap-1"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i> Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4 px-lg-5 flex-grow-1">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted font-heading">Aggregating platform intelligence...</p>
          </div>
        ) : (
          <>
            {/* KPI Metrics Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-4 col-xl-2">
                <div className="metric-card-v2 h-100">
                  <span className="text-muted small font-heading">Total Orders</span>
                  <h3 className="fw-bold font-heading mt-1 text-primary mb-1">
                    {data.stats?.totalOrders || data.orders?.length || 0}
                  </h3>
                  <small className="text-success fw-semibold font-heading">Platform Lifetime</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="metric-card-v2 h-100">
                  <span className="text-muted small font-heading">Settled GMV</span>
                  <h3 className="fw-bold font-heading mt-1 text-success mb-1">
                    ₹{data.stats?.totalRevenue || 0}
                  </h3>
                  <small className="text-muted font-heading">Gross Revenue</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="metric-card-v2 h-100">
                  <span className="text-muted small font-heading">Restaurants</span>
                  <h3 className="fw-bold font-heading mt-1 text-dark mb-1">
                    {data.stats?.totalRestaurants || data.restaurant?.length || 0}
                  </h3>
                  <small className="text-muted font-heading">Partner Kitchens</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="metric-card-v2 h-100">
                  <span className="text-muted small font-heading">Riders</span>
                  <h3 className="fw-bold font-heading mt-1 text-info mb-1">
                    {data.stats?.totalDeliveryPartners || data.deliveryman?.length || 0}
                  </h3>
                  <small className="text-muted font-heading">Active Fleet</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="metric-card-v2 h-100">
                  <span className="text-muted small font-heading">Foodies</span>
                  <h3 className="fw-bold font-heading mt-1 text-dark mb-1">
                    {data.stats?.totalUsers || data.user?.length || 0}
                  </h3>
                  <small className="text-muted font-heading">Registered Accounts</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="metric-card-v2 h-100">
                  <span className="text-muted small font-heading">Menu Items</span>
                  <h3 className="fw-bold font-heading mt-1 text-warning mb-1">
                    {data.menu?.length || 0}
                  </h3>
                  <small className="text-muted font-heading">Published Catalog</small>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="card shadow-xs border-0 rounded-4 p-2 mb-4 bg-white">
              <div className="d-flex flex-wrap gap-2">
                {[
                  { id: "overview", label: "Overview Feed", icon: "bi-grid-fill" },
                  { id: "restaurants", label: "Restaurants", icon: "bi-shop" },
                  { id: "orders", label: "Live Orders Dispatch", icon: "bi-receipt" },
                  { id: "coupons", label: "Promos & Coupons", icon: "bi-tag-fill" },
                  { id: "delivery", label: "Driver Fleet", icon: "bi-bicycle" },
                  { id: "users", label: "Users Catalog", icon: "bi-people-fill" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`btn btn-sm rounded-pill px-4 font-heading fw-semibold d-inline-flex align-items-center gap-2 ${
                      activeTab === tab.id ? "btn-crave-primary" : "btn-crave-secondary"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`bi ${tab.icon}`}></i>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="row g-4">
                <div className="col-lg-7">
                  <div className="card shadow-xs border-0 rounded-4 p-4 bg-white h-100">
                    <h5 className="fw-bold font-heading text-dark mb-3">Live Order Feed</h5>
                    <div className="crave-table-container">
                      <table className="crave-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Dish</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.orders || []).slice(0, 8).map((order) => (
                            <tr key={order._id}>
                              <td className="fw-bold font-monospace">#{order._id.slice(-6).toUpperCase()}</td>
                              <td>{order.menuid?.name || (order.items && order.items[0]?.name) || "Dish"}</td>
                              <td className="fw-bold font-heading text-primary">₹{order.totalAmount || order.price}</td>
                              <td>
                                <span className={`badge ${order.status === "Delivered" ? "bg-success" : "bg-warning text-dark"} rounded-pill font-heading`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-light text-secondary border font-heading">
                                  {order.paymentmethod}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="card shadow-xs border-0 rounded-4 p-4 bg-white h-100">
                    <h5 className="fw-bold font-heading text-dark mb-3">Restaurant Verification Queue</h5>
                    <div className="d-flex flex-column gap-3">
                      {(data.restaurant || []).slice(0, 6).map((r) => (
                        <div key={r._id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-light">
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={getImageUrl(r.image)}
                              alt={r.name}
                              className="rounded-3 shadow-xs object-fit-cover"
                              style={{ width: "42px", height: "42px" }}
                            />
                            <div>
                              <strong className="d-block font-heading text-dark text-truncate" style={{ maxWidth: "150px" }}>{r.name}</strong>
                              <small className="text-muted"><i className="bi bi-geo-alt me-1 text-danger"></i>{r.city || "Bangalore"}</small>
                            </div>
                          </div>
                          <button
                            className={`btn btn-sm rounded-pill px-3 font-heading fw-semibold ${r.isactive ? "btn-outline-danger" : "btn-success"}`}
                            onClick={() => handleToggleRestaurant(r._id)}
                          >
                            {r.isactive ? "Deactivate" : "Approve & Open"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Restaurants */}
            {activeTab === "restaurants" && (
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold font-heading text-dark mb-3">All Registered Restaurants ({data.restaurant?.length})</h5>
                <div className="crave-table-container">
                  <table className="crave-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Restaurant Name</th>
                        <th>City / Address</th>
                        <th>Phone</th>
                        <th>Rating</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.restaurant || []).map((r, i) => (
                        <tr key={r._id}>
                          <td className="text-muted small">{i + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img src={getImageUrl(r.image)} alt={r.name} className="rounded-3 shadow-xs object-fit-cover" style={{ width: "38px", height: "38px" }} />
                              <strong className="font-heading text-dark">{r.name}</strong>
                            </div>
                          </td>
                          <td>{r.address}, {r.city}</td>
                          <td>{r.phonenumber}</td>
                          <td>
                            <span className="rating-pill">
                              <i className="bi bi-star-fill" style={{ fontSize: "10px" }}></i> {r.rating || "4.3"}
                            </span>
                          </td>
                          <td>
                            <span className={`badge rounded-pill font-heading ${r.isactive ? "bg-success bg-opacity-10 text-success border border-success" : "bg-secondary bg-opacity-10 text-secondary border border-secondary"}`}>
                              {r.isactive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className={`btn btn-sm rounded-pill px-3 font-heading fw-semibold ${r.isactive ? "btn-outline-danger" : "btn-outline-success"}`}
                              onClick={() => handleToggleRestaurant(r._id)}
                            >
                              {r.isactive ? "Turn Off" : "Approve"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Orders */}
            {activeTab === "orders" && (
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold font-heading text-dark mb-0">Platform Orders & Dispatch Control</h5>
                    <small className="text-muted">Authoritative multi-role state monitoring and operational overrides</small>
                  </div>
                  <button
                    className="btn btn-sm btn-crave-secondary rounded-pill px-3 font-heading d-inline-flex align-items-center gap-1"
                    onClick={loadDashboard}
                  >
                    <i className="bi bi-arrow-clockwise"></i> Refresh Feed
                  </button>
                </div>
                <div className="crave-table-container">
                  <table className="crave-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>User</th>
                        <th>Item</th>
                        <th>Amount</th>
                        <th>Kitchen State</th>
                        <th>Delivery State</th>
                        <th>Rider</th>
                        <th>Live Map</th>
                        <th className="text-end">Operations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.orders || []).map((o) => {
                        const kStatus = o.orderStatus || o.status;
                        const dStatus = o.deliveryStatus || "NOT_REQUESTED";
                        const canReassign = !["DELIVERED", "CANCELLED", "REJECTED"].includes(kStatus);

                        return (
                          <tr key={o._id}>
                            <td className="fw-bold font-monospace">#{o._id.slice(-6).toUpperCase()}</td>
                            <td>{o.userid?.name || "Customer"}</td>
                            <td>{o.menuid?.name || (o.items && o.items[0]?.name) || "Dish"}</td>
                            <td className="fw-bold font-heading text-primary">₹{o.totalAmount || o.price}</td>
                            <td>
                              <span
                                className={`badge px-2 py-1 rounded-pill font-heading ${
                                  kStatus === "DELIVERED"
                                    ? "bg-success bg-opacity-10 text-success border border-success"
                                    : kStatus === "PREPARING"
                                    ? "bg-warning bg-opacity-10 text-dark border border-warning"
                                    : kStatus === "CANCELLED"
                                    ? "bg-danger bg-opacity-10 text-danger border border-danger"
                                    : "bg-light text-dark border"
                                }`}
                              >
                                {kStatus}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge px-2 py-1 rounded-pill font-heading ${
                                  dStatus === "DELIVERED"
                                    ? "bg-success"
                                    : dStatus === "OUT_FOR_DELIVERY"
                                    ? "bg-primary"
                                    : dStatus === "ASSIGNED" || dStatus === "ARRIVED_AT_RESTAURANT"
                                    ? "bg-info text-dark"
                                    : "bg-secondary"
                                }`}
                              >
                                {dStatus}
                              </span>
                            </td>
                            <td>
                              {o.deliverypersonid?.name ? (
                                <span className="d-inline-flex align-items-center gap-1">
                                  <i className="bi bi-bicycle text-primary"></i> {o.deliverypersonid.name}
                                </span>
                              ) : (
                                <span className="text-muted italic">Unassigned</span>
                              )}
                            </td>
                            <td>
                              <Link
                                to={`/orders/track/${o._id}`}
                                className="btn btn-sm btn-crave-secondary rounded-pill px-3 py-1 font-heading"
                                style={{ fontSize: "12px" }}
                              >
                                <i className="bi bi-map me-1"></i> Track
                              </Link>
                            </td>
                            <td className="text-end">
                              {canReassign && (
                                <button
                                  className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 font-heading d-inline-flex align-items-center gap-1"
                                  style={{ fontSize: "11px" }}
                                  onClick={() => {
                                    const reason = prompt("Enter reason for manual dispatch restart:", "Rider unresponsiveness");
                                    if (reason) {
                                      api.post(`/admin/deliveries/${o._id}/reassign`, { reason })
                                        .then((res) => {
                                          toast.success(res.data.message || "Dispatch restarted");
                                          loadDashboard();
                                        })
                                        .catch((err) => toast.error(err.response?.data?.message || "Reassign failed"));
                                    }
                                  }}
                                >
                                  <i className="bi bi-lightning-charge"></i> Re-dispatch
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Coupons */}
            {activeTab === "coupons" && (
              <div className="row g-4">
                <div className="col-lg-5">
                  <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                    <h5 className="fw-bold font-heading text-dark mb-3">Create New Offer / Promo</h5>
                    <form onSubmit={handleCreateCoupon}>
                      <div className="mb-3">
                        <label className="crave-label">Coupon Code</label>
                        <input
                          type="text"
                          className="crave-input text-uppercase font-monospace"
                          value={newCoupon.code}
                          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                          placeholder="e.g. FESTIVE30"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="crave-label">Offer Title / Description</label>
                        <input
                          type="text"
                          className="crave-input"
                          value={newCoupon.title}
                          onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                          placeholder="e.g. 30% Off up to ₹150"
                          required
                        />
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="crave-label">Type</label>
                          <select
                            className="crave-input"
                            value={newCoupon.discountType}
                            onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="crave-label">Discount Value</label>
                          <input
                            type="number"
                            className="crave-input"
                            value={newCoupon.discountValue}
                            onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                      <div className="row g-2 mb-4">
                        <div className="col-6">
                          <label className="crave-label">Max Discount (₹)</label>
                          <input
                            type="number"
                            className="crave-input"
                            value={newCoupon.maxDiscount}
                            onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="crave-label">Min Spend (₹)</label>
                          <input
                            type="number"
                            className="crave-input"
                            value={newCoupon.minOrderAmount}
                            onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-crave-primary w-100 py-3 font-heading">
                        Publish Promo Code
                      </button>
                    </form>
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                    <h5 className="fw-bold font-heading text-dark mb-3">Active Promotional Codes</h5>
                    <div className="crave-table-container">
                      <table className="crave-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Value</th>
                            <th>Min Order</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.coupons || []).map((c) => (
                            <tr key={c._id}>
                              <td className="fw-bold font-monospace text-primary">{c.code}</td>
                              <td>{c.title}</td>
                              <td className="font-heading">{c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                              <td>₹{c.minOrderAmount}</td>
                              <td>
                                <span className={`badge rounded-pill font-heading ${c.isActive ? "bg-success" : "bg-secondary"}`}>
                                  {c.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Delivery */}
            {activeTab === "delivery" && (
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold font-heading text-dark mb-3">Delivery Partner Fleet ({data.deliveryman?.length})</h5>
                <div className="crave-table-container">
                  <table className="crave-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Vehicle</th>
                        <th>Availability</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.deliveryman || []).map((d, i) => (
                        <tr key={d._id}>
                          <td className="text-muted small">{i + 1}</td>
                          <td className="fw-bold font-heading text-dark">
                            <i className="bi bi-bicycle text-primary me-1"></i> {d.name}
                          </td>
                          <td>{d.email}</td>
                          <td>{d.phonenumber || "-"}</td>
                          <td>{d.vehicleType || "Electric Bike"}</td>
                          <td>
                            <span className={`badge rounded-pill font-heading ${d.isAvailable ? "bg-success" : "bg-secondary"}`}>
                              {d.isAvailable ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td>
                            <span className="rating-pill">
                              <i className="bi bi-star-fill" style={{ fontSize: "10px" }}></i> {d.rating || "4.8"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 6: Users */}
            {activeTab === "users" && (
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold font-heading text-dark mb-3">Registered Customers ({data.user?.length})</h5>
                <div className="crave-table-container">
                  <table className="crave-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>City / Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.user || []).map((u, i) => (
                        <tr key={u._id}>
                          <td className="text-muted small">{i + 1}</td>
                          <td className="fw-bold font-heading text-dark">
                            <i className="bi bi-person-circle text-muted me-1"></i> {u.name}
                          </td>
                          <td>{u.email}</td>
                          <td>{u.phonenumber || "-"}</td>
                          <td>{u.address || "-"}, {u.city || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
