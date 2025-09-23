import React from 'react'
import "./FoodCard.css";

export default function CardRestaurant(props) {

  const { id,name,image,address,phonenumber,available} =props;

  return (
    <div>
     <div className="card food-card shadow-sm border-0">
        <div className="img-wrapper">
          <img
            src={"https://cravecart-5vz7.onrender.com"+image}
            className="card-img-top"
            alt="Food"
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">{name}</h5>
          <p className="card-text text-muted mb-2">{address}</p>
          <p className="card-text text-muted mb-2">Available : {available?(<b className='text-success'>Opened</b>):(<b className='text-danger'>Closed</b>)}</p>

          {/* ⭐ Star Ratings */}
          <div className="mb-2">
            <span className="text-warning">★★★★☆</span>
            <small className="text-muted ms-2">(200+ ratings)</small>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold">{phonenumber}</span>
            <a className="btn btn-sm btn-success" href='https://maps.app.goo.gl/N348dgNd5wSjUoU98' target='new' >visit</a>
          </div>
        </div>
      </div>
    </div>
  )
}
