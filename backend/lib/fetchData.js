require("dotenv").config();
const axios = require("axios");
const redis = require("./redis");
const dayjs = require("dayjs");
const cron = require("node-cron");

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

    const sciraAQIResponse = await axios
      .get(`http://10.141.3.68:8470/api/summary`, {
        headers: {
          "X-API-Key": process.env.SCIRA_API_KEY,
        },
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error fetching data:", error);
        return {};
      });
      
    let worstArea = null;
    if (sciraAQIResponse && sciraAQIResponse.top5_areas) {
        worstArea = sciraAQIResponse.top5_areas.reduce((acc, area) => {
            return acc.aqi > area.aqi ? acc : area;
        }, sciraAQIResponse.top5_areas[0]);
    }

    if (!sciraAQIResponse) {
      return;
    }

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
      sciraAQI: {
        timestamp: dayjs(sciraAQIResponse.timestamp).toISOString(),
        aqi: worstArea ? worstArea.aqi : null,
        pm25: worstArea ? worstArea.pm25 : null,
      },
    };

    await redis.set("air-quality-api", JSON.stringify(newData));
    console.log("Data updated successfully");

    try {
      await redis.set("air-quality-api-last-update", dayjs().toISOString());
    } catch (error) {
      console.error("Error setting last update:", error);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const initCron = () => {
  // Schedule cron job to run every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    console.log("Running scheduled data fetch...");
    fetchAndUpdateData();
  });

  // Initial fetch on startup
  console.log("Performing initial data fetch...");
  fetchAndUpdateData();
};

module.exports = { fetchAndUpdateData, initCron };
