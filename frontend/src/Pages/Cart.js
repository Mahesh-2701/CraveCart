import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import CartCard from "../components/CartCard";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    axios
      .get(
        "https://cravecart-5vz7.onrender.com/user/cartdisplay/" + localStorage.getItem("id"),
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      )
      .then((res) => setCartItems(res.data))
      .catch((err) => toast.error(err.response.data.message));
  }, []);

  const removeitem = (id) => {
    axios
      .delete("https://cravecart-5vz7.onrender.com/user/cartdelete/" + id, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => {
        toast.success(res.data.message);
        axios
          .get(
            "https://cravecart-5vz7.onrender.com/user/cartdisplay/" +
              localStorage.getItem("id"),
            {
              headers: {
                Authorization: "Bearer " + localStorage.getItem("token"),
              },
            }
          )
          .then((res) => setCartItems(res.data))
          .catch((err) => toast.error(err.response.data.message));
      })
      .catch((err) => toast.error(err.response.data.message));
  };

  const handlequantityupdate = (id, newquantity) => {
    const updateditems = cartItems.map((item) =>
      item._id === id ? { ...item, quantity: newquantity } : item
    );
    setCartItems(updateditems);
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * (item.quantity || 1),
    0
  );

//order proceedings
const [address, setAddress] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const handleChange = (e) => {
    setAddress(e.target.value);
  };

  const order =  function(e){
    e.preventDefault();
    
    if(window.confirm("Are You Placing the order ?")){

      cartItems.map((item)=>
      {
                  let orderdetails = {
              userid:localStorage.getItem("id"),
              menuid:item.menuid._id,
              price:item.price,
              quantity:item.quantity,
              paymentmethod:paymentMethod,
              address:address
        }

        axios.post("https://cravecart-5vz7.onrender.com/user/order/"+localStorage.getItem("id"),orderdetails,
                {headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
        .then((res)=>console.log(res.data.message))
        .catch((err)=>toast.error(err.response.data.message));

      })
      toast.success("Thank you for the Order ! Your Order will recieve Soon ")
    
      axios.delete("https://cravecart-5vz7.onrender.com/user/cartrefresh/"+localStorage.getItem("id"), {headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
      .then((res)=>toast.success(res.data.message)).catch((err)=>toast.error(err.response.data.message));
      setCartItems([])
  
    }
  };

  return (
    <div>
      <Navbar></Navbar>

      <div className="container my-4">
        <h3 className="mb-4 d-flex align-items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-bag-fill" viewBox="0 0 16 16">
  <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4z"/>
</svg> Your Cart</h3>
        <div className="row">
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <div className="col-md-4 mb-4" key={index}>
                <CartCard
                  item={item}
                  removeitem={removeitem}
                  handlequantityupdate={handlequantityupdate}
                  key={item._id}
                ></CartCard>
              </div>
            ))
          ) : (
            <div className="col-12 text-center">
              <p className="text-muted">Your cart is empty.</p>
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div>
            <div className="card p-3 mt-4 shadow-sm">
              <h5 className="mb-3">Delivery Details</h5>
              <form onSubmit={order}>
                {/* Address Fields */}
                <div className="mb-2">
                  <label className="form-label"> Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="street"
                    value={address.street}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Payment Method */}
                <h6 className="mb-2">Payment Method</h6>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="cod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="cod">
                    Cash on Delivery (COD)
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="online"
                    value="Online"
                    checked={paymentMethod === "Online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="online">
                    Online Payment
                  </label>
                </div>
                <button className="btn btn-success form-control" type="submit" >Proceed to CheckOut</button>
              </form>
            </div>
            <div className="mt-4 p-3 border rounded shadow-sm bg-light text-end">
              <h4>Total: ₹{totalPrice}</h4>
              <p className="text-muted">
                <b>+</b> ₹60 Delivery Charges
              </p>
              
            </div>
          </div>
        )}
      </div>
      <ToastContainer style={{top:"80px",left:"75%",right:"auto"}} autoClose={3000} limit={3} />
      <Footer></Footer>
    </div>
  );
}
