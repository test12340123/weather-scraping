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

    let hourlyText1 = '';
    let hourlyText2 = '';
    let hourlyText3 = '';
    let hourlyText4 = '';
    let hourlyText5 = '';

    let hourlyForecastData = [];

    try {
        // Method 1: Direct text extraction
        hourlyText1 = hourly$('.small-12.columns.scrollable').text().trim();

        // Method 2: Iterate over children and concatenate text
        hourly$('.small-12.columns.scrollable').children().each((i, el) => {
            hourlyText2 += hourly$(el).text().trim() + ' ';
        });
        hourlyText2 = hourlyText2.trim();

        // Method 3: Select all text nodes and join them
        let textNodes = hourly$('.small-12.columns.scrollable').contents().filter(function() {
            return this.nodeType === 3; // Text node
        });
        hourlyText3 = textNodes.map(function() {
            return hourly$(this).text().trim();
        }).get().join(' ');

        // Method 4: Using .map() to extract text
        hourlyText4 = hourly$('.small-12.columns.scrollable').children().map((i, el) => {
            return hourly$(el).text().trim();
        }).get().join(' ');

        // Method 5: Using .each() to build an array of text
        let hourlyTextArray = [];
        hourly$('.small-12.columns.scrollable').children().each((i, el) => {
            hourlyTextArray.push(hourly$(el).text().trim());
        });
        hourlyText5 = hourlyTextArray.join(' ');

        // Extract structured hourly forecast data
        hourly$('#hourly-forecast-table tbody tr').each((i, row) => {
            const time = hourly$(row).find('.time').text().trim();
            const temperature = hourly$(row).find('.temperature').text().trim();
            const description = hourly$(row).find('.description').text().trim();
            const precipitation = hourly$(row).find('.precipitation').text().trim();

            hourlyForecastData.push({
                time: time,
                temperature: temperature,
                description: description,
                precipitation: precipitation
            });
        });


    } catch (error) {
        console.error("Error scraping hourly forecast:", error);
        const fallbackMessage = "Error: Could not retrieve hourly forecast data.";
        hourlyText1 = fallbackMessage + " (Method 1)";
        hourlyText2 = fallbackMessage + " (Method 2)";
        hourlyText3 = fallbackMessage + " (Method 3)";
        hourlyText4 = fallbackMessage + " (Method 4)";
        hourlyText5 = fallbackMessage + " (Method 5)";
        hourlyForecastData = fallbackMessage + " (Structured Data)";
    }

    const weatherData = {
      rawText: weatherText,
      hourlyForecast1: hourlyText1,
      hourlyForecast2: hourlyText2,
      hourlyForecast3: hourlyText3,
      hourlyText4: hourlyText4,
      hourlyText5: hourlyText5,
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
