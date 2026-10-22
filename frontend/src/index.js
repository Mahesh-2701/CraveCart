import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Pages/LoginPage';
import SigninPage from './Pages/SigninPage';
import Restaraunts from './Pages/Restaraunts';
import Foods from './Pages/Foods';
import RestaurantsView from './Pages/RestaurantsView';
import RestaurantAdmin from './Pages/RestaurantAdmin';
import DeliveryPerson from './Pages/DeliveryPerson';
import DeliveryPersonView from './Pages/DeliveryPersonView';
import UserProfile from './Pages/UserProfile';
import Cart from './Pages/Cart';
import Protectedroute from './Pages/Protectedroute';
import ProtectedrouteDelivery from './Pages/ProtectedrouteDelivery';
import ProtectedrouteRestaurant from './Pages/ProtectedrouteRestaurant';
import Orders from './Pages/Orders';
import LiveTracking from './Pages/LiveTracking';
import RestaurantOrder from './Pages/RestaurantOrder';
import Logout from './Pages/Logout';
import RestaurantLogout from './Pages/RestaurantLogout';
import DeliveryLogout from './Pages/DeliveryLogout';
import DeliveryOrders from './Pages/DeliveryOrders';
import AdminLogin from './Pages/AdminLogin';
import AdminDashboard from './Pages/AdminDashboard';
import ProtectedRouteAdmin from './Pages/ProductedRouteAdmin';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      {/* Public Customer Routes */}
      <Route exact path="/" element={<App />} />
      <Route exact path="/user/login" element={<LoginPage />} />
      <Route exact path="/user/signup" element={<SigninPage />} />
      <Route exact path="/restaurants" element={<Restaraunts />} />
      <Route exact path="/foods" element={<Foods />} />
      <Route exact path="/logout" element={<Logout />} />

      {/* Protected Customer Routes */}
      <Route element={<Protectedroute />}>
        <Route exact path="/user/update" element={<UserProfile />} />
        <Route exact path="/user/cart" element={<Cart />} />
        <Route exact path="/user/orders" element={<Orders />} />
        <Route exact path="/orders/track/:orderId" element={<LiveTracking />} />
      </Route>

      {/* Restaurant Partner Routes */}
      <Route exact path="/restaurant/view" element={<RestaurantsView />} />
      <Route exact path="/restaurant/logout" element={<RestaurantLogout />} />
      <Route element={<ProtectedrouteRestaurant />}>
        <Route exact path="/restaurant/admin" element={<RestaurantAdmin />} />
        <Route exact path="/restaurant/admin/order" element={<RestaurantOrder />} />
      </Route>

      {/* Delivery Partner Routes */}
      <Route exact path="/delivery" element={<DeliveryPerson />} />
      <Route exact path="/delivery/logout" element={<DeliveryLogout />} />
      <Route element={<ProtectedrouteDelivery />}>
        <Route exact path="/delivery/view" element={<DeliveryPersonView />} />
        <Route exact path="/delivery/order" element={<DeliveryOrders />} />
      </Route>

      {/* Administration Routes */}
      <Route exact path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRouteAdmin />}>
        <Route exact path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>
    </Routes>
  </Router>
);

reportWebVitals();
