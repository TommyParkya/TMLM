const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const repo = process.env.GITHUB_REPOSITORY || '';
const basePath = repo ? `/${repo.split('/')[1]}` : '';

const DOCS_PATH = path.join(__dirname, 'docs');
const SRC_PATH = path.join(__dirname, 'src');

async function buildSite() {
    console.log(`Starting build process. Base path is set to: '${basePath}'`);

    await fs.rm(DOCS_PATH, { recursive: true, force: true });
    await fs.mkdir(DOCS_PATH, { recursive: true });
    await fs.cp(path.join(__dirname, 'assets'), path.join(DOCS_PATH, 'assets'), { recursive: true });

    const cssContent = await fs.readFile(path.join(SRC_PATH, 'css', 'style.css'), 'utf-8');
    const jsContent = await fs.readFile(path.join(SRC_PATH, 'js', 'script.js'), 'utf-8');
    const data = JSON.parse(await fs.readFile('data.json', 'utf-8'));
    const featured = JSON.parse(await fs.readFile('featured.json', 'utf-8'));
    const changelogs = JSON.parse(await fs.readFile('changelogs.json', 'utf-8'));
    const listTemplate = await fs.readFile(path.join(SRC_PATH, 'templates', 'list_template.html'), 'utf-8');
    console.log('Loaded assets and data.');

    const $ = cheerio.load(listTemplate);

    $('link[rel="stylesheet"]').replaceWith(`<style>${cssContent}</style>`);
    $('script[src]').replaceWith(`<script>${jsContent}</script>`);
    
    const buyButton = $('header .header-navigation a');
    buyButton.attr('href', 'https://www.mixmods.com.br/').attr('target', '_blank');
    buyButton.find('span').text('Visit MixMods');
    buyButton.find('svg').replaceWith(`<img src="assets/logo.svg" alt="MixMods Logo" style="height: 26px; width: 26px; filter: invert(39%) sepia(98%) saturate(2544%) hue-rotate(195deg) brightness(103%) contrast(101%);">`);
    
    $('a.header-brand').attr('href', `${basePath}/`);

    $('body').append(`<script id="mod-data" type="application/json">${JSON.stringify(data)}</script>`);
    $('body').append(`<script id="featured-data" type="application/json">${JSON.stringify(featured)}</script>`);
    $('body').append(`<script id="changelog-data" type="application/json">${JSON.stringify(changelogs)}</script>`);

    await fs.writeFile(path.join(DOCS_PATH, 'index.html'), $.html());
    
    console.log('Build complete. Generated index.html.');
}

buildSite();
