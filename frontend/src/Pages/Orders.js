import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client"

const socket = io("https://cravecart-5vz7.onrender.com")

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios
      .get("https://cravecart-5vz7.onrender.com/user/orders/" + localStorage.getItem("id"), {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => setOrders(res.data))
      .catch((err) =>
        toast.error("Network Error " + err.response.data.message)
      );

    socket.on("updatedOrder",(data)=>setOrders(data))     
    
    return ()=>socket.off("updatedOrder")
  }, []);

  return (
    <div>
      <Navbar></Navbar>

      <section className="container">
        <h2 className="h4 my-3">
          <b>Orders History</b>
        </h2>
        <div className="row">
          {orders.map((order) => {
            return (
              <div className="col-12 col-md-6">
                <div
                  className="card mb-3 shadow-sm hover-card"
                  style={{
                    maxWidth: "500px",
                    transition: "0.3s",
                    cursor: "pointer",
                  }}
                >
                  <div className="row g-0">
                    <div className="col-4">
                      <img
                        src={"https://cravecart-5vz7.onrender.com" + order.menuid.image}
                        className="img-fluid rounded-start"
                        alt={order.menuid.name}
                        style={{
                          objectFit: "cover",
                          height: "150px",
                          width: "100%",
                        }}
                      />
                    </div>
                    <div className="col-8">
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h6 className="card-title mb-0">
                            {order.menuid.name}
                          </h6>
                          <span
                            className={`badge px-2 py-1 ${
                              order.status === "Delivered"
                                ? "bg-success"
                                : order.status === "Preparing"
                                ? "bg-warning text-dark"
                                : "bg-danger"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p
                          className="card-subtitle text-muted mb-1"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {new Date(order.createdAt).toLocaleString()}
                        </p>

                        <p className="mb-1" style={{ fontSize: "0.8rem" }}>
                          <strong>User:</strong> {order.userid.name}
                        </p>
                        <p className="mb-1" style={{ fontSize: "0.8rem" }}>
                          <strong>Qty:</strong> {order.quantity} |{" "}
                          <strong>Price:</strong> ₹{order.price}
                        </p>
                        <p className="mb-1" style={{ fontSize: "0.8rem" }}>
                          <strong>Payment:</strong> {order.paymentmethod}
                        </p>
                        <p className="mb-0" style={{ fontSize: "0.8rem" }}>
                          <strong>Delivery:</strong>{" "}
                          {order.deliverypersonid.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
