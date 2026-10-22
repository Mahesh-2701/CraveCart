import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRouteAdmin() {
  const isAuth = Boolean(
    localStorage.getItem("token") && localStorage.getItem("role") === "admin"
  );

  return isAuth ? <Outlet /> : <Navigate to="/admin/login" replace />;
}