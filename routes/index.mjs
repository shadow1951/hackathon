import express from "express";
import { fetchRedditReviewViaJson } from "../controller/Scrapper.mjs";
import { addReview } from "../controller/User.mjs";
import {
  getBadReviews,
  getGoodReviews,
  getNeutralReviews,
} from "../controller/review.mjs";
const router = express.Router();

// Define a route for the home page
router.get("/scrap", fetchRedditReviewViaJson);

// Define other routes as needed
router.post("/addReview", addReview);

router.get("/getGoodReviews", getGoodReviews);
router.get("/good/:username", getGoodReviews);
router.get("/bad/:username", getBadReviews);
router.get("/neutral/:username", getNeutralReviews);

// Export the router
export default router;
