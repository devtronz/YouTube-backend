import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import channelRoute from "./routes/channel.js";
import videosRoute from "./routes/videos.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", channelRoute);
app.use("/api", videosRoute);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
