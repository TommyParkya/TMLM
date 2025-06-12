const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

// --- CONFIGURATION ---
const MODS_PER_PAGE = 9;
const GITHUB_USERNAME = 'tommyparkya';
const REPO_NAME = 'TMLM';

// --- The absolute path to your site's root ---
const siteRootUrl = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}`;

// --- PATHS ---
const DOCS_PATH = path.join(__dirname, 'docs');
const SRC_PATH = path.join(__dirname, 'src');

// Helper function to get a URL-friendly slug
function getModSlug(modPageUrl) {
    try {
        return new URL(modPageUrl).pathname.split('/').filter(Boolean).pop() || 'mod';
    } catch (e) {
        return 'mod-' + Math.random().toString(36).substring(2, 9);
    }
}

// Helper function to fix all paths using the absolute site root URL
function fixPaths($, rootUrl) {
    // --- FIX: Use the full, absolute URL for CSS and JS ---
    $('link[rel="stylesheet"]').attr('href', `${rootUrl}/css/styles.css`);
    $('script[src]').attr('src', `${rootUrl}/js/script.js`);

    // Fix navigation and brand links to point to the site root
    $('a[href="/"]').attr('href', `${rootUrl}/`);
    $('a[href^="/news"]').attr('href', `${rootUrl}/`);
    $('a[href^="/changes"]').attr('href', `${rootUrl}/`);
    $('a[href^="/support"]').attr('href', `${rootUrl}/`);
}

// Helper function to update the header button
function updateHeaderButton($) {
    const buyButton = $('header .header-navigation a[href*="store.steampowered.com"]');
    buyButton.attr('href', 'https://www.mixmods.com.br/').attr('target', '_blank');
    buyButton.find('span').text('Visit MixMods');
    buyButton.find('svg').replaceWith('<img src="https://www.mixmods.com.br/wp-content/uploads/2022/10/mxmlogo200.png" alt="MixMods Logo" style="height: 26px; width: 26px; filter: hue-rotate(200deg) saturate(3) brightness(0.9);">');
}

// Main build function
async function buildSite() {
    console.log('Starting build process...');

    await fs.rm(DOCS_PATH, { recursive: true, force: true });
    await fs.mkdir(DOCS_PATH, { recursive: true });
    await fs.mkdir(path.join(DOCS_PATH, 'mods'), { recursive: true });
    await fs.mkdir(path.join(DOCS_PATH, 'page'), { recursive: true });

    await fs.cp(path.join(SRC_PATH, 'css'), path.join(DOCS_PATH, 'css'), { recursive: true });
    await fs.cp(path.join(SRC_PATH, 'js'), path.join(DOCS_PATH, 'js'), { recursive: true });
    console.log('Copied static assets.');

    const data = JSON.parse(await fs.readFile('data.json', 'utf-8'));
    const featured = JSON.parse(await fs.readFile('featured.json', 'utf-8'));
    const listTemplate = await fs.readFile(path.join(SRC_PATH, 'templates', 'list_template.html'), 'utf-8');
    const modTemplate = await fs.readFile(path.join(SRC_PATH, 'templates', 'mod_template.html'), 'utf-8');
    console.log('Loaded data and templates.');

    const featuredSet = new Set(featured);
    data.sort((a, b) => {
        const aIsFeatured = featuredSet.has(a.modPageUrl);
        const bIsFeatured = featuredSet.has(b.modPageUrl);
        if (aIsFeatured && !bIsFeatured) return -1;
        if (!aIsFeatured && bIsFeatured) return 1;
        return new Date(b.uploadDate) - new Date(a.uploadDate);
    });

    // --- Generate Mod Detail Pages ---
    for (const mod of data) {
        const $ = cheerio.load(modTemplate);
        fixPaths($, siteRootUrl);
        updateHeaderButton($);

        $('title').text(`${mod.title} - MixMods Browser`);
        $('.blog-hero-image').css('background-image', `url(${mod.thumbnailUrl})`);
        $('.blog-hero-body h1').text(mod.title);
        $('.blog-hero-body p').text(mod.description);
        $('.author').remove();
        const downloadButtons = mod.downloadLinks.map(link => `<a href="${link.url}" class="button is-primary is-large" target="_blank" rel="noopener noreferrer">${link.displayText}</a>`).join(' ');
        $('.news-section-block .content').html(`<p>${mod.description}</p><div class="hero-buttons" style="justify-content: flex-start; margin-top: 2rem;">${downloadButtons}</div>`);
        $('.change-blog-container, .likes, .news-section-block .section-header').remove();

        await fs.writeFile(path.join(DOCS_PATH, 'mods', `${getModSlug(mod.modPageUrl)}.html`), $.html());
    }
    console.log(`Generated ${data.length} mod detail pages.`);

    // --- Generate List Pages (index.html + page/n.html) ---
    const totalPages = Math.ceil(data.length / MODS_PER_PAGE);
    for (let i = 1; i <= totalPages; i++) {
        const $ = cheerio.load(listTemplate);
        fixPaths($, siteRootUrl);
        updateHeaderButton($);

        $('body').append(`<script id="mod-data" type="application/json">${JSON.stringify(data)}</script>`);
        $('body').append(`<script id="featured-data" type="application/json">${JSON.stringify(featured)}</script>`);

        const featuredMod = data[0];
        $('.blog-list-header .blog-hero-image').css('background-image', `url(${featuredMod.thumbnailUrl})`);
        $('.blog-list-header h1').text(featuredMod.title);
        $('.blog-list-header p').text(featuredMod.description);
        $('.blog-list-header a').attr('href', `${siteRootUrl}/mods/${getModSlug(featuredMod.modPageUrl)}.html`);

        const postContainer = $('.blog-posts-container').empty();
        const pageMods = data.slice((i - 1) * MODS_PER_PAGE, i * MODS_PER_PAGE);
        for (const mod of pageMods) {
            const modPagePath = `${siteRootUrl}/mods/${getModSlug(mod.modPageUrl)}.html`;
            const isFeatured = featuredSet.has(mod.modPageUrl);
            postContainer.append(`
                <div class="blog-post">
                    <a href="${modPagePath}" class="blog-post-image"><img src="${mod.thumbnailUrl}" alt="Mod Thumbnail"><div class="dev-tags">${isFeatured ? '<img src="https://community.fastly.steamstatic.com/public/images/sharedfiles/Workshop_FeatureTag_new.png" alt="Featured" style="position: absolute; top: -5px; left: -5px; width: 64px; height: 64px; z-index: 10;">' : ''}</div></a>
                    <div class="blog-post-body">
                        <div class="date"><span><i>schedule</i></span><span>${new Date(mod.uploadDate).toDateString()}</span></div>
                        <a href="${modPagePath}"><h1 class="title is-size-4">${mod.title}</h1></a>
                        <p class="subtitle is-size-6">${mod.description}</p>
                    </div>
                </div>
            `);
        }

        const paginationList = $('.pagination-list').empty();
        for (let p = 1; p <= totalPages; p++) {
            const pageHref = p === 1 ? `${siteRootUrl}/` : `${siteRootUrl}/page/${p}.html`;
            paginationList.append(`<li><a href="${pageHref}" class="pagination-link ${p === i ? 'is-current' : ''}">${p}</a></li>`);
        }
        const prevHref = i > 1 ? (i === 2 ? `${siteRootUrl}/` : `${siteRootUrl}/page/${i - 1}.html`) : null;
        const nextHref = i < totalPages ? `${siteRootUrl}/page/${i + 1}.html` : null;
        $('.pagination-previous').attr('href', prevHref).prop('disabled', !prevHref);
        $('.pagination-next').attr('href', nextHref).prop('disabled', !nextHref);

        const pagePath = (i === 1) ? 'index.html' : `page/${i}.html`;
        await fs.writeFile(path.join(DOCS_PATH, pagePath), $.html());
        if (i === 1) {
             await fs.writeFile(path.join(DOCS_PATH, 'page', '1.html'), $.html());
        }
    }
    console.log(`Generated ${totalPages} list pages.`);
    console.log('Build complete. Static site is in the /docs directory.');
}

buildSite();
