const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://www.mixmods.com.br';
const MAX_PAGES = 10;

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
                const listPageThumbnail = $article.find('div.post-image a img').attr('src');

                let modPageHtml;
                try {
                    const response = await axios.get(modPageUrl, { headers });
                    modPageHtml = response.data;
                } catch (modPageError) {
                    console.log(`[SKIPPED] ${rawTitle} - Reason: Failed to fetch mod page`);
                    continue;
                }

                const $$ = cheerio.load(modPageHtml);
                const downloadElements = $$('a.download_bt1, a:has(.download_bt1), a:has(img[src*="download-baixar"])');

                if (downloadElements.length === 0) {
                    console.log(`[SKIPPED] ${rawTitle} - Reason: No download link found`);
                    continue;
                }

                const downloadLinks = [];
                downloadElements.each((_, el) => {
                    const url = $$(el).attr('href');
                    if (url) downloadLinks.push({ url });
                });
                
                if (downloadLinks.length === 0) {
                     console.log(`[SKIPPED] ${rawTitle} - Reason: Could not extract links.`);
                     continue;
                }

                const description = $$('div.entry-content > p').first().text().trim();
                const highQualityThumbnail = $$('div.entry-content img').first().attr('src');
                const thumbnailUrl = highQualityThumbnail || listPageThumbnail;
                
                let gameTag = '';
                let platform = 'PC';
                const lowerTitle = rawTitle.toLowerCase();

                if (lowerTitle.includes('mobile') || lowerTitle.includes('android')) platform = 'Mobile';
                else if (lowerTitle.includes('ps2')) platform = 'PS2';
                else if (lowerTitle.includes('definitive edition') || lowerTitle.includes(' de ')) platform = 'DE';

                const categoryLinks = $article.find('span.cat-links a');
                categoryLinks.each((_, link) => {
                    const href = $(link).attr('href');
                    if (href.includes('/sa/')) { gameTag = '[SA]'; return false; }
                    if (href.includes('/vice-city/')) { gameTag = '[VC]'; return false; }
                    if (href.includes('/iii/')) { gameTag = '[III]'; return false; }
                });

                if (!gameTag) {
                    if (lowerTitle.includes('san andreas')) gameTag = '[SA]';
                    else if (lowerTitle.includes('vice city')) gameTag = '[VC]';
                    else if (lowerTitle.includes('gta 3') || lowerTitle.includes('gta iii')) gameTag = '[III]';
                }

                const finalTitle = gameTag ? `${gameTag} ${rawTitle}` : rawTitle;
                allMods.push({ title: finalTitle, platform, modPageUrl, thumbnailUrl, description, uploadDate: new Date(uploadDate).toISOString(), downloadLinks });
                console.log(`[ADDED] ${finalTitle} (${platform})`);
            }
        } catch (error) {
            console.error(`An error occurred on page ${i}:`, error.message);
            break;
        }
    }

    if (allMods.length > 0) {
        fs.writeFileSync('data.json', JSON.stringify(allMods, null, 2));
        console.log(`\nScraping complete. Found ${allMods.length} mods. Data saved to data.json.`);
    } else {
        console.log('\nScraping finished, but no mods were collected.');
    }
}

scrapeMixMods();
