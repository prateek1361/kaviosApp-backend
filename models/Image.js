import mongoose from "mongoose";

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

export default mongoose.model("Image", imageSchema);
