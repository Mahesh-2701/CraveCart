import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import RestaurantNavbar from "../components/RestaurantNavbar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import RestaurantOrderCard from "../components/RestaurantOrderCard";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function RestaurantOrder() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios
      .get(
        "http://localhost:5000/restaurant/order/" + localStorage.getItem("id"),
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      )
      .then((res) => setOrders(res.data))
      .catch((err) =>
        toast.error("Network Error " + err.response.data.message)
      );

    socket.on("updatingRestOrder", (data) => setOrders(data));

    return () => socket.off("updatingRestOrder");
  }, []);

  return (
    <div>
      <RestaurantNavbar></RestaurantNavbar>
      <div className="container mt-5 pt-4">
        <h3>Restaurant Order's</h3>
        <div className="table-responsive my-3">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-secondary">
              <tr>
                <th>#</th>
                <th>Food</th>
                <th>User</th>
                <th>Qty</th>
                <th>Price (₹)</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Delivery Person</th>
                <th>Order Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <RestaurantOrderCard order={order} key={order._id} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
  /* Container */
  .container {
    max-width: 1200px;
  }

  /* Heading */
  .container h3 {
    font-weight: bold;
    color: #2c3e50;
    font-size: 1.8rem;
    margin-bottom: 20px;
    text-align: center;
  }

  /* Table Styles */
  .table {
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .table thead {
    background: linear-gradient(90deg, #007bff, #00c6ff);
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-hover tbody tr:hover {
    background-color: #f8f9fa;
    transition: background-color 0.2s ease-in-out;
  }

  /* Table Cells */
  .table td, 
  .table th {
    vertical-align: middle;
    padding: 14px 16px;
  }

  /* Status Column Styling */
  td:nth-child(6) {
    font-weight: 600;
  }

  /* Payment Column Styling */
  td:nth-child(7) {
    font-style: italic;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .container h3 {
      font-size: 1.4rem;
    }
    .table th, .table td {
      font-size: 0.85rem;
      padding: 10px;
    }
  }
`}</style>

      <ToastContainer style={{top:"80px",left:"75%",right:"auto"}} autoClose={3000}  />
      <Footer></Footer>
    </div>
  );
}
