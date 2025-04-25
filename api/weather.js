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

app.get("/api/fruits", async (req, res) => {
  try {
    // First, get the list of all fruits
    const mainUrl = "https://blox-fruits.fandom.com/wiki/Blox_Fruits";
    const mainResponse = await axios.get(mainUrl);
    const main$ = cheerio.load(mainResponse.data);
    
    // Get all fruit names from the itemList div
    const fruitNames = [];
    main$('#itemList').find('a').each((i, el) => {
      const fruitName = main$(el).text().trim();
      if (fruitName) fruitNames.push(fruitName);
    });

    // Scrape details for each fruit
    const fruitsData = [];
    for (const fruitName of fruitNames) {
      try {
        const fruitUrl = `https://blox-fruits.fandom.com/wiki/${fruitName}`;
        const fruitResponse = await axios.get(fruitUrl);
        const fruit$ = cheerio.load(fruitResponse.data);

        const fruitData = {
          name: fruit$('h2.pi-title').text().trim(),
          rarity: fruit$('td[data-source="rarity"]').text().trim(),
          moneyCost: fruit$('td[data-source="money"]').text().trim(),
          robuxCost: fruit$('td[data-source="robux"]').text().trim(),
          url: fruitUrl
        };

        fruitsData.push(fruitData);
        
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping ${fruitName}:`, error.message);
      }
    }

    res.json({
      fruits: fruitsData,
      timestamp: new Date().toISOString(),
      total: fruitsData.length
    });

  } catch (error) {
    console.error('Scraping Error:', error.message);
    res.status(500).json({ error: "Failed to fetch Blox Fruits data" });
  }
});

// Add back the weather endpoint
app.get("/api/weather", async (req, res) => {
  try {
    const weatherUrl = "https://www.wunderground.com/weather/ca/winnipeg";
    const response = await axios.get(weatherUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    let weatherText = '';
    $('.region-content-main div:nth-of-type(1) div.has-sidebar').children().each((i, el) => {
      weatherText += $(el).text().trim() + ' ';
    });

    res.json({
      weather: weatherText.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather API Error:', error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
