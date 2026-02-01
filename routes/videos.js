import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/videos", async (req, res) => {
  try {
    const { query } = req.query;

    // 1️⃣ Get channel ID first
    const channelRes = await axios.get(
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
      channelRes.data.items[0]?.snippet?.channelId;

    if (!channelId) {
      return res.status(404).json([]);
    }

    // 2️⃣ Get last 10 video IDs
    const searchRes = await axios.get(
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

    const videoIds = searchRes.data.items
      .map(v => v.id.videoId)
      .join(",");

    // 3️⃣ Get video statistics
    const statsRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics",
          id: videoIds,
          key: process.env.YT_API_KEY
        }
      }
    );

    // 4️⃣ Format response
    const videos = statsRes.data.items.map(v => ({
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
