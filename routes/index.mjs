import express from "express";
import { fetchRedditReviewViaJson } from "../controller/Scrapper.mjs";
import { addReview } from "../controller/User.mjs";
const router = express.Router();

// Define a route for the home page
router.get("/scrap", fetchRedditReviewViaJson);

// Define other routes as needed
router.post("/addReview", addReview);



// Export the router
export default router;
