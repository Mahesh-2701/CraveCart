const express = require("express")
const adminSchema = require("../../Models/Admin")
const userSchema = require("../../Models/UserSchema")
const restSchema = require("../../Models/RestaurantSchema")
const deliverySchema = require("../../Models/Deliveryperson")
const menuSchema = require("../../Models/Menuitems")
const orderSchema = require("../../Models/OrderSchema")
const jwt = require("jsonwebtoken")

const adminRoute = express.Router()

const secrettoken = "mahesh"

const validatetoken=(req,res,next)=>{
    
    const token=req.headers["authorization"];
    const tokenonly= token && token.split(" ")[1];


    if(tokenonly){
       
        jwt.verify(tokenonly,secrettoken,(err,payload)=>{
            if(err){
                console.log("Invalid or Expired Token")
               return res.status(400).json({ message:"Invalid or Expired Token ! Please Login To Continue"})
               
            }

            req.user=payload;

            next();
        })
        
    }else{
        console.log("Required Token")
        return res.status(400).json({ message: "Token Required"})
    }
}


adminRoute.post("/login",async (req,res)=>{

    let enteredemail =req.body.email;
    let enteredpassword = req.body.password;

    console.log(enteredemail);
    console.log(enteredpassword);

    try{
 
        let result=await adminSchema.findOne({email:enteredemail})

        if(result){


            if( result.password == enteredpassword){
                
                const token = jwt.sign({email:result.email,id:result._id,role:result.role},secrettoken,{expiresIn:"6h"});
                console.log(token,result.email);
                res.status(200).json({message:"Login Success",token:token,email:result.email,id:result._id,role:result.role})

            }
            else{
                res.status(400).json({message:"Invalid Password"})
            }

        }else{
            res.status(400).json({message:"Invalid Email Credentials"})
        }

    }
    catch(err){
  
        res.status(400).json({message:"Server Error : "+err.message})

    }

    
})

adminRoute.get("/dashboard",validatetoken,async(req,res)=>{
    
    try{
        
        let users = await userSchema.find()

        let restaurant = await restSchema.find()

        let deliveryman = await deliverySchema.find()

        let menu = await menuSchema.find().populate("restaurantid")

        let orders = await orderSchema.find().populate("userid").populate({ path:"menuid" ,populate: "restaurantid"}).populate("deliverypersonid").sort({createdAt:-1})

        res.status(200).json({user:users , restaurant : restaurant, deliveryman : deliveryman, menu : menu,orders:orders})
    }
    catch(err){
        res.status(500).json({message:"Server Error : "+err.message})
    }
})

module.exports = adminRoute