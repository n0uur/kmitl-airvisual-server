require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const redis = require("./lib/redis");
const dayjs = require("dayjs");

const app = express();
const port = process.env.PORT || 3100;

const fetchAndUpdateData = async () => {
  try {
    console.log("Fetching data...");
    const response = await axios
      .get(`http://api.openweathermap.org/data/2.5/air_pollution`, {
        params: {
          lat: 13.721434635446425,
          lon: 100.78113540955499,
          appid: process.env.OWM_API_KEY,
        },
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    if (!response) {
      return;
    }

    const weatherResponse = await axios
      .get(`https://api.openweathermap.org/data/3.0/onecall`, {
        params: {
          lat: 13.721434635446425,
          lon: 100.78113540955499,
          appid: process.env.OWM_API_KEY,
          exclude: "minutely,hourly,daily",
        },
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        return {};
      });

    if (!weatherResponse) {
      return;
    }

    const weatherData = weatherResponse.data;

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

    const data = response.data;

    const newData = {
      city: "Bangkok",
      state: "Bangkok",
      country: "Thailand",
      location: null,
      pollution: null,
      weather: null,
      cnaqi: cnaqiResponse,
      owm: {
        updated: dayjs.unix(data.list[0].dt).toISOString(),
        aqi: data.list[0].main.aqi,
        components: data.list[0].components,
      },
      owmWeather: {
        updated: dayjs.unix(weatherData.current.dt).toISOString(),
        temp: weatherData.current.temp,
        feels_like: weatherData.current.feels_like,
        pressure: weatherData.current.pressure,
        humidity: weatherData.current.humidity,
        dew_point: weatherData.current.dew_point,
        uvi: weatherData.current.uvi,
        clouds: weatherData.current.clouds,
        visibility: weatherData.current.visibility,
        wind_speed: weatherData.current.wind_speed,
        weather: weatherData.current.weather[0],
      },
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
    if (!lastUpdate || dayjs().diff(lastUpdate, "minutes") > 15) {
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
