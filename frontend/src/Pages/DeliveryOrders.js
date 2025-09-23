import React, { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import DeliveryNavbar from '../components/DeliveryNavbar'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import { io } from "socket.io-client"

const socket = io("https://cravecart-5vz7.onrender.com")


export default function DeliveryOrders() {
    const [orders,setOrders] = useState([])

    useEffect(()=>{
        axios.get("https://cravecart-5vz7.onrender.com/delivery/order/"+localStorage.getItem("id"),{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
        .then((res)=>setOrders(res.data)).catch((err)=>toast.error("Network Error "+err.response.data.message))

       socket.on("updatingDelivery",(data)=>setOrders(data))

       return ()=>socket.off("updatingDelivery")
    },[])


  return (
   <div>
  <DeliveryNavbar></DeliveryNavbar>

  <div className="container mt-4 pt-5 table-section">
    <h3 className="animate-title mb-4">Delivery Order History</h3>
    <div className="table-responsive animate-table">
      <table className="table table-striped table-hover align-middle shadow-sm rounded">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Food</th>
            <th>User</th>
            <th>Qty</th>
            <th>Price (₹)</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Restaurant Name</th>
            <th>Order Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order,index) => (
            <tr key={order._id} className="animate-row">
              <td>{index+1}</td>
              <td>
                <div className="d-flex align-items-center">
                  <img 
                    src={"https://cravecart-5vz7.onrender.com"+order.menuid.image} 
                    alt={order.menuid.name} 
                    style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", marginRight: "8px" }}
                  />
                  {order.menuid.name}
                </div>
              </td>
              <td>{order.userid.name}</td>
              <td>{order.quantity}</td>
              <td>{order.price}</td>
              <td>
                <span className={`badge ${
                  order.status === 'Delivered' ? 'bg-success' : 
                  order.status === 'Preparing' ? 'bg-warning text-dark' : 'bg-danger'
                }`}>
                  {order.status}
                </span>
              </td>
              <td>{order.paymentmethod}</td>
              <td>{order.menuid.restaurantid.name}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

  <Footer></Footer>
  <ToastContainer 
    className="custom-toast"
    autoClose={3000} 
  />

  {/* Inline CSS for professional look and animations */}
  <style>{`
    .table-section {
      animation: fadeInSection 1s ease forwards;
    }

    .animate-title {
      opacity: 0;
      transform: translateY(-20px);
      animation: fadeInDown 1s ease forwards;
    }

    .animate-table {
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 1s ease forwards;
      animation-delay: 0.3s;
      animation-fill-mode: forwards;
    }

    .animate-row {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .animate-row:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }

    table.table {
      border-radius: 8px;
      overflow: hidden;
    }

    @keyframes fadeInDown {
      0% { opacity: 0; transform: translateY(-20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeInSection {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

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
</div>

  )
}
