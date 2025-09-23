import React from 'react'
import "./FoodCard.css";
import axios from "axios"
import {toast,ToastContainer} from "react-toastify"

export default function Card(props) {

  const { id,name,image,description,price,restaurant} =props;

  const addtocart = () =>{
     
      let cartitem = { 
        userid:localStorage.getItem("id"),
        menuid:id,
        price:price
      }

    axios.post("https://cravecart-5vz7.onrender.com/user/addtocart",cartitem,{ headers : { Authorization : "Bearer "+localStorage.getItem("token")}})
    .then((res)=>{ toast.success("Added to cart")})
    .catch((err)=>toast.error("Please Login to Continue Shopping"))      
  }

  return (
    <div>
      <div className="card food-card shadow-sm border-0 mx-2 my-2 position-relative">
        <div className="img-wrapper">
          <img
            src={"https://cravecart-5vz7.onrender.com" + image}
            className="card-img-top"
            alt="Food"
          />
        </div>

        {/* 🔹 Dark overlay when restaurant = false */}
        {!restaurant && (
          <div
            className="overlay position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderRadius: "0.5rem"
            }}
          ></div>
        )}

        <div className="card-body position-relative">
          <h5 className="card-title">{name}</h5>
          <p className="card-text text-muted mb-2">{description}</p>

          {/* ⭐ Star Ratings */}
          <div className="mb-2">
            <span className="text-warning">★★★★☆</span>
            <small className="text-muted ms-2">(200+ ratings)</small>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold">₹ {price}</span>
            {restaurant ? (
              <button className="btn btn-sm btn-success" onClick={addtocart}>Add +</button>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <ToastContainer style={{top:"80px",left:"75%",right:"auto"}} autoClose={3000} limit={3} />
    </div>
  )
}
