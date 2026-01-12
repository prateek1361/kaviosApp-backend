const mongoose = require("mongoose")

const albumSchema = new mongoose.Schema({
  albumId: String,
  name: String,
  description: String,
  ownerId: String,
  sharedWith: [String]
});

module.exports = mongoose.model("Album", albumSchema);
