const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        // Set default URL for Winnipeg
        const url = 'https://www.wunderground.com/weather/ca/winnipeg';
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);

        // Updated selectors specific to Winnipeg page
        const temperature = $('.wu-value-to').first().text().trim();
        const humidity = $('.wu-value').eq(1).text().trim();
        const windSpeed = $('.wind-speed').first().text().trim();
        const pressure = $('.pressure-value').first().text().trim();

        // Log the scraped data for debugging
        console.log('Scraped data:', { temperature, humidity, windSpeed, pressure });

        res.json({
            city: 'Winnipeg',
            temperature: temperature || '--',
            humidity: humidity || '--',
            windSpeed: windSpeed || '--',
            pressure: pressure || '--',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Scraping error:', {
            message: error.message,
            stack: error.stack,
            url: 'https://www.wunderground.com/weather/ca/winnipeg'
        });
        
        res.status(500).json({ 
            error: 'Failed to fetch weather data',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};