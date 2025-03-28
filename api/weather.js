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
    
    const weatherResponse = await axios.get(weatherUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(weatherResponse.data);

    const currentConditions = {
      timestamp: $('div:contains("access_time")').first().text().trim(),
      temperature: {
        current: $('div.temp').first().text().trim(),
        feels_like: $('div:contains("like")').first().text().trim()
      },
      conditions: $('div:contains("Cloudy")').first().text().trim(),
      wind: {
        direction: $('div:contains("N")').first().text().trim(),
        gusts: $('div:contains("Gusts")').first().text().trim()
      }
    };

    const forecast = {
      today: {
        high: $('div:contains("High")').first().text().trim(),
        precipitation: $('div:contains("Precip")').first().text().trim(),
        description: $('div:contains("Cloudy skies")').first().text().trim()
      },
      tonight: {
        low: $('div:contains("Low")').first().text().trim(),
        precipitation: $('div:contains("Precip")').eq(1).text().trim(),
        description: $('div:contains("Cloudy with snow")').first().text().trim()
      }
    };

    const weatherData = {
      current: currentConditions,
      forecast: forecast,
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
