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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
