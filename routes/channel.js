import express from "express";
import axios from "axios";

const router = express.Router();

/* -------- HELPER: CLEAN QUERY -------- */
function normalizeQuery(input) {
  if (!input) return "";

  // Handle full URL
  if (input.includes("youtube.com")) {
    const handleMatch = input.match(/@([a-zA-Z0-9._-]+)/);
    if (handleMatch) return handleMatch[1];

    const idMatch = input.match(/channel\/([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];
  }

  // Remove @ if present
  return input.replace("@", "").trim();
}

router.get("/channel", async (req, res) => {
  try {
    const rawQuery = req.query.query;
    const query = normalizeQuery(rawQuery);

    if (!query) {
      return res.status(400).json({ error: "Invalid query" });
    }

    // 1️⃣ Search channel
    const search = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: query,
          type: "channel",
          maxResults: 1,
          key: process.env.YT_API_KEY
        }
      }
    );

    if (!search.data.items.length) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const channelId = search.data.items[0].id.channelId;

    // 2️⃣ Get channel details
    const channelRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics",
          id: channelId,
          key: process.env.YT_API_KEY
        }
      }
    );

    const c = channelRes.data.items[0];

    res.json({
      channelId,
      title: c.snippet.title,
      description: c.snippet.description,
      thumbnail: c.snippet.thumbnails.high.url,
      subscribers: c.statistics.subscriberCount,
      views: c.statistics.viewCount,
      videos: c.statistics.videoCount
    });
  } catch (err) {
    console.error("CHANNEL ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "YouTube API error" });
  }
});

export default router;
