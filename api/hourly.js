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

    $('div > div.row.collapse > div.small-12.columns > table.mat-table.cdk-table > tbody tr').each((i, row) => {
      const entry = {
        time: $(row).find('td:nth-child(1) > span:nth-child(1)').text().trim(),
        condition: {
          text: $(row).find('td:nth-child(2) > span:nth-child(1) > span:nth-child(2)').text().trim(),
          icon: $(row).find('td:nth-child(2) > span:nth-child(1) > img:nth-child(1)').attr('src')
        },
        temperature: {
          value: $(row).find('td:nth-child(3) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
          unit: $(row).find('td:nth-child(3) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(2) > span:nth-child(2)').text().trim()
        },
        feelsLike: $(row).find('td:nth-child(4) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
        precipitation: {
          value: $(row).find('td:nth-child(6) > a:nth-child(1) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
          unit: $(row).find('td:nth-child(6) > a:nth-child(1) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(2) > span:nth-child(2)').text().trim()
        },
        cloudCover: $(row).find('td:nth-child(7) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
        dewPoint: $(row).find('td:nth-child(8) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
        humidity: $(row).find('td:nth-child(9) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
        wind: {
          speed: $(row).find('td:nth-child(10) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
          unit: $(row).find('td:nth-child(10) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(2) > span:nth-child(2)').text().trim(),
          direction: $(row).find('td:nth-child(10) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(3)').text().trim()
        },
        pressure: {
          value: $(row).find('td:nth-child(11) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(1)').text().trim(),
          unit: $(row).find('td:nth-child(11) > lib-display-unit:nth-child(1) > span:nth-child(1) > span:nth-child(2) > span:nth-child(2)').text().trim()
        }
      };
      hourlyData.push(entry);
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
