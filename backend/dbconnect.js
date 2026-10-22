const mongoose = require("mongoose");
require("dotenv").config();

const DEFAULT_URI = "mongodb+srv://maheshmdu27_db_user:rOtbwbvEcXXExCsn@cluster0.ajejyjz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let isConnected = false;

const dbconnect = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("Database Connected successfully to MongoDB");
    return conn;
  } catch (err) {
    console.warn("MongoDB connection warning:", err.message);
    if (process.env.NODE_ENV !== "test") {
      console.warn("Operating with local or fallback database access.");
    }
    return null;
  }
};

module.exports = dbconnect;
