const fs = require('fs').promises;
const path = require('path');

async function buildSite() {
    console.log('Starting build process...');

    const CWD = __dirname;
    const PUBLIC_PATH = path.join(CWD, 'public');
    // This now correctly points to 'src' without the dot.
    const SRC_PATH = path.join(CWD, 'src');
    const DATA_FILE = path.join(CWD, 'data.json');
    const MANUAL_DATA_FILE = path.join(CWD, 'manual_data.json');

    await fs.rm(PUBLIC_PATH, { recursive: true, force: true });
    await fs.mkdir(PUBLIC_PATH, { recursive: true });

    try {
        await fs.cp(path.join(SRC_PATH, 'assets'), path.join(PUBLIC_PATH, 'assets'), { recursive: true });
        console.log('Copied static assets.');
    } catch (error) {
        console.log("Warning: 'src/assets' folder not found. Site will build without images.");
    }

    console.log('Loading data and assets from disk...');
    const cssContent = await fs.readFile(path.join(SRC_PATH, 'css', 'main.css'), 'utf-8');
    const jsContent = await fs.readFile(path.join(SRC_PATH, 'js', 'app.js'), 'utf-8');
    const modData = JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
    const manualData = JSON.parse(await fs.readFile(MANUAL_DATA_FILE, 'utf-8'));
    console.log('All data loaded successfully.');

    const htmlShell = `
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MixMods Browser</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&family=Inter:wght@600;700&display=swap" rel="stylesheet">
    <style>${cssContent}</style>
</head>
<body>
    <div id="loader"></div>
    <header class="app-header">
        <div class="container">
            <a href="#" class="logo">MixMods Browser</a>
            <div class="header-actions">
                <div id="theme-switch" class="theme-switch" aria-label="Toggle dark mode" role="button">
                    <div class="theme-switch-track"><div class="theme-switch-thumb"></div></div>
                </div>
            </div>
        </div>
    </header>
    <main class="container">
        <div class="filter-bar">
            <input type="search" id="search-input" placeholder="Filter by name...">
            <select id="platform-filter" aria-label="Filter by Platform"><option value="all">All Platforms</option><option value="PC">PC</option><option value="Mobile">Mobile</option><option value="DE">Definitive Edition</option><option value="PS2">PS2</option></select>
            <select id="game-filter" aria-label="Filter by Game"><option value="all">All Games</option><option value="SA">GTA SA</option><option value="VC">GTA VC</option><option value="III">GTA III</option></select>
            <select id="sort-control" aria-label="Sort by"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select>
        </div>
        <div id="mod-grid" class="mod-grid"></div>
        <div id="pagination" class="pagination"></div>
    </main>
    <div id="modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
        <div id="modal-content" class="modal-content" role="document"></div>
    </div>
    <script id="mod-data" type="application/json">${JSON.stringify(modData)}</script>
    <script id="featured-data" type="application/json">${JSON.stringify(manualData.featured)}</script>
    <script id="changelog-data" type="application/json">${JSON.stringify(manualData.changelogs)}</script>
    <script>${jsContent}</script>
</body>
</html>`;

    await fs.writeFile(path.join(PUBLIC_PATH, 'index.html'), htmlShell);
    console.log('Build complete. Generated public/index.html.');
}

buildSite();
