import {React, useState} from 'react'
import axios from 'axios'
import {  useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import Footer from '../components/Footer';
import DeliveryNavbar from "../components/DeliveryNavbar"

export default function DeliveryPerson() {
     const navigate=useNavigate();

     //login
    
        const [login,setLogin]=useState({
            email:"",
            password:""
        })
    
         const updatelogin=(event)=>{
             setLogin({...login,[event.target.name] : event.target.value})
        }
    
        const sendlogin=(event)=>{
    
             event.preventDefault();
    
             axios.post("https://cravecart-5vz7.onrender.com/delivery/login",login)
             .then((res)=>{ 
                toast.success(res.data.message);
                 localStorage.setItem("token",res.data.token) ;
                 localStorage.setItem("role",res.data.role) ;
                 localStorage.setItem("id",res.data.id)
                  setTimeout(()=>navigate("/delivery/order"),1500)})
             .catch((err)=>{ toast.error(err.response.data.message)})
     
        }

    //signin
      const [user,setUser]=useState({
             name:"",
             email:"",
             password:"",
             phonenumber:"",
             address:"",
     
         })
     
         const [errormsg,setErrormsg]=useState({
             email:false,
             password:false,
             phonenumber:false,
         });
     
         const update=(event)=>{
              setUser({...user,[event.target.name] : event.target.value})
         }
     
         const send=(event)=>{
                event.preventDefault();
                
                console.log(user);
     
               const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
               
               if( !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ){
                return  setErrormsg((prev)=>({...prev,email:true}))
               }
               else{
                  setErrormsg((prev)=>({...prev,email:false}))
               }
     
               if( !strongPasswordRegex.test(user.password) ){
                  return  setErrormsg((prev)=>({...prev,password:true}))
               }
               else{
                  setErrormsg((prev)=>({...prev,password:false}))
               }
               
               if( !/^\d{10}$/.test(user.phonenumber) ){
                  return  setErrormsg((prev)=>({...prev,phonenumber:true}))
               }
               else{
                  setErrormsg((prev)=>({...prev,phonenumber:false}))
               }
     
     
                axios.post("https://cravecart-5vz7.onrender.com/delivery/signin",user)
                .then((res)=>toast.success(res.data.message) )
                .catch((err)=>{ toast.error("Email Already Exists Or "+err.response.data.message)})
         }

  return (
    <div>
      <DeliveryNavbar></DeliveryNavbar>
      <section className='login-page rounded-bottom-4'>
          <div className='container p-2 d-flex justify-content-center my-5'>
                 <form onSubmit={sendlogin} className='w-75 w-lg-50 p-3 border bg-light rounded-3'>
          
                  <h2 className='p-2 text-center'>Login</h2>
                  <hr></hr>
                  <div class="mb-3">
                      <label class="form-label">Email</label>
                      <input type="email" class="form-control" placeholder='Mahesh@gmail.com' onChange={updatelogin} name='email' required/>
                     
                  </div>
          
                 <div class="mb-3">
                      <label class="form-label">Password</label>
                      <input type="password" class="form-control" placeholder='****' onChange={updatelogin} name='password' required/>
                 </div>
           
                  <button type="submit" class="btn btn-primary w-100">Submit</button>
                  
          
                </form>
              </div>
      </section>

      <div className="partner-info-section py-5 vh-100 d-flex align-items-center bg-light">
  <div className="container text-center">
    <h2 className="fw-bold mb-4">Why Deliver with <span className="text-primary">CraveCart </span>?</h2>
    <p className="lead mb-5">
      Join our growing network of delivery partners and start earning on your schedule.  
      Flexible hours, instant payouts, and supportive community await you.
    </p>

    <div className="row">
      <div className="col-md-4 mb-4">
        <div className="card shadow-sm h-100 border-0">
          <div className="card-body">
            <h4 className="fw-bold mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-cash-coin me-2" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8m5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0"/>
                <path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195z"/>
                <path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083q.088-.517.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1z"/>
                <path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 6 6 0 0 1 3.13-1.567"/>
              </svg> Earn on Your Terms</h4>
            <p>
              Deliver food whenever you want. Choose your working hours and get paid daily for completed deliveries.
            </p>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-4">
        <div className="card shadow-sm h-100 border-0">
          <div className="card-body">
            <h4 className="fw-bold mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-geo-alt-fill me-1" viewBox="0 0 16 16">
  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
</svg> Explore Your City</h4>
            <p>
              Discover new neighborhoods and meet customers while earning. Each delivery helps you grow your experience.
            </p>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-4">
        <div className="card shadow-sm h-100 border-0">
          <div className="card-body">
            <h4 className="fw-bold mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-people-fill me-1" viewBox="0 0 16 16">
  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
</svg> Supportive Community</h4>
            <p>
              From onboarding to problem-solving, our dedicated support team is available 24/7 to guide you through every step.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


    <section className="delivery-hero d-flex rounded-top-4 align-items-center" style={{ minHeight: "100vh" }}>
  <div className="container">
    <div className="row align-items-center">

      {/* Left Side Info */}
      <div className="col-md-6 text-white p-4">
        <h1 className="fw-bold display-5">Become a Delivery Partner</h1>
        <p className="lead mt-3">
          Join CraveCart and start earning on your schedule.  
          Flexible hours, instant payouts, and supportive community await you.
        </p>
        <ul className="mt-4">
          <li>Work at your convenience</li>
          <li>Instant daily payouts</li>
          <li>Grow experience and explore your city</li>
          <li>24/7 support whenever you need it</li>
        </ul>
      </div>

      {/* Right Side Form */}
      <div className="col-md-6">
        <div className="p-2 d-flex justify-content-center">
          <form onSubmit={send} className="w-100 p-3 border rounded-3 shadow-lg bg-light">
            <h2 className="p-2 text-center">Signup</h2>

            <div className="mb-3">
              <label className="form-label">Name</label>
              <input type="text" className="form-control" placeholder="Mahesh" onChange={update} name="name" required />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="Mahesh@gmail.com" onChange={update} name="email" required />
              {errormsg.email ? <div style={{ color: "red" }} className="form-text">*Enter a Valid Email.</div> : <div></div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="****" onChange={update} name="password" required />
              {errormsg.password ? <div style={{ color: "red" }} className="form-text">*Password must be 8+ chars with uppercase, lowercase, number & special character.</div> : <div></div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input type="number" className="form-control" placeholder="1234567890" onChange={update} name="phonenumber" required />
              {errormsg.phonenumber ? <div style={{ color: "red" }} className="form-text">*PhoneNumber Contains 10 digits Only.</div> : <div></div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea className="form-control" onChange={update} name="address" required></textarea>
            </div>

            <button type="submit" className="btn btn-primary w-100">Submit</button>
          </form>
        </div>
      </div>

    </div>
  </div>

  {/* Inline styles for background */}
  <style>{`
    .delivery-hero {
      background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
                  url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1600&q=80')
                  no-repeat center center/cover;
    }

    .delivery-hero .text-white {
      text-shadow: 1px 1px 4px rgba(0,0,0,0.7);
    }
  `}</style>
</section>

      <ToastContainer 
    className="custom-toast"
    autoClose={3000} 
  />
         <style>{`
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
                url("https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1600&q=80")
                no-repeat center center;
    background-size: cover;
  }

  form {
    max-width: 500px;
    width: 100%;
  }

  /* Mobile */
  @media (max-width: 480px) {
    .login-page {
      background-position: top center;   /* focus top of image */
      background-size: cover;            /* still fills screen */
    }
  }

  /* Tablet */
  @media (min-width: 481px) and (max-width: 1024px) {
    .login-page {
      background-position: center center; /* balance */
      background-size: cover;
    }
  }

  /* Laptop & Desktop */
  @media (min-width: 1025px) {
    .login-page {
      background-position: center center;
      background-size: cover;
    }
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

      <Footer></Footer>
    </div>
  )
}
