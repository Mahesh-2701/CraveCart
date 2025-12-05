const express = require("express")
const multer=require("multer")
const jwt=require("jsonwebtoken")
const path=require("path")
const restSchema=require("../../Models/RestaurantSchema")
const menuSchema=require("../../Models/Menuitems")
const orderSchema = require("../../Models/OrderSchema")

const restRoute=express.Router();

const secrettoken="mahiraji"

restRoute.use(express.json())
restRoute.use(express.urlencoded())



// jwt portion

const validatetoken=(req,res,next)=>{
    const token =req.headers["authorization"];
    const tokenonly=token && token.split(" ")[1];

    if(tokenonly){

        jwt.verify(tokenonly,secrettoken,(err,payload)=>{
            if(err) return res.status(400).json({message:"Token invalid"})

                req.restaurant=payload
        })
        
        
    }
    else{
        return  res.status(400).json({message:"Token Required"})
    }

    next()
}

// multer portion

const storage=multer.diskStorage({
    destination:path.join(__dirname, "../../uploads/restaurants"),
    filename : function(req,file,cb){
        let filesname = Date.now()+"_"+file.originalname;
        cb(null,filesname)
    }

})

let filefilter = (req,file,cb)=>{
    let allowedtypes=/jpeg|jpg|png/
    let extension = allowedtypes.test(path.extname(file.originalname).toLowerCase())
    let mimetype = allowedtypes.test(file.mimetype)

    if( extension && mimetype){
        cb(null,true)
    }
    else{
        cb(new Error("Only images are allowed"))
    }
}

const upload = multer({
    storage:storage,
    limit:{
        fileSize: 15 * 1024 *1024
    },
    fileFilter:filefilter
})


restRoute.post("/signin",upload.single("image"),async (req,res)=>{
    
    let restaurant = { ...req.body}
    let imagename = "/uploads/restaurants/"+req.file.filename

    try{

        await restSchema.create({...restaurant,image:imagename})
        res.status(200).json({message:"Signin Success! Please Login to Continue"})

    }catch(err){
       res.status(400).json({message:"Signin Failed : "+err.message})
    }
    
})

restRoute.post("/login",async(req,res)=>{
      
    let enteredemail=req.body.email;
    let enteredpassword=req.body.password;

    try{
      
        let result = await restSchema.findOne({email:enteredemail},{password:true,email:true,role:true})

        if(result){

            let comparingpassword=await result.comparepassword(enteredpassword);
             
            if(comparingpassword){
                
                const token = jwt.sign({email:result.email,role:result.role,id:result._id},secrettoken,{expiresIn:"6h"});
                console.log(token,result.email);
                res.status(200).json({ message:"Login Success",token:token,role:result.role,id:result.id })
            }
            else{
                res.status(400).json({message:"Invalid Password"})
            }

        }
        else{
            res.status(400).json({message:"Invalid Email Credentials"})
        }
    }
    catch(err){
        console.log(err)
        res.status(400).json({message:"Server Error : "+err.message})
    }

    
})

restRoute.get("/details/:id",validatetoken,async(req,res)=>{
    const id=req.params.id;

    try{
       let result=await restSchema.findById(id)
       
       res.status(200).json(result)
    }
    catch(err){
       console.log(err)
        res.status(400).json({message:"Server Error : "+err.message})
    }

})

// for adding menu items

restRoute.post("/menuupload",validatetoken,upload.single("image"),async(req,res)=>{
        
    let menu = {...req.body}
    let menuimage = "/uploads/restaurants/"+req.file.filename


    try{
       await menuSchema.create({...menu,image:menuimage})

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
        req.io.emit("foodsData", result);
         res.status(200).json({message:"Menu Item Added Successfully"})
        
    }
    catch(err){
       res.status(400).json({message:"Server Error : "+err.message})
    }

})

//for displaying menu items

restRoute.get("/menudisplay/:id",validatetoken,async(req,res)=>{

    let restaurantid=req.params.id
    
    try{
       var result = await menuSchema.find({restaurantid:restaurantid})
       res.status(200).json(result)

    }catch(err){ 
        console.log(err)
        res.status(400).json({message:"Server Error "+err.message})
    }
})

//for deleting menu items

restRoute.delete("/deletemenu/:id",validatetoken,async(req,res)=>{

    let deleteid=req.params.id
    
    try{
       await menuSchema.deleteOne({_id:deleteid})

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
        req.io.emit("foodsData", result);

       res.status(200).json({message:"Deleted Succesfully"})

    }catch(err){ 
        console.log(err)
        res.status(400).json({message:"Server Error "+err.message})
    }
})

//displaying order items

restRoute.get("/order/:id",validatetoken,async(req,res)=>{
    let restaurantid=req.params.id

    try{
     const orders = await orderSchema.find().populate({  path: "menuid", populate: { path: "restaurantid" }}).populate("userid")
                        .populate("deliverypersonid").sort({ createdAt: -1 });

        const restaurantOrders = orders.filter(order =>
  order?.menuid?.restaurantid?._id?.toString() === restaurantid.toString()
);

      res.status(200).json(restaurantOrders)
    }
    catch(err){
      res.status(200).json({message:"Server Error "+err.message})
    }
})

//order status changing

restRoute.patch("/order/statuschange/:id",validatetoken,async(req,res)=>{
    let orderid = req.params.id
    console.log(req.body.status)
    try{
        await orderSchema.findByIdAndUpdate(orderid,{ $set : { status : req.body.status }})

        let orderdetail = await orderSchema.findById(orderid)

        let result = await orderSchema.find({userid:orderdetail.userid}).populate("userid menuid deliverypersonid").sort({createdAt:-1})
        req.io.emit("updatedOrder",result)

        let resultdelivery = await orderSchema.find({ deliverypersonid : orderdetail.deliverypersonid }).populate("userid")
                                .populate({ path : "menuid" , populate : { path :"restaurantid"} }).populate("deliverypersonid").sort({createdAt:-1})
                                          
        
        req.io.emit("updatingDelivery",resultdelivery)

        res.status(200).json({message:"Status Updated"})
    }
    catch(err){
         res.status(500).json({message:"Server Error "+err.message})
    }
})

//availability status changing

restRoute.patch("/availability/:id",validatetoken,async(req,res)=>{
    let restaurantid = req.params.id;
 
    try{
         await restSchema.findByIdAndUpdate(restaurantid,{ $set : req.body})

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
        req.io.emit("foodsData", result);


        res.status(200).json({message:"Availability Status Updated !"})
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
})


restRoute.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large! Max 15MB allowed." });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Custom errors (like fileFilter)
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = restRoute;
