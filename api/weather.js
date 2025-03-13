const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        const { city = 'winnipeg' } = req.query;
        const url = `https://www.wunderground.com/weather/ca/${city}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Scrape weather data
        const temperature = $('.wu-value-to').first().text();
        const humidity = $('.wu-unit-humidity').first().text();
        const windSpeed = $('.wu-value-to').eq(3).text();
        const pressure = $('.wu-value-to').eq(4).text();

        res.json({
            temperature,
            humidity,
            windSpeed,
            pressure
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
};