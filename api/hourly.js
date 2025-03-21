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
    
    // Debug: Log the structure of the table container
    const tableContainer = $('#hourly-forecast-table').parent().html();
    if (!tableContainer) {
      console.error("Table container not found. Logging HTML for debugging:");
      console.log($.html());
      return res.status(500).send("Error: Unable to locate the hourly forecast table.");
    }

    $('#hourly-forecast-table tr.mat-row').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length === 0) {
        console.error(`Row ${i} has no cells. Skipping.`);
        return;
      }

      hourlyData.push([
        $(cells[0]).text().trim(),
        $(cells[1]).find('.conditions').text().trim(),
        `${$(cells[2]).find('.wu-value').text().trim()}°C`,
        `Feels ${$(cells[3]).find('.wu-value').text().trim()}°C`,
        `${$(cells[4]).find('.wu-value').text().trim()}% precip`,
        `${$(cells[6]).find('.wu-value').text().trim()}% clouds`,
        `${$(cells[8]).find('.wu-value').text().trim()}% humidity`,
        $(cells[9]).text().trim()
      ].join(' | '));
    });

    if (hourlyData.length === 0) {
      console.error("No data extracted. Check the selectors or the website structure.");
      return res.status(500).send("Error: No hourly forecast data found.");
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send(hourlyData.join('\n'));
  } catch (error) {
    console.error('Hourly Weather API Error:', error.message);
    res.status(500).send(`Error: Failed to fetch Winnipeg hourly weather data`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
