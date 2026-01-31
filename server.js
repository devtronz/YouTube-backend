const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.YOUTUBE_API_KEY;

// Health check
app.get("/", (req, res) => {
  res.json({ status: "YouTube Analyzer API running 🚀" });
});

// 🔹 Get channel metadata
app.get("/api/channel/:channelId", async (req, res) => {
  try {
    const { channelId } = req.params;

    const url = `https://www.googleapis.com/youtube/v3/channels`;
    const response = await axios.get(url, {
      params: {
        part: "snippet,statistics",
        id: channelId,
        key: API_KEY
      }
    });

    if (!response.data.items.length) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const channel = response.data.items[0];

    res.json({
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscribers: channel.statistics.subscriberCount,
      views: channel.statistics.viewCount,
      videos: channel.statistics.videoCount,
      thumbnail: channel.snippet.thumbnails.high.url
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch channel data" });
  }
});

// 🔹 Get latest videos metadata
app.get("/api/videos/:channelId", async (req, res) => {
  try {
    const { channelId } = req.params;

    // 1. Get uploads playlist ID
    const channelRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "contentDetails",
          id: channelId,
          key: API_KEY
        }
      }
    );

    const uploadsPlaylist =
      channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

    // 2. Get videos from playlist
    const videosRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        params: {
          part: "snippet",
          playlistId: uploadsPlaylist,
          maxResults: 10,
          key: API_KEY
        }
      }
    );

    const videos = videosRes.data.items.map(v => ({
      title: v.snippet.title,
      videoId: v.snippet.resourceId.videoId,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails.medium.url
    }));

    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
