import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

const Navbar = () => {
   
    const navigate = useNavigate()

    const [isAuth,setIsAuth] = useState(Boolean(localStorage.getItem("token") && localStorage.getItem("role") === "user")) 

  return (
    <nav className="navbar navbar-expand-lg rounded-bottom-5 border sticky-top bg-white shadow-lg px-3">
      <div className="container-fluid">
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

        <ul class="navbar-nav ms-auto d-flex flex-row">
                  
        
                    { !isAuth ? (
                          
                        <li className="nav-item">
                          <Link to="/user/login" className="btn btn-secondary rounded-pill px-3">
                            Log In
                          </Link>
                        </li>
        
                    ):(
                      <>
                      <li className="nav-item">
                        <Link to="/foods" className="nav-link fw-semibold">
                          Foods
                        </Link>
                      </li>
                       <li className="nav-item ">
              <Link to="/user/cart" className="btn btn-outline-secondary rounded-pill px-3 fw-bold ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-fill" viewBox="0 0 16 16">
                  <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4z"/>
                </svg> Cart
              </Link>
            </li>
            </>
                      
                    )}
                    
               </ul>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          

          {/* Right section: Links */}
          <ul className="navbar-nav ms-auto align-items-center gap-2">
           
            <li className="nav-item">
              <Link to="/restaurants" className="nav-link fw-semibold">
                Restaurants
              </Link>
            </li>

           { !isAuth ? (
            <>
           
            <li className="nav-item">
              <Link to="/user/signup" className="btn btn-outline-secondary rounded-pill px-3">
                Sign In
              </Link>
            </li>
            
            </>

            ) : (

            <>
            <li className="nav-item">
              <Link to="/user/orders" className="nav-link fw-semibold">
                Orders
              </Link>
            </li>
            <li className="nav-item me-2">
                <div class="dropdown">
                <Link to="#" class="d-flex align-items-center text-dark text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"> <img src="https://images.icon-icons.com/3251/PNG/512/settings_regular_icon_203305.png" alt="" width="32" height="32" class="rounded-circle "/></Link> 
                <ul class="dropdown-menu dropdown-menu-light text-small shadow" >
                    <li><Link class="dropdown-item" to="/user/update">Profile</Link></li>
                    <li>
                        <hr class="dropdown-divider"/>
                    </li>
                    <li><Link class="dropdown-item" to="/logout" onClick={ ()=>{ 
                         setIsAuth(false) ;
                         } }>Logout</Link></li>
                </ul>
                </div>
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
