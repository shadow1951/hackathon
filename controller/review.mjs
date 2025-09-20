import User from "../models/User.mjs";

export const getGoodReviews = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const goodReviews = user.reviews.filter(
      (r) =>
        r.sentinental_analysis[0] > r.sentinental_analysis[1] &&
        r.sentinental_analysis[0] > r.sentinental_analysis[2]
    );

    res.status(200).json({
      message: "Good reviews fetched successfully",
      reviews: goodReviews,
    });
  } catch (err) {
    next(err);
  }
};

export const getBadReviews = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const badReviews = user.reviews.filter(
      (r) =>
        r.sentinental_analysis[1] > r.sentinental_analysis[0] &&
        r.sentinental_analysis[1] > r.sentinental_analysis[2]
    );

    res.status(200).json({
      message: "Bad reviews fetched successfully",
      reviews: badReviews,
    });
  } catch (err) {
    next(err);
  }
};

export const getNeutralReviews = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const neutralReviews = user.reviews.filter(
      (r) =>
        r.sentinental_analysis[2] > r.sentinental_analysis[0] &&
        r.sentinental_analysis[2] > r.sentinental_analysis[1]
    );

    res.status(200).json({
      message: "Neutral reviews fetched successfully",
      reviews: neutralReviews,
    });
  } catch (err) {
    next(err);
  }
};
