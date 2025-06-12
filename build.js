const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const MODS_PER_PAGE = 9;
const DOCS_PATH = path.join(__dirname, 'docs');
const SRC_PATH = path.join(__dirname, 'src');

// --- Helper Functions ---

function getModSlug(modPageUrl) {
    try {
        const url = new URL(modPageUrl);
        const slug = url.pathname.split('/').filter(Boolean).pop();
        return slug || 'mod';
    } catch (e) {
        return 'mod-' + Math.random().toString(36).substring(2, 9);
    }
}

function createChangelogHTML($, changelogData) {
    const iconMap = {
        'Features': 'add_circle',
        'Improvements': 'arrow_circle_up',
        'Fixed': 'handyman',
        'Removed': 'remove_circle'
    };
    const classMap = {
        'Features': 'features',
        'Improvements': 'improvements',
        'Fixed': 'fixed',
        'Removed': 'removed'
    };

    let changelogHtml = '';
    for (const header in changelogData) {
        const items = changelogData[header];
        const icon = iconMap[header] || 'info';
        const className = classMap[header] || 'features';

        const listItems = items.map(item => `
            <li>
                <span>•</span>
                <div class="entry">${item}</div>
            </li>
        `).join('');

        changelogHtml += `
            <div class="changes-row ${className}">
                <div class="changes-row-header">
                    <span class="icon"><i>${icon}</i></span>
                    <h3>${header}</h3>
                </div>
                <div class="changes-row-body">
                    <ul>${listItems}</ul>
                </div>
            </div>
        `;
    }
    return changelogHtml;
}

