import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../config/api";
import CardRestaurant from "../components/CardRestaurant";
import AIChatWidget from "../components/AIChatWidget";
import { ToastContainer } from "react-toastify";

export default function Restaurant() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [loading, setLoading] = useState(true);

  const cities = ["All", "Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad"];

  useEffect(() => {
    api
      .get("/user/restaurant")
      .then((res) => {
        setRestaurants(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching restaurants:", err);
        setLoading(false);
      });
  }, []);

  const filteredRestaurants = restaurants.filter((rest) => {
    const matchesSearch =
      rest.name.toLowerCase().includes(search.toLowerCase()) ||
      (rest.cuisine && rest.cuisine.toLowerCase().includes(search.toLowerCase())) ||
      (rest.address && rest.address.toLowerCase().includes(search.toLowerCase()));

    const matchesCity =
      selectedCity === "All" ||
      (rest.city && rest.city.toLowerCase() === selectedCity.toLowerCase());

    return matchesSearch && matchesCity;
  });

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <section className="container py-4 flex-grow-1">
        {/* Header and Search */}
        <div className="row align-items-center mb-4 g-3">
          <div className="col-lg-6">
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1 fw-bold small">
              VERIFIED KITCHENS
            </span>
            <h2 className="fw-bold font-heading text-dark mt-1 mb-1">Top Restaurants Near You</h2>
            <p className="text-muted small mb-0">Browse kitchens and discover your next favorite meal</p>
          </div>
          <div className="col-lg-6">
            <div className="crave-search-bar bg-white rounded-pill shadow-xs border p-1">
              <i className="bi bi-search"></i>
              <input
                className="form-control border-0 shadow-none bg-transparent"
                type="search"
                placeholder="Search by restaurant name, cuisine, area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-sm text-muted border-0 me-2"
                  onClick={() => setSearch("")}
                  aria-label="Clear Search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* City Filter Chips */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {cities.map((city) => (
            <button
              key={city}
              className={`btn btn-sm rounded-pill px-3 font-heading fw-semibold d-inline-flex align-items-center gap-1 ${
                selectedCity === city
                  ? "btn-crave-primary"
                  : "btn-crave-secondary"
              }`}
              onClick={() => setSelectedCity(city)}
            >
              <i className="bi bi-geo-alt" style={{ fontSize: "12px" }}></i>
              <span>{city}</span>
            </button>
          ))}
        </div>

        {/* Restaurant List */}
        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div className="col-12 col-md-6 col-lg-4" key={n}>
                <div className="card border-0 shadow-xs rounded-4 overflow-hidden bg-white p-3">
                  <div className="skeleton rounded-3 mb-3" style={{ height: "160px" }}></div>
                  <div className="skeleton rounded-pill mb-2" style={{ height: "20px", width: "65%" }}></div>
                  <div className="skeleton rounded-pill mb-3" style={{ height: "14px", width: "45%" }}></div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="skeleton rounded-pill" style={{ height: "16px", width: "30%" }}></div>
                    <div className="skeleton rounded-pill" style={{ height: "30px", width: "90px" }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="card shadow-xs border-0 rounded-4 text-center py-5 p-4 bg-white my-4">
            <div className="mx-auto text-muted mb-3 p-3 bg-light rounded-circle" style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-shop fs-1 text-primary"></i>
            </div>
            <h4 className="fw-bold font-heading text-dark">No restaurants found</h4>
            <p className="text-muted small mx-auto" style={{ maxWidth: "400px" }}>
              We couldn't find matches for "{search}". Try searching for another restaurant or clearing filters.
            </p>
            <div>
              <button
                className="btn btn-crave-primary rounded-pill px-4"
                onClick={() => {
                  setSearch("");
                  setSelectedCity("All");
                }}
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredRestaurants.map((val) => (
              <div className="col-12 col-md-6 col-lg-4" key={val._id}>
                <CardRestaurant
                  id={val._id}
                  name={val.name}
                  image={val.image}
                  address={val.address}
                  phonenumber={val.phonenumber}
                  available={val.isactive}
                  cuisine={val.cuisine}
                  rating={val.rating || 4.3}
                  deliveryTimeMinutes={val.deliveryTimeMinutes || 30}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <AIChatWidget />
      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
