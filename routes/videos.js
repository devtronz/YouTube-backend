import express from "express";
import axios from "axios";

const router = express.Router();
const YT_KEY = process.env.YT_API_KEY;

router.get("/videos", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Get channel ID first
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
      return res.json([]);
    }

    // Get last 10 videos
    const videosRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          channelId,
          order: "date",
          maxResults: 10,
          type: "video",
          key: YT_KEY,
        },
      }
    );

    const videoIds = videosRes.data.items
      .map((v) => v.id.videoId)
      .join(",");

    if (!videoIds) return res.json([]);

    // Get video statistics
    const statsRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "statistics,snippet",
          id: videoIds,
          key: YT_KEY,
        },
      }
    );

    const videos = statsRes.data.items.map((v) => ({
      videoId: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails.medium.url,
      views: v.statistics.viewCount || 0,
      likes: v.statistics.likeCount || 0,
      comments: v.statistics.commentCount || 0,
      publishedAt: v.snippet.publishedAt,
    }));

    res.json(videos);
  } catch (err) {
    console.error("VIDEOS ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

export default router;