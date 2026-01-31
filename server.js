const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.YOUTUBE_API_KEY;
const PORT = process.env.PORT || 10000;

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.json({ status: "YouTube Analyzer API running 🚀" });
});

/* -------------------- UTILS -------------------- */
const extractQuery = (query) => {
  if (query.includes("youtube.com")) {
    const match = query.match(/@([a-zA-Z0-9_.-]+)/);
    return match ? match[1] : query;
  }
  return query.replace("@", "");
};

/* -------------------- CHANNEL METADATA -------------------- */
app.get("/api/channel", async (req, res) => {
  try {
    const input = req.query.query;
    if (!input) {
      return res.status(400).json({ error: "query parameter is required" });
    }

    const searchQuery = extractQuery(input);

    // 1️⃣ Search channel
    const searchRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchQuery,
          type: "channel",
          maxResults: 1,
          key: API_KEY
        }
      }
    );

    if (!searchRes.data.items.length) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const channelId = searchRes.data.items[0].id.channelId;

    // 2️⃣ Get channel details
    const channelRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics,contentDetails",
          id: channelId,
          key: API_KEY
        }
      }
    );

    const channel = channelRes.data.items[0];

    res.json({
      channelId,
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscribers: channel.statistics.subscriberCount,
      views: channel.statistics.viewCount,
      videos: channel.statistics.videoCount,
      thumbnail: channel.snippet.thumbnails.high.url,
      createdAt: channel.snippet.publishedAt
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch channel data" });
  }
});

/* -------------------- CHANNEL VIDEOS -------------------- */
app.get("/api/videos", async (req, res) => {
  try {
    const input = req.query.query;
    if (!input) {
      return res.status(400).json({ error: "query parameter is required" });
    }

    const searchQuery = extractQuery(input);

    // 1️⃣ Search channel
    const searchRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchQuery,
          type: "channel",
          maxResults: 1,
          key: API_KEY
        }
      }
    );

    const channelId = searchRes.data.items[0].id.channelId;

    // 2️⃣ Get uploads playlist
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

    // 3️⃣ Get videos
    const playlistRes = await axios.get(
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

    const videos = playlistRes.data.items.map(v => ({
      videoId: v.snippet.resourceId.videoId,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails.medium.url
    }));

    res.json(videos);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

/* -------------------- START SERVER -------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
