import React, { useEffect, useState } from "react";
import api, { getImageUrl } from "../config/api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

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
      .then((res) => {
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
    <div className="bg-light min-vh-100">
      {/* Admin Top Header */}
      <nav className="navbar navbar-dark bg-dark px-4 py-3 shadow-sm sticky-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger rounded-circle p-2 fs-6">🛡️</span>
            <span className="navbar-brand mb-0 h1 fw-bold fs-4">
              CraveCart <span className="text-warning">Command Center</span>
            </span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light small d-none d-sm-inline">
              Superadmin Portal
            </span>
            <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4 px-lg-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Aggregating platform intelligence...</p>
          </div>
        ) : (
          <>
            {/* KPI Metrics Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-4 col-xl-2">
                <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
                  <span className="text-muted small">Total Orders</span>
                  <h3 className="fw-bold mt-1 text-primary">{data.stats?.totalOrders || data.orders?.length || 0}</h3>
                  <small className="text-success fw-semibold">Platform Lifetime</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
                  <span className="text-muted small">Gross Revenue</span>
                  <h3 className="fw-bold mt-1 text-success">₹{data.stats?.totalRevenue || 0}</h3>
                  <small className="text-muted">Settled GMV</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
                  <span className="text-muted small">Restaurants</span>
                  <h3 className="fw-bold mt-1 text-dark">{data.stats?.totalRestaurants || data.restaurant?.length || 0}</h3>
                  <small className="text-muted">Partner Kitchens</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
                  <span className="text-muted small">Riders</span>
                  <h3 className="fw-bold mt-1 text-info">{data.stats?.totalDeliveryPartners || data.deliveryman?.length || 0}</h3>
                  <small className="text-muted">Active Fleet</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
                  <span className="text-muted small">Registered Users</span>
                  <h3 className="fw-bold mt-1 text-dark">{data.stats?.totalUsers || data.user?.length || 0}</h3>
                  <small className="text-muted">Foodies</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-xl-2">
                <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
                  <span className="text-muted small">Menu Items</span>
                  <h3 className="fw-bold mt-1 text-warning">{data.menu?.length || 0}</h3>
                  <small className="text-muted">Published Dishes</small>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="card shadow-sm border-0 rounded-4 p-2 mb-4 bg-white">
              <div className="d-flex flex-wrap gap-2">
                {["overview", "restaurants", "orders", "coupons", "delivery", "users"].map((tab) => (
                  <button
                    key={tab}
                    className={`btn btn-sm rounded-pill px-4 text-capitalize fw-semibold ${
                      activeTab === tab ? "btn-primary" : "btn-light"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Contents */}
            {activeTab === "overview" && (
              <div className="row g-4">
                <div className="col-lg-7">
                  <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
                    <h5 className="fw-bold mb-3">Live Order Feed</h5>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
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
                              <td className="fw-bold">#{order._id.slice(-6).toUpperCase()}</td>
                              <td>{order.menuid?.name || (order.items && order.items[0]?.name) || "Dish"}</td>
                              <td className="fw-bold">₹{order.totalAmount || order.price}</td>
                              <td>
                                <span className={`badge ${order.status === "Delivered" ? "bg-success" : "bg-warning text-dark"} rounded-pill`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>{order.paymentmethod}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
                    <h5 className="fw-bold mb-3">Restaurant Verification Queue</h5>
                    <div className="d-flex flex-column gap-3">
                      {(data.restaurant || []).slice(0, 6).map((r) => (
                        <div key={r._id} className="d-flex justify-content-between align-items-center p-2 border rounded-3">
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={getImageUrl(r.image)}
                              alt={r.name}
                              className="rounded-3"
                              style={{ width: "42px", height: "42px", objectFit: "cover" }}
                            />
                            <div>
                              <strong className="d-block text-truncate" style={{ maxWidth: "150px" }}>{r.name}</strong>
                              <small className="text-muted">{r.city || "Bangalore"}</small>
                            </div>
                          </div>
                          <button
                            className={`btn btn-sm rounded-pill px-3 ${r.isactive ? "btn-outline-danger" : "btn-success"}`}
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

            {activeTab === "restaurants" && (
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-3">All Registered Restaurants ({data.restaurant?.length})</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Restaurant Name</th>
                        <th>City / Address</th>
                        <th>Phone</th>
                        <th>Rating</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.restaurant || []).map((r, i) => (
                        <tr key={r._id}>
                          <td>{i + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img src={getImageUrl(r.image)} alt={r.name} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px" }} />
                              <strong>{r.name}</strong>
                            </div>
                          </td>
                          <td>{r.address}, {r.city}</td>
                          <td>{r.phonenumber}</td>
                          <td>★ {r.rating || "4.3"}</td>
                          <td>
                            <span className={`badge ${r.isactive ? "bg-success" : "bg-secondary"} rounded-pill`}>
                              {r.isactive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm rounded-pill px-3 ${r.isactive ? "btn-outline-danger" : "btn-outline-success"}`}
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

            {activeTab === "coupons" && (
              <div className="row g-4">
                <div className="col-lg-5">
                  <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                    <h5 className="fw-bold mb-3">+ Create New Offer / Coupon</h5>
                    <form onSubmit={handleCreateCoupon}>
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Coupon Code</label>
                        <input
                          type="text"
                          className="form-control rounded-3 text-uppercase font-monospace"
                          value={newCoupon.code}
                          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                          placeholder="e.g. FESTIVE30"
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Offer Title / Description</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          value={newCoupon.title}
                          onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                          placeholder="e.g. 30% Off up to ₹150"
                          required
                        />
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Type</label>
                          <select
                            className="form-select rounded-3"
                            value={newCoupon.discountType}
                            onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Discount Value</label>
                          <input
                            type="number"
                            className="form-control rounded-3"
                            value={newCoupon.discountValue}
                            onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Max Discount (₹)</label>
                          <input
                            type="number"
                            className="form-control rounded-3"
                            value={newCoupon.maxDiscount}
                            onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Min Spend (₹)</label>
                          <input
                            type="number"
                            className="form-control rounded-3"
                            value={newCoupon.minOrderAmount}
                            onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary-crave w-100 py-2">
                        Publish Promo Code
                      </button>
                    </form>
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                    <h5 className="fw-bold mb-3">Active Promotional Codes</h5>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
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
                              <td>{c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                              <td>₹{c.minOrderAmount}</td>
                              <td>
                                <span className={`badge ${c.isActive ? "bg-success" : "bg-secondary"}`}>
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

            {activeTab === "orders" && (
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-3">Order Monitoring</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>User</th>
                        <th>Item</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Delivery Partner</th>
                        <th>Address</th>
                        <th>Live Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.orders || []).map((o) => (
                        <tr key={o._id}>
                          <td className="fw-bold font-monospace">#{o._id.slice(-6).toUpperCase()}</td>
                          <td>{o.userid?.name || "Customer"}</td>
                          <td>{o.menuid?.name || (o.items && o.items[0]?.name) || "Dish"}</td>
                          <td className="fw-bold">₹{o.totalAmount || o.price}</td>
                          <td>
                            <span className={`badge ${o.status === "Delivered" ? "bg-success" : "bg-warning text-dark"} rounded-pill`}>
                              {o.status}
                            </span>
                          </td>
                          <td>{o.deliverypersonid?.name || "Unassigned"}</td>
                          <td className="small text-truncate" style={{ maxWidth: "200px" }}>{o.address}</td>
                          <td>
                            <Link
                              to={`/orders/track/${o._id}`}
                              className="btn btn-sm btn-outline-primary rounded-pill px-2 py-1"
                              style={{ fontSize: "12px" }}
                            >
                              🗺️ Track
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-3">Delivery Partner Fleet ({data.deliveryman?.length})</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
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
                          <td>{i + 1}</td>
                          <td className="fw-bold">🛵 {d.name}</td>
                          <td>{d.email}</td>
                          <td>{d.phonenumber || "-"}</td>
                          <td>{d.vehicleType || "Bike"}</td>
                          <td>
                            <span className={`badge ${d.isAvailable ? "bg-success" : "bg-secondary"} rounded-pill`}>
                              {d.isAvailable ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td>★ {d.rating || "4.8"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-3">Registered Customers ({data.user?.length})</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
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
                          <td>{i + 1}</td>
                          <td className="fw-bold">👤 {u.name}</td>
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
