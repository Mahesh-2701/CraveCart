const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const userSchema = new mongoose.Schema( {
    name : String,
    email: { type: String, required:true ,unique : true ,trim : true },
    password : { type: String ,required:true},
    phonenumber : {type:Number, min : 1000000000,max:9999999999},
    address : String,
    city : String,
    pincode : { type : Number },
    role:{type:String,default:"user"}
})

userSchema.pre("save",async function(next){

    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.pre("findOneAndUpdate", async function (next) {
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

userSchema.methods.comparepassword= async function(enteredpassword){

     return await bcrypt.compare(enteredpassword,this.password);

}


const useModel=mongoose.model("user",userSchema)

module.exports = useModel