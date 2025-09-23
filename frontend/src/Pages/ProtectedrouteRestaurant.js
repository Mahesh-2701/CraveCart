import React from 'react'
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedrouteRestaurant({children}) {
   
    const isAuth = localStorage.getItem("token") && localStorage.getItem("role") == "restaurant";

    if(!isAuth){
        return <Navigate to="/restaurant/view"></Navigate>
    }
    else{
        return <Outlet></Outlet>
    }
}
