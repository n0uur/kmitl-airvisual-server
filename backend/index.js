require("dotenv").config();

const express = require("express");
const cors = require("cors");
const redis = require("./lib/redis");

const { initCron } = require("./lib/fetchData");
const cluster = require("node:cluster");

const app = express();
const port = process.env.PORT || 3100;

// Initialize Cron Job (only if primary process)
if (cluster.isPrimary) {
  initCron();
}

// Enable CORS for all routes
app.use(cors());

// Route to get stored data
app.get("/", async (req, res) => {
  try {
    const data = await redis.get("air-quality-api").catch(() => {});
    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
