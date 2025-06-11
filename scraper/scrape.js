import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const BASE_URL = 'https://www.mixmods.com.br';
const MAX_PAGES_TO_SCRAPE = 20; // A safe limit to prevent infinite loops.

/**
 * Determines the game and version tags based on the mod's title.
 * @param {string} title The title of the mod.
 * @returns {{game: string, versions: string[]}}
 */
function determineTags(title) {
    const lowerTitle = title.toLowerCase();
    let game = 'Unknown';
    const versions = new Set();

    // Determine Game
    if (lowerTitle.includes('[sa]') || lowerTitle.includes('san andreas')) game = 'GTA SA';
    else if (lowerTitle.includes('[vc]') || lowerTitle.includes('vice city')) game = 'GTA VC';
    else if (lowerTitle.includes('[iii]')) game = 'GTA III';

    // Determine Versions
    if (lowerTitle.includes('mobile') || lowerTitle.includes('android')) versions.add('Mobile');
    if (lowerTitle.includes('de') || lowerTitle.includes('definitive edition')) versions.add('DE');
    if (lowerTitle.includes('ps2')) versions.add('PS2');
    
    // If no specific version is found, it's likely for PC.
    if (versions.size === 0) versions.add('PC');

    return { game, versions: Array.from(versions) };
}

/**
 * Ensures the mod title has the correct game prefix.
 * @param {string} title The original title.
 * @param {string} game The determined game tag.
 * @returns {string} The prefixed title.
 */
function prefixTitle(title, game) {
    const prefixes = {
        'GTA SA': '[SA]',
        'GTA VC': '[VC]',
        'GTA III': '[III]'
    };
    const prefix = prefixes[game];
    if (prefix && !title.trim().startsWith(prefix)) {
        return `${prefix} ${title.trim()}`;
    }
    return title.trim();
}


async function scrapeAllMods() {
    const allMods = [];
    console.log('Starting scrape...');

    for (let i = 1; i <= MAX_PAGES_TO_SCRAPE; i++) {
        console.log(`Scraping page ${i}...`);
        try {
            const listPageUrl = `${BASE_URL}/page/${i}`;
            const { data: listPageHtml } = await axios.get(listPageUrl);
            const $list = cheerio.load(listPageHtml);

            // STAGE 1: Use a powerful selector to get only articles that are NOT news.
            const articles = $list('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (articles.length === 0) {
                console.log(`No more articles found on page ${i}. Ending scrape.`);
                break;
            }

            for (const element of articles) {
                const article = $list(element);

                // STAGE 2: Extract preliminary data from the list page.
                const titleElement = article.find('h2.entry-title a');
                const preliminaryTitle = titleElement.text().trim();
                const modPageUrl = titleElement.attr('href');
                
                if (!modPageUrl) continue;

                const uploadDate = article.find('time.entry-date').attr('datetime');
                const thumbnailUrl = article.find('div.post-image a img').attr('src');

                // STAGE 3: Visit the mod page to check for a download button.
                const { data: modPageHtml } = await axios.get(modPageUrl);
                const $mod = cheerio.load(modPageHtml);

                const hasDownloadButton1 = $mod('.download_bt1').length > 0;
                const hasDownloadButton2 = $mod('a img[src*="download-baixar-4532137.png"]').length > 0;

                if (!hasDownloadButton1 && !hasDownloadButton2) {
                    continue; // Skip this article if no download button is found.
                }

                // STAGE 4: Extract final details from the mod page.
                const description = $mod('div.entry-content p').first().text().trim();
                const downloadLinks = [];

                $mod('.download_bt1 a, a:has(img[src*="download-baixar-4532137.png"])').each((_, el) => {
                    const link = $mod(el);
                    const url = link.attr('href');
                    const displayText = link.text().trim() || 'Download';
                    if (url) {
                        downloadLinks.push({ displayText, url });
                    }
                });
                
                if (downloadLinks.length === 0) continue; // Final check

                // Process and add the mod
                const { game, versions } = determineTags(preliminaryTitle);
                const finalTitle = prefixTitle(preliminaryTitle, game);

                allMods.push({
                    title: finalTitle,
                    modPageUrl,
                    thumbnailUrl,
                    description,
                    uploadDate,
                    game,
                    versions,
                    downloadLinks
                });
                console.log(`  -> Found and processed: ${finalTitle}`);
            }
        } catch (error) {
            console.error(`Error scraping page ${i}:`, error.message);
            break;
        }
    }

    console.log(`Scrape complete. Found ${allMods.length} valid mods.`);
    
    // Save the data to a file in the root directory
    const outputPath = path.join(process.cwd(), '..', 'data.json');
    await fs.writeFile(outputPath, JSON.stringify(allMods, null, 2));
    console.log(`Data saved to ${outputPath}`);
}

scrapeAllMods();
