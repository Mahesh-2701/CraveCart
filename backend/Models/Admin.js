const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name: { type: String, default: "Administrator" },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
}, { timestamps: true });

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

adminSchema.methods.comparepassword = async function (enteredPassword) {
  // If password in DB is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (this.password && this.password.startsWith("$2")) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  // Backward compatibility fallback for legacy plaintext passwords
  const isMatch = this.password === enteredPassword;
  if (isMatch) {
    // Automatically migrate legacy plaintext password to secure bcrypt hash
    try {
      this.password = await bcrypt.hash(enteredPassword, 10);
      await this.save();
    } catch (e) {
      console.warn("Failed to auto-migrate legacy admin password:", e.message);
    }
  }
  return isMatch;
};

const adminModel = mongoose.model("admin", adminSchema);

module.exports = adminModel;