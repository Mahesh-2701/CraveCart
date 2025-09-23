import React from 'react'
import { Navigate, Outlet } from 'react-router-dom';

export default function Protectedroute({children}) {

    const isAuth = localStorage.getItem("token") && localStorage.getItem("role") == "admin"

    if(!isAuth){
        return <Navigate to="/admin/login"></Navigate>
    }
    else{
        return <Outlet></Outlet>
    }


}