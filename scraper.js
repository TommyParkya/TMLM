// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs/promises');

const log = (level, message) => console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`);

const GAME_TAGS_MAP = {
    'gta-sao-andreas-mods': '[SA]',
    'gta-vice-city-mods': '[VC]',
    'gta-3-mods': '[III]'
};

const VERSION_TAGS_MAP = {
    'pc': '[PC]',
    'mobile': '[Mobile]',
    'the-definitive-edition-trilogy': '[DE]',
    'ps2': '[PS2]'
};

function getTagsFromCategories($, categoryLinks) {
    const tags = { game: '', version: '' };
    categoryLinks.each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        const slug = href.split('/').filter(Boolean).pop();
        if (GAME_TAGS_MAP[slug]) {
            tags.game = GAME_TAGS_MAP[slug];
        }
        if (VERSION_TAGS_MAP[slug]) {
            tags.version = VERSION_TAGS_MAP[slug];
        }
    });
    return tags;
}

async function scrapeMixmods() {
    log('info', 'Starting MixMods scraper...');
    const baseUrl = "https://www.mixmods.com.br";
    let allMods = [];
    let pageNum = 1;
    let keepScraping = true;

    const session = axios.create({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        }
    });

    while (keepScraping) {
        const listUrl = `${baseUrl}/page/${pageNum}`;
        log('info', `Scraping list page: ${listUrl}`);

        try {
            const response = await session.get(listUrl, { timeout: 30000 });
            const $ = cheerio.load(response.data);
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

                    const originalTitle = titleTag.text().trim();
                    modData.modPageUrl = titleTag.attr('href');
                    modData.id = modData.modPageUrl.split('/').filter(Boolean).pop();
                    
                    const dateTag = articleElement.find('time.entry-date.published');
                    modData.uploadDate = dateTag.attr('datetime') || new Date().toISOString();

                    const thumbTag = articleElement.find('div.post-image a img');
                    modData.thumbnailUrl = thumbTag.attr('src') || "";
                    
                    const categoryLinks = articleElement.find('span.cat-links a');
                    const tags = getTagsFromCategories($, categoryLinks);
                    modData.gameTag = tags.game;
                    modData.versionTag = tags.version;

                    let newTitle = originalTitle;
                    if (tags.game && !newTitle.includes(tags.game)) {
                        newTitle = `${tags.game} ${newTitle}`;
                    }
                    if (tags.version && !newTitle.includes(tags.version)) {
                        newTitle = `${tags.version} ${newTitle}`;
                    }
                    modData.title = newTitle;

                    log('info', `     Visiting mod page: ${modData.modPageUrl}`);
                    const modPageResponse = await session.get(modData.modPageUrl, { timeout: 30000 });
                    const $$ = cheerio.load(modPageResponse.data);

                    const downloadButtonA = $$('a.download_bt1');
                    const downloadButtonB = $$('a img[src*="download-baixar-4532137.png"]');

                    if (downloadButtonA.length === 0 && downloadButtonB.length === 0) {
                        log('warning', `     DISCARDED: ${originalTitle} (No download link)`);
                        continue;
                    }

                    const entryContent = $$('div.entry-content');
                    const firstP = entryContent.find('p').first();
                    modData.description = firstP.text().trim() || "No description found.";

                    modData.downloadLinks = [];
                    downloadButtonA.each((i, el) => {
                        const link = $$(el);
                        modData.downloadLinks.push({
                            displayText: link.text().trim(),
                            url: link.attr('href')
                        });
                    });
                    downloadButtonB.each((i, el) => {
                        const link = $$(el).closest('a');
                        if (link.attr('href')) {
                            modData.downloadLinks.push({
                                displayText: $$(el).attr('alt') || 'Download',
                                url: link.attr('href')
                            });
                        }
                    });

                    allMods.push(modData);
                    log('info', `     ADDED: ${modData.title}`);

                } catch (articleError) {
                    log('error', `    !! Error processing article: ${articleError.message}`);
                }
            }
            pageNum++;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                log('warning', "Reached end of pages (404 Not Found).");
            } else {
                log('error', `Error fetching list page ${listUrl}: ${error.message}`);
            }
            keepScraping = false;
        }
    }

    log('info', `\nScraping complete. Found ${allMods.length} valid mods.`);

    try {
        await fs.writeFile('data.json', JSON.stringify(allMods, null, 2), 'utf-8');
        log('info', 'Successfully saved mod data to data.json');
    } catch (error) {
        log('error', `Failed to write to data.json: ${error.message}`);
    }
}

scrapeMixmods();
