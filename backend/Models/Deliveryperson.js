const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const deliverySchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{ type:String,required:true,unique:true},
    password:{type:String,required:true},
    phonenumber:{type:Number},
    address:String,
    role:{type:String,default:"deliveryperson"}
})

deliverySchema.pre("save",async function(next){

    if(!this.isModified("password")) return next()

    this.password=await bcrypt.hash(this.password,10)
    next()
})

deliverySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update.password) {
    // get the current user document
    const docToUpdate = await this.model.findOne(this.getQuery());

    // check if the new password is already hashed
    const isHashed = docToUpdate.password === update.password;

    if (!isHashed) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
    }

    this.setUpdate(update);
  }

  next();
});




deliverySchema.methods.comparepassword =async function(enteredpassword){
    return await bcrypt.compare(enteredpassword,this.password)
}

const deliveryModel=mongoose.model("deliveryperson",deliverySchema)

module.exports = deliveryModel