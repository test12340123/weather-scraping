const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get("/api/hourly", async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto("https://www.wunderground.com/hourly/ca/winnipeg", {
      waitUntil: "networkidle2"
    });

    // Wait for the table to load
    await page.waitForSelector("#hourly-forecast-table", { timeout: 15000 });

    // Extract table content
    const hourlyData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("#hourly-forecast-table tr.mat-row"));
      return rows.map(row => {
        const cells = row.querySelectorAll("td");
        return [
          cells[0]?.textContent.trim(),
          cells[1]?.querySelector(".conditions")?.textContent.trim(),
          `${cells[2]?.querySelector(".wu-value")?.textContent.trim()}°C`,
          `Feels ${cells[3]?.querySelector(".wu-value")?.textContent.trim()}°C`,
          `${cells[4]?.querySelector(".wu-value")?.textContent.trim()}% precip`,
          `${cells[6]?.querySelector(".wu-value")?.textContent.trim()}% clouds`,
          `${cells[8]?.querySelector(".wu-value")?.textContent.trim()}% humidity`,
          cells[9]?.textContent.trim()
        ].join(" | ");
      });
    });

    if (!hourlyData.length) {
      throw new Error("No hourly forecast data found.");
    }

    res.setHeader("Content-Type", "text/plain");
    res.send(hourlyData.join("\n"));
  } catch (error) {
    console.error("Hourly Weather API Error:", error.message);
    res.status(500).send(`Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
