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
        {/* Restaurant Profile Overview */}
        <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white p-4">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-5">
              <h3 className="fw-bold mb-1">{restaurant.name || "Restaurant"} Kitchen</h3>
              <p className="text-muted small mb-0">
                <b>Address:</b> {restaurant.address || "Kitchen location"} <br />
                <b>Phone:</b> {restaurant.phonenumber} | <b>Email:</b> {restaurant.email}
              </p>
            </div>

            <div className="col-12 col-md-4 text-center">
              <div className="mb-2">
                <span className="small text-muted me-2">Store Status:</span>
                <span className={`badge ${available ? "bg-success" : "bg-danger"} px-3 py-2 rounded-pill`}>
                  {available ? "OPEN & ACCEPTING" : "CLOSED"}
                </span>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button
                  className="btn btn-sm btn-success rounded-pill px-3"
                  onClick={() => toggleAvailability(true)}
                  disabled={available}
                >
                  Turn Online
                </button>
                <button
                  className="btn btn-sm btn-danger rounded-pill px-3"
                  onClick={() => toggleAvailability(false)}
                  disabled={!available}
                >
                  Turn Offline
                </button>
              </div>
              <div className="mt-2">
                <Link to="/restaurant/admin/order" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                  📦 View Incoming Orders
                </Link>
              </div>
            </div>

            <div className="col-12 col-md-3 text-center">
              <img
                src={getImageUrl(restaurant.image, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400")}
                className="img-fluid rounded-4 shadow-sm"
                alt={restaurant.name || "Restaurant banner"}
                style={{ maxHeight: "120px", objectFit: "cover", width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0">Menu Management ({menu.length} items)</h4>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Dish</th>
                  <th>Image</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menu.length > 0 ? (
                  menu.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>{index + 1}</td>
                      <td className="fw-bold">
                        {item.name}
                        {item.isVeg && <span className="badge bg-success ms-2 small">Veg</span>}
                      </td>
                      <td>
                        <img
                          src={getImageUrl(item.image)}
                          className="img-fluid rounded-3"
                          style={{ width: "60px", height: "45px", objectFit: "cover" }}
                          alt={item.name}
                        />
                      </td>
                      <td>{item.category || "Main Course"}</td>
                      <td className="fw-bold text-primary">₹{item.price}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill px-3"
                          onClick={() => deletemenu(item._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No menu items added yet. Use the form below to add your culinary specials!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Food Form */}
        <div className="card shadow-sm border-0 rounded-4 bg-white p-4">
          <h4 className="fw-bold mb-3">Add New Menu Dish</h4>
          <form onSubmit={handleAddFood} className="row g-3" ref={formRef}>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Dish Name</label>
              <input
                type="text"
                className="form-control rounded-3"
                name="name"
                value={newFood.name}
                onChange={handleChange}
                placeholder="e.g. Royal Chicken Biryani"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Dish Photo</label>
              <input
                type="file"
                className="form-control rounded-3"
                name="image"
                accept="image/*"
                onChange={handlefileChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Price (₹)</label>
              <input
                type="number"
                className="form-control rounded-3"
                name="price"
                value={newFood.price}
                onChange={handleChange}
                placeholder="250"
                min="1"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold">Description</label>
              <input
                type="text"
                className="form-control rounded-3"
                name="description"
                value={newFood.description}
                onChange={handleChange}
                placeholder="Short description of ingredients, spices, or taste"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Category</label>
              <select
                className="form-select rounded-3"
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
                <label className="form-check-label small fw-semibold" htmlFor="isVegCheck">
                  Pure Veg 🌱
                </label>
              </div>
            </div>

            <div className="col-12 text-end">
              <button type="submit" className="btn btn-primary-crave px-4 py-2">
                + Publish Menu Item
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
