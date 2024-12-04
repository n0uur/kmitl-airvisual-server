const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");
const Data = require("./models/Data");

const app = express();
const port = process.env.PORT || 3100;
const apiUrl = `http://api.airvisual.com/v2/nearest_city?lat=13.721434635446425&lon=100.78113540955499&key=${process.env.API_KEY}`;

// MongoDB Connection URI using environment variables
const dbURI = process.env.DB_CONNECTION_STRING;
// const dbURI = `mongodb://${process.env.DB_HOSTNAME}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
console.log('This is connection string: ' + dbURI);
// Connect to MongoDB
mongoose
  .connect(dbURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

const fetchAndUpdateData = async () => {
  try {
    const response = await axios.get(apiUrl);
    const data = response.data.data;

    // Function to round a date object to the nearest 10 minutes
    const roundToNearestTenMinutes = (date) => {
      const minutes = date.getMinutes();
      const roundedMinutes = Math.round(minutes / 10) * 10;
      date.setMinutes(roundedMinutes, 0, 0); // Reset seconds and milliseconds
      return date;
    };

    // Get the current time and round it
    const currentTime = new Date();
    const roundedTime = roundToNearestTenMinutes(currentTime);

    const newData = {
      city: data.city,
      state: data.state,
      country: data.country,
      location: data.location,
      pollution: data.current.pollution,
      weather: data.current.weather,
      saved_time: roundedTime,
    };

    // Replace the existing data in the database
    await Data.findOneAndReplace({}, newData, { upsert: true });
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
    const data = await Data.findOne({});
    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
