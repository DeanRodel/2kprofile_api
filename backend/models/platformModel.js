import mongoose from "mongoose";

const platformSchema = mongoose.Schema({
  _id: Number,
  name: String,
});

const Platform = mongoose.model("Platform", platformSchema);

export default Platform;
