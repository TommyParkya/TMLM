const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.mixmods.com.br';
const MAX_PAGES = 10;
const OUTPUT_FILE = path.join(__dirname, 'data.json');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
};

const categoryWhitelist = new Set(['/sa/', '/vc/', '/iii/']);

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
            const articles = $('article');

            if (articles.length === 0) {
                console.log('No more articles found on this page. Ending scrape.');
                break;
            }

            for (const article of articles) {
                const $article = $(article);
                const titleElement = $article.find('h2.entry-title a');
                const rawTitle = titleElement.text().trim();
                
                // --- THE FIX: Two-stage whitelist check ---
                let isWhitelisted = false;
                
                // Stage 1: Check category links first.
                $article.find('span.cat-links a').each((_, link) => {
                    const href = $(link).attr('href');
                    for (const allowed of categoryWhitelist) {
                        if (href.includes(allowed)) {
                            isWhitelisted = true;
                            return false;
                        }
                    }
                });

                // Stage 2: If categories didn't match, check the title as a fallback.
                if (!isWhitelisted) {
                    if (rawTitle.startsWith('[SA]') || rawTitle.startsWith('[VC]') || rawTitle.startsWith('[III]')) {
                        isWhitelisted = true;
                    }
                }

                if (!isWhitelisted) {
                    console.log(`[SKIPPED] ${rawTitle} - Reason: Not a 3D Universe mod.`);
                    continue;
                }

                const modPageUrl = titleElement.attr('href');
                if (!modPageUrl || processedUrls.has(modPageUrl)) continue;
                processedUrls.add(modPageUrl);

                const uploadDate = $article.find('time.entry-date.published').attr('datetime');
                
                let modPageHtml;
                try {
                    const response = await axios.get(modPageUrl, { headers });
                    modPageHtml = response.data;
                } catch (modPageError) {
                    continue;
                }

                const $$ = cheerio.load(modPageHtml);
                const downloadElements = $$('a.download_bt1, a:has(.download_bt1), a:has(img[src*="download-baixar"])');
                if (downloadElements.length === 0) continue;

                const downloadLinks = [];
                downloadElements.each((_, el) => {
                    const url = $$(el).attr('href');
                    if (url) downloadLinks.push({ url });
                });
                
                if (downloadLinks.length === 0) continue;

                const description = $$('div.entry-content > p').first().text().trim();
                const thumbnailUrl = $$('div.entry-content img').first().attr('src') || $article.find('div.post-image a img').attr('src');
                
                let gameTag = '';
                let platform = 'PC';
                const lowerTitle = rawTitle.toLowerCase();

                if (lowerTitle.includes('mobile') || lowerTitle.includes('android')) platform = 'Mobile';
                else if (lowerTitle.includes('ps2')) platform = 'PS2';
                else if (lowerTitle.includes('definitive edition') || (lowerTitle.includes(' de ') && !lowerTitle.includes(' de '))) platform = 'DE';

                $article.find('span.cat-links a').each((_, link) => {
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
                console.log(`[ADDED] ${finalTitle}`);
            }
        } catch (error) {
            console.error(`FATAL ERROR: Could not fetch page ${i}. The website may be blocking requests.`);
            console.error('Error details:', error.message);
            process.exit(1);
        }
    }

    if (allMods.length > 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allMods, null, 2));
        console.log(`\nScraping complete. Found ${allMods.length} mods. Data saved to ${OUTPUT_FILE}.`);
    } else {
        console.log('\nScraping finished, but no mods were collected. data.json was not created.');
        process.exit(1);
    }
}

scrapeMixMods();
