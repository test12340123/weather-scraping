const express = require('express');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const app = express();

function findChromePath() {
    const paths = {
        win32: [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
        ],
        linux: [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
        ],
    };

    const possiblePaths = paths[process.platform] || [];
    return possiblePaths.find(path => fs.existsSync(path));
}

async function getHourlyForecast() {
    let browser;
    try {
        const chromePath = findChromePath();
        if (!chromePath) {
            throw new Error('Chrome not found. Please install Chrome browser.');
        }

        browser = await puppeteer.launch({
            headless: "new",
            executablePath: chromePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ],
            ignoreHTTPSErrors: true
        });
        const page = await browser.newPage();
        await page.goto('https://www.wunderground.com/hourly/ca/winnipeg', {
            waitUntil: 'networkidle0'
        });

        // Wait for the table to be visible
        await page.waitForSelector('.hourly-forecast-table', { timeout: 10000 });

        // Get the table content
        const content = await page.evaluate(() => {
            const table = document.querySelector('.hourly-forecast-table');
            return table ? table.textContent : '';
        });

        if (!content) {
            throw new Error('No table content found');
        }

        return content;
    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
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
