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
    const blockText = $('.region-content-main div:nth-of-type(1) div.has-sidebar').text().trim();
    const forecastText = $('.city-forecast:nth-of-type(n+3)').text().trim();
    const conditionsText = $('.city-conditions').text().trim();
    const astronomyText = $('.city-astronomy').text().trim();
    
    res.json({ 
      sidebarText: blockText,
      forecastText: forecastText,
      conditionsText: conditionsText,
      astronomyText: astronomyText
    });
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