import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/videos", async (req, res) => {
  try {
    const { query } = req.query;

    // 1️⃣ Find channel ID
    const channelSearch = await axios.get(
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

    const channelId =
      channelSearch.data.items[0]?.snippet?.channelId;

    if (!channelId) return res.json([]);

    // 2️⃣ Get last 10 video IDs
    const search = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          channelId,
          maxResults: 10,
          order: "date",
          type: "video",
          key: process.env.YT_API_KEY
        }
      }
    );

    const videoIds = search.data.items
      .map(v => v.id.videoId)
      .join(",");

    if (!videoIds) return res.json([]);

    // 3️⃣ Get statistics (THIS IS THE KEY PART)
    const stats = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics",
          id: videoIds,
          key: process.env.YT_API_KEY
        }
      }
    );

    // 4️⃣ Format data for frontend
    const videos = stats.data.items.map(v => ({
      videoId: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails.medium.url,
      publishedAt: v.snippet.publishedAt,
      views: v.statistics.viewCount,
      likes: v.statistics.likeCount,
      comments: v.statistics.commentCount
    }));

    res.json(videos);
  } catch (err) {
    console.error(err.message);
    res.status(500).json([]);
  }
});

export default router;
