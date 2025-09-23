const mongoose = require("mongoose")

const adminSchema = new mongoose.Schema({
    name:String,
    email:{type:String,required:true,unique:true},
    password:String,
    role:{type:String,default:"admin"}
})

const adminModel = mongoose.model("admin",adminSchema)

module.exports = adminModel