import React from 'react'
import RestaurantNavbar from "../components/RestaurantNavbar"
import Footer from '../components/Footer'
import RestaurantLogin from '../components/RestaurantLogin'
import RestaurantSignin from '../components/RestaurantSignin'

export default function RestaurantsSignup() {
  return (
    <div>
      <RestaurantNavbar></RestaurantNavbar>

      <RestaurantLogin></RestaurantLogin>

      <div className="partner-info-section py-5 vh-100 d-flex align-items-center bg-light">
  <div className="container text-center">
    <h2 className="fw-bold mb-4">Why Partner with <span className="text-primary">CraveCart </span>?</h2>
    <p className="lead mb-5">
      Join hundreds of restaurants growing their business online.  
      We help you reach more customers, increase orders, and boost revenue.
    </p>

    <div className="row">
      <div className="col-md-4 mb-4">
        <div className="card shadow-sm h-100 border-0">
          <div className="card-body">
            <h4 className="fw-bold mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-receipt-cutoff" viewBox="0 0 16 16">
  <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5M11.5 4a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>
  <path d="M2.354.646a.5.5 0 0 0-.801.13l-.5 1A.5.5 0 0 0 1 2v13H.5a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H15V2a.5.5 0 0 0-.053-.224l-.5-1a.5.5 0 0 0-.8-.13L13 1.293l-.646-.647a.5.5 0 0 0-.708 0L11 1.293l-.646-.647a.5.5 0 0 0-.708 0L9 1.293 8.354.646a.5.5 0 0 0-.708 0L7 1.293 6.354.646a.5.5 0 0 0-.708 0L5 1.293 4.354.646a.5.5 0 0 0-.708 0L3 1.293zm-.217 1.198.51.51a.5.5 0 0 0 .707 0L4 1.707l.646.647a.5.5 0 0 0 .708 0L6 1.707l.646.647a.5.5 0 0 0 .708 0L8 1.707l.646.647a.5.5 0 0 0 .708 0L10 1.707l.646.647a.5.5 0 0 0 .708 0L12 1.707l.646.647a.5.5 0 0 0 .708 0l.509-.51.137.274V15H2V2.118z"/>
</svg> Grow Your Sales</h4>
            <p>
              Get discovered by thousands of hungry customers nearby and increase your daily orders effortlessly.
            </p>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-4">
        <div className="card shadow-sm h-100 border-0">
          <div className="card-body">
            <h4 className="fw-bold mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-lightning-charge-fill" viewBox="0 0 16 16">
  <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
</svg> Easy Dashboard</h4>
            <p>
              Manage menus, orders, and deliveries all in one place with our user-friendly partner tools.
            </p>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-4">
        <div className="card shadow-sm h-100 border-0">
          <div className="card-body">
            <h4 className="fw-bold mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
</svg> Reliable Support</h4>
            <p>
              From onboarding to handling orders, our dedicated support team is here to help 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <style>{`
    .partner-info-section h2 {
      font-size: 2rem;
    }
    .partner-info-section p.lead {
      max-width: 700px;
      margin: 0 auto;
    }
    .partner-info-section .card {
      transition: transform 0.2s ease-in-out;
    }
    .partner-info-section .card:hover {
      transform: translateY(-5px);
    }
  `}</style>
</div>


      <RestaurantSignin></RestaurantSignin>
      <Footer></Footer>
    </div>
  )
}
