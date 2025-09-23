import React, { useState } from 'react'

export default function CartCard(props) {

  const { item  ,removeitem ,handlequantityupdate} = props

  const [ items , setItems] = useState({...item})


  const quantityupdate = (eve)=>{
    setItems({...items,[eve.target.name]:Number(eve.target.value)})
    handlequantityupdate(items._id,Number(eve.target.value))
  }
    

  return (
    <div>
                <div className="card shadow-sm h-100">
                  <img
                    src={"http://localhost:5000" + items.menuid.image}
                    className="card-img-top"
                    alt={item.name}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{items.menuid.name}</h5>
                    <p className="card-text text-muted">
                      Restaurant: {item.menuid.restaurantid.name}
                    </p>
                    <p className="card-text text-muted">Price: ₹{items.price}</p>
                    <p className="card-text text">
                      Subtotal: <b>₹{items.price*items.quantity}</b>
                    </p>
                    <label className="form-label">Quantity :</label>
                    <select
                      class="form-select"
                      aria-label="Default select example"
                      onChange={quantityupdate}
                      name="quantity"
                    >
                     <option selected>{items.quantity}</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                    <button
                      className="btn btn-danger btn-sm mt-2"
                      onClick={() => {
                        removeitem(item._id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
    </div>
  )
}
