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

    let hourlyForecastData = [];

    try {
        hourly$('#hourly-forecast-table tbody tr').each((i, row) => {
            const time = hourly$(row).find('.cdk-column-timeHour span:first-child').text().trim();
            const conditions = hourly$(row).find('.cdk-column-conditions img').attr('alt');
            const temperature = hourly$(row).find('.cdk-column-temperature .wu-value-to').text().trim();
            const feelsLike = hourly$(row).find('.cdk-column-feelsLike .wu-value-to').text().trim();
            const precipitation = hourly$(row).find('.cdk-column-precipitation .wu-value-to').text().trim();
            const amount = hourly$(row).find('.cdk-column-liquidPrecipitation .wu-value-to').text().trim();
            const cloudCover = hourly$(row).find('.cdk-column-cloudCover .wu-value-to').text().trim();
            const dewPoint = hourly$(row).find('.cdk-column-dewPoint .wu-value-to').text().trim();
            const humidity = hourly$(row).find('.cdk-column-humidity .wu-value-to').text().trim();
            const wind = hourly$(row).find('.cdk-column-wind .wu-value-to').text().trim();
            const pressure = hourly$(row).find('.cdk-column-pressure .wu-value-to').text().trim();

            hourlyForecastData.push({
                time: time,
                conditions: conditions,
                temperature: temperature,
                feelsLike: feelsLike,
                precipitation: precipitation,
                amount: amount,
                cloudCover: cloudCover,
                dewPoint: dewPoint,
                humidity: humidity,
                wind: wind,
                pressure: pressure
            });
        });

    } catch (error) {
        console.error("Error scraping hourly forecast:", error);
        hourlyForecastData = "Error: Could not retrieve hourly forecast data (Structured Data).";
    }

    const weatherData = {
      rawText: weatherText,
      hourlyForecastData: hourlyForecastData,
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
