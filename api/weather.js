const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const app = express();

app.get("/api/weather", async (req, res) => {
  try {
    const hourlyUrl = "https://www.wunderground.com/hourly/ca/winnipeg";
    
    const response = await axios.get(hourlyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.wunderground.com/'
      }
    });

    const $ = cheerio.load(response.data);

    // Debug: Log the entire HTML to see what's being received
    console.log("Full HTML Content:", response.data.substring(0, 1000));

    // Multiple potential selectors to try
    const hourlySelectors = [
      '#hourly-forecast-table tbody tr',
      '.table-hourly tr',
      '.hourly-table tr',
      '.wx-data-table tr'
    ];

    let hourlyText = '';
    let selectorFound = false;

    hourlySelectors.forEach(selector => {
      const rows = $(selector);
      if (rows.length > 0) {
        selectorFound = true;
        rows.each((i, row) => {
          let rowText = '';
          $(row).find('td').each((j, cell) => {
            const cellText = $(cell).text().trim();
            rowText += cellText + ' | ';
          });
          hourlyText += rowText.trim() + '\n';
        });
      }
    });

    if (!selectorFound) {
      console.error("No matching selectors found. HTML structure might have changed.");
      hourlyText = "Could not retrieve hourly forecast data.";
    }

    res.json({
      hourlyForecast: hourlyText.trim(),
      timestamp: new Date().toLocaleTimeString()
    });

  } catch (error) {
    console.error('Hourly Forecast Scraping Error:', error.message);
    res.status(500).json({ 
      error: "Failed to fetch hourly forecast", 
      details: error.message 
    });
  }
});

module.exports = app;
