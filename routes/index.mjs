import express from "express";
import { fetchRedditReviewViaJson } from "../controller/Scrapper.mjs";
import { addMultipleReviews, addReview } from "../controller/User.mjs";
import {
  getBadReviews,
  getGoodReviews,
  getNeutralReviews,
  getStatisticalAnalysis,
} from "../controller/review.mjs";
const router = express.Router();

// Define a route for the home page
router.get("/scrap", fetchRedditReviewViaJson);

// Define other routes as needed
router.post("/addReview", addReview);
router.post("/addMultipleReview", addMultipleReviews);
router.get("/getGoodReviews", getGoodReviews);
router.get("/good", getGoodReviews);
router.get("/bad", getBadReviews);
router.get("/neutral", getNeutralReviews);
router.get("/getStats", getStatisticalAnalysis);

// Export the router
export default router;
