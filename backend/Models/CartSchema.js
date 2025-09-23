const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
       
    userid:{
        type: mongoose.Schema.Types.ObjectId,
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
        default:1
    }
})

const cartModel = mongoose.model("cart",cartSchema)

module.exports = cartModel