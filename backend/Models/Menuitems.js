const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, default: "Main Course", trim: true },
  cuisine: { type: String, default: "Multi-Cuisine", trim: true },
  isVeg: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 4.2, min: 1, max: 5 },
  ratingCount: { type: Number, default: 12 },
  preparationTimeMinutes: { type: Number, default: 25 },
  ingredients: [{ type: String }],
  restaurantid: {
    type: mongoose.Schema.ObjectId,
    ref: "restaurant",
    required: true,
  },
}, { timestamps: true });

menuSchema.index({ name: "text", description: "text", category: "text", cuisine: "text" });

const menuModel = mongoose.model("menuitems", menuSchema);

module.exports = menuModel;