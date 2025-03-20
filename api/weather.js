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
    
    // Helper functions
    const fahrenheitToCelsius = (f) => Math.round((f - 32) * 5 / 9);
    const extractTemperature = (text) => {
      const celsiusMatch = text.match(/(-?\d+)\s*°C/);
      const fahrenheitMatch = text.match(/(-?\d+)\s*°F/);
      return celsiusMatch ? parseInt(celsiusMatch[1]) : 
             fahrenheitMatch ? fahrenheitToCelsius(parseInt(fahrenheitMatch[1])) : null;
    };
    
    // Extract data using regex
    const currentTemp = extractTemperature(blockText);
    const feelsLike = blockText.match(/like\s*(-?\d+)°/);
    const condition = blockText.match(/(Cloudy|Clear|Rain|Snow|Partly cloudy|Mostly cloudy|Overcast)[^\d]*/i);
    
    // Updated wind patterns to handle both km/h and mph
    const windMatch = blockText.match(/([NEWS])\s*(\d+)(?:\s*Gusts\s*(\d+))?\s*°?(mph|km\/h)/i);
    const windDirection = windMatch?.[1] || '';
    const windSpeed = windMatch?.[2] || '';
    const windGusts = windMatch?.[3] || '';
    const isMetric = windMatch?.[4]?.toLowerCase() === 'km/h';
    
    // Convert wind speeds if needed
    const convertWind = (speed) => isMetric ? speed : Math.round(speed * 1.60934);
    
    const precipitation = blockText.match(/(\d+)%\s*Precip/);
    const updateTime = blockText.match(/Updated\s*(.*?)(?:\s*ago)?/);
    
    // Extract detailed weather info
    const airQuality = blockText.match(/AIR QUALITY\s*(Good|Moderate|Poor|Unknown)/i)?.[1] || 'Unknown';
    const uvIndex = blockText.match(/UV INDEX\s*(Low|Moderate|High|Very High|Extreme)/i)?.[1] || 'Unknown';
    
    const weatherData = {
      temperature: currentTemp !== null ? `${currentTemp}°C` : '--',
      feelsLike: feelsLike ? `${feelsLike[1]}°C` : '--',
      condition: condition ? condition[1].trim() : 'Unknown',
      windSpeed: windSpeed ? `${windDirection}${convertWind(parseInt(windSpeed))} km/h` : '--',
      windGusts: windGusts ? `${convertWind(parseInt(windGusts))} km/h` : '--',
      precipitation: precipitation ? `${precipitation[1]}%` : '0%',
      pollen: blockText.match(/POLLEN.*?(\w+)/i)?.[1] || 'None',
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