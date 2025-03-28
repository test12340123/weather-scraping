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

    let hourlyText = '';
    hourly$('div#hourly-forecasts div.row').each((i, el) => { // Select each row in the hourly forecasts
        let rowText = '';
        hourly$(el).find('div').each((j, cell) => { // Select each cell in the row
            rowText += hourly$(cell).text().trim() + ' | '; // Append cell text with a separator
        });
        hourlyText += rowText.trim() + '\n'; // Append row text with a newline
    });
    hourlyText = hourlyText.trim();

    const weatherData = {
      rawText: weatherText,
      hourlyForecast: hourlyText,
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
