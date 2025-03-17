// Express.js server for web scraping API on Vercel
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

app.get("/api/weather", async (req, res) => {
  try {
    const url = "https://www.wunderground.com/weather/ca/downtown-winnipeg/49.90,-97.14";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const weatherBlock = $(".region-content-main div:nth-of-type(1) div.has-sidebar").text().trim();
    
    // Parse the weather string
    const tempMatch = weatherBlock.match(/(\d+)°/);
    const windMatch = weatherBlock.match(/(\d+)\s*Gusts\s*(\d+)/);
    const conditionMatch = weatherBlock.match(/(\w+)N\d/); // Matches condition before wind direction
    
    const weatherData = {
      temperature: tempMatch ? tempMatch[1] : "--",
      humidity: "N/A", // Weather Underground doesn't provide humidity in this block
      windSpeed: windMatch ? windMatch[2] : "--",
      pressure: "N/A", // Weather Underground doesn't provide pressure in this block
      condition: conditionMatch ? conditionMatch[1] : "Unknown"
    };
    
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

module.exports = app;