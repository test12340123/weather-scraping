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

    // Keep original scraping method for raw text
    let weatherText = '';
    $('.region-content-main div:nth-of-type(1) div.has-sidebar').children().each((i, el) => {
      weatherText += $(el).text().trim() + ' ';
    });
    weatherText = weatherText.trim();

    // Split the raw text into sections for easier reading
    const sections = weatherText.split(/(?=Today|Tonight|Tomorrow)/);
    
    const weatherData = {
      rawText: weatherText,
      formatted: {
        current: sections[0] || '',
        today: sections.find(s => s.startsWith('Today')) || '',
        tonight: sections.find(s => s.startsWith('Tonight')) || '',
        tomorrow: sections.find(s => s.startsWith('Tomorrow')) || ''
      },
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
