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
        // Add timeout of 10 seconds to wait for page load
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const hourlyData = [];
        
        // Log the HTML to debug
        console.log('Page HTML structure:', $.html('#hourly-forecast-table'));
        
        // Updated selectors to match the dynamic content
        $('table[id="hourly-forecast-table"] tbody tr').each((i, row) => {
            const $row = $(row);
            
            const time = $row.find('td[class*="timeHour"]').text().trim();
            const temp = $row.find('td[class*="temperature"] span.wu-value-to').first().text().trim();
            const conditions = $row.find('td[class*="conditions"] span.conditions').first().text().trim();
            const feelsLike = $row.find('td[class*="feelsLike"] span.wu-value-to').first().text().trim();
            const precipitation = $row.find('td[class*="precipitation"] span.wu-value-to').first().text().trim();
            const humidity = $row.find('td[class*="humidity"] span.wu-value-to').first().text().trim();
            const wind = $row.find('td[class*="wind"]').text().trim();
            
            console.log('Processing row:', { time, temp, conditions }); // Debug log
            
            if (time) {
                hourlyData.push({
                    time,
                    temperature: temp ? `${temp}°C` : 'N/A',
                    conditions: conditions || 'N/A',
                    feelsLike: feelsLike ? `${feelsLike}°C` : 'N/A',
                    precipitation: precipitation ? `${precipitation}%` : 'N/A',
                    humidity: humidity ? `${humidity}%` : 'N/A',
                    wind: wind || 'N/A'
                });
            }
        });
        
        if (hourlyData.length === 0) {
            console.error('No hourly data found');
            res.status(404).json({ error: "No hourly forecast data available" });
            return;
        }
        
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