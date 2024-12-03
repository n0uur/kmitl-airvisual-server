// models/Data.js
const mongoose = require('mongoose');

const pollutionSchema = new mongoose.Schema({
    ts: String,
    aqius: Number,
    mainus: String,
    aqicn: Number,
    maincn: String,
});

const weatherSchema = new mongoose.Schema({
    ts: String,
    tp: Number,
    pr: Number,
    hu: Number,
    ws: Number,
    wd: Number,
    ic: String,
});

const locationSchema = new mongoose.Schema({
    type: String,
    coordinates: [Number],
});

const dataSchema = new mongoose.Schema({
    city: String,
    state: String,
    country: String,
    location: locationSchema,
    pollution: pollutionSchema,
    weather: weatherSchema,
});

const Data = mongoose.model('Data', dataSchema);
module.exports = Data;
