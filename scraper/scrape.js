import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'https://www.mixmods.com.br';
const OUTPUT_PATH = path.join('..', 'data.json');
// Using a more reliable, free translation API
const TRANSLATE_API = 'https://api.mymemory.translated.net/get';

async function translateText(text) {
    if (!text) return '';
    try {
        const response = await axios.get(TRANSLATE_API, { params: { q: text, langpair: 'pt|en' } });
        return response.data.responseData.translatedText || text;
    } catch (error) {
        console.warn(`  -> Translation failed for text. Using original. Error: ${error.message}`);
        return text;
    }
}

function detectGame($, article) {
    const links = article.find('span.cat-links a');
    for (let i = 0; i < links.length; i++) {
        const href = $(links[i]).attr('href');
        if (href.includes('/gta-sa/')) return 'SA';
        if (href.includes('/gta-vc/')) return 'VC';
        if (href.includes('/gta-iii/')) return 'III';
    }
    return 'Unknown';
}

function formatTitle(title, game) {
    const prefixes = { SA: '[SA]', VC: '[VC]', III: '[III]' };
    const prefix = prefixes[game];
    if (prefix && !title.trim().startsWith(prefix)) {
        return `${prefix} ${title}`;
    }
    return title;
}

async function main() {
    console.log('--- Starting Robust MixMods Scraper v4 ---');
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

                    const translatedTitle = formatTitle(await translateText(originalTitle), game);
                    const translatedDescription = await translateText(originalDescription);

                    const downloadLinks = [];
                    let combinedTextForVersionCheck = (originalTitle + ' ' + originalDescription).toLowerCase();
                    
                    downloadElements.each((i, linkEl) => {
                        const link = $mod(linkEl);
                        const url = link.attr('href');
                        const text = link.text().trim() || 'Download';
                        if (url) {
                            downloadLinks.push({ displayText: text, url: url });
                            combinedTextForVersionCheck += ' ' + text.toLowerCase();
                        }
                    });

                    if (downloadLinks.length === 0) continue; // Final check

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
                    console.log(`  -> SUCCESS: Processed "${originalTitle}"`);

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
