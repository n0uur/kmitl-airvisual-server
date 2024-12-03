// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const Data = require('./models/Data');

const app = express();
const port = 3100;
const apiUrl = 'http://api.airvisual.com/v2/nearest_city?lat=13.721434635446425&lon=100.78113540955499&key=a10a5cc7-e04a-46e5-b2e4-f1d79bf8200c';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/airvisual', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Function to fetch and update data every 10 minutes
const fetchAndUpdateData = async () => {
    try {
        const response = await axios.get(apiUrl);
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
        await Data.findOneAndReplace({}, newData, {upsert: true});
        console.log('Data updated successfully');
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// Fetch and update data every 10 minutes
cron.schedule('*/10 * * * *', fetchAndUpdateData);

// Initial fetch on server start
fetchAndUpdateData();

// Enable CORS for all routes
app.use(cors());

// Route to get stored data
app.get('/', async (req, res) => {
    try {
        const data = await Data.findOne({});
        if (!data) {
            return res.status(404).json({message: 'No data found'});
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({message: 'Error fetching data', error});
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
