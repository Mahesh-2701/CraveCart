import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card";
import api, { getSocket } from "../config/api";
import AIChatWidget from "../components/AIChatWidget";
import { ToastContainer } from "react-toastify";

export default function Foods() {
  const location = useLocation();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("search") || "";
  const initialCategory = queryParams.get("category") || "All";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState("");

  const categories = ["All", "Biryani", "Pizza", "Burger", "Main Course", "Fast Food", "Desserts"];

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("search")) setSearchQuery(q.get("search"));
    if (q.get("category")) setSelectedCategory(q.get("category"));
  }, [location.search]);

  const fetchFoods = () => {
    setLoading(true);
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (isVegOnly) params.isVeg = "true";
    if (selectedCategory !== "All") params.category = selectedCategory;
    if (sortOption) params.sort = sortOption;

    api
      .get("/user/foods", { params })
      .then((res) => {
        setFoods(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Foods fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFoods();

    const socket = getSocket();
    socket.on("foodsData", (updatedFoods) => {
      setFoods(updatedFoods);
    });

    return () => {
      socket.off("foodsData");
    };
  }, [searchQuery, isVegOnly, selectedCategory, sortOption]);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-4 flex-grow-1">
        {/* Header and Search */}
        <div className="row align-items-center mb-4 g-3">
          <div className="col-lg-6">
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1 fw-bold small">
              CULINARY CATALOG
            </span>
            <h2 className="fw-bold font-heading text-dark mt-1 mb-1">Explore Delicious Dishes</h2>
            <p className="text-muted small mb-0">
              Freshly prepared by verified restaurant chefs and delivered hot
            </p>
          </div>
          <div className="col-lg-6">
            <div className="crave-search-bar bg-white rounded-pill shadow-xs border p-1">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control border-0 shadow-none bg-transparent"
                placeholder="Search for biryani, pizza, rolls, pasta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-sm text-muted border-0 me-2"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear Search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Category Bar */}
        <div className="card border-0 shadow-xs rounded-4 p-3 mb-4 bg-white">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Category Chips */}
            <div className="d-flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm rounded-pill px-3 font-heading fw-semibold ${
                    selectedCategory === cat
                      ? "btn-crave-primary"
                      : "btn-crave-secondary"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Toggles: Veg & Sorting */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-2 font-heading fw-semibold ${
                  isVegOnly
                    ? "btn-success text-white"
                    : "btn-outline-success"
                }`}
                onClick={() => setIsVegOnly(!isVegOnly)}
              >
                <span className="badge-veg bg-white shadow-xs">
                  <span className="veg-dot" />
                </span>
                <span>Pure Veg</span>
              </button>

              <select
                className="form-select form-select-sm rounded-pill shadow-none border font-heading"
                style={{ width: "auto" }}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="">Sort: Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dishes Grid */}
        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={n}>
                <div className="card border-0 shadow-xs rounded-4 overflow-hidden bg-white p-3">
                  <div className="skeleton rounded-3 mb-3" style={{ height: "160px" }}></div>
                  <div className="skeleton rounded-pill mb-2" style={{ height: "18px", width: "70%" }}></div>
                  <div className="skeleton rounded-pill mb-3" style={{ height: "14px", width: "40%" }}></div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="skeleton rounded-pill" style={{ height: "20px", width: "30%" }}></div>
                    <div className="skeleton rounded-pill" style={{ height: "28px", width: "60px" }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="card shadow-xs border-0 rounded-4 text-center py-5 p-4 bg-white my-4">
            <div className="mx-auto text-muted mb-3 p-3 bg-light rounded-circle" style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-search fs-1 text-primary"></i>
            </div>
            <h4 className="fw-bold font-heading text-dark">No culinary matches found</h4>
            <p className="text-muted small mx-auto" style={{ maxWidth: "400px" }}>
              We couldn't find any dishes matching your current selection. Try resetting filters or exploring other categories.
            </p>
            <div>
              <button
                className="btn btn-crave-primary rounded-pill px-4"
                onClick={() => {
                  setSearchQuery("");
                  setIsVegOnly(false);
                  setSelectedCategory("All");
                  setSortOption("");
                }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {foods.map((food) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={food._id}>
                <Card
                  name={food.name}
                  price={food.price}
                  image={food.image}
                  restaurantname={food.restaurantid?.name}
                  id={food._id}
                  isVeg={food.isVeg}
                  rating={food.rating}
                  isRestaurantActive={food.restaurantid?.isactive}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AIChatWidget />
      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
