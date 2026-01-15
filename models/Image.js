const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  imageId: {
    type: String,
    required: true,
  },

  albumId: {
    type: String,
    required: true,
  },

  name: String,

  imageUrl: {
    type: String,
    required: true,
  },

  tags: [String],          
  people: [String],       

  isFavorite: {
    type: Boolean,
    default: false,
  },

  comments: [String],

  size: Number,

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Image", imageSchema);
