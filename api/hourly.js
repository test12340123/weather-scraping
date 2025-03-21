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

    // Select rows from the hourly forecast table
    $('#hourly-forecast-table tr.mat-row').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length > 0) {
        hourlyData.push([
          $(cells[0]).text().trim(), // Time
          $(cells[1]).find('.conditions').text().trim(), // Conditions
          `${$(cells[2]).find('.wu-value').text().trim()}°C`, // Temperature
          `Feels ${$(cells[3]).find('.wu-value').text().trim()}°C`, // Feels Like
          `${$(cells[4]).find('.wu-value').text().trim()}% precip`, // Precipitation
          `${$(cells[6]).find('.wu-value').text().trim()}% clouds`, // Cloud Cover
          `${$(cells[8]).find('.wu-value').text().trim()}% humidity`, // Humidity
          $(cells[9]).text().trim() // Wind
        ].join(" | "));
      }
    });

    if (hourlyData.length === 0) {
      throw new Error("No hourly forecast data found. Check the selectors or the website structure.");
    }

    res.setHeader("Content-Type", "text/plain");
    res.send(hourlyData.join("\n"));
  } catch (error) {
    console.error("Hourly Weather API Error:", error.message);
    res.status(500).send(`Error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
