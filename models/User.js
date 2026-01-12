const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

export default mongoose.model("User", userSchema);
