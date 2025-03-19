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
    
    // Updated selectors and parsing logic
    const tempCelsius = $('.wu-value-to').first().text().trim().replace('°C', '');
    const temperature = tempCelsius ? Math.round((parseFloat(tempCelsius) * 9/5) + 32).toString() : "--";
    
    const condition = $('.condition-icon, .condition-text').first().text().trim();
    const windText = $('.wind-speed, .wind-text').first().text().trim();
    const windSpeed = windText.match(/(\d+)\s*km\/h/)?.[1] || "--";
    const windSpeedMph = windSpeed !== "--" ? Math.round(parseInt(windSpeed) * 0.621371).toString() : "--";
    
    // Improved data extraction
    const precipitation = $('.precip, .precipitation-text').first().text().match(/(\d+)%/)?.[1] + "%" || "0%";
    const pollen = $('.pollen-level, .pollen-text').first().text().trim() || 'None';
    const airQuality = $('.aqi-value, .air-quality-text').first().text().trim() || 'Good';
    const uvIndex = $('.uv-index, .uv-text').first().text().match(/UV\s*(\d+)/)?.[1] || 'Moderate';
    
    // Get forecast from the forecast section
    const forecast = $('.forecast-link, .forecast-text').first().text().trim()
      || $('.tomorrow-forecast').first().text().trim()
      || "No forecast available";
    
    // Get update time
    const updateTime = $('.timestamp, .update-time').first().text().trim()
      || new Date().toLocaleString('en-US', { 
          timeZone: 'America/Winnipeg',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
          timeZoneName: 'short'
        });
    
    const weatherData = {
      temperature,
      windSpeed: windSpeedMph,
      condition,
      precipitation,
      pollen,
      airQuality,
      uvIndex,
      forecast,
      updateTime,
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
