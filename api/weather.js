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
    const hourlyUrl = "https://www.wunderground.com/calendar/ca/winnipeg";
    
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
    try {
        hourly$('lib-city-calendar ul.calendar-days li.calendar-day').each((i, day) => {
            const date = hourly$(day).find('div.date').text().trim();
            const phrase = hourly$(day).find('div.phrase').text().trim();
            const high = hourly$(day).find('div.temperature span.hi').text().trim();
            const low = hourly$(day).find('div.temperature span.low').text().trim();
            const precipitation = hourly$(day).find('div.precipitation lib-display-unit span.wu-value').text().trim();

            if (date && phrase && high && low) {
                hourlyText += `Date: ${date}, Phrase: ${phrase}, High: ${high}, Low: ${low}, Precipitation: ${precipitation || '0'}\n`;
            }
        });
        hourlyText = hourlyText.trim();
    } catch (error) {
        console.error("Error scraping hourly forecast:", error);
        hourlyText = "Error: Could not retrieve hourly forecast data.";
    }

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
