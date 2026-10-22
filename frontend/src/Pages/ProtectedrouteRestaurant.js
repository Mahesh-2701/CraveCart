import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRouteRestaurant() {
  const isAuth = Boolean(
    localStorage.getItem("token") && localStorage.getItem("role") === "restaurant"
  );

  return isAuth ? <Outlet /> : <Navigate to="/restaurant/view" replace />;
}
