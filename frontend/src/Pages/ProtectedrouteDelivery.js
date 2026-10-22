import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRouteDelivery() {
  const role = localStorage.getItem("role");
  const isAuth = Boolean(
    localStorage.getItem("token") && (role === "deliveryperson" || role === "delivery")
  );

  return isAuth ? <Outlet /> : <Navigate to="/delivery" replace />;
}
