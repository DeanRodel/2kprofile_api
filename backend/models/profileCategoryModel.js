import mongoose from "mongoose";

const profileCategorySchema = mongoose.Schema({
  _id: Number,
  name: String,
});

const ProfileCategory = mongoose.model(
  "ProfileCategory",
  profileCategorySchema
);

export default ProfileCategory;
