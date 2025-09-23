import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [orders, setOrder] = useState([]);
  const [menus, setMenu] = useState([]);
  const [users, setUser] = useState([]);
  const [restaurants, setRestaurant] = useState([]);
  const [deliveryPersons, setDeliveryPerson] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/admin/dashboard", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => {
        setOrder(res.data.orders || []);
        setUser(res.data.user || []);
        setMenu(res.data.menu || []);
        setRestaurant(res.data.restaurant || []);
        setDeliveryPerson(res.data.deliveryman || []);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Error fetching data");
        setLoading(false);
      });
  }, []);

  const renderTable = (columns, data) => (
    <div className="table-responsive mt-3 animate-table">
      <table className="table table-striped table-hover align-middle shadow-sm bg-transparent rounded">
        <thead className="table-secondary">
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data || []).map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => {
                const key = col.toLowerCase();
                let value = "-";

                // Orders table
                if (row._id) {
                  switch (key) {
                    case "id":
                      value = row._id;
                      break;
                    case "user":
                      value = row.userid?.name || "-";
                      break;
                    case "menu":
                      value = row.menuid?.name || "-";
                      break;
                    case "deliveryperson":
                      value = row.deliverypersonid?.name || "-";
                      break;
                    case "price":
                      value = row.price || "-";
                      break;
                    case "quantity":
                      value = row.quantity || "-";
                      break;
                    case "status":
                      value = row.status || "-";
                      break;
                    case "paymentmethod":
                      value = row.paymentmethod || "-";
                      break;
                    case "address":
                      value = row.address || "-";
                      break;
                    case "createdat":
                      value = row.createdAt ? new Date(row.createdAt).toLocaleString() : "-";
                      break;
                    case "updatedat":
                      value = row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-";
                      break;
                    default:
                      value = row[key] || "-";
                  }
                } else {
                  // Other schemas
                  value = row[key] || row._id || "-";
                }

                return <td key={col}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <h2 className="text-center text-white mt-5">Loading Dashboard...</h2>;

  return (
    <div className="dashboard-container">
      <div className="container py-5">
        <h1
          className="text-center display-5 mb-5 fw-bold text-white"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
           Admin Dashboard
        </h1>

        {/* Orders */}
        <details className="mb-4 dashboard-section">
          <summary>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cart-check-fill me-2" viewBox="0 0 16 16">
              <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0m7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-1.646-7.646-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708"/>
            </svg>
            Orders
             </summary>
          {renderTable(
            [
              "ID",
              "User",
              "Menu",
              "Price",
              "Quantity",
              "Status",
              "PaymentMethod",
              "Address",
              "DeliveryPerson",
              "CreatedAt",
              "UpdatedAt",
            ],
            orders
          )}
        </details>

        {/* Menus */}
        <details className="mb-4 dashboard-section">
          <summary>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fork-knife me-2" viewBox="0 0 16 16">
              <path d="M13 .5c0-.276-.226-.506-.498-.465-1.703.257-2.94 2.012-3 8.462a.5.5 0 0 0 .498.5c.56.01 1 .13 1 1.003v5.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5zM4.25 0a.25.25 0 0 1 .25.25v5.122a.128.128 0 0 0 .256.006l.233-5.14A.25.25 0 0 1 5.24 0h.522a.25.25 0 0 1 .25.238l.233 5.14a.128.128 0 0 0 .256-.006V.25A.25.25 0 0 1 6.75 0h.29a.5.5 0 0 1 .498.458l.423 5.07a1.69 1.69 0 0 1-1.059 1.711l-.053.022a.92.92 0 0 0-.58.884L6.47 15a.971.971 0 1 1-1.942 0l.202-6.855a.92.92 0 0 0-.58-.884l-.053-.022a1.69 1.69 0 0 1-1.059-1.712L3.462.458A.5.5 0 0 1 3.96 0z"/>
            </svg>
             Menus</summary>
          {renderTable(
            ["ID", "Name", "Description", "Price", "Restaurant"],
            (menus || []).map((m) => ({
              _id: m._id,
              name: m.name,
              description: m.description,
              price: m.price,
              restaurant: m.restaurantid?.name || "-",
            }))
          )}
        </details>

        {/* Restaurants */}
        <details className="mb-4 dashboard-section">
          <summary>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house-fill me-2" viewBox="0 0 16 16">
            <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z"/>
            <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293z"/>
          </svg>
             Restaurants</summary>
          {renderTable(
            ["ID", "Name", "Email", "Phonenumber", "Address", "City", "Pincode", "IsActive"],
            (restaurants || []).map((r) => ({
      _id: r._id,
      name: r.name,
      email: r.email,
      phonenumber: r.phonenumber,
      address: r.address,
      city: r.city,
      pincode: r.pincode,
      isactive: r.isactive ? "Open" : "Closed", // <-- updated here
    }))
          )}
        </details>

        {/* Users */}
        <details className="mb-4 dashboard-section">
          <summary><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people-fill me-2" viewBox="0 0 16 16">
            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
          </svg> Users</summary>
          {renderTable(
            ["ID", "Name", "Email", "PhoneNumber", "Address", "City", "Pincode"],
            users
          )}
        </details>

        {/* Delivery Persons */}
        <details className="mb-4 dashboard-section">
          <summary><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-truck me-2" viewBox="0 0 16 16">
          <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
        </svg> Delivery Persons</summary>
          {renderTable(
            ["ID", "Name", "Email", "PhoneNumber", "Address"],
            deliveryPersons
          )}
        </details>
      </div>

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(-45deg, #1a2a6c, #b21f1f, #fdbb2d, #00c6ff);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }
        @keyframes gradientBG {
          0% {background-position:0% 50%;}
          50% {background-position:100% 50%;}
          100% {background-position:0% 50%;}
        }
        summary {
          cursor: pointer;
          padding: 0.8rem 1rem;
          background: rgba(255,255,255,0.1);
          color: white;
          border-radius: 8px;
          font-size: 1.2rem;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          transition: background 0.3s, transform 0.2s;
        }
        summary:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.02);
        }
        details[open] summary {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        .dashboard-section {
          padding: 0.5rem;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .dashboard-section[open] {
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transform: translateY(3px);
        }
        .animate-table {
          animation: fadeInUp 0.5s ease forwards;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(15px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        .table-hover tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
          transition: background 0.3s;
        }
        table {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
