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
    
    // Try different selector approaches for forecast
    const forecastBlocks = {
      // Try direct class approach
      byClass: $('.forecast-wrap').text().trim(),
      // Try nested approach
      nested: $('.region-content-main .forecast-wrap').text().trim(),
      // Try alternative selectors
      alt1: $('[class*="forecast"]').text().trim(),
      alt2: $('.wu-forecast').text().trim(),
      // Try getting individual days
      days: $('.wu-forecast-item').map((i, el) => $(el).text().trim()).get(),
      // Log element count
      elementCount: $('.forecast-wrap').length,
      // Try getting full HTML to inspect structure
      pageStructure: $('body').html()
    };
    
    const conditionsText = $('.wu-current-conditions').text().trim();
    const astronomyText = $('.astronomy').text().trim();
    
    res.json({ 
      sidebarText: blockText,
      forecastBlocks: forecastBlocks,
      conditionsText: conditionsText,
      astronomyText: astronomyText,
      debug: {
        url: url,
        status: 'completed'
      }
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