const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Main handler function for Vercel
const handler = async (req, res) => {
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
    try {
        hourly$('#hourly-forecast-table tbody tr').each((i, row) => {
            let rowText = '';
            hourly$(row).find('td').each((j, cell) => {
                const cellText = hourly$(cell).text().trim();
                rowText += cellText + ' | ';
            });
            hourlyText += rowText.trim() + '\n';
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
    
    res.status(200).json(weatherData);
  } catch (error) {
    console.error('Weather API Error:', error.message);
    res.status(500).json({ error: "Failed to fetch Winnipeg weather data" });
  }
};

// Export the handler for Vercel
module.exports = handler;
