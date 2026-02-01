import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/channel", async (req, res) => {
  try {
    const { query } = req.query;

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

    const channelId = search.data.items[0]?.id?.channelId;
    if (!channelId) return res.status(404).json({});

    const channel = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics",
          id: channelId,
          key: process.env.YT_API_KEY
        }
      }
    );

    const c = channel.data.items[0];

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
    console.error(err.message);
    res.status(500).json({});
  }
});

export default router;
