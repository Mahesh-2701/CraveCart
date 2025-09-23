const mongoose=require("mongoose")

const dbconnect = async()=>{

    try{
        mongoose.connect("mongodb+srv://maheshmdu27_db_user:mZcaHOA2luapXQYT@cluster0.ajejyjz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log("Database Connected")
    }
    catch(err){
        console.log(err.message)
    }
}

module.exports = dbconnect