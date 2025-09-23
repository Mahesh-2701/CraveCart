import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-top mt-5">
      <div className="container-fluid py-5">
        <div className="row gy-4">
          {/* Branding & app downloads */}
          <div className="col-12 col-md-4">
            <Link
              to="/"
              className="d-flex align-items-center mb-3 text-decoration-none"
            >
              {/* Replace SVG with your logo */}
              <svg
                width="40"
                height="40"
                viewBox="0 0 100 100"
                className="me-2"
                aria-hidden="true"
              >
                <circle cx="50" cy="50" r="48" fill="#FF6F00"></circle>
                <text
                  x="50"
                  y="58"
                  textAnchor="middle"
                  fontSize="42"
                  fill="#fff"
                  fontFamily="sans-serif"
                >
                  C
                </text>
              </svg>
              <span className="h5 mb-0 text-dark">CraveCart, Inc</span>
            </Link>
            <p className="text-muted small">
              Order food from your favourite restaurants & get it delivered fast.
            </p>

            <div className="d-flex gap-2 mt-3">
              {/* Replace with real Play/App Store links and badges */}
              <Link to="#" className="d-inline-block" aria-label="Download on Google Play">
                <img
                  src="https://cdn.worldvectorlogo.com/logos/google-play-3.svg"
                  alt="Google Play"
                  style={{ height: "50px" }}
                  className="img-fluid"
                />
              </Link>
              <Link to="#" className="d-inline-block" aria-label="Download on App Store">
                <img
                  src="https://cdn.worldvectorlogo.com/logos/available-on-the-app-store.svg"
                  alt="App Store"
                  style={{ height: "50px" }}
                  className="img-fluid"
                />
              </Link>
            </div>
          </div>

          {/* Explore / Company links */}
          <div className="col-6 col-md-2">
            <h6 className="text-dark fw-semibold">CraveCart</h6>
            <ul className="list-unstyled small">
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">About us</Link></li>
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">Team</Link></li>
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">Careers</Link></li>
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">Blog</Link></li>
            </ul>
          </div>

          {/* For restaurants / partners */}
          <div className="col-6 col-md-2">
            <h6 className="text-dark fw-semibold">Partner with us</h6>
            <ul className="list-unstyled small">
              <li><Link to="/delivery" className="text-muted text-decoration-none d-block py-1">Work with us</Link></li>
              <li><Link to="/restaurant/view" className="text-muted text-decoration-none d-block py-1">Restaurant login</Link></li>
            </ul>
          </div>

          {/* Help & legal */}
          <div className="col-6 col-md-2">
            <h6 className="text-dark fw-semibold">Support</h6>
            <ul className="list-unstyled small">
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">Help Center</Link></li>
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">FAQs</Link></li>
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">Contact us</Link></li>
            </ul>
          </div>

          {/* Cities / quick links */}
          <div className="col-6 col-md-2">
            <h6 className="text-dark fw-semibold">Popular links</h6>
            <ul className="list-unstyled small">
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">Privacy policy</Link></li>
              <li><Link to="#" className="text-muted text-decoration-none d-block py-1">Terms</Link></li>
            </ul>
          </div>
        </div>

        <hr className="my-4" />

        {/* Bottom bar */}
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="text-muted small">© 2025 CraveCart, Inc</div>

          <div className="d-flex align-items-center gap-3">
            {/* Social icons (use <Link>) */}
            <Link to="#" className="text-muted text-decoration-none" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.2v-2.9h2.2V9.4c0-2.2 1.3-3.4 3.3-3.4.96 0 1.9.17 1.9.17v2.1h-1.1c-1.1 0-1.4.67-1.4 1.36v1.6h2.4l-.38 2.9h-2.02v7A10 10 0 0 0 22 12z"/>
              </svg>
            </Link>
            <Link to="#" className="text-muted text-decoration-none" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 5.9c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.7-.6.4-1.3.7-2.1.9C18.7 5 17.6 4.6 16.5 4.6c-1.8 0-3.2 1.5-3.2 3.2 0 .3 0 .6.1.8-2.7-.1-5.2-1.4-6.8-3.5-.3.5-.5 1.1-.5 1.8 0 1.2.6 2.2 1.5 2.8-.6 0-1.2-.2-1.7-.5v.1c0 1.7 1.2 3.1 2.8 3.4-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.7 2.3 3.2 2.3-1.2.9-2.7 1.4-4.2 1.4-.3 0-.6 0-.9-.1 1.5 1 3.3 1.6 5.2 1.6 6.2 0 9.6-5.2 9.6-9.7v-.4c.7-.5 1.3-1.2 1.8-1.9-.6.3-1.2.6-1.9.7z"/>
              </svg>
            </Link>
            <Link to="#" className="text-muted text-decoration-none" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.2A4.8 4.8 0 1 0 16.8 13 4.8 4.8 0 0 0 12 8.2zm6.2-3.1a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
