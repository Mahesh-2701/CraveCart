const mongoose=require("mongoose")

const dbconnect = async()=>{

    try{
        mongoose.connect("mongodb://localhost:27017/project");
        console.log("Database Connected")
    }
    catch(err){
        console.log(err.message)
    }
}

module.exports = dbconnect