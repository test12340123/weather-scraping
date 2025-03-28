app.get("/api/weather", async (req, res) => {
  try {
    const weatherUrl = "https://www.wunderground.com/weather/ca/winnipeg";
    const hourlyUrl = "https://www.wunderground.com/hourly/ca/winnipeg";
    
    const browser = await puppeteer.launch(); // Recommended over cheerio
    const page = await browser.newPage();
    
    // Set a more sophisticated user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the page and wait for content to load
    await page.goto(hourlyUrl, { waitUntil: 'networkidle0' });
    
    // Wait for the specific selector that contains hourly forecast
    await page.waitForSelector('.hourly-table', { timeout: 5000 });
    
    const hourlyText = await page.evaluate(() => {
      const rows = document.querySelectorAll('.hourly-table tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => cell.textContent.trim()).join(' | ');
      }).join('\n');
    });
    
    await browser.close();

    const weatherData = {
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
