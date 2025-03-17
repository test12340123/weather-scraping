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
    res.json({ weather: weatherBlock });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

module.exports = app;