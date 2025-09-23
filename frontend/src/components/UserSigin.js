import React,{useState} from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'

export default function UserSigin() {

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

    const [errormsg,setErrormsg]=useState({
        email:false,
        password:false,
        phonenumber:false,
        pincode:false
    });

    const update=(event)=>{
         setUser({...user,[event.target.name] : event.target.value})
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
            return   setErrormsg((prev)=>({...prev,password:true}))
          }
          else{
             setErrormsg((prev)=>({...prev,password:false}))
          }
          
          if( !/^\d{10}$/.test(user.phonenumber) ){
            return   setErrormsg((prev)=>({...prev,phonenumber:true}))
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


           axios.post("http://localhost:5000/user/signin",user)
           .then((res)=>{ toast.success(res.data.message) ; setTimeout(()=>navigate("/"),2000)})
           .catch((err)=>{ toast.error("Network Error or Email already exists")})
    }

  return (
    <div className='login-page'>
    <div className='container p-2 d-flex justify-content-center my-3'>
      <form onSubmit={send} className='w-50 p-3 border bg-light rounded-3'>
        
         <h2 className='p-2 text-center'>Signin</h2>
         <hr ></hr>
        <div class="mb-3">
            <label class="form-label">Name</label>
            <input type="text" class="form-control" placeholder='Mahesh' onChange={update} name='name' required/>
            
            
        </div>

        <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" placeholder='Mahesh@gmail.com' onChange={update} name='email' required/>
            { errormsg.email ? <div style={{color:"red"}} class="form-text">*Enter a Valid Email.</div> : <div></div>}

        </div>

       <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" placeholder='****' onChange={update} name='password' required/>
            { errormsg.password ? <div style={{color:"red"}} class="form-text">*Password must be 8+ chars with uppercase, lowercase, number & special character.</div> : <div></div>}
        </div>

        <div class="mb-3">
            <label class="form-label">Phone Number</label>
            <input type="number" class="form-control" placeholder='123456789' onChange={update} name='phonenumber' required/>
            { errormsg.phonenumber ? <div style={{color:"red"}} class="form-text">*PhoneNumber Contains 10 digits Only.</div> : <div></div>}
        </div>

        <div class="mb-3">
            <label class="form-label">Address</label>
            <textarea class="form-control" onChange={update} name='address' required></textarea>
        </div>

       <div class="mb-3">
            <label class="form-label">City</label>
            <input type="text" class="form-control" placeholder='Delhi' onChange={update} name='city' required/>
            <div id="" class="form-text"></div>
        </div>

        <div class="mb-3">
            <label class="form-label">Pincode</label>
            <input type="number" class="form-control" placeholder='625-532' onChange={update} name='pincode' required/>
            { errormsg.pincode ? <div style={{color:"red"}} class="form-text">*Enter a Valid Pincode.</div> : <div></div>}
        </div>
        
        
        <button type="submit" class="btn btn-primary w-100">Submit</button>

        <div className='d-flex justify-content-center my-3'><Link to="/user/login" className='h6 text-center text-primary  text-decoration-none '>Already Have an Account? Login</Link></div>
      </form>
      <ToastContainer  style={{top:"80px",left:"75%",right:"auto"}}></ToastContainer>
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
