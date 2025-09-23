import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/user/orders/" + localStorage.getItem("id"), {
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
                        src={"http://localhost:5000" + order.menuid.image}
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

      <ToastContainer></ToastContainer>
      <Footer></Footer>
    </div>
  );
}
