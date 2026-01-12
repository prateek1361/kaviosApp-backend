import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
  albumId: String,
  name: String,
  description: String,
  ownerId: String,
  sharedWith: [String]
});

export default mongoose.model("Album", albumSchema);
