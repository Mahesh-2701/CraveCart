import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

export default function RestaurantLogout() {
   const navigate = useNavigate();
  
    useEffect(() => {
      localStorage.removeItem("id");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
  
      navigate("/restaurant/view");
    }, [navigate]);

  return (
    <div>
      
    </div>
  )
}
