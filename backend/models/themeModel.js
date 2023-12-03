import mongoose from "mongoose";

const themeSchema = mongoose.Schema({
  _id: Number,
  name: String,
  background: [String],
  banner: [String],
});

const Theme = mongoose.model("Theme", themeSchema);

export default Theme;
