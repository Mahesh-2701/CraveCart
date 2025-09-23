import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'

export default function UserLogin() {

   const navigate=useNavigate();

    const [login,setLogin]=useState({
        email:"",
        password:""
    })

     const update=(event)=>{
         setLogin({...login,[event.target.name] : event.target.value})
    }

    const send=(event)=>{

         event.preventDefault();

         axios.post("https://cravecart-5vz7.onrender.com/user/login",login)
         .then((res)=>{ toast.success(res.data.message);
           localStorage.setItem("token",res.data.token) ;
           localStorage.setItem("id",res.data.id) ;
           localStorage.setItem("role",res.data.role) 
            setTimeout(()=>navigate("/"),1500)})
         .catch((err)=>{ toast.error(err.response.data.message)})
 
    }

  return (
    <div className='login-page'>
    <div className='container p-2 d-flex justify-content-center my-5'>
       <form onSubmit={send} className='w-50 p-3 border bg-light shadow-lg rounded-3'>

        <h2 className='p-2 text-center'>Login</h2>
        <hr></hr>
        <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" placeholder='Mahesh@gmail.com' onChange={update} name='email' required/>
           
        </div>

       <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" placeholder='****' onChange={update} name='password' required/>
       </div>
 
        <button type="submit" class="btn btn-primary w-100">Submit</button>

         <div className='d-flex justify-content-center my-3'><Link to="/user/signup" className='h6 text-center text-primary  text-decoration-none '>Don't Have an Account? Signin</Link></div>


      </form>
      <ToastContainer style={{top:"80px",left:"75%",right:"auto"}} autoClose={3000}  />
    </div>
    <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
                      url("https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1600&q=80")
                      no-repeat center center/cover;
        }
        form {
          max-width: 500px;
          width: 100%;
        }
      `}</style>
    </div>
  )
}
