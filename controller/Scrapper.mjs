// redditJsonScraper.js
import axios from "axios";

/**
 * Search reddit via the public JSON endpoints and return the top post + a top comment text.
 *
 */
export async function fetchRedditReviewViaJson(req, res) {
  const query = "my laptop is lagging when its new";
  const ua = process.env.REDDIT_USER_AGENT || "my-scraper/0.1 by yourusername";
  const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(
    query
  )}&sort=relevance&limit=5`;

  try {
    const searchResp = await axios.get(searchUrl, {
      headers: { "User-Agent": ua },
      timeout: 20000,
    });

    const posts = (searchResp.data?.data?.children || []).map((c) => c.data);
    if (!posts.length) return { error: "No posts found" };

    const top = posts[0];
    const postInfo = {
      id: top.id,
      title: top.title,
      url: `https://reddit.com${top.permalink}`,
      selftext: top.selftext || "",
      subreddit: top.subreddit_name_prefixed,
    };

    // Fetch comments JSON for that post
    const commentsUrl = `https://www.reddit.com${top.permalink}.json?limit=5`;
    const commentsResp = await axios.get(commentsUrl, {
      headers: { "User-Agent": ua },
      timeout: 20000,
    });

    const commentsListing = commentsResp.data?.[1]?.data?.children || [];
    const topComments = commentsListing
      .filter((c) => c.kind === "t1")
      .slice(0, 5)
      .map((c) => ({
        author: c.data.author,
        body: c.data.body,
        score: c.data.score,
        created_utc: c.data.created_utc,
      }));

    const reviewText =
      postInfo.selftext || (topComments[0] && topComments[0].body) || "";

    return res.json({ post: postInfo, reviewText, topComments });
  } catch (err) {
    return { error: err.message || "Request failed" };
  }
}
