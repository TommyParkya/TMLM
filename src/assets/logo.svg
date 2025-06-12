document.addEventListener('DOMContentLoaded', () => {
    const modsData = JSON.parse(document.getElementById('mod-data')?.textContent || '[]');
    const featuredData = JSON.parse(document.getElementById('featured-data')?.textContent || '[]');
    const changelogData = JSON.parse(document.getElementById('changelog-data')?.textContent || '{}');

    const state = {
        mods: [],
        currentPage: 1,
        filters: { search: '', platform: 'all', game: 'all', sort: 'newest' }
    };

    const MODS_PER_PAGE = 12;
    const downloadIconMap = {
        'sharemods.com': 'https://sharemods.com/favicon.ico',
        'mediafire.com': 'https://www.mediafire.com/favicon.ico',
        'drive.google.com': 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
        'patreon.com': 'https://c5.patreon.com/external/favicon/rebrand/favicon.ico?v=af5597c2ef',
        'modsfire.com': 'https://modsfire.com/favicon.ico'
    };
    const gameInfoMap = {
        '[SA]': { name: 'Grand Theft Auto: San Andreas', icon: 'assets/gta_sa.png' },
        '[VC]': { name: 'Grand Theft Auto: Vice City', icon: 'assets/gta_vc.png' },
        '[III]': { name: 'Grand Theft Auto: III', icon: 'assets/gta_3.png' }
    };

    const modGrid = document.getElementById('mod-grid');
    const paginationContainer = document.getElementById('pagination');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    function formatDate(dateString) {
        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
    }

    function renderGrid() {
        modGrid.innerHTML = '';
        const startIndex = (state.currentPage - 1) * MODS_PER_PAGE;
        const endIndex = startIndex + MODS_PER_PAGE;
        const modsForPage = state.mods.slice(startIndex, endIndex);

        if (modsForPage.length === 0) {
            modGrid.innerHTML = `<p class="no-results">None Found.</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        modsForPage.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';
            card.dataset.modUrl = mod.modPageUrl;

            const gameTag = mod.title.match(/^\[(SA|VC|III)\]/);
            const gameIcon = gameTag ? gameInfoMap[gameTag[0]].icon : 'assets/gta_default.png';

            card.innerHTML = `
                <img src="${mod.thumbnailUrl}" alt="${mod.title}" class="mod-card-thumbnail" loading="lazy">
                <div class="mod-card-body">
                    <h2 class="mod-card-title">${mod.title}</h2>
                    <p class="mod-card-description">${mod.description}</p>
                    <div class="mod-card-footer">
                        <span>${formatDate(mod.uploadDate)}</span>
                        <img src="${gameIcon}" class="game-icon">
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });
        modGrid.appendChild(fragment);
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(state.mods.length / MODS_PER_PAGE);
        if (totalPages <= 1) return;

        const createButton = (text, page, disabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.dataset.page = page;
            if (disabled) button.disabled = true;
            return button;
        };

        paginationContainer.appendChild(createButton('«', 1, state.currentPage === 1));
        paginationContainer.appendChild(createButton('‹', state.currentPage - 1, state.currentPage === 1));
        
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
        paginationContainer.appendChild(pageInfo);

        paginationContainer.appendChild(createButton('›', state.currentPage + 1, state.currentPage === totalPages));
        paginationContainer.appendChild(createButton('»', totalPages, state.currentPage === totalPages));
    }

    function showModal(mod) {
        const gameTag = mod.title.match(/^\[(SA|VC|III)\]/);
        const gameInfo = gameTag ? gameInfoMap[gameTag[0]] : { name: 'Unknown Game', icon: 'assets/gta_default.png' };
        
        const downloadButtons = mod.downloadLinks.map(link => {
            const hostname = new URL(link.url).hostname.replace('www.', '');
            const iconUrl = downloadIconMap[hostname];
            return iconUrl ? `<a href="${link.url}" target="_blank" rel="noopener noreferrer"><img src="${iconUrl}" title="${hostname}"></a>` : '';
        }).join('');

        const changelogs = changelogData[mod.modPageUrl];
        let changelogHtml = '';
        if (changelogs) {
            for (const header in changelogs) {
                const items = changelogs[header].map(item => `<li>${item}</li>`).join('');
                changelogHtml += `<div class="changelog-section"><h3>${header}</h3><ul>${items}</ul></div>`;
            }
        }

        modalContent.innerHTML = `
            <header class="modal-header">
                <div class="game-info">
                    <img src="${gameInfo.icon}" alt="${gameInfo.name}">
                    <div>
                        <div class="game-name">${gameInfo.name}</div>
                        <div class="platform">${mod.platform}</div>
                    </div>
                </div>
                <div class="meta-info">
                    <span class="upload-date">${formatDate(mod.uploadDate)}</span>
                    <div class="download-links">${downloadButtons}</div>
                </div>
            </header>
            <main class="modal-body">
                <h1 class="mod-title">${mod.title}</h1>
                <img src="${mod.thumbnailUrl}" alt="Mod Thumbnail" class="mod-thumbnail">
                <p class="mod-description">${mod.description}</p>
                ${changelogHtml}
            </main>
        `;
        modalOverlay.classList.add('visible');
        modalOverlay.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    function hideModal() {
        modalOverlay.classList.add('hidden');
        modalOverlay.classList.remove('visible');
        document.body.classList.remove('modal-open');
    }

    function updateView() {
        const featuredSet = new Set(featuredData);
        let filteredMods = modsData.filter(mod => {
            const titleMatch = mod.title.toLowerCase().includes(state.filters.search);
            const platformMatch = state.filters.platform === 'all' || mod.platform === state.filters.platform;
            const gameMatch = state.filters.game === 'all' || mod.title.includes(`[${state.filters.game}]`);
            return titleMatch && platformMatch && gameMatch;
        });

        filteredMods.sort((a, b) => {
            const aIsFeatured = featuredSet.has(a.modPageUrl);
            const bIsFeatured = featuredSet.has(b.modPageUrl);
            if (aIsFeatured !== bIsFeatured) return aIsFeatured ? -1 : 1;

            const dateA = new Date(a.uploadDate);
            const dateB = new Date(b.uploadDate);
            return state.filters.sort === 'newest' ? dateB - dateA : dateA - dateB;
        });

        state.mods = filteredMods;
        renderGrid();
        renderPagination();
    }

    function init() {
        const searchInput = document.getElementById('search-input');
        const platformFilter = document.getElementById('platform-filter');
        const gameFilter = document.getElementById('game-filter');
        const sortControl = document.getElementById('sort-control');
        const themeSwitch = document.getElementById('theme-switch');

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.filters.search = e.target.value.toLowerCase();
                state.currentPage = 1;
                updateView();
            }, 300);
        });

        platformFilter.addEventListener('change', (e) => { state.filters.platform = e.target.value; state.currentPage = 1; updateView(); });
        gameFilter.addEventListener('change', (e) => { state.filters.game = e.target.value; state.currentPage = 1; updateView(); });
        sortControl.addEventListener('change', (e) => { state.filters.sort = e.target.value; state.currentPage = 1; updateView(); });

        paginationContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.page) {
                state.currentPage = parseInt(e.target.dataset.page);
                updateView();
                window.scrollTo(0, 0);
            }
        });

        modGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.mod-card');
            if (card && card.dataset.modUrl) {
                const mod = modsData.find(m => m.modPageUrl === card.dataset.modUrl);
                if (mod) showModal(mod);
            }
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) hideModal();
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.classList.contains('visible')) hideModal();
        });

        themeSwitch.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        updateView();
        document.getElementById('loader').style.display = 'none';
    }

    init();
});
