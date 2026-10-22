const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deliverySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phonenumber: { type: Number },
    address: { type: String, default: "" },
    role: { type: String, default: "deliveryperson" },
    isAvailable: { type: Boolean, default: true },
    vehicleType: { type: String, default: "Bike" },
    rating: { type: Number, default: 4.8, min: 1, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    currentLocation: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

deliverySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

deliverySchema.methods.comparepassword = async function (enteredpassword) {
  if (this.password && this.password.startsWith("$2")) {
    return await bcrypt.compare(enteredpassword, this.password);
  }
  return this.password === enteredpassword;
};

const deliveryModel = mongoose.model("deliveryperson", deliverySchema);

module.exports = deliveryModel;