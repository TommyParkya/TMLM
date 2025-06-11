import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'https://www.mixmods.com.br';
const OUTPUT_PATH = path.join('..', 'data.json');

async function main() {
    console.log('--- Starting MixMods Scraper ---');
    const allMods = [];
    let page = 1;
    const maxPages = 50;

    while (page <= maxPages) {
        const listUrl = `${BASE_URL}/page/${page}`;
        console.log(`[Page ${page}] Fetching list: ${listUrl}`);

        try {
            const { data: listHtml } = await axios.get(listUrl);
            const $list = cheerio.load(listHtml);

            const articles = $list('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (articles.length === 0) {
                console.log(`[Page ${page}] No more valid articles found. Stopping.`);
                break;
            }

            for (const element of articles) {
                const article = $list(element);
                const titleElement = article.find('h2.entry-title a');
                const title = titleElement.text().replace(/<font style="vertical-align: inherit;">/g, '').replace(/<\/font>/g, '').trim();
                const modPageUrl = titleElement.attr('href');

                if (!modPageUrl || !title) continue;

                try {
                    const { data: modHtml } = await axios.get(modPageUrl);
                    const $mod = cheerio.load(modHtml);

                    const hasDownloadButton1 = $mod('.download_bt1').length > 0;
                    const hasDownloadButton2 = $mod('a img[src*="download-baixar-4532137.png"]').length > 0;

                    if (!hasDownloadButton1 && !hasDownloadButton2) continue;
                    
                    const uploadDate = article.find('time.entry-date').attr('datetime');
                    const thumbnailUrl = article.find('div.post-image a img').attr('src');
                    const description = $mod('div.entry-content p').first().text().trim();
                    const downloadLinks = [];

                    // --- THIS IS THE CORRECTED, MORE ROBUST SELECTOR ---
                    const selector = 'a.download_bt1, .download_bt1 a, a:has(img[src*="download-baixar-4532137.png"])';

                    $mod(selector).each((i, linkEl) => {
                        const link = $mod(linkEl);
                        const url = link.attr('href');
                        if (url) { // Only add if a URL exists
                            downloadLinks.push({
                                displayText: link.text().trim() || 'Download',
                                url: url
                            });
                        }
                    });
                    
                    console.log(`  -> SUCCESS: Found mod "${title}"`);
                    allMods.push({
                        title,
                        modPageUrl,
                        thumbnailUrl,
                        description,
                        uploadDate,
                        downloadLinks
                    });

                } catch (modPageError) {
                    // Skip this mod if its individual page fails to load
                }
            }
            page++;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`[Page ${page}] Not found. Reached the end of pages.`);
            } else {
                console.error(`[FATAL] Failed to fetch page ${page}: ${error.message}`);
            }
            break;
        }
    }

    if (allMods.length === 0) {
        console.error("[FATAL] No mods were found. Not overwriting data.json.");
        return;
    }

    try {
        await fs.writeFile(OUTPUT_PATH, JSON.stringify(allMods, null, 2));
        console.log(`--- Scraping complete. Found ${allMods.length} mods. ---`);
        console.log(`Data successfully written to ${OUTPUT_PATH}`);
    } catch (writeError) {
        console.error(`[FATAL] Failed to write to ${OUTPUT_PATH}: ${writeError.message}`);
    }
}

main().catch(console.error);
