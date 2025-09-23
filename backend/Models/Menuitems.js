const mongoose=require("mongoose")

const menuSchema = new mongoose.Schema({
    name:{type:String,required:true},
    image:{type:String,required:true},
    description:String,
    price:{type:Number,required:true},
    restaurantid:{
        type:mongoose.Schema.ObjectId,
        ref:"restaurant",
        required:true
    }
})

const menuModel = mongoose.model("menuitems",menuSchema);

module.exports= menuModel