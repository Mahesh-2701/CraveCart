import React, { useEffect, useRef, useState } from "react";
import RestaurantNavbar from "../components/RestaurantNavbar";
import Footer from "../components/Footer";
import api, { getImageUrl } from "../config/api";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function RestaurantAdmin() {
  const [restaurant, setRestaurant] = useState({
    name: "",
    address: "",
    phonenumber: "",
    email: "",
  });

  const formRef = useRef(null);
  const [available, setAvailable] = useState(false);
  const [menu, setMenu] = useState([]);
  const [menuimage, setMenuimage] = useState(null);

  const [newFood, setNewFood] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main Course",
    isVeg: false,
  });

  const restaurantId = localStorage.getItem("id");

  const loadMenu = () => {
    if (!restaurantId) return;
    api
      .get(`/restaurant/menudisplay/${restaurantId}`)
      .then((res) => setMenu(res.data))
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  useEffect(() => {
    if (!restaurantId) return;

    api
      .get(`/restaurant/details/${restaurantId}`)
      .then((res) => {
        setRestaurant({ ...res.data });
        setAvailable(Boolean(res.data.isactive));
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
      });

    loadMenu();
  }, [restaurantId]);

  const toggleAvailability = (newstatus) => {
    api
      .patch(`/restaurant/availability/${restaurantId}`, { isactive: newstatus })
      .then((res) => {
        setAvailable(newstatus);
        toast.success(res.data.message || "Availability status updated");
      })
      .catch((err) => toast.error("Error: " + (err.response?.data?.message || err.message)));
  };

  const deletemenu = (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      api
        .delete(`/restaurant/deletemenu/${id}`)
        .then((res) => {
          toast.success(res.data.message);
          loadMenu();
        })
        .catch((err) => toast.error("Error: " + (err.response?.data?.message || err.message)));
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setNewFood({ ...newFood, [e.target.name]: value });
  };

  const handlefileChange = (event) => {
    setMenuimage(event.target.files[0]);
  };

  const handleAddFood = (e) => {
    e.preventDefault();
    if (!menuimage) {
      toast.error("Please select a dish image file.");
      return;
    }

    const formdata = new FormData();
    formdata.append("image", menuimage);
    formdata.append("name", newFood.name);
    formdata.append("description", newFood.description);
    formdata.append("price", newFood.price);
    formdata.append("category", newFood.category);
    formdata.append("isVeg", newFood.isVeg);
    formdata.append("restaurantid", restaurantId);

    api
      .post("/restaurant/menuupload", formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        toast.success(res.data.message);
        loadMenu();
        if (formRef.current) formRef.current.reset();
        setNewFood({ name: "", description: "", price: "", category: "Main Course", isVeg: false });
        setMenuimage(null);
      })
      .catch((err) => {
        toast.error("Error: " + (err.response?.data?.message || err.message));
      });
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <RestaurantNavbar />

      <section className="container py-4 flex-grow-1">
        {/* Restaurant Profile Overview Banner */}
        <div className="card shadow-xs border-0 rounded-4 mb-4 bg-white p-4">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-5">
              <span className="badge rounded-pill bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-3 py-1 font-heading small mb-2">
                <i className="bi bi-shop-window text-warning me-1"></i> Kitchen Operations
              </span>
              <h3 className="fw-bold font-heading text-dark mb-1">{restaurant.name || "Restaurant"} Kitchen</h3>
              <p className="text-muted small mb-0">
                <i className="bi bi-geo-alt text-danger me-1"></i> {restaurant.address || "Kitchen location"} <br />
                <i className="bi bi-telephone text-primary me-1"></i> {restaurant.phonenumber} &nbsp;|&nbsp; 
                <i className="bi bi-envelope text-muted me-1"></i> {restaurant.email}
              </p>
            </div>

            <div className="col-12 col-md-4 text-center">
              <div className="mb-2">
                <span className="small text-muted me-2 font-heading">Accepting Orders:</span>
                <span className={`badge px-3 py-1 rounded-pill font-heading ${available ? "bg-success" : "bg-danger"}`}>
                  {available ? "OPEN & ACCEPTING" : "OFFLINE / CLOSED"}
                </span>
              </div>
              <div className="d-flex justify-content-center gap-2 mb-2">
                <button
                  className="btn btn-sm btn-success rounded-pill px-3 font-heading"
                  onClick={() => toggleAvailability(true)}
                  disabled={available}
                >
                  <i className="bi bi-toggle-on me-1"></i> Turn Online
                </button>
                <button
                  className="btn btn-sm btn-outline-danger rounded-pill px-3 font-heading"
                  onClick={() => toggleAvailability(false)}
                  disabled={!available}
                >
                  <i className="bi bi-toggle-off me-1"></i> Turn Offline
                </button>
              </div>
              <div>
                <Link to="/restaurant/admin/order" className="btn btn-sm btn-crave-primary rounded-pill px-3 d-inline-flex align-items-center gap-1 font-heading">
                  <i className="bi bi-fire"></i> View Kitchen KDS Feed
                </Link>
              </div>
            </div>

            <div className="col-12 col-md-3 text-center">
              <img
                src={getImageUrl(restaurant.image, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400")}
                className="img-fluid rounded-4 shadow-xs object-fit-cover w-100"
                alt={restaurant.name || "Restaurant banner"}
                style={{ maxHeight: "120px" }}
              />
            </div>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="card shadow-xs border-0 rounded-4 mb-4 bg-white p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold font-heading text-dark mb-0">Menu Management</h4>
              <small className="text-muted">{menu.length} active dishes published to customer catalog</small>
            </div>
          </div>

          <div className="crave-table-container">
            <table className="crave-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dish</th>
                  <th>Image</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menu.length > 0 ? (
                  menu.map((item, index) => (
                    <tr key={item._id || index}>
                      <td className="text-muted small">{index + 1}</td>
                      <td className="fw-bold font-heading text-dark">
                        {item.name}
                        {item.isVeg && (
                          <span className="badge-veg ms-2" title="Pure Veg">
                            <span className="veg-dot" />
                          </span>
                        )}
                      </td>
                      <td>
                        <img
                          src={getImageUrl(item.image)}
                          className="img-fluid rounded-3 object-fit-cover shadow-xs"
                          style={{ width: "54px", height: "42px" }}
                          alt={item.name}
                        />
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border rounded-pill px-2 py-1 font-heading">
                          {item.category || "Main Course"}
                        </span>
                      </td>
                      <td className="fw-bold font-heading text-primary">₹{item.price}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px" }}
                          title="Delete dish"
                          onClick={() => deletemenu(item._id)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <div className="p-3 bg-light rounded-circle d-inline-block mb-2">
                        <i className="bi bi-egg-fried fs-2 text-muted"></i>
                      </div>
                      <p className="mb-0">No dishes on your menu yet. Add your first culinary item below!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Food Form */}
        <div className="card shadow-xs border-0 rounded-4 bg-white p-4">
          <h4 className="fw-bold font-heading text-dark mb-1">Publish New Menu Dish</h4>
          <p className="text-muted small mb-4">Add high-resolution dish details to attract hungry foodies</p>

          <form onSubmit={handleAddFood} className="row g-3" ref={formRef}>
            <div className="col-md-4">
              <label className="crave-label">Dish Name</label>
              <input
                type="text"
                className="crave-input"
                name="name"
                value={newFood.name}
                onChange={handleChange}
                placeholder="e.g. Royal Chicken Biryani"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="crave-label">Dish Photo</label>
              <input
                type="file"
                className="crave-input"
                name="image"
                accept="image/*"
                onChange={handlefileChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="crave-label">Price (₹)</label>
              <input
                type="number"
                className="crave-input"
                name="price"
                value={newFood.price}
                onChange={handleChange}
                placeholder="250"
                min="1"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="crave-label">Description</label>
              <input
                type="text"
                className="crave-input"
                name="description"
                value={newFood.description}
                onChange={handleChange}
                placeholder="Short description of ingredients, spices, or cooking style"
              />
            </div>

            <div className="col-md-4">
              <label className="crave-label">Category</label>
              <select
                className="crave-input"
                name="category"
                value={newFood.category}
                onChange={handleChange}
              >
                <option value="Main Course">Main Course</option>
                <option value="Biryani">Biryani</option>
                <option value="Starters">Starters</option>
                <option value="Pizza">Pizza</option>
                <option value="Burger">Burger</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-center pt-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="isVeg"
                  id="isVegCheck"
                  checked={newFood.isVeg}
                  onChange={handleChange}
                />
                <label className="form-check-label small fw-semibold font-heading" htmlFor="isVegCheck">
                  Pure Veg
                </label>
              </div>
            </div>

            <div className="col-12 text-end mt-4">
              <button type="submit" className="btn btn-crave-primary rounded-pill px-4 py-2 font-heading">
                <i className="bi bi-plus-lg me-1"></i> Publish Menu Item
              </button>
            </div>
          </form>
        </div>
      </section>

      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
