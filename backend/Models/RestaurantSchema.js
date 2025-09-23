const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const restSchema=new mongoose.Schema({
    name:{type:String,required:true,unique:true},
    image:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    phonenumber:{type:Number, min : 1000000000,max:9999999999},
    address:String,
    city:String,
    pincode:Number,
    isactive:{type:Boolean,default:false},
    role:{type:String,default:"restaurant"}

})

restSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()

    this.password=await bcrypt.hash(this.password,10)
})

restSchema.methods.comparepassword=async function(enteredpassword){
       return await bcrypt.compare(enteredpassword,this.password)
}

const restModel=mongoose.model("restaurant",restSchema)

module.exports=restModel