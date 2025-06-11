// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs/promises');

// Basic logging to see progress in the console
const log = (level, message) => console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`);

async function scrapeMixmods() {
    log('info', 'Starting MixMods scraper...');
    const baseUrl = "https://www.mixmods.com.br";
    const allMods = [];
    let pageNum = 1;
    let keepScraping = true;

    // Use an axios instance for session-like behavior (e.g., cookies, headers)
    const session = axios.create({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    while (keepScraping) {
        const listUrl = `${baseUrl}/page/${pageNum}`;
        log('info', `Scraping list page: ${listUrl}`);

        try {
            const response = await session.get(listUrl, { timeout: 20000 });
            const $ = cheerio.load(response.data);

            // STAGE 1: The Combined Filter Selector (from Guide.txt)
            const validArticles = $('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (validArticles.length === 0) {
                log('info', `No more valid mod articles found on page ${pageNum}. Ending scrape.`);
                keepScraping = false;
                continue;
            }

            // Using a for...of loop to handle async operations correctly inside the loop
            for (const articlePreview of validArticles) {
                const modData = {};
                const articleElement = $(articlePreview);
                
                try {
                    // STAGE 2: Loop and Preliminary Data Extraction
                    const titleTag = articleElement.find('h2.entry-title a');
                    if (!titleTag.attr('href')) continue;

                    modData.title = titleTag.text().trim();
                    modData.modPageUrl = titleTag.attr('href');
                    modData.id = modData.modPageUrl.split('/').filter(Boolean).pop();

                    log('info', `  -> Found potential mod: ${modData.title}`);
                    
                    const dateTag = articleElement.find('time.entry-date.published');
                    modData.uploadDate = dateTag.attr('datetime') || new Date().toISOString();

                    const thumbTag = articleElement.find('div.post-image a img');
                    modData.thumbnailUrl = thumbTag.attr('src') || "";

                    // STAGE 3: The Final Download Filter
                    log('info', `     Visiting mod page: ${modData.modPageUrl}`);
                    const modPageResponse = await session.get(modData.modPageUrl, { timeout: 20000 });
                    const $$ = cheerio.load(modPageResponse.data);

                    const downloadButtonA = $$('.download_bt1');
                    const downloadButtonB = $$('a img[src*="download-baixar-4532137.png"]');

                    if (downloadButtonA.length === 0 && downloadButtonB.length === 0) {
                        log('warning', `     SKIPPING - No valid download link found on page.`);
                        continue;
                    }
                    
                    log('info', `     SUCCESS - Valid download link found. Extracting final data.`);
                    
                    // STAGE 4: Final Data Extraction
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

                    allMods.push(modData);

                } catch (articleError) {
                    log('error', `    !! Error processing an article: ${articleError.message}`);
                }
            } // end for loop
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
        // STAGE 2.5: Final Output Generation
        await fs.writeFile('data.json', JSON.stringify(allMods, null, 2), 'utf-8');
        log('info', 'Successfully saved mod data to data.json');
    } catch (error) {
        log('error', `Failed to write to data.json: ${error.message}`);
    }
}

scrapeMixmods();