// --- Main Build Logic ---

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
    const changelogs = JSON.parse(await fs.readFile('changelogs.json', 'utf-8'));
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
        const slug = getModSlug(mod.modPageUrl);
        
        // --- FIX: Use relative paths for assets from a 'mods/' subdirectory ---
        const relativePrefix = '../';
        $('link[href^="/"]').each((_, el) => $(el).attr('href', `${relativePrefix}${$_$(el).attr('href').substring(1)}`));
        $('script[src^="/"]').each((_, el) => $(el).attr('src', `${relativePrefix}${$_$(el).attr('src').substring(1)}`));
        $('a[href="/"]').attr('href', `${relativePrefix}index.html`);
        $('a[href^="/news"]').attr('href', `${relativePrefix}index.html`);
        $('a[href^="/changes"]').attr('href', `${relativePrefix}index.html`);
        $('a[href^="/support"]').attr('href', `${relativePrefix}index.html`);

        $('title').text(`${mod.title} - MixMods Browser`);
        $('.blog-hero-image').css('background-image', `url(${mod.thumbnailUrl})`);
        $('.tags .tag.secondary span').next().text(new Date(mod.uploadDate).toLocaleDateString('en-CA'));
        $('.blog-hero-body h1').text(mod.title);
        $('.blog-hero-body p').text(mod.description);
        $('.author').remove();

        const contentDiv = $('.news-section-block .content');
        contentDiv.empty().append(`<p>${mod.description}</p>`);
        
        const downloadButtons = mod.downloadLinks.map(link => 
            `<a href="${link.url}" class="button is-primary is-large" target="_blank" rel="noopener noreferrer">${link.displayText}</a>`
        ).join(' ');
        contentDiv.append(`<div class="hero-buttons" style="justify-content: flex-start; margin-top: 2rem;">${downloadButtons}</div>`);

        if (changelogs[mod.modPageUrl]) {
            const changelogContainer = $('.change-blog-container').first();
            const changelogHtml = createChangelogHTML($, changelogs[mod.modPageUrl]);
            changelogContainer.find('.changes-body').html(changelogHtml);
            changelogContainer.find('.sidebar-section .title').text(mod.title).attr('href', mod.modPageUrl);
            changelogContainer.find('.sidebar-section .date').contents().last().replaceWith(` ${new Date(mod.uploadDate).toDateString()}`);
        } else {
            $('.change-blog-container').remove();
        }
        
        $('.likes').remove();
        $('.news-section-block .section-header').remove();
        $('.change-blog-container').not(':first').remove();

        await fs.writeFile(path.join(DOCS_PATH, 'mods', `${slug}.html`), $.html());
    }
    console.log(`Generated ${data.length} mod detail pages.`);

    // --- Generate List Pages (index.html + page/n.html) ---
    const totalPages = Math.ceil(data.length / MODS_PER_PAGE);
    for (let i = 1; i <= totalPages; i++) {
        const $ = cheerio.load(listTemplate);
        const isRootPage = (i === 1);
        const relativePrefix = isRootPage ? './' : '../';

        // --- FIX: Use relative paths for assets based on page depth ---
        $('link[href^="/"]').each((_, el) => $(el).attr('href', `${relativePrefix}${$_$(el).attr('href').substring(1)}`));
        $('script[src^="/"]').each((_, el) => $(el).attr('src', `${relativePrefix}${$_$(el).attr('src').substring(1)}`));
        $('a[href="/"]').attr('href', `${relativePrefix}index.html`);
        $('a[href^="/news"]').attr('href', `${relativePrefix}index.html`);
        $('a[href^="/changes"]').attr('href', `${relativePrefix}index.html`);
        $('a[href^="/support"]').attr('href', `${relativePrefix}index.html`);

        const buyButton = $('header .header-navigation a[href*="store.steampowered.com"]');
        buyButton.attr('href', 'https://www.mixmods.com.br/').attr('target', '_blank');
        buyButton.find('span').text('Visit MixMods');
        buyButton.find('svg').replaceWith('<img src="https://www.mixmods.com.br/wp-content/uploads/2022/10/mxmlogo200.png" alt="MixMods Logo" style="height: 26px; width: 26px; filter: hue-rotate(200deg) saturate(3) brightness(0.9);">');

        $('body').append(`<script id="mod-data" type="application/json">${JSON.stringify(data)}</script>`);
        $('body').append(`<script id="featured-data" type="application/json">${JSON.stringify(featured)}</script>`);

        const featuredMod = data[0];
        $('.blog-list-header .blog-hero-image').css('background-image', `url(${featuredMod.thumbnailUrl})`);
        $('.blog-list-header .tags .tag span').next().text(new Date(featuredMod.uploadDate).toLocaleDateString('en-CA'));
        const featuredLink = $('.blog-list-header a.blog-header-title');
        featuredLink.attr('href', `${relativePrefix}mods/${getModSlug(featuredMod.modPageUrl)}.html`);
        featuredLink.find('h1').text(featuredMod.title);
        $('.blog-list-header p').text(featuredMod.description);
        $('.blog-list-header a.button').attr('href', featuredLink.attr('href'));

        const postContainer = $('.blog-posts-container');
        postContainer.empty();

        const pageMods = data.slice((i - 1) * MODS_PER_PAGE, i * MODS_PER_PAGE);

        for (const mod of pageMods) {
            const post = cheerio.load('<div class="blog-post"></div>')('.blog-post');
            const slug = getModSlug(mod.modPageUrl);
            const modPagePath = `${relativePrefix}mods/${slug}.html`;

            post.html(`
                <a href="${modPagePath}" class="blog-post-image">
                    <img src="${mod.thumbnailUrl}" alt="Blog Header Image">
                    <div class="dev-tags">
                        ${featuredSet.has(mod.modPageUrl) ? '<img src="https://community.fastly.steamstatic.com/public/images/sharedfiles/Workshop_FeatureTag_new.png" alt="Featured" style="position: absolute; top: -5px; left: -5px; width: 64px; height: 64px; z-index: 10;">' : ''}
                    </div>
                </a>
                <div class="blog-post-body">
                    <div class="date">
                        <span class="icon"><i>schedule</i></span>
                        <span>${new Date(mod.uploadDate).toDateString()}</span>
                    </div>
                    <a href="${modPagePath}">
                        <h1 class="title is-size-4">${mod.title}</h1>
                    </a>
                    <p class="subtitle is-size-6">${mod.description}</p>
                </div>
            `);
            postContainer.append(post);
        }

        const paginationList = $('.pagination-list');
        paginationList.empty();
        for (let p = 1; p <= totalPages; p++) {
            const linkClass = (p === i) ? 'pagination-link is-current' : 'pagination-link';
            const pageHref = p === 1 ? `${relativePrefix}index.html` : `${relativePrefix}page/${p}.html`;
            paginationList.append(`<li><a href="${pageHref}" class="${linkClass}">${p}</a></li>`);
        }
        
        const prevHref = i > 1 ? (i === 2 ? `${relativePrefix}index.html` : `${relativePrefix}page/${i - 1}.html`) : null;
        const nextHref = i < totalPages ? `${relativePrefix}page/${i + 1}.html` : null;
        
        $('.pagination-previous').attr('href', prevHref).prop('disabled', !prevHref);
        $('.pagination-next').attr('href', nextHref).prop('disabled', !nextHref);

        const pagePath = isRootPage ? 'index.html' : `page/${i}.html`;
        await fs.writeFile(path.join(DOCS_PATH, pagePath), $.html());
        if (isRootPage) {
             await fs.writeFile(path.join(DOCS_PATH, 'page', '1.html'), $.html());
        }
    }
    console.log(`Generated ${totalPages} list pages.`);
    console.log('Build complete. Static site is in the /docs directory.');
}

buildSite();
