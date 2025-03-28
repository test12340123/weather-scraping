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
    
    const weatherResponse = await axios.get(weatherUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(weatherResponse.data);

    // Keep original scraping method for raw text
    let weatherText = '';
    $('.region-content-main div:nth-of-type(1) div.has-sidebar').children().each((i, el) => {
      weatherText += $(el).text().trim() + ' ';
    });
    weatherText = weatherText.trim();

    const weatherData = {
      rawText: weatherText,
      structured: {
        current: {
          time: weatherText.match(/access_time (.*?) \|/)?.[1] || '',
          temperature: {
            current: weatherText.match(/(-?\d+)°\s*\|\s*(-?\d+)°/)?.[1] || '',
            feels_like: weatherText.match(/like\s*(-?\d+)°/)?.[1] || '',
            unit: '°C'
          },
          conditions: weatherText.match(/(?:Cloudy|Clear|Sunny|Rain|Snow)[^\n]*/)?.[0] || '',
          wind: {
            direction: weatherText.match(/[NEWS]\d+/)?.[0] || '',
            gusts: weatherText.match(/Gusts\s*(\d+\s*km\/h)/)?.[1] || ''
          }
        },
        forecast: {
          today: {
            date: weatherText.match(/Today\s*([\w\s]+\d{2}\/\d{2})/)?.[1] || '',
            high: weatherText.match(/High\s*(-?\d+)\s*°C/)?.[1] || '',
            precipitation: {
              chance: weatherText.match(/(\d+)%\s*Precip/)?.[1] || '',
              amount: weatherText.match(/Precip\.\s*\/\s*([\d.]+)/)?.[1] || '0'
            },
            description: weatherText.match(/(?:Today[^]*?)\.\s*([^]*?)\./)?.[1] || ''
          },
          tonight: {
            low: weatherText.match(/Low\s*(-?\d+)\s*°C/)?.[1] || '',
            precipitation: {
              chance: weatherText.match(/Tonight[^]*?(\d+)%\s*Precip/)?.[1] || '',
              amount: weatherText.match(/Tonight[^]*?Precip\.\s*\/\s*([\d.]+)/)?.[1] || '0'
            },
            description: weatherText.match(/Tonight[^]*?\.\s*([^]*?)\./)?.[1] || ''
          },
          tomorrow: {
            date: weatherText.match(/Tomorrow\s*([\w\s]+\d{2}\/\d{2})/)?.[1] || '',
            temperatures: weatherText.match(/Tomorrow[^]*?(-?\d+)\s*\|\s*(-?\d+)\s*°C/)?.[1] || '',
            precipitation: {
              chance: weatherText.match(/Tomorrow[^]*?(\d+)%\s*Precip/)?.[1] || '',
              amount: weatherText.match(/Tomorrow[^]*?Precip\.\s*\/\s*([\d.]+)/)?.[1] || '0'
            },
            description: weatherText.match(/Tomorrow[^]*?\.\s*([^]*?)\./)?.[1] || ''
          }
        },
        conditions: {
          precipitation: {
            chance: weatherText.match(/PRECIPITATION\s*(\d+)%/)?.[1] || '',
            forecast: weatherText.match(/PRECIPITATION[^]*?(\d+[^]*?hours)/)?.[1] || ''
          },
          pollen: weatherText.match(/POLLEN\s*([^\n]+)/)?.[1] || '',
          airQuality: {
            status: weatherText.match(/AIR QUALITY\s*([^\n]+)/)?.[1] || '',
            index: weatherText.match(/Air Quality Index\s*(\d+)/)?.[1] || ''
          },
          uv: {
            level: weatherText.match(/UV INDEX\s*([^\n]+)/)?.[1] || '',
            value: weatherText.match(/Daytime UV\s*(\d+)/)?.[1] || ''
          }
        }
      },
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
