const mongoose = require("mongoose")

const imageSchema = new mongoose.Schema({
  imageId: String,
  albumId: String,
  name: String,
  tags: [String],
  person: String,
  isFavorite: Boolean,
  comments: [String],
  size: Number,
  uploadedAt: Date,
  path: String
});

module.exports = mongoose.model("Image", imageSchema);
