import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    content: String,
    rating: Number,
    sentinental_analysis: {
      type: Array, // can hold [score, label] or more structured data
      default: [],
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    reviews: [reviewSchema],
    isSPan: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
