const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const MODS_PER_PAGE = 9;
const repo = process.env.GITHUB_REPOSITORY || '';
const basePath = repo ? `/${repo.split('/')[1]}` : '';

const DOCS_PATH = path.join(__dirname, 'docs');
const SRC_PATH = path.join(__dirname, 'src');

const downloadIconMap = {
    'sharemods.com': 'https://sharemods.com/favicon.ico',
    'mediafire.com': 'https://www.mediafire.com/favicon.ico',
    'drive.google.com': 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
    'patreon.com': 'https://c5.patreon.com/external/favicon/rebrand/favicon.ico?v=af5597c2ef'
};

const gameIconMap = {
    '[SA]': 'assets/gta_sa.png',
    '[VC]': 'assets/gta_vc.png',
    '[III]': 'assets/gta_3.png'
};

function getModSlug(modPageUrl) {
    try { return new URL(modPageUrl).pathname.split('/').filter(Boolean).pop() || 'mod'; }
    catch (e) { return 'mod-' + Math.random().toString(36).substring(2, 9); }
}

function updateHeaderButton($) {
    const buyButton = $('header .header-navigation a[href*="store.steampowered.com"]');
    buyButton.attr('href', 'https://www.mixmods.com.br/').attr('target', '_blank');
    buyButton.find('span').text('Visit MixMods');
    // FIX: Use a CSS filter to force the logo to blue
    buyButton.find('svg').replaceWith('<img src="assets/logo.svg" alt="MixMods Logo" style="height: 26px; width: 26px; filter: invert(39%) sepia(98%) saturate(2544%) hue-rotate(195deg) brightness(103%) contrast(101%);">');
}

async function buildSite() {
    console.log(`Starting build process. Base path is set to: '${basePath}'`);

    await fs.rm(DOCS_PATH, { recursive: true, force: true });
    await fs.mkdir(DOCS_PATH, { recursive: true });
    await fs.mkdir(path.join(DOCS_PATH, 'mods'), { recursive: true });
    await fs.mkdir(path.join(DOCS_PATH, 'page'), { recursive: true });
    await fs.cp(path.join(__dirname, 'assets'), path.join(DOCS_PATH, 'assets'), { recursive: true });

    const cssContent = await fs.readFile(path.join(SRC_PATH, 'css', 'style.css'), 'utf-8');
    const jsContent = await fs.readFile(path.join(SRC_PATH, 'js', 'script.js'), 'utf-8');
    const data = JSON.parse(await fs.readFile('data.json', 'utf-8'));
    const featured = JSON.parse(await fs.readFile('featured.json', 'utf-8'));
    const listTemplate = await fs.readFile(path.join(SRC_PATH, 'templates', 'list_template.html'), 'utf-8');
    const modTemplate = await fs.readFile(path.join(SRC_PATH, 'templates', 'mod_template.html'), 'utf-8');
    console.log('Loaded assets and data.');

    const featuredSet = new Set(featured);
    data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    const processPage = ($, isModPage = false) => {
        const assetPrefix = isModPage ? '../' : '';
        $('link[rel="stylesheet"]').replaceWith(`<style>${cssContent}</style>`);
        $('script[src]').replaceWith(`<script>${jsContent}</script>`);
        
        $('a[href="/"]').attr('href', `${assetPrefix}index.html`);
        $('a[href^="/news"]').attr('href', `${assetPrefix}index.html`);
        
        updateHeaderButton($);
        $('footer').remove(); // Remove footer
        $('img[src*="facepunch.com"]').each((_, el) => {
            const $el = $(el);
            const src = $el.attr('src');
            const fileName = src.split('/').pop();
            $el.attr('src', `${assetPrefix}assets/${fileName}`);
        });
    };

    for (const mod of data) {
        const $ = cheerio.load(modTemplate);
        processPage($, true);

        $('title').text(`${mod.title} - MixMods Browser`);
        $('.blog-hero-image').css('background-image', `url(${mod.thumbnailUrl})`);
        $('.blog-hero-body h1').text(mod.title);
        $('.blog-hero-body p').text(mod.description);
        $('.tags .tag.secondary').html(`<span class="icon"><i>schedule</i></span> ${new Date(mod.uploadDate).toLocaleDateString()}`);
        $('.tags a.tag').remove(); // Remove the "update" tag

        const gameTag = mod.title.match(/^\[(SA|VC|III)\]/);
        const gameIcon = gameTag ? gameIconMap[gameTag[0]] : 'assets/gta_default.png';
        const gameName = gameTag ? `GTA ${gameTag[1]}` : 'Unknown Game';
        
        $('.author').html(`
            <div class="card user-card">
                <div class="image"><img src="../${gameIcon}"></div>
                <div class="body">
                    <div class="title has-text-white">${gameName}</div>
                    <div class="position">${mod.platform}</div>
                </div>
            </div>
        `);

        const downloadButtons = mod.downloadLinks.map(link => {
            const hostname = new URL(link.url).hostname.replace('www.', '');
            const iconUrl = downloadIconMap[hostname];
            if (iconUrl) {
                return `<a href="${link.url}" class="button is-secondary is-large" target="_blank" rel="noopener noreferrer" style="background-color: #fff; padding: 0.5rem 1rem;"><img src="${iconUrl}" style="height: 24px; margin-right: 8px;"><span>${hostname}</span></a>`;
            }
            return `<a href="${link.url}" class="button is-primary is-large" target="_blank" rel="noopener noreferrer">Download</a>`;
        }).join(' ');
        $('.news-section-block .content').html(`<div class="hero-buttons" style="justify-content: flex-start; margin-top: 2rem; gap: 1rem; flex-wrap: wrap;">${downloadButtons}</div>`);

        await fs.writeFile(path.join(DOCS_PATH, 'mods', `${getModSlug(mod.modPageUrl)}.html`), $.html());
    }
    console.log(`Generated ${data.length} mod detail pages.`);

    const totalPages = Math.ceil(data.length / MODS_PER_PAGE);
    for (let i = 1; i <= totalPages; i++) {
        const $ = cheerio.load(listTemplate);
        processPage($);

        $('body').append(`<script id="mod-data" type="application/json">${JSON.stringify(data)}</script>`);
        $('body').append(`<script id="featured-data" type="application/json">${JSON.stringify(featured)}</script>`);

        const postContainer = $('.blog-posts-container').empty();
        // The main featured post is now static HTML, so we only populate the list
        
        await fs.writeFile(path.join(DOCS_PATH, i === 1 ? 'index.html' : `page/${i}.html`), $.html());
        if (i === 1) {
             await fs.writeFile(path.join(DOCS_PATH, 'page', '1.html'), $.html());
        }
    }
    console.log(`Generated ${totalPages} list pages.`);
    console.log('Build complete.');
}

buildSite();
