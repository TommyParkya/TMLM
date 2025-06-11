const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs/promises');

const log = (level, message) => console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`);

const GAME_TAGS = {
    "GTA San Andreas": "[SA]",
    "GTA Vice City": "[VC]",
    "GTA III": "[III]"
};

const VERSION_TAGS = {
    "PC": "[PC]",
    "Mobile": "[Mobile]",
    "Definitive Edition": "[DE]",
    "PS2": "[PS2]"
};

function addTagToTitle(title, tagMap) {
    for (const [key, tag] of Object.entries(tagMap)) {
        if (title.toLowerCase().includes(key.toLowerCase()) && !title.includes(tag)) {
            return `${tag} ${title}`;
        }
    }
    return title;
}

async function scrapeMixmods() {
    log('info', 'Starting MixMods scraper...');
    const baseUrl = "https://www.mixmods.com.br";
    let allMods = [];
    let pageNum = 1;
    let keepScraping = true;

    const session = axios.create({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
                const modData = {};
                const articleElement = $(articlePreview);
                
                try {
                    const titleTag = articleElement.find('h2.entry-title a');
                    if (!titleTag.attr('href')) continue;

                    let originalTitle = titleTag.text().trim();
                    modData.modPageUrl = titleTag.attr('href');
                    modData.id = modData.modPageUrl.split('/').filter(Boolean).pop();
                    
                    const dateTag = articleElement.find('time.entry-date.published');
                    modData.uploadDate = dateTag.attr('datetime') || new Date().toISOString();

                    const thumbTag = articleElement.find('div.post-image a img');
                    modData.thumbnailUrl = thumbTag.attr('src') || "";

                    log('info', `     Visiting mod page: ${modData.modPageUrl}`);
                    const modPageResponse = await session.get(modData.modPageUrl, { timeout: 30000 });
                    const $$ = cheerio.load(modPageResponse.data);

                    const downloadButtonA = $$('.download_bt1');
                    const downloadButtonB = $$('a img[src*="download-baixar-4532137.png"]');

                    if (downloadButtonA.length === 0 && downloadButtonB.length === 0) {
                        log('warning', `     DISCARDED: ${originalTitle} (No download link)`);
                        continue;
                    }
                    
                    const entryContent = $$('div.entry-content');
                    const firstP = entryContent.find('p').first();
                    modData.description = firstP.text().trim() || "No description found.";

                    modData.downloadLinks = [];
                    $$('a.download_bt1').each((i, el) => {
                        modData.downloadLinks.push({
                            displayText: $(el).text().trim(),
                            url: $(el).attr('href')
                        });
                    });

                    downloadButtonB.each((i, el) => {
                        const link = $(el).closest('a');
                        if (link.attr('href')) {
                            modData.downloadLinks.push({
                                displayText: $(el).attr('alt') || 'Download',
                                url: link.attr('href')
                            });
                        }
                    });

                    // Add game and version tags to title
                    let newTitle = addTagToTitle(originalTitle, GAME_TAGS);
                    newTitle = addTagToTitle(newTitle, VERSION_TAGS);
                    modData.title = newTitle;

                    allMods.push(modData);
                    log('info', `     ADDED: ${modData.title}`);

                } catch (articleError) {
                    log('error', `    !! Error processing an article: ${articleError.message}`);
                }
            }
            pageNum++;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                log('warning', "Reached end of pages (404 Not Found).");
            } else {
                log('error', `Error fetching page ${listUrl}: ${error.message}`);
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
