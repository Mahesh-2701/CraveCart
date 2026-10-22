const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const restSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    image: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phonenumber: { type: Number, min: 1000000000, max: 9999999999 },
    address: { type: String, default: "" },
    city: { type: String, default: "Bangalore" },
    pincode: { type: Number, default: 560001 },
    isactive: { type: Boolean, default: false },
    role: { type: String, default: "restaurant" },
    cuisine: { type: String, default: "North Indian, Biryani, Fast Food" },
    rating: { type: Number, default: 4.3, min: 1, max: 5 },
    ratingCount: { type: Number, default: 120 },
    deliveryTimeMinutes: { type: Number, default: 30 },
    costForTwo: { type: Number, default: 350 },
    openingHours: { type: String, default: "10:00 AM - 11:00 PM" },
    featured: { type: Boolean, default: false },
    coordinates: {
      lat: { type: Number, default: 12.9650 },
      lng: { type: Number, default: 77.5880 },
    },
  },
  { timestamps: true }
);

restSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

restSchema.methods.comparepassword = async function (enteredpassword) {
  if (this.password && this.password.startsWith("$2")) {
    return await bcrypt.compare(enteredpassword, this.password);
  }
  return this.password === enteredpassword;
};

const restModel = mongoose.model("restaurant", restSchema);

module.exports = restModel;