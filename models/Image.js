const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  imageId: { type: String, required: true },
  albumId: { type: String, required: true },
  name: String,
  imageUrl: { type: String, required: true },
  tags: { type: [String], default: [] },
  person: { type: String, default: "" }, // <-- changed from people
  isFavorite: { type: Boolean, default: false },
  comments: { type: [String], default: [] },
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", imageSchema);
