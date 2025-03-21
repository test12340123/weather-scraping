const axios = require('axios');
const cheerio = require('cheerio');

async function getHourlyForecast() {
    try {
        const url = 'https://www.wunderground.com/hourly/ca/winnipeg';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        const hourlyData = [];
        
        $('#hourly-forecast-table tr.mat-row').each((i, element) => {
            const row = $(element);
            const hourlyEntry = {
                time: row.find('td:nth-child(1)').text().trim(),
                temperature: row.find('td:nth-child(2)').text().trim(),
                feels: row.find('td:nth-child(3)').text().trim(),
                precipitation: row.find('td:nth-child(4)').text().trim(),
                cloudCover: row.find('td:nth-child(5)').text().trim(),
                humidity: row.find('td:nth-child(6)').text().trim(),
                wind: row.find('td:nth-child(7)').text().trim()
            };
            hourlyData.push(hourlyEntry);
        });

        return hourlyData;
    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
        throw error;
    }
}

module.exports = {
    getHourlyForecast
};
