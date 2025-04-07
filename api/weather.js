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
      // Method 1: Attempt to extract data using a more specific selector
      hourlyText = extractHourlyForecast(hourly$);
      if (!hourlyText) {
        // Method 2: If the first method fails, try a different selector
        hourlyText = extractHourlyForecastAlternative(hourly$);
      }
      if (!hourlyText) {
        // Method 3: If the second method fails, try a simpler selector
        hourlyText = extractHourlyForecastSimple(hourly$);
      }
      if (!hourlyText) {
        hourlyText = "Error: Could not retrieve hourly forecast data.";
      }
    } catch (error) {
      console.error("Error scraping hourly forecast:", error);
      hourlyText = "Error: Could not retrieve hourly forecast data.";
    }

    // Clean up the extracted text
    hourlyText = hourlyText.replace(/\s+/g, ' ').trim();

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

// Helper function to extract hourly forecast data using a specific selector
function extractHourlyForecast(hourly$) {
  try {
    let text = '';
    hourly$('table.calendar-table tbody tr').each((i, row) => {
      hourly$(row).find('td').each((j, cell) => {
        text += hourly$(cell).text().trim() + ' ';
      });
    });
    return text.trim();
  } catch (error) {
    console.error("Error in extractHourlyForecast:", error);
    return '';
  }
}

// Helper function to extract hourly forecast data using an alternative selector
function extractHourlyForecastAlternative(hourly$) {
  try {
    let text = '';
    hourly$('.day-content').each((i, el) => {
      text += hourly$(el).text().trim() + ' ';
    });
    return text.trim();
  } catch (error) {
    console.error("Error in extractHourlyForecastAlternative:", error);
    return '';
  }
}

// Helper function to extract hourly forecast data using a simpler selector
function extractHourlyForecastSimple(hourly$) {
  try {
    return hourly$('lib-city-calendar').text().trim();
  } catch (error) {
    console.error("Error in extractHourlyForecastSimple:", error);
    return '';
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
