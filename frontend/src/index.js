import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter as Router,Routes,Route} from 'react-router-dom'
import LoginPage from './Pages/LoginPage';
import SigninPage from './Pages/SigninPage';
import Restaraunts from './Pages/Restaraunts';
import Foods from './Pages/Foods';
import RestaurantsView from "./Pages/RestaurantsView"
import RestaurantAdmin from "./Pages/RestaurantAdmin"
import DeliveryPerson from './Pages/DeliveryPerson';
import DeliveryPersonView from './Pages/DeliveryPersonView';
import UserProfile from './Pages/UserProfile';
import Cart from "./Pages/Cart"
import Protectedroute from './Pages/Protectedroute';
import ProtectedrouteDelivery from "./Pages/ProtectedrouteDelivery"
import ProtectedrouteRestaurant from "./Pages/ProtectedrouteRestaurant"
import Orders from './Pages/Orders';
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
  <>

  <Router>
    <Routes>

      {/* user routes */}
      <Route exact path='/' element={<App/>}/>
      <Route exact path="/user/login" element={<LoginPage/>}></Route>
      <Route exact path="/user/signup" element={<SigninPage/>}></Route>
      <Route exact path="/restaurants" element={<Restaraunts />}></Route>
      <Route exact path="/foods" element={<Foods/>}></Route>
      <Route exact path='/logout'element={<Logout></Logout>}></Route>

      <Route element={<Protectedroute/>}>
        <Route exact path="/user/update" element={<UserProfile></UserProfile>}></Route>
        <Route exact path="/user/cart" element={<Cart></Cart>}></Route>
        <Route exact path="/user/orders" element={<Orders></Orders>}></Route>
      </Route>


      {/* restaurant routes */}
      <Route exact path="/restaurant/view" element={<RestaurantsView />}></Route>
      <Route exact path='/restaurant/logout' element={<RestaurantLogout/>}></Route>
      <Route element={<ProtectedrouteRestaurant/>}>
       <Route exact path="/restaurant/admin" element={<RestaurantAdmin/>}></Route>
       <Route exact path="/restaurant/admin/order" element={<RestaurantOrder></RestaurantOrder>}></Route>
      </Route>
      

       {/* deliveryperson routes */}
      <Route exact path="/delivery" element={<DeliveryPerson></DeliveryPerson>}></Route>
      <Route exact path='/delivery/logout' element={<DeliveryLogout/>}></Route>
      <Route element={<ProtectedrouteDelivery/>}>
        <Route exact path="/delivery/view" element={<DeliveryPersonView></DeliveryPersonView>}></Route>
         <Route exact path="/delivery/order" element={<DeliveryOrders/>}></Route>
      </Route>

        {/* admin routes */}
      <Route exact path="/admin/login" element={<AdminLogin></AdminLogin>}></Route>
      <Route element={<ProtectedRouteAdmin></ProtectedRouteAdmin>}>
         <Route exact path="/admin/dashboard" element={<AdminDashboard></AdminDashboard>}></Route>
      </Route>
        
    </Routes>
  </Router>

  </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
