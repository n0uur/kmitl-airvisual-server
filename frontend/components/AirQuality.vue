<script setup lang="ts">

import {ref, watch} from 'vue';

const aqi = ref(91);
const level = ref('');
const pollutant = ref('PM2.5');
const concentration = ref(30.5);
const temperature = ref(32);
const windSpeed = ref(14.8);
const humidity = ref(46);

const aqiCardStyle = ref({backgroundColor: '', color: ''});
const aqiNumCardStyle = ref({backgroundColor: ''});

const updateTheme = (aqiValue: number) => {
  if (aqiValue <= 50) {
    // Soft green
    aqiCardStyle.value = {backgroundColor: '#b4de71', color: '#364222'};
    aqiNumCardStyle.value = {backgroundColor: '#94bf52'};
    level.value = 'ดี';
  } else if (aqiValue <= 100) {
    // Soft yellow
    aqiCardStyle.value = {backgroundColor: '#f8e473', color: '#4a401e'};
    aqiNumCardStyle.value = {backgroundColor: '#e7c047'};
    level.value = 'ปานกลาง';
  } else if (aqiValue <= 150) {
    // Warm orange
    aqiCardStyle.value = {backgroundColor: '#f1a064', color: '#48301e'};
    aqiNumCardStyle.value = {backgroundColor: '#e38443'};
    level.value = 'มีผลกระทบต่อผู้ป่วยหรือร่างกายอ่อนแอ';
  } else if (aqiValue <= 200) {
    // Muted red
    aqiCardStyle.value = {backgroundColor: '#ec736e', color: '#ffffff'};
    aqiNumCardStyle.value = {backgroundColor: '#d75755'};
    level.value = 'มีผลกระทบต่อทุกคน';
  } else if (aqiValue <= 300) {
    // Vibrant purple
    aqiCardStyle.value = {backgroundColor: '#9a5fb5', color: '#ffffff'};
    aqiNumCardStyle.value = {backgroundColor: '#835f99'};
    level.value = 'มีผลกระทบต่อทุกคนอย่างรุนแรง';
  } else {
    // Deep maroon
    aqiCardStyle.value = {backgroundColor: '#a07583', color: '#ffffff'};
    aqiNumCardStyle.value = {backgroundColor: '#895e6c'};
    level.value = 'อันตราย';
  }
};


// Watch the AQI value and update the theme dynamically
watch(aqi, (newAqi) => {
  updateTheme(newAqi);
});

// Initialize the theme
updateTheme(aqi.value);
</script>

<template>
  <div
      class="rounded-2xl shadow-md max-w-[360px] z-10 overflow-hidden"
      :style="aqiCardStyle"
  >
    <div class="p-4">
      <div class="flex gap-3 items-center">
        <div class="flex flex-col bg-yellow-400 rounded-2xl px-4 py-2"
             :style="aqiNumCardStyle">
          <div class="text-3xl font-semibold text-center">
            {{ aqi }}
          </div>
          <div class="text-xs mt-1">US AQI</div>
        </div>
        <div class="text-2xl font-bold">{{ level }}</div>
      </div>
      <div class="mt-4 flex flex-row gap-4 justify-between mr-10">
        <div>
          สารมลพิษหลัก: {{ pollutant }}
        </div>
        <div>
          {{ concentration }} µg/m³
        </div>
      </div>
    </div>
    <div class="mt-4 px-6 flex justify-between text-gray-700 bg-white min-h-[44px] font-semibold">
      <div class="flex items-center">
        <img class="max-w-[32px]" src="https://www.airvisual.com/images/01d.png" alt=""/>
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
  </div>
</template>

<style scoped>
</style>
