// Express.js server for web scraping API on Vercel
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get("/api/weather", async (req, res) => {
  try {
    const weatherUrl = "https://www.wunderground.com/weather/ca/winnipeg";
    const healthUrl = "https://www.wunderground.com/health/ca/winnipeg";
    
    const [weatherResponse, healthResponse] = await Promise.all([
      axios.get(weatherUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }),
      axios.get(healthUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    ]);
    
    const weather$ = cheerio.load(weatherResponse.data);
    const health$ = cheerio.load(healthResponse.data);
    
    // Updated weather selectors
    const temperature = weather$('.wu-value-to').first().text().trim();
    const condition = weather$('.condition-icon').text().trim();
    const feelsLike = weather$('.feels-like').text().trim();
    const humidity = weather$('[data-variable="humidity"] .wu-value').text().trim();
    const wind = weather$('[data-variable="wind"] .wu-value').text().trim();
    
    const airQualityText = health$('div.air-quality-index').text().trim();
    const pollenText = health$('div.pollen-section').text().trim();
    
    const weatherData = {
      temperature,
      condition,
      feelsLike,
      humidity,
      wind,
      airQuality: airQualityText,
      pollen: pollenText,
      timestamp: new Date().toLocaleTimeString(),
      source: "Weather Underground"
    };
    
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API Error:', error.message);
    res.status(500).json({ error: "Failed to fetch Winnipeg weather data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
