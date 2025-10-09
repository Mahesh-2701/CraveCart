const mongoose=require("mongoose")

const dbconnect = async()=>{

    try{
        mongoose.connect("mongodb+srv://maheshmdu27_db_user:Mahi@2701@cluster0.ajejyjz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log("Database Connected")
    }
    catch(err){
        console.log(err.message)
    }
}

module.exports = dbconnect
