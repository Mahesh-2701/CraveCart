const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    menuid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"menuitems",
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    quantity:{
         type:Number,
        required:true
    },
    status: {
      type: String,
      enum: ["Preparing", "Out for Delivery", "Delivered"],
      default: "Preparing",
    },
    paymentmethod:{
         type: String,
      enum: ["COD", "Online"],
      default: "COD",
    },
    address: {
      type: String,
      required: true,
    },
    deliverypersonid:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"deliveryperson"
    }
} ,{ timestamps: true })

const orderModel = mongoose.model("orders",orderSchema)

module.exports = orderModel