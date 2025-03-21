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

app.get("/api/hourly", async (req, res) => {
  try {
    const url = "https://www.wunderground.com/hourly/ca/winnipeg";
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const hourlyData = [];
    
    $('#hourly-forecast-table tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const time = $(row).find('.mat-column-timeHour').text().trim();
      const temp = $(row).find('.mat-column-temperature .wu-value-to').text().trim();
      const conditions = $(row).find('.mat-column-conditions .conditions').text().trim();
      const feelsLike = $(row).find('.mat-column-feelsLike .wu-value-to').text().trim();
      const precipitation = $(row).find('.mat-column-precipitation .wu-value-to').text().trim();
      const humidity = $(row).find('.mat-column-humidity .wu-value-to').text().trim();
      const wind = $(row).find('.mat-column-wind').text().trim();
      
      if (time) {
        hourlyData.push({
          time,
          temperature: `${temp}°C`,
          conditions,
          feelsLike: `${feelsLike}°C`,
          precipitation: `${precipitation}%`,
          humidity: `${humidity}%`,
          wind
        });
      }
    });
    
    res.json({ hourlyForecast: hourlyData });
  } catch (error) {
    console.error('Hourly Forecast API Error:', error.message);
    res.status(500).json({ error: "Failed to fetch Winnipeg hourly forecast data" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Hourly forecast server running on port ${PORT}`);
});

module.exports = app;
