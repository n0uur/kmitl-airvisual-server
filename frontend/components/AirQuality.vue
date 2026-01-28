<script setup lang="ts">
type Breakpoint = {
  aqiLow: number;
  aqiHigh: number;
  concentrationLow: number;
  concentrationHigh: number;
};

import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.locale("th");
dayjs.extend(relativeTime);
dayjs.extend(buddhistEra);

const config = useRuntimeConfig();

// Define refs for data
const aqi = ref(0);
const level = ref("");
const pollutant = ref("PM2.5");
const icon = ref("https://www.airvisual.com/images/01d.png");
const concentration = ref(0);
const temperature = ref(0);
const windSpeed = ref(0);
const humidity = ref(0);
const saved_time = ref("");

const aqiCardStyle = ref({ backgroundColor: "", color: "" });
const aqiNumCardStyle = ref({ backgroundColor: "" });

const updateTheme = (aqiValue: number) => {
  if (aqiValue <= 50) {
    aqiCardStyle.value = { backgroundColor: "#a8e05f", color: "#364222" }; // Green
    aqiNumCardStyle.value = { backgroundColor: "#87c13c" };
    level.value = "ดี";
  } else if (aqiValue <= 100) {
    aqiCardStyle.value = { backgroundColor: "#fdd64b", color: "#4a401e" }; // Yellow
    aqiNumCardStyle.value = { backgroundColor: "#efbe1d" };
    level.value = "ปานกลาง";
  } else if (aqiValue <= 150) {
    aqiCardStyle.value = { backgroundColor: "#ff9b57", color: "#48301e" }; // Orange
    aqiNumCardStyle.value = { backgroundColor: "#f27e2f" };
    level.value = "มีผลกระทบต่อผู้ป่วยหรือร่างกายอ่อนแอ";
  } else if (aqiValue <= 200) {
    aqiCardStyle.value = { backgroundColor: "#fe6a69", color: "#ffffff" }; // Red
    aqiNumCardStyle.value = { backgroundColor: "#e84b50" };
    level.value = "มีผลกระทบต่อทุกคน";
  } else if (aqiValue <= 300) {
    aqiCardStyle.value = { backgroundColor: "#a97abc", color: "#ffffff" }; // Purple
    aqiNumCardStyle.value = { backgroundColor: "#8a5d9d" };
    level.value = "มีผลกระทบต่อทุกคนอย่างรุนแรง";
  } else {
    aqiCardStyle.value = { backgroundColor: "#a07684", color: "#ffffff" }; // Maroon
    aqiNumCardStyle.value = { backgroundColor: "#8f5c6b" };
    level.value = "อันตราย";
  }
};

// const pollutants = ["pm25", "pm10", "o3", "no2", "so2", "co"];

const fetchData = async () => {
  try {
    const response = await axios.get(config.public.backendUrl);
    const data = response.data;

    // Update values dynamically
    aqi.value = data.sciraAQI?.aqi;
    pollutant.value = "PM2.5";
    concentration.value = data.sciraAQI?.pm25;
    const _temperature = data.owmWeather.temp - 273.15; // Kelvin to Celsius
    const _windSpeed = data.owmWeather.wind_speed * 3.6; // m/s to km/h
    const _humidity = data.owmWeather.humidity; // %
    temperature.value = Number(
      _temperature.toLocaleString(undefined, { maximumFractionDigits: 1 })
    );
    windSpeed.value = Number(_windSpeed.toLocaleString(undefined, { maximumFractionDigits: 1 }));
    humidity.value = Number(_humidity.toLocaleString(undefined, { maximumFractionDigits: 1 }));
    icon.value = data.owmWeather.weather.icon;

    const lastUpdate = dayjs(data.owmWeather.updated);
    saved_time.value = `${lastUpdate.format("D MMMM BBBB H:MM น.")} - ${lastUpdate.fromNow()}`;

    icon.value = "https://www.airvisual.com/images/" + data.weather.ic + ".png";

    // Update the theme based on AQI
    updateTheme(aqi.value);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// Watch the AQI value and update the theme dynamically
watch(aqi, (newAqi: any) => {
  updateTheme(newAqi);
});

// Fetch data on component mount
await fetchData();

// Initialize the theme
updateTheme(aqi.value);
</script>

<template>
  <div class="rounded-2xl shadow-md max-w-[360px] z-10 overflow-hidden" :style="aqiCardStyle">
    <div class="p-4">
      <div class="flex gap-3 items-center">
        <div class="flex flex-col bg-yellow-400 rounded-2xl px-4 py-2" :style="aqiNumCardStyle">
          <div class="text-3xl font-semibold text-center">
            {{ aqi }}
          </div>
          <div class="text-xs mt-1">AQI</div>
        </div>
        <div class="text-2xl font-bold">{{ level }}</div>
      </div>
      <div class="mt-4 flex flex-row gap-4 justify-between mr-10">
        <div>ค่ามลพิษ: {{ pollutant }}</div>
        <div>{{ concentration }} µg/m<sup>3</sup></div>
      </div>
    </div>
    <div class="px-6 py-1 flex flex-col bg-white min-h-[44px] font-semibold text-neutral-800">
      <div class="flex flex-row justify-between">
        <div class="flex items-center">
          <img
            class="max-w-[32px]"
            alt=""
            :src="`https://openweathermap.org/img/wn/${icon}@2x.png`"
          />
          <span class="ml-2">{{ temperature }}°</span>
        </div>
        <div class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 text-slate-400 transform rotate-45"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.39L9.32 21.75a3.001 3.001 0 01-2.12 0 3 3 0 01-2.12-2.12v-2.37L2.35 12l3.97-5.96a3 3 0 015.15 0l5.56 8.34z"
            />
          </svg>
          <span class="ml-2">{{ windSpeed }} km/h</span>
        </div>
        <div class="flex items-center">
          <img
            class="h-[24px]"
            src="https://www.iqair.com/dl/web/svg/ic-humidity-2-solid-weather-blue-16.svg"
            alt=""
          />
          <span class="ml-2">{{ humidity }}%</span>
        </div>
      </div>
      <div class="font-thin text-[10px] text-gray-800 mt-0.5">
        <p>ข้อมูลเมื่อเวลา: {{ saved_time }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
