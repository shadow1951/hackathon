import User from "../models/User.mjs";

// -----------------------------
// Get Good Reviews for ALL users
// -----------------------------
export const getGoodReviews = async (req, res, next) => {
  try {
    const users = await User.find({});
    const goodReviews = [];

    users.forEach((user) => {
      user.reviews.forEach((r) => {
        if (
          r.sentinental_analysis[0] > r.sentinental_analysis[1] &&
          r.sentinental_analysis[0] > r.sentinental_analysis[2]
        ) {
          goodReviews.push({
            username: user.username,
            review: r,
          });
        }
      });
    });

    res.status(200).json({
      message: "Good reviews fetched successfully",
      reviews: goodReviews,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get Bad Reviews for ALL users
// -----------------------------
export const getBadReviews = async (req, res, next) => {
  try {
    const users = await User.find({});
    const badReviews = [];

    users.forEach((user) => {
      user.reviews.forEach((r) => {
        if (
          r.sentinental_analysis[1] > r.sentinental_analysis[0] &&
          r.sentinental_analysis[1] > r.sentinental_analysis[2]
        ) {
          badReviews.push({
            username: user.username,
            review: r,
          });
        }
      });
    });

    res.status(200).json({
      message: "Bad reviews fetched successfully",
      reviews: badReviews,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Get Neutral Reviews for ALL users
// -----------------------------
export const getNeutralReviews = async (req, res, next) => {
  try {
    const users = await User.find({});
    const neutralReviews = [];

    users.forEach((user) => {
      user.reviews.forEach((r) => {
        if (
          r.sentinental_analysis[2] > r.sentinental_analysis[0] &&
          r.sentinental_analysis[2] > r.sentinental_analysis[1]
        ) {
          neutralReviews.push({
            username: user.username,
            review: r,
          });
        }
      });
    });

    res.status(200).json({
      message: "Neutral reviews fetched successfully",
      reviews: neutralReviews,
    });
  } catch (err) {
    next(err);
  }
};

// Helper: calculate median
function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Helper: calculate mode
function mode(values) {
  const freq = {};
  values.forEach((v) => (freq[v] = (freq[v] || 0) + 1));
  let maxCount = 0,
    modes = [];
  for (const key in freq) {
    if (freq[key] > maxCount) {
      maxCount = freq[key];
      modes = [Number(key)];
    } else if (freq[key] === maxCount) {
      modes.push(Number(key));
    }
  }
  return modes;
}

// Helper: calculate standard deviation
function standardDeviation(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length || 0;
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

// -----------------------------
// Middleware: Full Statistical Analysis
// -----------------------------
export const getStatisticalAnalysis = async (req, res, next) => {
  try {
    // Fetch all users
    const users = await User.find({});
    if (!users.length) return res.status(404).json({ error: "No users found" });

    // Flatten all reviews
    const reviews = users.flatMap((u) => u.reviews);

    if (!reviews.length) {
      return res.status(200).json({ message: "No reviews found", data: {} });
    }

    // Ratings
    const ratings = reviews.map((r) => r.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const medRating = median(ratings); // Implement a median function
    const modeRating = mode(ratings); // Implement a mode function
    const stdRating = standardDeviation(ratings); // Implement std function

    // Sentinental analysis totals
    const totalSentiment = reviews.reduce(
      (acc, r) => {
        acc.good += r.sentinental_analysis[0] || 0;
        acc.bad += r.sentinental_analysis[1] || 0;
        acc.neutral += r.sentinental_analysis[2] || 0;
        return acc;
      },
      { good: 0, bad: 0, neutral: 0 }
    );

    // Sentinental analysis averages
    const avgSentiment = {
      good: totalSentiment.good / reviews.length,
      bad: totalSentiment.bad / reviews.length,
      neutral: totalSentiment.neutral / reviews.length,
    };

    // Count of dominant sentiment reviews
    const countDominant = { good: 0, bad: 0, neutral: 0 };
    reviews.forEach((r) => {
      const [g, b, n] = r.sentinental_analysis;
      if (g > b && g > n) countDominant.good++;
      else if (b > g && b > n) countDominant.bad++;
      else if (n > g && n > b) countDominant.neutral++;
    });

    res.status(200).json({
      totalReviews: reviews.length,
      ratings: {
        min: minRating,
        max: maxRating,
        average: avgRating,
        median: medRating,
        mode: modeRating,
        standardDeviation: stdRating,
      },
      sentimentTotals: totalSentiment,
      sentimentAverages: avgSentiment,
      dominantSentimentCounts: countDominant,
    });
  } catch (err) {
    next(err);
  }
};
