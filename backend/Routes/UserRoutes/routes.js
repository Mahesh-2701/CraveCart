const express=require("express")
require("dotenv").config();
const jwt=require("jsonwebtoken")
const userSchema = require("../../Models/UserSchema")
const menuSchema = require("../../Models/Menuitems")
const restSchema = require("../../Models/RestaurantSchema")
const cartSchema = require("../../Models/CartSchema")
const deliverySchema = require("../../Models/Deliveryperson")
const orderSchema = require("../../Models/OrderSchema")
const bcrypt=require("bcryptjs")

const userrouter=express.Router();

userrouter.use(express.json())

const secrettoken="asdfghjkl";


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
        return res.status(400).json({ message: "Please Login to Continue , Token Required"})
    }
}




userrouter.post("/signin",async(req,res)=>{

    let user={ ...req.body}

    try{
        await userSchema.create({...user})
        res.status(200).json({message:"Signin Success"})
    }
    catch(err){
        console.log(err.message)
        res.status(500).json({message:"Email Already Exists"})
    }
    
    
})

userrouter.post("/login",async (req,res)=>{

    let enteredemail =req.body.email;
    let enteredpassword = req.body.password;

    console.log(enteredemail);
    console.log(enteredpassword);

    try{
 
        let result=await userSchema.findOne({email:enteredemail})

        if(result){

            let comparingpassword=await result.comparepassword(enteredpassword);

            if( comparingpassword){
                
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


userrouter.get("/home",(req,res)=>{
    res.status(200).json({ message : "validation sucess"})
})

//showing foods to user

userrouter.get("/foods",async(req,res)=>{

    try{
        let result=await menuSchema.find().populate("restaurantid")
        result.sort((a, b) => {
            if (a.restaurantid.isactive && !b.restaurantid.isactive) {
                return -1; 
            }
            if (!a.restaurantid.isactive && b.restaurantid.isactive) {
                return 1; 
            }
            return 0; 
        });
        res.status(200).json(result)
    }
    catch(err){
        res.status(200).json({message:"Server Error"})
    }
})

//showing restaurants to user

userrouter.get("/restaurant",async(req,res)=>{

    try{
        let result=await restSchema.find();
        res.status(200).json(result)
    }
    catch(err){
        res.status(200).json({message:"Server Error"})
    }
})

//display

userrouter.get("/view/:id",validatetoken,async(req,res)=>{
     const userid=req.params.id;

     try{
         
        const result = await userSchema.findById(userid)

        res.status(200).json(result)
     }
     catch(err){
        res.status(500).json({message:"Server Error : "+err.message})
     }
})

//update deatils

userrouter.put("/update/:id",validatetoken,async(req,res)=>{

    let user = { ...req.body}
    let userid = req.params.id

    try{
         await userSchema.findByIdAndUpdate(userid,{...user})
         res.status(200).json({message:"Update Success Please Login to Continue"})
        
    }
    catch(err){
        res.status(500).json({message:"Error Try Again Later : "+err.message})
    }
})

//add to cart 

userrouter.post("/addtocart",validatetoken,async(req,res)=>{

    let cartdetails = { 
        userid:req.body.userid,
        menuid:req.body.menuid,
        price:req.body.price
    }

    try{
       await cartSchema.create({...cartdetails})
       res.status(200).json({message:"Item Added to Cart"})
    }
    catch(err){
        res.status(500).json({message:"Network Error "+err.message})
    }

})

//cart display

userrouter.get("/cartdisplay/:id",validatetoken,async(req,res)=>{
      
    let userid = req.params.id;

    try{
         
        let result = await cartSchema.find({userid:userid}).populate("userid").populate({ path :"menuid" , populate : { path :"restaurantid", select : "name address"}})
        res.status(200).json(result)
    }
    catch(err){
        res.status(500).json({message:"Server Error : "+err.message})
    }
})

//cart delete

userrouter.delete("/cartdelete/:id",validatetoken,async(req,res)=>{
    let deleteid = req.params.id

    try{
       await cartSchema.deleteOne({_id:deleteid})
       res.status(200).json({message:"Item Deleted"})
    }
    catch(err){
       res.status(500).json({message:"Server Error : "+err.message})
    }
})

//user order

    let counter = 1;
   

userrouter.post("/order/:id",validatetoken,async(req,res)=>{

 // doing it for selecting delivery person in order upto 10
    
    let deliverypersonid=null;


    function increaseCounter() {

    counter = counter+1;
    if(counter === 11){
        counter = 1
    } 
    return counter;

    }

    try{
       deliveryperson = (await deliverySchema.findOne({id:counter},{_id:true}));
        deliverypersonid = deliveryperson._id
         counter=increaseCounter()
    }
    catch(err){
        console.log(err.message)
        return res.status(500).json({message:"Delivery Person not Available Try Again Later "}+err.message)
        
    }


    let orderdetails = {...req.body,deliverypersonid:deliverypersonid}


    try{
        let result = await orderSchema.create({...orderdetails})

//informing the restaurant the new order is coming using the socket, here finding restauarantid and sending new order for that restaruant only

        let findrestuarant = await result.populate({ path : "menuid" , populate : { path : "restaurantid"}})

          const orders = await orderSchema.find().populate({  path: "menuid", populate: { path: "restaurantid" }}).populate("userid")
                                 .populate("deliverypersonid").sort({ createdAt: -1 });
         
             const restaurantOrders = orders.filter(
                     order => order.menuid.restaurantid._id.toString() === findrestuarant.menuid.restaurantid._id.toString()
             );

        req.io.emit("updatingRestOrder",restaurantOrders) 

//informing the deliveryman the new order is coming using the socket, here finding deliverymanid and sending new order for that person only
        
        
        let resultdelivery = await orderSchema.find({ deliverypersonid : findrestuarant.deliverypersonid }).populate("userid")
                        .populate({ path : "menuid" , populate : { path :"restaurantid"} }).populate("deliverypersonid").sort({createdAt:-1})
                                  

        req.io.emit("updatingDelivery",resultdelivery)
        
         res.status(200).json({message:"Thank you for the Order ! Your Order will recieve Soon "})
    }
    catch(err){
        console.log(err.message)
         return res.status(500).json({message:"Server Error Try Again Later "}+err.message)
    }
    
    
})

//cart delete after ordering
userrouter.delete("/cartrefresh/:id",validatetoken,async(req,res)=>{
    let userid = req.params.id

    try{
       await cartSchema.deleteMany({userid:userid})
       res.status(200).json({message:"Cart Items Refreshed Continue Shopping"})
    }
    catch(err){
       res.status(500).json({message:"Server Error : "+err.message})
    }
})

//display order history

userrouter.get("/orders/:id",validatetoken,async(req,res)=>{
    let userid=req.params.id;

    try{
        let result = await orderSchema.find({userid:userid}).populate("userid menuid deliverypersonid").sort({createdAt:-1})
        res.status(200).json(result)
    }
    catch(err){
        res.status(400).json({message:"Server Error "+err.message})
    }
})

module.exports = userrouter