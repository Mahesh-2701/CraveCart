import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import CardRestaurant from "../components/CardRestaurant";

export default function Restaurant() {
  const [restaurants, setRestaurants] = useState([]);
   const [searchrestaurants,setSearchrestaurants] = useState("");
  
    let favoriterestaurants = restaurants.filter((resta)=> resta.name.toLowerCase().includes(searchrestaurants.toLowerCase()))

  useEffect(() => {
    axios
      .get("https://cravecart-5vz7.onrender.com/user/restaurant")
      .then((res) => setRestaurants(res.data))
      .catch((err) => toast.error("Network Connection Error " + err.message));
  }, []);

  return (
    <div>
      <Navbar></Navbar>

      <section className="container my-3">
        <h2 className="h4 my-3">
          <b>Where to Visit?</b>
        </h2>
        <div className="my-3">
          <form className="d-flex  my-2 my-lg-0 w-75">
            <input
              className="form-control rounded-pill "
              type="search"
              placeholder="Search for your favorite restaurant..."
              aria-label="Search"
              onChange={(eve)=>{ setSearchrestaurants(eve.target.value)}}
            />
          </form>
        </div>
        <div className="row">
          {favoriterestaurants.map((val) => {

            return (
              <div className="col-12 col-md-6 col-lg-4">
                <CardRestaurant id={val._id} name={val.name} image={val.image} address={val.address} phonenumber={val.phonenumber} available={val.isactive}></CardRestaurant>
              </div>
            );

          })}
        </div>
      </section>

      <Footer></Footer>
      <ToastContainer></ToastContainer>
    </div>
  );
}
