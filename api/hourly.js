const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

async function getHourlyForecast() {
    try {
        const url = 'https://www.wunderground.com/hourly/ca/winnipeg';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        
        // More specific selector targeting the table content
        const tableContent = $('.hourly-forecast-table wu-table table').text();
        if (!tableContent) {
            throw new Error('No table content found');
        }
        return tableContent;
    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
        throw error;
    }
}

// Create API endpoint
app.get('/api/hourly', async (req, res) => {
    try {
        const data = await getHourlyForecast();
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    } catch (error) {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Export the server instead of just the function
module.exports = app;

// Start the server if running directly
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
