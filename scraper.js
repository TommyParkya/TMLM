// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseUrl = 'https://www.mixmods.com.br';
// Set a reasonable limit to avoid running forever in case of an issue.
const MAX_PAGES_TO_SCRAPE = 25; 

async function scrapeData() {
    console.log('Starting MixMods scraper...');
    const allMods = [];

    for (let pageNum = 1; pageNum <= MAX_PAGES_TO_SCRAPE; pageNum++) {
        try {
            const listPageUrl = `${baseUrl}/page/${pageNum}`;
            console.log(`Scraping page ${pageNum}: ${listPageUrl}`);

            const { data: listHtml } = await axios.get(listPageUrl);
            const $ = cheerio.load(listHtml);

            // STAGE 1: Use the powerful selector to get only articles that are NOT news.
            const articles = $('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (articles.length === 0) {
                console.log(`No more articles found on page ${pageNum}. Ending scrape.`);
                break;
            }

            // Process all valid articles on the page concurrently.
            const pagePromises = articles.map(async (index, element) => {
                const mod = {};

                // STAGE 2: Extract preliminary data from the list page.
                const header = $(element);
                const titleElement = header.find('h2.entry-title a');
                
                mod.title = titleElement.text().trim();
                mod.modPageUrl = titleElement.attr('href');
                mod.uploadDate = header.find('time.published').attr('datetime');
                mod.thumbnailUrl = header.find('.post-image img').attr('src');

                // Ensure we have the essential URLs before proceeding.
                if (!mod.modPageUrl || !mod.thumbnailUrl) {
                    return null;
                }

                try {
                    // STAGE 3: Visit the mod page to check for a download button.
                    const { data: detailHtml } = await axios.get(mod.modPageUrl);
                    const $$ = cheerio.load(detailHtml);

                    const downloadButton1 = $$('.download_bt1');
                    const downloadButton2 = $$('img[src*="download-baixar-4532137.png"]');

                    if (downloadButton1.length === 0 && downloadButton2.length === 0) {
                        // No download button found, discard this article.
                        return null;
                    }

                    // STAGE 4: Since it's a valid mod, get the final details.
                    mod.description = $$('.entry-content p').first().text().trim();
                    mod.downloadLinks = [];

                    // Find all download links and extract their info.
                    $$('.download_bt1 a, a:has(img[src*="download-baixar-4532137.png"])').each((i, linkEl) => {
                        const link = $$(linkEl);
                        mod.downloadLinks.push({
                            displayText: link.text().trim() || 'Download', // Use "Download" as fallback text
                            url: link.attr('href')
                        });
                    });
                    
                    console.log(`  -> Processed: ${mod.title}`);
                    return mod;

                } catch (detailError) {
                    console.error(`  -> Failed to fetch details for ${mod.modPageUrl}: ${detailError.message}`);
                    return null;
                }
            }).get();

            const pageMods = (await Promise.all(pagePromises)).filter(mod => mod !== null);
            allMods.push(...pageMods);

        } catch (error) {
            console.error(`Error scraping page ${pageNum}: ${error.message}`);
            // Stop if a page fails to load.
            break;
        }
    }

    // Final step: Save the data to a JSON file.
    fs.writeFileSync('data.json', JSON.stringify(allMods, null, 2));
    console.log(`\nScraping complete! Saved ${allMods.length} mods to data.json`);
}

scrapeData();