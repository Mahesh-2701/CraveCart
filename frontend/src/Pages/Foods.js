import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card";
import api, { getSocket } from "../config/api";
import AIChatWidget from "../components/AIChatWidget";
import { ToastContainer } from "react-toastify";

export default function Foods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("");

  const categories = ["All", "Biryani", "Pizza", "Burger", "Main Course", "Fast Food", "Desserts"];

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
            <h2 className="fw-bold mb-1">Explore Delicious Dishes</h2>
            <p className="text-muted small mb-0">Delivered warm and fast from top-rated restaurants</p>
          </div>
          <div className="col-lg-6">
            <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white p-1 border">
              <span className="input-group-text bg-transparent border-0 ps-3">🔍</span>
              <input
                type="text"
                className="form-control border-0 shadow-none"
                placeholder="Search for biryani, pizza, rolls, momos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-sm text-muted border-0 pe-3"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Category Chips */}
            <div className="d-flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm rounded-pill px-3 ${
                    selectedCategory === cat ? "btn-primary" : "btn-light border"
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
                className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${
                  isVegOnly ? "btn-success" : "btn-outline-success"
                }`}
                onClick={() => setIsVegOnly(!isVegOnly)}
              >
                <span>🌱</span> Pure Veg
              </button>

              <select
                className="form-select form-select-sm rounded-pill shadow-none"
                style={{ width: "auto" }}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="">Sort By</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dishes Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Sizzling the dishes for you...</p>
          </div>
        ) : foods.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center py-5 p-4 bg-white">
            <span style={{ fontSize: "52px" }}>🔍</span>
            <h4 className="mt-3 fw-bold">No dishes found</h4>
            <p className="text-muted">Try clearing some filters or searching for something else.</p>
            <div>
              <button
                className="btn btn-outline-primary rounded-pill px-4"
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
