import React, { useEffect, useRef, useState } from "react";
import RestaurantNavbar from "../components/RestaurantNavbar"
import Footer from "../components/Footer";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function RestaurantAdmin() {

  const [restaurant, setRestaurant] = useState({
    name: "",
    address: "",
    phonenumber: "",
    email: "",
  });
 
  const formRef = useRef(null); 

  const [available, setAvailable] = useState();

  useEffect(() => {
    axios
      .get("http://localhost:5000/restaurant/details/" + localStorage.getItem("id"), {
        headers: { Authorization:"Bearer "+ localStorage.getItem("token") },
      })
      .then((res) => {
        setRestaurant({ ...res.data });
        setAvailable(res.data.isactive)
      })
      .catch((err) => {
        toast.error(err.message);
      });
  }, []);

  //for changing the availability status
  function availability(id,newstatus){
        axios.patch("http://localhost:5000/restaurant/availability/"+id,{ isactive: newstatus},{headers:{Authorization:"Bearer "+localStorage.getItem("token")}})
        .then((res)=>toast.success(res.data.message))
        .catch((err)=>toast.error("Error Occured : "+err.response.data.message))
  }

  // Menu items
  const [menu, setMenu] = useState([]);

  useEffect(()=>{
    axios
      .get("http://localhost:5000/restaurant/menudisplay/" +localStorage.getItem("id"), {
        headers: { Authorization:"Bearer "+ localStorage.getItem("token") },
      })
      .then((res) => {
        setMenu(res.data);
      })
      .catch((err) => {
        toast.error(err.response.data.message);
      });
  },[])

  const [newFood, setNewFood] = useState({
    name: "",
    description: "",
    price: "",
    restaurantid:"",
  });

  //delete menu items

  function deletemenu(Id){
      if(window.confirm("Are you Sure Want To Delete?")){
        axios
      .delete("http://localhost:5000/restaurant/deletemenu/"+Id, {
        headers: { Authorization:"Bearer "+ localStorage.getItem("token") }} )
      .then((res) => {
        toast.success(res.data.message) ; 

        axios.get("http://localhost:5000/restaurant/menudisplay/" +localStorage.getItem("id"), {
          headers: { Authorization:"Bearer "+ localStorage.getItem("token") },
        })
        .then((res) => {  setMenu(res.data);  }).catch((err) => {  toast.error(err.message);});
      })
      .catch((err) => {
        toast.error("Server connection Error : "+err.message);
      });
      }
  }

  const [menuimage, setMenuimage] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    setNewFood({ ...newFood, [e.target.name]: e.target.value });
  };

  const handlefileChange = (event) => {
    setMenuimage(event.target.files[0]);
  };

  // Add new food item
  const handleAddFood = (e) => {
    e.preventDefault();
    const formdata = new FormData();
    formdata.append("image", menuimage);
    formdata.append("name", newFood.name);
    formdata.append("description", newFood.description);
    formdata.append("price", newFood.price);
    formdata.append("restaurantid",restaurant._id)

    console.log(formdata)

    axios
      .post("http://localhost:5000/restaurant/menuupload", formdata, {
        headers: { Authorization:"Bearer "+ localStorage.getItem("token") }} )
      .then((res) =>{
         toast.success(res.data.message);

        axios.get("http://localhost:5000/restaurant/menudisplay/" +localStorage.getItem("id"), {
          headers: { Authorization:"Bearer "+ localStorage.getItem("token") },
         })
        .then((res) => {  setMenu(res.data);  }).catch((err) => {  toast.error("Error Occured : "+err.response.data.message);});
         
        formRef.current.reset()
        })
      .catch((err) => {
        toast.error("Error Occured : "+err.response.data.message);
      });
  };

  return (
    <div>
      <RestaurantNavbar></RestaurantNavbar>

      <section className="container mt-5">
        <div className="container mt-5 pt-5">
          {/* Restaurant Info */}
          <div className="card shadow mb-4">
            <div className="row">
              <div className="col-12 col-md-4 d-flex flex-column justify-content-start align-items-center">
                <div className="card-body">
                  <h3 className="card-title">{restaurant.name} Restaurant</h3>
                  <p className="card-text">
                    <b>Address:</b> {restaurant.address} <br />
                    <b>Phone:</b> {restaurant.phonenumber} <br />
                    <b>Email:</b> {restaurant.email}
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-4 d-flex flex-column gap-2 justify-content-center align-items-center">
                <div><Link to="/restaurant/admin/order" className="btn btn-outline-secondary">View Orders</Link></div>
                <div>
                  <b>IsAvailable :</b>{" "}
                  { available ? "Opens" : "Closed"}
                </div>
                <div>
                  <button
                    className="btn btn-outline-success me-3"
                    onClick={() =>{ setAvailable(true) ; availability(restaurant._id,true)}}
                  >
                    Opened
                  </button>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() =>{ setAvailable(false) ; availability(restaurant._id,false)}}
                  >
                    Closed
                  </button>
                </div>
              </div>
              <div className="col-12 col-md-4 d-flex justify-content-center align-items-center">
                <img
                  src={"http://localhost:5000" + restaurant.image}
                  className="img-fluid rounded-2 p-2 border-dark"
                  alt={restaurant.image}
                  width={"300px"}
                ></img>
              </div>
            </div>
          </div>

          {/* Menu Table */}
          <div className="card shadow mb-4">
            <div className="card-body">
              <h4 className="mb-3">Menu Items</h4>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-secondary">
                    <tr>
                      <th>#</th>
                      <th>Dish</th>
                      <th>Image</th>
                      <th>Description</th>
                      <th>Price (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.length > 0 ? (
                      menu.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.name}</td>
                          <td><img src={"http://localhost:5000"+item.image} className="img-fluid rounded-2" width={"90px"} height={"60px"}/></td>
                          <td>{item.description}</td>
                          <td>₹{item.price}</td>
                          <td><button className="btn btn-danger" onClick={ ()=> deletemenu(item._id)}>Delete</button></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No food items available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Food Form */}
          <div className="card shadow">
            <div className="card-body">
              <h4 className="mb-3">Add New Food Item</h4>
              <form onSubmit={handleAddFood} className="row g-3"  ref={formRef}>
                <div className="col-md-4">
                  <label className="form-label">Dish Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Image</label>
                  <input
                    type="file"
                    className="form-control"
                    name="image"
                    onChange={handlefileChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    name="description"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Restaurant Id</label>
                  <input
                    type="text"
                    className="form-control"
                    name="restaurantid"
                    value={restaurant._id}
                    readOnly
                  />
                </div>
                <div className="col-12 text-end">
                  <button type="submit" className="btn btn-primary">
                    Add Food
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer></Footer>
      <ToastContainer></ToastContainer>
    </div>
  );
}
