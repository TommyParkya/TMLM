const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.mixmods.com.br';
const MAX_PAGES = 10;
const OUTPUT_FILE = path.join(__dirname, 'data.json');

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' };

const gameKeywords = {
    SA: ['[SA]', 'san andreas', '/sa/'],
    VC: ['[VC]', 'vice city', '/vc/'],
    III: ['[III]', 'gta 3', '/iii/']
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
            const articles = $('article');

            if (articles.length === 0) break;

            for (const article of articles) {
                const $article = $(article);
                const titleElement = $article.find('h2.entry-title a');
                const rawTitle = titleElement.text().trim();
                const lowerTitle = rawTitle.toLowerCase();
                const categoryLinks = $article.find('span.cat-links a').map((_, el) => $(el).attr('href')).get().join(' ');

                let game = null;
                for (const [gameCode, keywords] of Object.entries(gameKeywords)) {
                    if (keywords.some(kw => lowerTitle.includes(kw) || categoryLinks.includes(kw))) {
                        game = gameCode;
                        break;
                    }
                }

                if (!game) {
                    console.log(`[SKIPPED] ${rawTitle} - Not a 3D Universe mod.`);
                    continue;
                }

                const modPageUrl = titleElement.attr('href');
                if (!modPageUrl || processedUrls.has(modPageUrl)) continue;
                processedUrls.add(modPageUrl);

                const uploadDate = $article.find('time.entry-date.published').attr('datetime');
                
                let modPageHtml;
                try {
                    modPageHtml = (await axios.get(modPageUrl, { headers })).data;
                } catch (e) { continue; }

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
                const thumbnailUrl = $$('div.entry-content img').first().attr('src') || $article.find('div.post-image a img').attr('src') || 'assets/placeholder.png';
                
                let platform = 'PC';
                if (lowerTitle.includes('mobile') || lowerTitle.includes('android')) platform = 'Mobile';
                else if (lowerTitle.includes('ps2')) platform = 'PS2';
                else if (rawTitle.includes('DE') || lowerTitle.includes('definitive edition')) platform = 'DE';

                const finalTitle = rawTitle.replace(/^\[(SA|VC|III)\]\s*/, '');
                
                allMods.push({ title: finalTitle, game, platform, modPageUrl, thumbnailUrl, description, uploadDate, downloadLinks });
                console.log(`[ADDED] [${game}] ${finalTitle}`);
            }
        } catch (error) {
            console.error(`FATAL ERROR on page ${i}:`, error.message);
            process.exit(1);
        }
    }

    if (allMods.length > 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allMods, null, 2));
        console.log(`\nScraping complete. Found ${allMods.length} mods.`);
    } else {
        console.log('\nScraping finished, but no mods were collected.');
        process.exit(1);
    }
}

scrapeMixMods();
