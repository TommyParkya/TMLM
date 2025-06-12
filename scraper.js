const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://www.mixmods.com.br';
const MAX_PAGES = 10; // Set to a low number for testing

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
};

async function scrapeMixMods() {
    console.log('Starting scraper...');
    const allMods = [];
    const processedUrls = new Set();

    for (let i = 1; i <= MAX_PAGES; i++) {
        const pageUrl = `${BASE_URL}/page/${i}`;
        console.log(`\n--- Scraping Page ${i}: ${pageUrl} ---`);

        try {
            const { data: pageHtml } = await axios.get(pageUrl, { headers });
            const $ = cheerio.load(pageHtml);
            const articles = $('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (articles.length === 0) {
                console.log('No more articles found. Ending scrape.');
                break;
            }

            for (const article of articles) {
                const $article = $(article);
                const titleElement = $article.find('h2.entry-title a');
                const rawTitle = titleElement.text().trim();
                const modPageUrl = titleElement.attr('href');

                if (!modPageUrl || processedUrls.has(modPageUrl)) continue;
                processedUrls.add(modPageUrl);

                const uploadDate = $article.find('time.entry-date.published').attr('datetime');
                const thumbnailUrl = $article.find('div.post-image a img').attr('src');

                let modPageHtml;
                try {
                    const response = await axios.get(modPageUrl, { headers });
                    modPageHtml = response.data;
                } catch (modPageError) {
                    console.log(`[SKIPPED] ${rawTitle} - Reason: Failed to fetch mod page ${modPageUrl}`);
                    continue;
                }

                const $$ = cheerio.load(modPageHtml);
                const downloadElements = $$('a.download_bt1, a:has(.download_bt1), a:has(img[src="https://www.mixmods.com.br/wp-content/uploads/2021/11/download-baixar-4532137.png"])');

                if (downloadElements.length === 0) {
                    console.log(`[SKIPPED] ${rawTitle} - Reason: No download link found`);
                    continue;
                }

                const downloadLinks = [];
                downloadElements.each((_, el) => {
                    const $el = $$(el);
                    const url = $el.attr('href');
                    let displayText = $el.text().trim();

                    if (!displayText) {
                        const img = $el.find('img');
                        if (img.length) {
                            displayText = img.attr('alt').trim();
                        }
                    }
                    
                    // --- FIX: Clean up the button text ---
                    // If the text is empty or looks like a filename, default to "Download".
                    if (!displayText || displayText.includes('download-baixar')) {
                        displayText = 'Download';
                    }

                    if (url) {
                        downloadLinks.push({ displayText, url });
                    }
                });
                
                if (downloadLinks.length === 0) {
                     console.log(`[SKIPPED] ${rawTitle} - Reason: Found download buttons but could not extract links.`);
                     continue;
                }

                const description = $$('div.entry-content > p').first().text().trim();
                let gameTag = '';
                const categoryLinks = $article.find('span.cat-links a');
                categoryLinks.each((_, link) => {
                    const href = $(link).attr('href');
                    if (href.includes('/sa/')) { gameTag = '[SA]'; return false; }
                    if (href.includes('/vice-city/')) { gameTag = '[VC]'; return false; }
                    if (href.includes('/iii/')) { gameTag = '[III]'; return false; }
                });

                if (!gameTag) {
                    const lowerTitle = rawTitle.toLowerCase();
                    if (lowerTitle.includes('san andreas')) gameTag = '[SA]';
                    else if (lowerTitle.includes('vice city')) gameTag = '[VC]';
                    else if (lowerTitle.includes('gta 3') || lowerTitle.includes('gta iii')) gameTag = '[III]';
                }

                const finalTitle = gameTag ? `${gameTag} ${rawTitle}` : rawTitle;
                allMods.push({ title: finalTitle, modPageUrl, thumbnailUrl, description, uploadDate: new Date(uploadDate).toISOString(), downloadLinks });
                console.log(`[ADDED] ${finalTitle}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Page ${i} returned 404. Scraper has reached the end.`);
            } else {
                console.error(`An error occurred on page ${i}:`, error.message);
            }
            break;
        }
    }

    if (allMods.length > 0) {
        fs.writeFileSync('data.json', JSON.stringify(allMods, null, 2));
        console.log(`\nScraping complete. Found ${allMods.length} mods. Data saved to data.json.`);
    } else {
        console.log('\nScraping finished, but no mods were collected. The data.json file was not created.');
    }
}

scrapeMixMods();
