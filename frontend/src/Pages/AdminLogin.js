import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'

export default function AdminLogin() {

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

         axios.post("https://cravecart-5vz7.onrender.com/admin/login",login)
         .then((res)=>{ toast.success(res.data.message);
           localStorage.setItem("token",res.data.token) ;
           localStorage.setItem("id",res.data.id) ;
           localStorage.setItem("role",res.data.role) 
            setTimeout(()=>navigate("/admin/dashboard"),1500)})
         .catch((err)=>{ toast.error(err.response.data.message)})
 
    }

  return (
    <div className='container p-2 d-flex justify-content-center my-5'>
       <form onSubmit={send} className='w-50 p-3 border rounded-3'>

        <h2 className='p-2 text-center'>Admin Login</h2>
        <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" placeholder='Mahesh@gmail.com' onChange={update} name='email' required/>
           
        </div>

       <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" placeholder='****' onChange={update} name='password' required/>
       </div>
 
        <button type="submit" class="btn btn-primary w-100">Submit</button>

      </form>
      <ToastContainer ></ToastContainer>
    </div>
  )
}
