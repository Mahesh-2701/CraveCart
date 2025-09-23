import React,{useState} from 'react'
import axios from 'axios'
import {  useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'

export default function RestaurantSignin() {

    const navigate=useNavigate();

    const [user,setUser]=useState({
        name:"",
        email:"",
        password:"",
        phonenumber:"",
        address:"",
        city:"",
        pincode:""

    })

    const [file,setFile]=useState(null);

    const [errormsg,setErrormsg]=useState({
        email:false,
        password:false,
        phonenumber:false,
        pincode:false
    });

    const update=(event)=>{
         setUser({...user,[event.target.name] : event.target.value})
    }

    const fileupdate=(event)=>{
        setFile(event.target.files[0])
    }

    const send=(event)=>{
           event.preventDefault();
           
           console.log(user);

          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          
          if( !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ){
            return setErrormsg((prev)=>({...prev,email:true}))
          }
          else{
             setErrormsg((prev)=>({...prev,email:false}))
          }

          if( !strongPasswordRegex.test(user.password) ){
              return setErrormsg((prev)=>({...prev,password:true}))
          }
          else{
             setErrormsg((prev)=>({...prev,password:false}))
          }
          
          if( !/^\d{10}$/.test(user.phonenumber) ){
              return setErrormsg((prev)=>({...prev,phonenumber:true}))
          }
          else{
             setErrormsg((prev)=>({...prev,phonenumber:false}))
          }

          if (!/^\d{6}$/.test(user.pincode)) {
            return setErrormsg((prev)=>({ ...prev, pincode: true }));
          }
          else{
             setErrormsg((prev)=>({...prev,pincode:false}))
          }
        
           const formdata= new FormData();
           formdata.append("image",file);
           formdata.append("name",user.name);
           formdata.append("email",user.email)
           formdata.append("password",user.password)
           formdata.append("city",user.city)
           formdata.append("pincode",user.pincode);
           formdata.append("phonenumber",user.phonenumber)
           formdata.append("address",user.address)


           axios.post("https://cravecart-5vz7.onrender.com/restaurant/signin",formdata)
           .then((res)=> toast.success(res.data.message))
           .catch((err)=>{ toast.error(err.response.data.message)})
    }

  return (
    <div className="login-page d-flex align-items-center rounded-top-4 py-5" style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="row align-items-center">

          {/* Left Side Content */}
          <div className="col-md-6 text-white p-4">
            <h1 className="fw-bold display-5">Join CraveCart </h1>
            <p className="lead mt-3">
              Expand your restaurant reach by joining our platform.  
              Deliver food to thousands of hungry customers nearby and grow your business with ease.
            </p>
            <ul className="mt-4">
              <li> Get discovered by new customers</li>
              <li> Easy-to-use partner dashboard</li>
              <li> Increase revenue with online orders</li>
            </ul>
          </div>

          <div className="col-md-6">
            <div className="p-2 d-flex justify-content-center">
              <form onSubmit={send} className="w-100 p-3 border rounded-3 shadow-lg bg-light">
                <h2 className="p-2 text-center">Restaurant's Signin</h2>
                <hr />
                <div class="mb-3">
                  <label class="form-label">Restaurant Name</label>
                  <input type="text" class="form-control" placeholder="Mahesh" onChange={update} name="name" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">Restaurant Image</label>
                  <input type="file" class="form-control" onChange={fileupdate} name="image" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" placeholder="Mahesh@gmail.com" onChange={update} name="email" required />
                  {errormsg.email ? <div style={{ color: "red" }} class="form-text">*Enter a Valid Email.</div> : <div></div>}
                </div>

                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input type="password" class="form-control" placeholder="****" onChange={update} name="password" required />
                  {errormsg.password ? <div style={{ color: "red" }} class="form-text">*Password must be 8+ chars with uppercase, lowercase, number & special character.</div> : <div></div>}
                </div>

                <div class="mb-3">
                  <label class="form-label">Phone Number</label>
                  <input type="number" class="form-control" placeholder="123456789" onChange={update} name="phonenumber" required />
                  {errormsg.phonenumber ? <div style={{ color: "red" }} class="form-text">*PhoneNumber Contains 10 digits Only.</div> : <div></div>}
                </div>

                <div class="mb-3">
                  <label class="form-label">Address</label>
                  <textarea class="form-control" onChange={update} name="address" required></textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label">City</label>
                  <input type="text" class="form-control" placeholder="Delhi" onChange={update} name="city" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">Pincode</label>
                  <input type="number" class="form-control" placeholder="625532" onChange={update} name="pincode" required />
                  {errormsg.pincode ? <div style={{ color: "red" }} class="form-text">*Enter a Valid Pincode.</div> : <div></div>}
                </div>

                <button type="submit" class="btn btn-primary w-100">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer 
    className="custom-toast"
    autoClose={3000} 
  />

      {/* Inline styles */}
      <style>{`
        .login-page {
          background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
                      url("https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1600&q=80")
                      no-repeat center center/cover;
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
