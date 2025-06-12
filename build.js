const fs = require('fs').promises;
const path = require('path');

async function buildSite() {
    const CWD = __dirname;
    const PUBLIC_PATH = path.join(CWD, 'public');
    const SRC_PATH = path.join(CWD, 'src');

    await fs.rm(PUBLIC_PATH, { recursive: true, force: true });
    await fs.mkdir(PUBLIC_PATH, { recursive: true });

    try {
        await fs.cp(path.join(SRC_PATH, 'assets'), path.join(PUBLIC_PATH, 'assets'), { recursive: true });
    } catch (error) {
        console.log("Warning: 'src/assets' folder not found.");
    }

    const cssContent = await fs.readFile(path.join(SRC_PATH, 'css', 'main.css'), 'utf-8');
    const jsContent = await fs.readFile(path.join(SRC_PATH, 'js', 'app.js'), 'utf-8');
    const modData = JSON.parse(await fs.readFile(path.join(CWD, 'data.json'), 'utf-8'));
    const manualData = JSON.parse(await fs.readFile(path.join(CWD, 'manual_data.json'), 'utf-8'));

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
    <header class="app-header">
        <div class="container">
            <a href="#" class="logo">MixMods Browser</a>
            <div id="theme-switch" role="button" aria-label="Toggle dark mode"></div>
        </div>
    </header>
    <main class="container">
        <div class="filter-bar">
            <input type="search" id="search-input" placeholder="Filter by name...">
            <select id="platform-filter" aria-label="Filter by Platform"><option value="all">All Platforms</option><option value="PC">PC</option><option value="Mobile">Mobile</option><option value="DE">DE</option><option value="PS2">PS2</option></select>
            <select id="game-filter" aria-label="Filter by Game"><option value="all">All Games</option><option value="SA">GTA: San Andreas</option><option value="VC">GTA: Vice City</option><option value="III">GTA III</option></select>
            <select id="sort-control" aria-label="Sort by"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select>
        </div>
        <div id="mod-grid" class="mod-grid"></div>
        <div id="pagination" class="pagination"></div>
    </main>
    <div id="modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
        <div id="modal-content" class="modal-content" role="document"></div>
    </div>
    <script id="mod-data" type="application/json">${JSON.stringify(modData)}</script>
    <script id="manual-data" type="application/json">${JSON.stringify(manualData)}</script>
    <script>${jsContent}</script>
</body>
</html>`;

    await fs.writeFile(path.join(PUBLIC_PATH, 'index.html'), htmlShell);
    console.log('Build complete.');
}

buildSite();
