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
    
    // Helper function to convert F to C
    const fahrenheitToCelsius = (f) => Math.round((f - 32) * 5 / 9);
    
    // Extract data using regex
    const currentTemp = blockText.match(/(\d+)\s*°F\s*like/);
    const feelsLike = blockText.match(/like\s*(\d+)°/);
    const condition = blockText.match(/(Cloudy|Clear|Rain|Snow|Partly cloudy|Mostly cloudy|Overcast)[^\d]*/i);
    const windMatch = blockText.match(/N(\d+)\s*Gusts\s*(\d+)/);
    const precipitation = blockText.match(/(\d+)%\s*Precip/);
    const updateTime = blockText.match(/Updated\s*(.*?)\s*ago/);
    
    const weatherData = {
      temperature: currentTemp ? `${fahrenheitToCelsius(parseInt(currentTemp[1]))}°C` : '--',
      feelsLike: feelsLike ? `${fahrenheitToCelsius(parseInt(feelsLike[1]))}°C` : '--',
      condition: condition ? condition[1].trim() : 'Unknown',
      windSpeed: windMatch ? `${windMatch[1]} km/h` : '--',
      windGusts: windMatch ? `${windMatch[2]} km/h` : '--',
      precipitation: precipitation ? `${precipitation[1]}%` : '0%',
      pollen: blockText.includes('POLLEN') ? (blockText.match(/POLLEN\s*(.*?)\s*AIR/)?.[1] || 'None') : 'None',
      airQuality: blockText.includes('AIR QUALITY') ? (blockText.match(/AIR QUALITY\s*(.*?)\s*Air/)?.[1] || 'Unknown') : 'Unknown',
      uvIndex: blockText.includes('UV INDEX') ? (blockText.match(/UV INDEX\s*(.*?)$/m)?.[1] || 'Unknown') : 'Unknown',
      lastUpdate: updateTime ? updateTime[1] : 'Unknown',
      rawText: blockText // Keep for debugging
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