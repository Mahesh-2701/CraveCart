import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

export default function DeliveryLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("id");
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/delivery");
  }, [navigate]);

  return null; 
}
