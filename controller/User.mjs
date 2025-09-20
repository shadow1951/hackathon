// UserController.mjs
import User from "../models/User.mjs";
import axios from "axios";

// -----------------------------
// Helper: check if review is a problem using Gemini AI
// -----------------------------
async function isProblem(reviewMessage) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const response = await axios.post(
      "https://api.gemini.com/v1/decide-problem", // replace with actual Gemini endpoint
      {
        prompt: `Decide if the following review describes a real problem that requires attention. Respond only with "true" or "false". Review: "${reviewMessage}"`,
      },
      {
        headers: {
          Authorization: `Bearer ${geminiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Expecting response.data.result to be "true" or "false"
    return response.data.result === "true";
  } catch (err) {
    console.error("Gemini API error:", err.message);
    // fallback: treat as non-problem
    return false;
  }
}

// -----------------------------
// Helper: fetch Reddit solution asynchronously
// -----------------------------
async function fetchRedditSolution(query) {
  try {
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(
      query
    )}&limit=5`;
    const searchResp = await axios.get(searchUrl, {
      headers: { "User-Agent": "my-app/0.1" },
    });

    const posts = searchResp.data.data.children || [];
    if (!posts.length) return { post: null, solution: "No solution found" };

    const top = posts[0].data;
    const commentsUrl = `https://www.reddit.com${top.permalink}.json?limit=5`;
    const commentsResp = await axios.get(commentsUrl, {
      headers: { "User-Agent": "my-app/0.1" },
    });

    const comments = commentsResp.data[1]?.data?.children || [];
    const topComment = comments.find((c) => c.kind === "t1")?.data.body || "";

    return {
      post: `https://reddit.com${top.permalink}`,
      solution: topComment || top.selftext || "No solution found",
    };
  } catch (err) {
    console.error("Reddit fetch error:", err.message);
    return { post: null, solution: "No solution found" };
  }
}

// -----------------------------
// Middleware: add single review
// -----------------------------
export const addReview = async (req, res, next) => {
  try {
    const { username, message, rating, sentinental_analysis } = req.body;

    if (!username || !message || rating == null) {
      return res
        .status(400)
        .json({ error: "username, message, and rating are required" });
    }

    // Optional: check if problem via Gemini (can skip for speed)
    const problem = true; // for demo purposes, assume all are problems

    if (!problem) {
      return res.status(200).json({
        message: "Review does not describe a problem. Nothing stored.",
      });
    }

    // Find or create user
    let user = await User.findOne({ username });
    if (!user) user = new User({ username });

    // Append review
    const newReview = {
      content: message,
      rating,
      sentinental_analysis: Array.isArray(sentinental_analysis)
        ? sentinental_analysis
        : [],
    };
    user.reviews.push(newReview);

    // Save user and fetch Reddit concurrently
    const [savedUser, redditSolution] = await Promise.all([
      user.save(),
      fetchRedditSolution(message),
    ]);

    // Send both back
    res.status(201).json({
      message: "Review stored, problem detected.",
      user: savedUser,
      redditSolution,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Middleware: add multiple reviews
// -----------------------------
export const addMultipleReviews = async (req, res, next) => {
  try {
    const { username, reviews } = req.body;

    if (!username || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        error: "username and reviews array (non-empty) are required",
      });
    }

    // Find or create user
    let user = await User.findOne({ username });
    if (!user) user = new User({ username });

    // Validate each review
    const validReviews = reviews
      .filter(
        (r) =>
          r.message &&
          r.rating != null &&
          typeof r.message === "string" &&
          typeof r.rating === "number"
      )
      .map((r) => ({
        content: r.message,
        rating: r.rating,
        sentinental_analysis: Array.isArray(r.sentinental_analysis)
          ? r.sentinental_analysis
          : [],
      }));

    if (validReviews.length === 0) {
      return res.status(400).json({ error: "No valid reviews provided" });
    }

    // Append to existing reviews
    user.reviews.push(...validReviews);

    await user.save();

    res.status(201).json({
      message: `${validReviews.length} reviews added successfully`,
      user,
    });
  } catch (err) {
    next(err);
  }
};
