import axios from 'axios'
import React, {  useEffect, useState } from 'react'
import { toast,ToastContainer } from 'react-toastify'

export default function RestaurantOrderCard({index,order}) {

   let orderstatus = order.status

    const [status,setStatus]=useState(orderstatus)

     useEffect(() => {
    setStatus(order.status); 
  }, [order.status]);

    function changestatus(id,newstatus){
      axios.patch("https://cravecart-5vz7.onrender.com/restaurant/order/statuschange/"+id,{status:newstatus},{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
      .then((res)=>{ toast.success(res.data.message)})
      .catch((err)=>toast.error("Error Occured : "+err.response.data.message))
    }

  return (
    <tr>
                <td>{index + 1}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <img 
                      src={"https://cravecart-5vz7.onrender.com"+order.menuid.image} 
                      alt={order.menuid.name} 
                      style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", marginRight: "8px" }}
                    />
                    {order.menuid.name}
                  </div>
                </td>
                <td>{order.userid.name}</td>
                <td>{order.quantity}</td>
                <td>{order.price}</td>
                <td>
                  { status === "Delivered" ? (<p className='text-danger px-2'>{status}</p>) : (

                    <select class="form-select" aria-label="Default select example"  value={status}
                          onChange={(eve)=>{  setStatus(eve.target.value) ; changestatus(order._id,eve.target.value)}}>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>

                  )}
                </td>
                <td>{order.paymentmethod}</td>
                <td>{order.deliverypersonid.name}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
  </tr>
  
  )
}
