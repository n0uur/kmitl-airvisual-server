const express = require("express");
const axios = require("axios");
const cors = require("cors");
const redis = require("./lib/redis");
const dayjs = require("dayjs");

const app = express();
const port = process.env.PORT || 3100;

const fetchAndUpdateData = async () => {
  try {
    const response = await axios
      // .get(`http://api.airvisual.com/v2/nearest_city`, {
      .get(`http://api.airvisual.com/v2/city`, {
        params: {
          // lat: 13.721434635446425,
          // lon: 100.78113540955499,
          city: "Bangkok",
          state: "Bangkok",
          country: "Thailand",
          key: process.env.API_KEY,
        },
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    if (!response) {
      return;
    }

    const cnaqiResponse = await axios
      .get(`https://api.waqi.info/feed/geo:13.721434635446425;100.78113540955499/`, {
        params: {
          token: process.env.AQICN_API_KEY,
        },
      })
      .then((response) => response.data.data)
      .catch((error) => {
        console.error("Error fetching data:", error);
        return {};
      });

    const data = response.data.data;

    const newData = {
      city: data.city,
      state: data.state,
      country: data.country,
      location: data.location,
      pollution: data.current.pollution,
      weather: data.current.weather,
      cnaqi: cnaqiResponse,
    };

    await redis.set("air-quality-api", JSON.stringify(newData));
    console.log("Data updated successfully");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// Initial fetch on server start
// fetchAndUpdateData();

// Enable CORS for all routes
app.use(cors());

// Route to get stored data
app.get("/", async (req, res) => {
  try {
    const lastUpdate = await redis
      .get("air-quality-api-last-update")
      .then((data) => dayjs(data))
      .catch(() => {});
    if (!lastUpdate || dayjs().diff(lastUpdate, "minutes") > 10) {
      await fetchAndUpdateData();
    }

    // const data = await Data.findOne({});
    const data = await redis.get("air-quality-api").catch(() => {});
    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }

  try {
    await redis.set("air-quality-api-last-update", dayjs().toISOString());
  } catch (error) {
    console.error("Error setting last update:", error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
