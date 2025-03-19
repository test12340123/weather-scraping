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
    const url = "https://www.wunderground.com/weather/ca/winnipeg";
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    
    // Helper functions
    const fahrenheitToCelsius = (f) => Math.round((f - 32) * 5 / 9);
    const mphToKmh = (mph) => Math.round(mph * 1.60934);
    
    // Use CSS selectors for better accuracy
    const currentTemp = $('.wu-value-to').first().text().trim();
    const condition = $('.condition-icon').first().text().trim();
    const windText = $('.wind-speed').first().text().trim();
    const windDirection = windText.match(/([NEWS][NEWS]?)/)?.[1] || '';
    const windSpeed = windText.match(/(\d+)/)?.[1] || '';
    
    const precipitation = $('.precip').first().text().trim();
    const pollen = $('.pollen-level').first().text().trim() || 'None';
    const airQuality = $('.aqi-value').first().text().trim();
    const uvIndex = $('.uv-index').first().text().trim();
    const updateTime = $('.timestamp').first().text().trim();
    
    const weatherData = {
      temperature: currentTemp ? `${fahrenheitToCelsius(parseInt(currentTemp))}°C` : '--',
      condition: condition || 'Unknown',
      windSpeed: windSpeed ? `${windDirection}${mphToKmh(parseInt(windSpeed))} km/h` : '--',
      precipitation: precipitation || '0%',
      pollen: pollen,
      airQuality: airQuality || 'Good',
      uvIndex: uvIndex || 'Moderate',
      lastUpdate: updateTime || 'Unknown',
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