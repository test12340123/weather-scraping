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
    const timeText = $('.cdk-column-timeHour').text().trim();
    const tempText = $('.cdk-column-temperature').text().trim();
    const conditionsText = $('.cdk-column-conditions').text().trim();
    const precipText = $('.cdk-column-precipitation').text().trim();
    const humidityText = $('.cdk-column-humidity').text().trim();
    const windText = $('.cdk-column-wind').text().trim();
    
    res.json({ 
      timeText,
      tempText,
      conditionsText,
      precipText,
      humidityText,
      windText
    });
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
