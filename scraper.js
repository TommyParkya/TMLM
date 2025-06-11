// scraper.js
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs/promises');

const log = (level, message) => console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`);

const GAME_TAGS_MAP = { 'gta-sao-andreas-mods': '[SA]', 'gta-vice-city-mods': '[VC]', 'gta-3-mods': '[III]' };
const VERSION_TAGS_MAP = { 'pc': '[PC]', 'mobile': '[Mobile]', 'the-definitive-edition-trilogy': '[DE]', 'ps2': '[PS2]' };

function getTagsFromCategories($, categoryLinks) {
    const tags = { game: '', version: '' };
    categoryLinks.each((i, el) => {
        const href = $(el).attr('href') || '';
        const slug = href.split('/').filter(Boolean).pop() || '';
        if (GAME_TAGS_MAP[slug]) tags.game = GAME_TAGS_MAP[slug];
        if (VERSION_TAGS_MAP[slug]) tags.version = VERSION_TAGS_MAP[slug];
    });
    return tags;
}

async function scrapeMixmods() {
    log('info', 'Starting MixMods scraper with Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessary for GitHub Actions
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');

    const baseUrl = "https://www.mixmods.com.br";
    let allMods = [];
    let pageNum = 1;
    let keepScraping = true;

    while (keepScraping) {
        const listUrl = `${baseUrl}/page/${pageNum}`;
        log('info', `Scraping list page: ${listUrl}`);

        try {
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            const content = await page.content();
            const $ = cheerio.load(content);
            const validArticles = $('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (validArticles.length === 0) {
                log('info', `No more valid mod articles found on page ${pageNum}. Ending scrape.`);
                keepScraping = false;
                continue;
            }

            for (const articlePreview of validArticles) {
                const articleElement = $(articlePreview);
                const modData = {};

                try {
                    const titleTag = articleElement.find('h2.entry-title a');
                    if (!titleTag.attr('href')) continue;
                    
                    modData.modPageUrl = titleTag.attr('href');
                    const originalTitle = titleTag.text().trim();

                    log('info', `     Visiting mod page: ${modData.modPageUrl}`);
                    await page.goto(modData.modPageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
                    const modPageContent = await page.content();
                    const $$ = cheerio.load(modPageContent);

                    const contentArea = $$('div.entry-content');
                    const downloadLinks = contentArea.find('a.download_bt1, a:has(img[src*="download-baixar-4532137.png"])');

                    if (downloadLinks.length === 0) {
                        log('warning', `     DISCARDED: ${originalTitle} (No download link found after render)`);
                        continue;
                    }
                    
                    modData.id = modData.modPageUrl.split('/').filter(Boolean).pop();
                    modData.uploadDate = $$('time.entry-date.published').attr('datetime') || new Date().toISOString();
                    modData.thumbnailUrl = $$('meta[property="og:image"]').attr('content') || "";
                    
                    const categoryLinks = $$('span.cat-links a');
                    const tags = getTagsFromCategories($$, categoryLinks);
                    modData.gameTag = tags.game;
                    modData.versionTag = tags.version;

                    let newTitle = $$('h1.entry-title').text().trim();
                    if (tags.game && !newTitle.includes(tags.game)) newTitle = `${tags.game} ${newTitle}`;
                    if (tags.version && !newTitle.includes(tags.version)) newTitle = `${tags.version} ${newTitle}`;
                    modData.title = newTitle;
                    
                    const firstP = contentArea.find('p').first();
                    modData.description = firstP.text().trim() || "No description found.";

                    modData.downloadLinks = [];
                    downloadLinks.each((i, el) => {
                        const link = $$(el);
                        const url = link.attr('href');
                        if (url && url !== '#' && !url.startsWith('javascript:')) {
                            const isImageButton = link.find('img').length > 0;
                            modData.downloadLinks.push({
                                displayText: isImageButton ? (link.find('img').attr('alt') || 'Download') : link.text().trim(),
                                url: url
                            });
                        }
                    });

                    if (modData.downloadLinks.length > 0) {
                        allMods.push(modData);
                        log('info', `     ADDED: ${modData.title}`);
                    } else {
                        log('warning', `     DISCARDED: ${originalTitle} (Found link tags but no valid href)`);
                    }

                } catch (articleError) {
                    log('error', `    !! Error processing article ${modData.modPageUrl}: ${articleError.message}`);
                }
            }
            pageNum++;
        } catch (error) {
            log('error', `Error on page ${pageNum}: ${error.message}`);
            keepScraping = false;
        }
    }
    
    await browser.close();
    log('info', `\nScraping complete. Found ${allMods.length} valid mods.`);

    try {
        await fs.writeFile('data.json', JSON.stringify(allMods, null, 2), 'utf-8');
        log('info', 'Successfully saved mod data to data.json');
    } catch (error) {
        log('error', `Failed to write to data.json: ${error.message}`);
    }
}

scrapeMixmods();
