const express = require("express");
const deliverySchema = require("../../Models/Deliveryperson");
const orderSchema = require("../../Models/OrderSchema")
const jwt=require("jsonwebtoken")
const bcrypt=require("bcryptjs")

const deliveryroute = express.Router();

const secrettoken="rajimahi"

const validatetoken= (req,res,next)=>{
    
    const token=req.headers["authorization"]
    const tokenonly=token && token.split(" ")[1];

    if(tokenonly){
        
        jwt.verify(tokenonly,secrettoken,(err,payload)=>{

            if(err){
                return res.status(400).json({message:"Invaild Token"})
            }

            req.deliveryperson=payload
        })
    }
    else{
        return res.status(400).json({message:"Token required"})
    }
    next()
}

deliveryroute.post("/signin", async (req, res) => {
  const deliveryperson = { ...req.body };

  try {
    await deliverySchema.create({ ...deliveryperson });
    res.status(200).json({ message: "Registration Success" });
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: "Registration Failed " + err.message });
  }
});

//login

deliveryroute.post("/login", async (req, res) => {
  let enteredemail = req.body.email;
  let enteredpassword = req.body.password;

  console.log(enteredemail);
    console.log(enteredpassword);

  try {
    let result = await deliverySchema.findOne({ email: enteredemail });

    if (result) {

        let comparingpassword = await result.comparepassword(enteredpassword)

      if (comparingpassword) {
         
         const token =jwt.sign({email:result.email,id:result._id,role:result.role},secrettoken,{expiresIn:"6h"})
         console.log(token)
         res.status(200).json({message:"Login Success",email:result.email,id:result._id,role:result.role,token:token})
      } 
      else {
         res.status(400).json({ message: "Invaild Password Credentials" });
      }

    } else {
      res.status(400).json({ message: "Invaild Email Credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error "+err.message });
  }
});

//display

deliveryroute.get("/view/:id",validatetoken,async(req,res)=>{
     const delpersonid=req.params.id;

     try{
         
        const result = await deliverySchema.findById(delpersonid)
        res.status(200).json(result)
     }
     catch(err){
        res.status(500).json({message:"Server Error : "+err.message})
     }
})

//update deatils

deliveryroute.put("/update/:id",validatetoken,async(req,res)=>{

    let delperson = { ...req.body}
    let delpersonid = req.params.id

    try{
         await deliverySchema.findByIdAndUpdate(delpersonid,{...delperson})
         res.status(200).json({message:"Update Success Please Login to Continue"})
        
    }
    catch(err){
        res.status(500).json({message:"Error Try Again Later : "+err.message})
    }
})

//orderhistory details

deliveryroute.get("/order/:id",validatetoken,async(req,res)=>{
    let deliverypersonid = req.params.id

    try{
        var result = await orderSchema.find({ deliverypersonid : deliverypersonid }).populate("userid")
                .populate({ path : "menuid" , populate : { path :"restaurantid"} }).populate("deliverypersonid").sort({createdAt:-1})

       res.status(200).json(result) 
    }
    catch(err){
      res.status(200).json({message:"Server Error "+err.message})
    }
})

module.exports = deliveryroute;
