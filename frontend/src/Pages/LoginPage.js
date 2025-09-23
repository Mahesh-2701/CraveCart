import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import UserLogin from "../components/UserLogin"

export default function LoginPage() {
  return (
    <>
     <Navbar></Navbar>
      
            <UserLogin></UserLogin>

     <Footer></Footer>
    </>
  )
}
