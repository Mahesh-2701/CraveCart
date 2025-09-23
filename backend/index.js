const express=require('express');
const path=require("path")
const cors=require("cors")
const userrouter=require("./Routes/UserRoutes/routes")
const restRoute=require("./Routes/RestaurantRoutes/restaurantroutes")
const deliveryroute=require("./Routes/DeliverypersonRoutes/deliverroutes")
const adminRoute = require("./Routes/AdminRoutes/adminroutes")
require("dotenv").config();
const jwt=require("jsonwebtoken")
const dbconnect=require("./dbconnect")
const { Server } = require("socket.io")
const http= require("http")

const app=express();

const server = http.createServer(app)

const io = new Server( server , { cors: { origin: "*"}})

app.use("/uploads", express.static(path.join(__dirname,"./", "uploads")));
console.log(path.join(__dirname,"./", "uploads"))

dbconnect()

const PORT=process.env.PORT;
const secrettoken=process.env.SECRET_TOKEN;


app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    req.io = io ;
    next()
})


app.use("/user",userrouter);
app.use("/restaurant",restRoute)
app.use("/delivery",deliveryroute)
app.use("/admin",adminRoute)


server.listen(5000,()=> console.log("Server Running at PORT "+PORT))
