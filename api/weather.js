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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scrapeWeatherData = async (retries = 3, delayMs = 2000) => {
  const url = "https://www.wunderground.com/weather/ca/winnipeg";
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Wait for dynamic content to load
      await delay(delayMs);
      
      const $ = cheerio.load(data);
      
      // Get temperature and validate
      const tempText = $('.wu-value-to').first().text().trim();
      const tempMatch = tempText.match(/-?\d+/);
      const tempCelsius = tempMatch ? parseInt(tempMatch[0]) : null;
      
      // Only proceed if we have valid temperature
      if (!tempCelsius && attempt < retries) {
        console.log(`Invalid temperature on attempt ${attempt}, retrying...`);
        continue;
      }
      
      const temperature = tempCelsius ? Math.round((tempCelsius * 9/5) + 32).toString() : "--";
      const condition = $('.condition-icon').first().text().trim();
      const windText = $('.wind-speed').first().text().trim();
      const windMatch = windText.match(/(\d+)\s*km\/h/);
      const windKmh = windMatch ? parseInt(windMatch[1]) : null;
      const windSpeed = windKmh ? Math.round(windKmh * 0.621371).toString() : "--";

      // Get other weather data
      const precipitation = $('.precip').first().text().trim();
      const pollen = $('.pollen-level').first().text().trim() || 'None';
      const airQuality = $('.aqi-value').first().text().trim();
      const uvIndex = $('.uv-index').first().text().trim();
      const forecast = $('.forecast-link').first().text().trim();
      const updateTime = $('.timestamp').first().text().trim();

      return {
        temperature,
        windSpeed,
        condition: condition || "Unknown",
        precipitation: precipitation || "0%",
        pollen,
        airQuality: airQuality || "Good",
        uvIndex: uvIndex || "Moderate",
        forecast: forecast || "No forecast available",
        updateTime: updateTime || "Unknown",
        source: "Weather Underground"
      };
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await delay(delayMs);
    }
  }
  throw new Error("Failed to get stable weather data");
};

app.get("/api/weather", async (req, res) => {
  try {
    const weatherData = await scrapeWeatherData();
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
