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
            <h2 className="fw-bold mb-1">Top Restaurants Near You</h2>
            <p className="text-muted small mb-0">Browse kitchens and discover your next favorite meal</p>
          </div>
          <div className="col-lg-6">
            <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white p-1 border">
              <span className="input-group-text bg-transparent border-0 ps-3">🔍</span>
              <input
                className="form-control border-0 shadow-none"
                type="search"
                placeholder="Search by restaurant name, cuisine, area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* City Filter Chips */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {cities.map((city) => (
            <button
              key={city}
              className={`btn btn-sm rounded-pill px-3 ${
                selectedCity === city ? "btn-primary" : "btn-white border bg-white"
              }`}
              onClick={() => setSelectedCity(city)}
            >
              📍 {city}
            </button>
          ))}
        </div>

        {/* Restaurant List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Locating the best dining spots...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center py-5 p-4 bg-white">
            <span style={{ fontSize: "52px" }}>🍽️</span>
            <h4 className="mt-3 fw-bold">No restaurants found</h4>
            <p className="text-muted">We couldn't find matches for "{search}".</p>
            <div>
              <button
                className="btn btn-outline-primary rounded-pill px-4"
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
