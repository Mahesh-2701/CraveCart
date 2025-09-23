import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Link } from "react-router-dom";

export default function App() {
  return (
    <div>
      <Navbar />

      <section
        className="d-flex container rounded-5 align-items-center justify-content-center text-center text-white mt-3"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1539136788836-5699e78bfc75?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Zm9vZCUyMHBsYXRlfGVufDB8fDB8fHww)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "70vh",
          position: "relative",
        }}
      >
        {/* Overlay (optional dark tint for better readability) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.37)",
            borderRadius: "30px",
            zIndex: 1,
          }}
        ></div>

        {/* Content */}
        <div style={{ zIndex: 2, maxWidth: "700px", padding: "20px" }}>
          <h1 className="fw-bold display-4">
            Order your <br /> favourite food here
          </h1>
          <p className="lead mt-3">
            Choose from a diverse menu crafted with the finest ingredients and
            culinary expertise. Delivered fast, hot, and fresh at your doorstep.
          </p>
           <Link
                type="button"
                className="btn btn-warning btn px-4 py-2 rounded-pill" to="/foods"
              >
               View Menu
              </Link>
        </div>
      </section>

      <section >
        <div
          className="position-relative container-fluid my-5 vh-100 d-flex flex-column justify-content-center overflow-hidden text-white"
          style={{
            minHeight: "450px",
            backgroundImage:
              "url(https://images.pexels.com/photos/2977515/pexels-photo-2977515.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark Overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0, 0, 0, 0.55)" }}
          ></div>

          {/* Content */}
          <div className="position-relative text-center p-5">
            {/* Heading */}
            <h1 className="display-4 fw-bold mb-4">Partner with Us</h1>

            {/* Subtext */}
            <p className="h3 mb-2 col-lg-8 mx-auto text-outline-secondary"><b>Are you a restaurant owner? </b></p>
            <p className="lead mb-5 col-lg-8 mx-auto">
              Join us and grow your business by
              reaching thousands of food lovers daily.<br></br> Enjoy 0% commission for
              the first month and become part of our premium partner network!
            </p>

            {/* CTA Buttons */}
            <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
              <Link
                type="button"
                className="btn btn-danger btn-lg px-5 py-3 rounded-pill" to="/restaurant/admin"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      </section>

    <section className="container rounded-3  bg-white py-5 position-relative overflow-hidden">
      <div className="text-center">
        {/* Heading */}
        <h2 className="fw-bold text-danger mb-3 display-5">
          Better food for <br /> more people
        </h2>

        {/* Subheading */}
        <p className="text-muted mx-auto mb-5 fs-5" style={{ maxWidth: "600px" }}>
          For over a decade, we’ve enabled our customers to discover new tastes,
          delivered right to their doorstep
        </p>
      </div>

      {/* Floating Images */}
      <div className="position-absolute top-0 start-0 translate-middle">
        <img
          src="https://pngimg.com/uploads/burger_sandwich/burger_sandwich_PNG4135.png"
          alt="Burger"
          className="img-fluid"
          style={{ maxWidth: "180px" }}
        />
      </div>

      <div className="position-absolute top-0 end-0 translate-middle">
        <img
          src="https://pngimg.com/uploads/pizza/pizza_PNG43991.png"
          alt="Pizza"
          className="img-fluid"
          style={{ maxWidth: "180px" }}
        />
      </div>

      {/* Stats Section */}
      <div className="container mt-5 ">
        <div className="row justify-content-center g-4 bg-white shadow rounded-4 py-4 px-2">
          <div className="col-12 col-md-4 text-center">
            <h3 className="fw-bold">3000+</h3>
            <p className="text-muted mb-0">Restaurants</p>
          </div>
          <div className="col-12 col-md-4 text-center">
            <h3 className="fw-bold">100+</h3>
            <p className="text-muted mb-0">Cities</p>
          </div>
          <div className="col-12 col-md-4 text-center">
            <h3 className="fw-bold">1 Million+</h3>
            <p className="text-muted mb-0">Orders delivered</p>
          </div>
        </div>
      </div>
    </section>

      <section >
        <div
          className="position-relative container-fluid my-5 d-flex flex-column justify-content-center vh-100 overflow-hidden text-white"
          style={{
            minHeight: "450px",
            backgroundImage:
              "url(https://media.gettyimages.com/id/2183497842/photo/a-swiggy-ltd-delivery-worker-in-traffic-in-mumbai-india-on-thursday-oct-24-2024-swiggys-1-3.jpg?s=612x612&w=0&k=20&c=nXjMjwyGKxSthkV92V9TeOUX5oklh7QrkfsC00aBYKg=)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark Overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0, 0, 0, 0.55)" }}
          ></div>

          {/* Content */}
          <div className="position-relative text-center p-5">
            {/* Heading */}
            <h1 className="display-4 fw-bold mb-4">Work with Us</h1>

            {/* Subtext */}
            <p className="h3 mb-2 col-lg-8 mx-auto text-outline-secondary"><b>Join us and grow your Income!</b></p>
            <p className="lead mb-5 col-lg-8 mx-auto">
              
             
              Get your uniform and bag delivered at your home Deliver orders and Earn big with Us<br></br> 
              You can become a part-time or a full-time delivery partner based on your preference.
            </p>

            {/* CTA Buttons */}
            <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
             <Link
                type="button"
                className="btn btn-danger btn-lg px-5 py-3 rounded-pill" to="/delivery/order"
              >
                Ride With Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
