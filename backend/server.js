const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cron = require("node-cron");
const redis = require("./lib/redis");

const app = express();
const port = process.env.PORT || 3100;

// MongoDB Connection URI using environment variables
// const dbURI = process.env.DB_CONNECTION_STRING;
// console.log(dbURI);
// // Connect to MongoDB
// mongoose
//   .connect(dbURI)
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Function to fetch and update data every 10 minutes
const fetchAndUpdateData = async () => {
  try {
    const response = await axios.get(`http://api.airvisual.com/v2/nearest_city`, {
      params: {
        lat: 13.721434635446425,
        lon: 100.78113540955499,
        key: process.env.API_KEY,
      },
    });
    const data = response.data.data;

    const newData = {
      city: data.city,
      state: data.state,
      country: data.country,
      location: data.location,
      pollution: data.current.pollution,
      weather: data.current.weather,
    };

    // Replace the existing data in the database
    // await Data.findOneAndReplace({}, newData, { upsert: true });
    await redis.set("air-quality-api", JSON.stringify(newData));
    console.log("Data updated successfully");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// Fetch and update data every 10 minutes
cron.schedule("*/10 * * * *", fetchAndUpdateData);

// Initial fetch on server start
fetchAndUpdateData();

// Enable CORS for all routes
app.use(cors());

// Route to get stored data
app.get("/", async (req, res) => {
  try {
    // const data = await Data.findOne({});
    const data = await redis.get("air-quality-api").catch(() => {});
    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
