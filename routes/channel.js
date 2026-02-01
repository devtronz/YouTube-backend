import express from "express";
import axios from "axios";

const router = express.Router();

const YT_KEY = process.env.YT_API_KEY;

router.get("/channel", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // STEP 1: Get channel ID (from username / handle / name)
    const searchRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: query,
          type: "channel",
          maxResults: 1,
          key: YT_KEY,
        },
      }
    );

    const channelId =
      searchRes.data.items?.[0]?.snippet?.channelId;

    if (!channelId) {
      return res.status(404).json({ error: "Channel not found" });
    }

    // STEP 2: Get channel statistics
    const channelRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics",
          id: channelId,
          key: YT_KEY,
        },
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
      videos: c.statistics.videoCount,
    });
  } catch (err) {
    console.error("CHANNEL ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch channel data" });
  }
});

export default router;