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
    const hourlyUrl = "https://www.wunderground.com/hourly/ca/winnipeg";
    
    const [weatherResponse, hourlyResponse] = await Promise.all([
      axios.get(weatherUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }),
      axios.get(hourlyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    ]);
    
    const weather$ = cheerio.load(weatherResponse.data);
    const hourly$ = cheerio.load(hourlyResponse.data);

    let weatherText = '';
    weather$('.region-content-main div:nth-of-type(1) div.has-sidebar').children().each((i, el) => {
      weatherText += weather$(el).text().trim() + ' ';
    });
    weatherText = weatherText.trim();

    let hourlyText1 = '';
    let hourlyText2 = '';
    let hourlyText3 = '';

    try {
        // Method 1: Direct text extraction
        hourlyText1 = hourly$('.small-12.columns.scrollable').text().trim();

        // Method 2: Iterate over children and concatenate text
        hourly$('.small-12.columns.scrollable').children().each((i, el) => {
            hourlyText2 += hourly$(el).text().trim() + ' ';
        });
        hourlyText2 = hourlyText2.trim();

        // Method 3: Select all text nodes and join them
        let textNodes = hourly$('.small-12.columns.scrollable').contents().filter(function() {
            return this.nodeType === 3; // Text node
        });
        hourlyText3 = textNodes.map(function() {
            return hourly$(this).text().trim();
        }).get().join(' ');


    } catch (error) {
        console.error("Error scraping hourly forecast:", error);
        hourlyText1 = "Error: Could not retrieve hourly forecast data (Method 1).";
        hourlyText2 = "Error: Could not retrieve hourly forecast data (Method 2).";
        hourlyText3 = "Error: Could not retrieve hourly forecast data (Method 3).";
    }

    const weatherData = {
      rawText: weatherText,
      hourlyForecast1: hourlyText1,
      hourlyForecast2: hourlyText2,
      hourlyForecast3: hourlyText3,
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
