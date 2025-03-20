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
    
    // Extract data using regex
    const currentTemp = blockText.match(/(\d+)\s*°F\s*like/);
    const feelsLike = blockText.match(/like\s*(\d+)°/);
    const condition = blockText.match(/(Cloudy|Clear|Rain|Snow|Partly cloudy|Mostly cloudy|Overcast)[^\d]*/i);
    
    // Updated wind pattern to capture direction and speed
    const windDirection = blockText.match(/\b([NEWS][NEWS]?)\d+/)?.[1] || '';
    const windSpeed = blockText.match(/([NEWS][NEWS]?)(\d+)/)?.[2] || '';
    const windGusts = blockText.match(/Gusts\s*(\d+)\s*°?mph/)?.[1] || '';
    
    const precipitation = blockText.match(/(\d+)%\s*Precip/);
    const updateTime = blockText.match(/Updated\s*(.*?)\s*ago/);
    
    // Improved Air Quality and UV Index patterns
    const airQuality = blockText.match(/AIR QUALITY\s*(Good|Moderate|Poor|Unknown)/i)?.[1] || 'Unknown';
    const uvIndex = blockText.match(/UV INDEX\s*(Low|Moderate|High|Very High|Extreme)/i)?.[1] || 'Unknown';
    
    const weatherData = {
      temperature: currentTemp ? `${currentTemp[1]}°F` : '--',
      feelsLike: feelsLike ? `${feelsLike[1]}°F` : '--',
      condition: condition ? condition[1].trim() : 'Unknown',
      windSpeed: windSpeed ? `${windDirection}${windSpeed} mph` : '--',
      windGusts: windGusts ? `${windGusts} mph` : '--',
      precipitation: precipitation ? `${precipitation[1]}%` : '0%',
      pollen: 'None',
      airQuality: airQuality,
      uvIndex: uvIndex,
      lastUpdate: updateTime ? updateTime[1] : 'Unknown',
      rawText: blockText
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