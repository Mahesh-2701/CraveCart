import React, { useEffect, useState} from "react";
import Footer from "../components/Footer";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer,toast } from "react-toastify";
import Navbar from "../components/Navbar";

export default function UserProfile() {
   
    const navigate = useNavigate();

    const userid=localStorage.getItem("id")

    const [delperson,setDelperson]=useState({
        id:"",
        name:"",
        email:"",
        password:"",
        address:"",
        phonenumber:"",
        city:"",
        pincode:""
    })

    const [errormsg,setErrormsg]=useState({

         phonenumber : false,
         pincode:false
        });

    useEffect(()=>{
        axios.get("http://localhost:5000/user/view/"+userid,{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
        .then((res)=>setDelperson({...res.data})).catch((err)=>toast.error("Network Error "+err.message))
    },[])

    const update=(event)=>{
      setDelperson({...delperson,[event.target.name]:event.target.value})
    }

    const handleupdate=(eve)=>{
         eve.preventDefault();
         console.log(delperson)


          if( !/^\d{10}$/.test(delperson.phonenumber) ){
              return setErrormsg((prev)=>({...prev,phonenumber:true}))
          }
          else{
             setErrormsg((prev)=>({...prev,phonenumber:false}))
          }

           if (!/^\d{6}$/.test(delperson.pincode)) {
           return setErrormsg((prev)=>({ ...prev, pincode: true }));
          }
          else{
             setErrormsg((prev)=>({...prev,pincode:false}))
          }
         
         axios.put("http://localhost:5000/user/update/"+userid,delperson,{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
        .then((res)=>{
          toast.success(res.data.message);
          setTimeout(()=>navigate("/user/login"),1500)
        })
        .catch((err)=>toast.error(err.response.data.message))

    }

  return (
    <div>

        <Navbar></Navbar>

      <div class="container my-4">
        <div class="row">
          <form onSubmit={handleupdate}>
          <div class="col-12 mb-4">
            <div class="card p-3 shadow-lg border rounded">
              <h3 class="mb-3"> User Details</h3>
              <hr className="w-100"></hr>
              <div class="mb-2">
                <label class="form-label d-none fw-bold">ID</label>
                <input
                  type="text"
                   name="id"
                  class="form-control d-none"
                  value={delperson._id}
                  readonly
                />
              </div>
              <div class="mb-2">
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
              <div class="mb-2">
                <label class="form-label fw-bold">Email</label>
                <input
                  type="email"
                   name="email"
                  class="form-control"
                  value={delperson.email}
                  readonly
                />
              </div>
              <div class="mb-2">
                <label class="form-label fw-bold">Password</label>
                <input
                  type="password"
                  class="form-control"
                   name="password"
                  value={delperson.password}
                  onChange={update}
                  required
                />
                 { errormsg.phonenumber ? <div style={{color:"red"}} class="form-text">*PhoneNumber Contains 10 digits Only.</div> : <div></div>}
 
                </div>
              <div>
                <label class="form-label fw-bold">Phone Number</label>
                <input
                  type="number"
                  class="form-control"
                   name="phonenumber"
                  value={delperson.phonenumber}
                  onChange={update}
                  required
                />
                   { errormsg.phonenumber ? <div style={{color:"red"}} class="form-text">*PhoneNumber Contains 10 digits Only.</div> : <div></div>}
 
              </div>
              <div>
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
               <label class="form-label fw-bold">Pincode</label>
                <input
                  type="number"
                  class="form-control"
                   name="pincode"
                  value={delperson.pincode}
                  onChange={update}
                  required
                />
                    { errormsg.pincode ? <div style={{color:"red"}} class="form-text">*Enter a Valid Pincode.</div> : <div></div>}
              <div className="my-3 d-flex justify-content-end"><button className="btn btn-primary " type="submit">Update Details</button></div>
            </div>
          </div>
          </form>

        </div>
      </div>

      <style>{`
  /* Page background */
  .container {
    max-width: 800px;
    animation: fadeInPage 0.8s ease-in-out;
  }

  /* Card design */
  .card {
    border-radius: 15px;
    background: #ffffff;
    border: none;
    box-shadow: 0 6px 18px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }

  /* Heading */
  .card h3 {
    font-weight: 700;
    color: #2c3e50;
    font-size: 1.6rem;
    text-align: center;
    animation: slideDown 0.6s ease-in-out;
  }

  /* Labels */
  .form-label {
    font-size: 0.95rem;
    color: #34495e;
    margin-bottom: 4px;
  }

  /* Inputs */
  .form-control {
    border-radius: 10px;
    padding: 10px 14px;
    border: 1px solid #dfe6e9;
    transition: all 0.3s ease;
    font-size: 0.95rem;
  }

  .form-control:focus {
    border-color: #007bff;
    box-shadow: 0 0 8px rgba(0,123,255,0.25);
  }

  /* Submit button */
  .btn-primary {
    padding: 10px 22px;
    font-weight: 600;
    border-radius: 8px;
    background: linear-gradient(90deg, #007bff, #00c6ff);
    border: none;
    transition: all 0.3s ease-in-out;
  }

  .btn-primary:hover {
    background: linear-gradient(90deg, #0056d2, #00a6e0);
    transform: scale(1.05);
  }

  /* Error messages */
  .form-text {
    font-size: 0.85rem;
    margin-top: 4px;
  }

  /* Animations */
  @keyframes fadeInPage {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-15px); }
    to { opacity: 1; transform: translateY(0); }
  }
`}</style>


      <ToastContainer></ToastContainer>

      <Footer></Footer>
    </div>
  );
}
