import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    rating: { type: Number, required: true },
    sentinental_analysis: {
      type: [Number], // Array of numbers
      default: [0, 0, 0], // [good, bad, neutral]
      validate: {
        validator: function (arr) {
          return arr.length === 3;
        },
        message:
          "sentinental_analysis must be an array of 3 numbers [good, bad, neutral]",
      },
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
