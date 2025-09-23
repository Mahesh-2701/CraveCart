import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {

    const [isAuth,setIsAuth] = useState(Boolean(localStorage.getItem("token") && localStorage.getItem("role") === "restaurant")) 

  return (
    <nav className="navbar navbar-expand-lg rounded-bottom-5 fixed-top bg-white shadow-lg px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center">
          {/* Replace with Swiggy logo */}
          <svg
            width="35"
            height="35"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="me-2"
          >
            <circle cx="50" cy="50" r="48" fill="#FF6F00" />
            <text
              x="50"
              y="58"
              textAnchor="middle"
              fontSize="40"
              fill="#fff"
              fontFamily="sans-serif"
            >
              C
            </text>
          </svg>
          <span className="fw-bold text-dark">CraveCart</span>
        </Link>

        <ul class="navbar-nav ms-auto d-flex me-2 flex-row">
    
            { !isAuth ? (
                  
                <li className="nav-item">
              <Link to="/restaurant/view" className="btn btn-secondary rounded-pill px-3">
                Log In
              </Link>
            </li>

            ):(
              <li className="nav-item">
              <Link to="/restaurant/admin" className="nav-link fw-semibold">
                Admin
              </Link>
            </li>
            )}
            
       </ul>

        {/* Toggler for mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        

        {/* Navbar Links */}
        <div className="collapse navbar-collapse mx-auto" id="navbarNav">
 
          <ul className="navbar-nav ms-auto align-items-center gap-2">
           { !isAuth  ? (
            <>
            
            <li className="nav-item">
              <Link to="/restaurant/view" className="btn btn-outline-secondary rounded-pill px-3">
                Sign In
              </Link>
            </li>
             
            </>

            ) : (

            <>
            
            <li className="nav-item">
              <Link to="/restaurant/admin/order" className="nav-link fw-semibold">
                Orders
              </Link>
            </li>
             <li className="text-decoration-none">
                <Link class="btn btn-outline-danger rounded-pill px-3" to="/restaurant/logout" 
                onClick={ ()=>{ 
                    setIsAuth(false) ; 
                 } }>Logout</Link>
            </li>
            </>
 
            )}
            </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
