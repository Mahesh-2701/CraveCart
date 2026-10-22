import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const isAuth = Boolean(
    localStorage.getItem("token") && localStorage.getItem("role") === "user"
  );

  return isAuth ? <Outlet /> : <Navigate to="/user/login" replace />;
}
