import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedrouteDelivery({children}) {
  
   const isAuth = localStorage.getItem("token") && localStorage.getItem("role") == "deliveryperson"

   if(!isAuth){
    return <Navigate to="/delivery"></Navigate>
   }
   else{
    return <Outlet></Outlet>
   }
}
