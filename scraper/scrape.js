import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'https://www.mixmods.com.br';
const OUTPUT_PATH = path.join('..', 'public', 'data.json');

async function main() {
    console.log('Starting MixMods scraper...');
    const allMods = [];
    let page = 1;
    const maxPages = 50; // Safety limit to prevent infinite loops

    while (page <= maxPages) {
        const listUrl = `${BASE_URL}/page/${page}`;
        console.log(`Scraping page ${page}: ${listUrl}`);

        try {
            const { data: listHtml } = await axios.get(listUrl);
            const $list = cheerio.load(listHtml);

            // Efficiently select only articles that are NOT news posts
            const articles = $list('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (articles.length === 0) {
                console.log(`No more valid articles found on page ${page}. Stopping.`);
                break;
            }

            for (const element of articles) {
                const article = $list(element);

                // --- STAGE 1: Preliminary Data Extraction from List Page ---
                const titleElement = article.find('h2.entry-title a');
                const title = titleElement.text().replace(/<font style="vertical-align: inherit;">/g, '').replace(/<\/font>/g, '').trim();
                const modPageUrl = titleElement.attr('href');
                const uploadDate = article.find('time.entry-date').attr('datetime');
                const thumbnailUrl = article.find('div.post-image a img').attr('src');

                if (!modPageUrl || !title) {
                    continue; // Skip if essential info is missing
                }

                // --- STAGE 2: Visit Mod Page and Apply Download Filter ---
                try {
                    const { data: modHtml } = await axios.get(modPageUrl);
                    const $mod = cheerio.load(modHtml);

                    const hasDownloadButton1 = $mod('.download_bt1').length > 0;
                    const hasDownloadButton2 = $mod('a img[src*="download-baixar-4532137.png"]').length > 0;

                    if (!hasDownloadButton1 && !hasDownloadButton2) {
                        console.log(` -> Skipping "${title}" (No download button)`);
                        continue;
                    }

                    // --- STAGE 3: Final Data Extraction ---
                    const description = $mod('div.entry-content p').first().text().trim();
                    const downloadLinks = [];

                    $mod('.download_bt1 a, a:has(img[src*="download-baixar-4532137.png"])').each((i, linkEl) => {
                        const link = $mod(linkEl);
                        downloadLinks.push({
                            displayText: link.text().trim() || 'Download',
                            url: link.attr('href')
                        });
                    });
                    
                    console.log(` -> Found mod: "${title}"`);
                    allMods.push({
                        title,
                        modPageUrl,
                        thumbnailUrl,
                        description,
                        uploadDate,
                        downloadLinks
                    });

                } catch (modPageError) {
                    console.error(`  -> Failed to fetch mod page ${modPageUrl}: ${modPageError.message}`);
                }
            }
            page++;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Page ${page} not found. Reached the end.`);
            } else {
                console.error(`Failed to fetch page ${page}: ${error.message}`);
            }
            break;
        }
    }

    console.log(`Scraping complete. Found ${allMods.length} mods.`);
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(allMods, null, 2));
    console.log(`Data successfully written to ${OUTPUT_PATH}`);
}

main().catch(console.error);
