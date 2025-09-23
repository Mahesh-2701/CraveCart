import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { io } from "socket.io-client";

const socket = io("https://cravecart-5vz7.onrender.com")

export default function Foods() {
  const [foods, setFoods] = useState([]);

  const [searchfoods,setSearchfoods] = useState("");

  let favoritefoods = foods.filter((food)=> food.name.toLowerCase().includes(searchfoods.toLowerCase()))
 

  useEffect(() => {
    axios
      .get("https://cravecart-5vz7.onrender.com/user/foods")
      .then((res) => setFoods(res.data))
      .catch((err) => toast.error("Network Connection Error " + err.message));

       // Listen for real-time updates
    socket.on("foodsData", (data) => {
      setFoods(data);
    });

    // Cleanup
    return () => socket.off("foodsData");

  }, []);


  return (
    <div>
      <Navbar></Navbar>

      <section className="container my-3">
        <h2 className="h4 my-3">
          <b>Whats on your Mind ?</b>
        </h2>
        <div className="my-3">
          <form className="d-flex  my-2 my-lg-0 w-75">
            <input
              className="form-control rounded-pill "
              type="search"
              placeholder="Search for your favorite dishes..."
              aria-label="Search"
              onChange={(eve)=>{ setSearchfoods(eve.target.value)}}
            />
          </form>
        </div>
        <div className="row">
          {favoritefoods.map((val) => {
            return (
              <div className="col-12 col-md-6 col-lg-4">
                <Card
                  id={val._id}
                  name={val.name}
                  image={val.image}
                  description={val.description}
                  price={val.price}
                  restaurant={val.restaurantid.isactive}
                ></Card>
              </div>
            );
          })}
        </div>
      </section>
      <style>{`
    .custom-toast {
      top: 80px !important;
      left: 75% !important;
      right: auto !important;
      width: 320px !important;
    }

    /* Tablet */
    @media (max-width: 1024px) {
      .custom-toast {
        left: 65% !important;
        width: 280px !important;
      }
    }

    /* Mobile */
    @media (max-width: 600px) {
      .custom-toast {
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 90% !important;
        max-width: 300px !important;
      }
    }
  `}</style>

  <ToastContainer 
    className="custom-toast"
    autoClose={3000} 
  />
      <Footer></Footer>
    </div>
  );
}
