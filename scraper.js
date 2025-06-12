const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const MAX_PAGES = 5; // Set a max number of pages to scrape to avoid being blocked
const baseUrl = 'https://www.mixmods.com.br';

async function scrapeMixMods() {
    let mods = [];
    console.log('Starting scraper...');

    for (let i = 1; i <= MAX_PAGES; i++) {
        try {
            console.log(`Scraping page ${i}...`);
            const { data } = await axios.get(`${baseUrl}/page/${i}`);
            const $ = cheerio.load(data);

            const modEntries = $('h2.entry-title a');

            for (const element of modEntries) {
                const modUrl = $(element).attr('href');
                const modData = await scrapeModPage(modUrl);
                if (modData) {
                    mods.push(modData);
                }
            }
        } catch (error) {
            console.error(`Error scraping page ${i}:`, error.message);
            break; // Stop if a page fails to load
        }
    }

    fs.writeFileSync('mods.json', JSON.stringify(mods, null, 2));
    console.log(`Scraping finished. ${mods.length} mods saved to mods.json`);
}

async function scrapeModPage(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const title = $('h1.entry-title').text().trim();
        let description = '';
        let images = [];
        let downloadLinks = [];
        let date = new Date($('time.entry-date').attr('datetime'));

        // Extract description and images
        $('.entry-content').contents().each((i, el) => {
            if ($(el).is('p')) {
                description += $(el).text().trim() + '\n';
            }
            if ($(el).is('img')) {
                images.push($(el).attr('src'));
            }
        });
        
        // Extract download links
        $('a[href*="mediafire.com"], a[href*="googledrive.com"], a[href*="mega.nz"]').each((i, el) => {
             const link = $(el).attr('href');
             const urlObject = new URL(link);
             downloadLinks.push({
                 url: link,
                 host: urlObject.hostname
             });
        });
        
        // Remove duplicate links
        downloadLinks = [...new Map(downloadLinks.map(item => [item['url'], item])).values()];


        return {
            title,
            url,
            date,
            description: description.slice(0, 300) + (description.length > 300 ? '...' : ''), // Truncate description
            thumbnail: images.length > 0 ? images[0] : '', // Use first image as thumbnail
            images,
            downloadLinks,
            isFeatured: Math.random() < 0.1 // Randomly feature a mod for demonstration
        };
    } catch (error) {
        console.error(`Error scraping mod page ${url}:`, error.message);
        return null;
    }
}

scrapeMixMods();
