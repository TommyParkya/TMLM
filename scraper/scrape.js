import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';
import translate from '@iamtraction/google-translate';

const BASE_URL = 'https://www.mixmods.com.br';
const OUTPUT_PATH = path.join('..', 'data.json');

// --- Helper function to detect game from categories ---
function detectGame($, article) {
    let game = 'Unknown';
    article.find('span.cat-links a').each((i, el) => {
        const href = $(el).attr('href');
        if (href.includes('/gta-sa/')) { game = 'SA'; return false; }
        if (href.includes('/gta-vc/')) { game = 'VC'; return false; }
        if (href.includes('/gta-iii/')) { game = 'III'; return false; }
    });
    return game;
}

// --- Helper function to add game prefix to title ---
function formatTitle(title, game) {
    const prefixes = { SA: '[SA]', VC: '[VC]', III: '[III]' };
    const prefix = prefixes[game];
    if (prefix && !/\[(SA|VC|III)\]/i.test(title)) {
        return `${prefix} ${title}`;
    }
    return title;
}

async function main() {
    console.log('--- Starting Advanced MixMods Scraper v2 ---');
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
            if (articles.length === 0) break;

            for (const element of articles) {
                const article = $list(element);
                const titleElement = article.find('h2.entry-title a');
                let originalTitle = titleElement.text().replace(/<font.*?>/g, '').trim();
                const modPageUrl = titleElement.attr('href');
                
                if (!modPageUrl || !originalTitle) continue;

                const game = detectGame($list, article);
                if (game === 'Unknown') continue;

                try {
                    const { data: modHtml } = await axios.get(modPageUrl);
                    const $mod = cheerio.load(modHtml);

                    const downloadSelector = 'a.download_bt1, .download_bt1 a, a:has(img[src*="download-baixar-4532137.png"])';
                    const downloadElements = $mod(downloadSelector);
                    if (downloadElements.length === 0) continue;

                    const uploadDate = article.find('time.entry-date').attr('datetime');
                    const thumbnailUrl = article.find('.post-image img').attr('src') || 'https://files.facepunch.com/lewis/1b1311b1/gmod-header.jpg';
                    let originalDescription = $mod('.entry-content p').first().text().trim();

                    // --- Auto-Translation Logic ---
                    let translatedTitle = formatTitle(originalTitle, game);
                    let translatedDescription = originalDescription;
                    try {
                        const [titleRes, descRes] = await Promise.all([
                            translate(originalTitle, { from: 'pt', to: 'en' }),
                            translate(originalDescription, { from: 'pt', to: 'en' })
                        ]);
                        translatedTitle = formatTitle(titleRes.text, game);
                        translatedDescription = descRes.text;
                        console.log(`  -> Translated "${originalTitle}"`);
                    } catch (e) {
                        console.log(`  -> Translation failed for "${originalTitle}", using original text. Error: ${e.message}`);
                    }

                    const downloadLinks = [];
                    let combinedTextForVersionCheck = originalTitle; // Start with title
                    downloadElements.each((i, linkEl) => {
                        const link = $mod(linkEl);
                        const url = link.attr('href');
                        const text = link.text().trim() || 'Download';
                        if (url) {
                            downloadLinks.push({ displayText: text, url: url });
                            combinedTextForVersionCheck += ' ' + text; // Add to version check
                        }
                    });
                    
                    combinedTextForVersionCheck += ' ' + originalDescription;

                    allMods.push({
                        title: translatedTitle,
                        modPageUrl,
                        thumbnailUrl,
                        description: translatedDescription,
                        uploadDate,
                        downloadLinks,
                        game: game,
                        version: {
                            pc: /pc/i.test(combinedTextForVersionCheck),
                            mobile: /mobile|android/i.test(combinedTextForVersionCheck),
                            de: /de|definitive edition/i.test(combinedTextForVersionCheck),
                            ps2: /ps2/i.test(combinedTextForVersionCheck)
                        }
                    });

                } catch (modPageError) { /* Skip mod on error */ }
            }
            page++;
        } catch (error) {
            console.error(`[FATAL] Error on page ${page}: ${error.message}`);
            break;
        }
    }

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(allMods, null, 2));
    console.log(`--- Scraping complete. Found ${allMods.length} mods. Data written to ${OUTPUT_PATH} ---`);
}

main().catch(console.error);
