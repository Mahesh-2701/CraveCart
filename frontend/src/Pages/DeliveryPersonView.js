import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import api from "../config/api";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import DeliveryNavbar from "../components/DeliveryNavbar";

export default function DeliveryPersonView() {
   
    const navigate = useNavigate();

    const deliverypersonid=localStorage.getItem("id")

    const [delperson,setDelperson]=useState({
        _id:"",
        id:"",
        name:"",
        email:"",
        password:"",
        address:"",
        phonenumber:""
    })

    const [errormsg,setErrormsg]=useState({

         phonenumber : false
        });

    useEffect(()=>{
        if (deliverypersonid) {
          api.get("/delivery/view/"+deliverypersonid)
          .then((res)=>setDelperson({...res.data}))
          .catch((err)=>toast.error("Network Error "+ (err.response?.data?.message || err.message)));
        }
    },[deliverypersonid])

    const update=(event)=>{
      setDelperson({...delperson,[event.target.name]:event.target.value})
    }

    const handleupdate=(eve)=>{
         eve.preventDefault();

          if( !/^\d{10}$/.test(delperson.phonenumber) ){
              return setErrormsg((prev)=>({...prev,phonenumber:true}))
          }
          else{
             setErrormsg((prev)=>({...prev,phonenumber:false}))
          }
         
         api.put("/delivery/update/"+deliverypersonid, delperson)
        .then((res)=>{
          toast.success(res.data.message);
          localStorage.removeItem("id");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setTimeout(()=>navigate("/delivery"),1500)
        })
        .catch((err)=>toast.error("Network Error "+ (err.response?.data?.message || err.message)))

    }

  return (
    <div>
  <DeliveryNavbar></DeliveryNavbar>

  <div class="container mt-4 pt-3">
    <div class="row mt-5">
      <form onSubmit={handleupdate}>
        <div class="col-12 mb-4">
          <div class="card p-3 shadow-sm border rounded animate-card">
            <h5 class="mb-3 animate-title">Delivery Person Details</h5>
            <hr></hr>
            <div class="mb-2 animate-input">
              <label class="form-label d-none fw-bold">ID</label>
              <input
                type="text"
                name="_id"
                class="form-control d-none"
                value={delperson._id}
                readonly
              />
            </div>
            <div class="mb-2 animate-input">
              <label class="form-label fw-bold">Allocated ID</label>
              <input
                type="text"
                name="id"
                class="form-control"
                value={delperson.id}
                readonly
              />
            </div>
            <div class="mb-2 animate-input">
              <label class="form-label fw-bold">Name</label>
              <input
                type="text"
                class="form-control"
                name="name"
                value={delperson.name}
                onChange={update}
                required
              />
            </div>
            <div class="mb-2 animate-input">
              <label class="form-label fw-bold">Email</label>
              <input
                type="email"
                name="email"
                class="form-control"
                value={delperson.email}
                readonly
              />
            </div>
            <div class="mb-2 animate-input">
              <label class="form-label fw-bold">Password</label>
              <input
                type="password"
                class="form-control"
                name="password"
                value={delperson.password}
                onChange={update}
                required
              />
            </div>
            <div class="animate-input">
              <label class="form-label fw-bold">Phone Number</label>
              <input
                type="number"
                class="form-control"
                name="phonenumber"
                value={delperson.phonenumber}
                onChange={update}
                required
              />
              {errormsg.phonenumber ? <div style={{color:"red"}} class="form-text">*PhoneNumber Contains 10 digits Only.</div> : <div></div>}
            </div>
            <div class="animate-input">
              <label class="form-label fw-bold">Address</label>
              <input
                type="text"
                class="form-control"
                name="address"
                value={delperson.address}
                onChange={update}
                required
              />
            </div>
            <div className="my-3 d-flex justify-content-end">
              <button className="btn btn-primary animate-button" type="submit">Update Details</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>

   <ToastContainer 
    className="custom-toast"
    autoClose={3000} 
  />

  <Footer></Footer>

  {/* Inline CSS for animations and professional look */}
  <style>{`
    .animate-card {
      transition: transform 0.5s ease, box-shadow 0.5s ease;
    }
    .animate-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.2);
    }

    .animate-title {
      animation: fadeInDown 1s ease forwards;
      opacity: 0;
    }

    .animate-input {
      animation: fadeInUp 0.8s ease forwards;
      opacity: 0;
      margin-bottom: 15px;
    }

    .animate-button {
      transition: transform 0.3s ease, background-color 0.3s ease;
    }
    .animate-button:hover {
      transform: scale(1.05);
      background-color: #0069d9;
    }

    @keyframes fadeInDown {
      0% { opacity: 0; transform: translateY(-20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
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

  );
}
