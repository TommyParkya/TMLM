const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://www.mixmods.com.br';

// Helper function to add prefixes like [SA] if they don't exist
function ensureGamePrefix(title) {
    if (title.match(/\[(SA|VC|III)\]/i)) {
        return title;
    }
    if (title.toLowerCase().includes('san andreas')) return `[SA] ${title}`;
    if (title.toLowerCase().includes('vice city')) return `[VC] ${title}`;
    if (title.toLowerCase().includes('gta iii') || title.toLowerCase().includes('gta 3')) return `[III] ${title}`;
    // Default to SA if no other game is mentioned, as it's the most common
    return `[SA] ${title}`;
}

// Helper function to determine game and versions from title/description
function getGameAndVersions(title, description) {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    const content = `${lowerTitle} ${lowerDesc}`;

    let game = 'GTA SA'; // Default
    if (lowerTitle.includes('[vc]') || content.includes('vice city')) game = 'GTA VC';
    if (lowerTitle.includes('[iii]') || content.includes('gta 3') || content.includes('gta iii')) game = 'GTA III';

    const versions = new Set();
    if (content.includes('pc')) versions.add('PC');
    if (content.includes('mobile') || content.includes('android') || content.includes('ios')) versions.add('Mobile');
    if (content.includes('definitive edition') || content.includes('de trilogy')) versions.add('DE');
    if (content.includes('ps2')) versions.add('PS2');

    // If no specific version is found, assume PC
    if (versions.size === 0) versions.add('PC');

    return { game, versions: Array.from(versions) };
}


async function scrapeAllMods() {
    const allMods = [];
    let hasMorePages = true;
    let pageNum = 1;

    console.log('Starting scraper...');

    while (hasMorePages) {
        try {
            console.log(`Scraping page ${pageNum}...`);
            const listPageUrl = `${BASE_URL}/page/${pageNum}`;
            const { data: listPageHtml } = await axios.get(listPageUrl);
            const $ = cheerio.load(listPageHtml);

            // The key optimization: Select only articles that DO NOT have the "News" category.
            const articles = $('article:not(:has(span.cat-links a[href*="/novidades/"]))');

            if (articles.length === 0) {
                hasMorePages = false;
                console.log('No more articles found. Ending scrape.');
                break;
            }

            for (const element of articles) {
                const article = $(element);
                const preliminaryData = {
                    title: article.find('h2.entry-title a').text().trim(),
                    modPageUrl: article.find('h2.entry-title a').attr('href'),
                    uploadDate: article.find('time.entry-date').attr('datetime'),
                    thumbnailUrl: article.find('div.post-image a img').attr('src')
                };

                if (!preliminaryData.modPageUrl) continue;

                // Now, visit the mod page to check for download buttons and get description
                const { data: modPageHtml } = await axios.get(preliminaryData.modPageUrl);
                const $mod = cheerio.load(modPageHtml);

                const hasDownloadButton1 = $mod('.download_bt1').length > 0;
                const hasDownloadButton2 = $mod('a img[src*="download-baixar-4532137.png"]').length > 0;

                if (!hasDownloadButton1 && !hasDownloadButton2) {
                    continue; // Skip if no download button is found
                }

                // Scrape final details
                const description = $mod('div.entry-content p').first().text().trim();
                const downloadLinks = [];

                $mod('.download_bt1 a, a:has(img[src*="download-baixar-4532137.png"])').each((i, linkEl) => {
                    const link = $(linkEl);
                    downloadLinks.push({
                        displayText: link.text().trim() || 'Download',
                        url: link.attr('href')
                    });
                });
                
                const { game, versions } = getGameAndVersions(preliminaryData.title, description);

                allMods.push({
                    ...preliminaryData,
                    title: ensureGamePrefix(preliminaryData.title),
                    description,
                    downloadLinks,
                    game,
                    versions
                });
                console.log(`  -> Found and processed: ${preliminaryData.title}`);
            }
            pageNum++;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Page ${pageNum} not found. This is the end.`);
            } else {
                console.error(`Error scraping page ${pageNum}:`, error.message);
            }
            hasMorePages = false;
        }
    }

    fs.writeFileSync('data.json', JSON.stringify(allMods, null, 2));
    console.log(`Scraping complete. Found ${allMods.length} mods. Saved to data.json.`);
}

scrapeAllMods();