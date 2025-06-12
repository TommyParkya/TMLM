document.addEventListener('DOMContentLoaded', () => {
    const modsData = JSON.parse(document.getElementById('mod-data')?.textContent || '[]');
    const manualData = JSON.parse(document.getElementById('manual-data')?.textContent || '{}');
    const { featured: featuredData = [], changelogs: changelogData = {} } = manualData;

    const state = { mods: [], currentPage: 1, filters: { search: '', platform: 'all', game: 'all', sort: 'newest' } };
    const MODS_PER_PAGE = 12;

    const gameInfoMap = {
        SA: { name: 'Grand Theft Auto: San Andreas', icon: 'assets/gta_sa.png' },
        VC: { name: 'Grand Theft Auto: Vice City', icon: 'assets/gta_vc.png' },
        III: { name: 'Grand Theft Auto: III', icon: 'assets/gta_3.png' }
    };
    const downloadIconMap = {
        'sharemods.com': 'https://sharemods.com/favicon.ico',
        'mediafire.com': 'https://www.mediafire.com/favicon.ico',
        'drive.google.com': 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
        'patreon.com': 'https://c5.patreon.com/external/favicon/rebrand/favicon.ico?v=af5597c2ef',
        'modsfire.com': 'https://modsfire.com/favicon.ico'
    };

    const modGrid = document.getElementById('mod-grid');
    const paginationContainer = document.getElementById('pagination');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    const formatDate = (dateString, long = true) => new Intl.DateTimeFormat('en-US', { weekday: long ? 'long' : undefined, year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));

    const renderGrid = () => {
        modGrid.innerHTML = '';
        const startIndex = (state.currentPage - 1) * MODS_PER_PAGE;
        const modsForPage = state.mods.slice(startIndex, startIndex + MODS_PER_PAGE);

        if (modsForPage.length === 0) {
            modGrid.innerHTML = `<p>None Found.</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        modsForPage.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';
            card.dataset.modUrl = mod.modPageUrl;
            const gameIcon = gameInfoMap[mod.game]?.icon || 'assets/gta_default.png';

            card.innerHTML = `
                <img src="${mod.thumbnailUrl}" alt="" class="mod-card-thumbnail" loading="lazy">
                <div class="mod-card-body">
                    <h2 class="mod-card-title">[${mod.game}] ${mod.title}</h2>
                    <p class="mod-card-description">${mod.description}</p>
                </div>
                <div class="mod-card-footer">
                    <span>${formatDate(mod.uploadDate)}</span>
                    <img src="${gameIcon}" alt="" class="game-icon">
                </div>
            `;
            fragment.appendChild(card);
        });
        modGrid.appendChild(fragment);
    };

    const renderPagination = () => {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(state.mods.length / MODS_PER_PAGE);
        if (totalPages <= 1) return;

        const createButton = (text, page, disabled = false) => {
            const button = document.createElement('button');
            button.innerHTML = text;
            button.dataset.page = page;
            if (disabled) button.disabled = true;
            return button;
        };

        paginationContainer.append(createButton('«', 1, state.currentPage === 1), createButton('‹', state.currentPage - 1, state.currentPage === 1));
        paginationContainer.append(document.createElement('span')).textContent = `Page ${state.currentPage} of ${totalPages}`;
        paginationContainer.append(createButton('›', state.currentPage + 1, state.currentPage === totalPages), createButton('»', totalPages, state.currentPage === totalPages));
    };

    const showModal = (mod) => {
        const gameInfo = gameInfoMap[mod.game] || { name: 'Unknown Game', icon: 'assets/gta_default.png' };
        
        const hostCounts = {};
        const downloadButtons = mod.downloadLinks.map(link => {
            const hostname = new URL(link.url).hostname.replace('www.', '');
            hostCounts[hostname] = (hostCounts[hostname] || 0) + 1;
            const iconUrl = downloadIconMap[hostname];
            const tooltipText = hostCounts[hostname] > 1 ? `${hostname} ${hostCounts[hostname]}` : hostname;
            const badge = hostCounts[hostname] > 1 ? `<span class="download-badge">${hostCounts[hostname]}</span>` : '';
            return iconUrl ? `<div class="tooltip"><a href="${link.url}" target="_blank" rel="noopener noreferrer"><img src="${iconUrl}" alt="${tooltipText}">${badge}</a><span class="tooltip-text">${tooltipText}</span></div>` : '';
        }).join('');

        const changelogHtml = (changelogData[mod.modPageUrl] || Object.entries(changelogData).find(([key, value]) => mod.modPageUrl.includes(key))?.[1] || []).map(([header, items]) => 
            `<div class="changelog-section"><h3>${header}</h3><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul></div>`
        ).join('');

        modalContent.innerHTML = `
            <header class="modal-header">
                <div class="game-info"><img src="${gameInfo.icon}" alt=""><div><div class="game-name">${gameInfo.name}</div><div class="platform">${mod.platform}</div></div></div>
                <div class="meta-info"><span class="upload-date">${formatDate(mod.uploadDate, false)}</span><div class="download-links">${downloadButtons}</div></div>
            </header>
            <main class="modal-body">
                <h1 class="modal-title">[${mod.game}] ${mod.title}</h1>
                <img src="${mod.thumbnailUrl}" alt="" class="modal-thumbnail">
                <p class="modal-description">${mod.description}</p>
                ${changelogHtml}
            </main>
        `;
        modalOverlay.classList.add('visible');
        document.body.classList.add('modal-open');
    };

    const hideModal = () => {
        modalOverlay.classList.remove('visible');
        document.body.classList.remove('modal-open');
    };

    const updateView = (preserveScroll = false) => {
        const scrollY = window.scrollY;
        const featuredSet = new Set(featuredData);
        state.mods = modsData
            .filter(mod => 
                (state.filters.platform === 'all' || mod.platform === state.filters.platform) &&
                (state.filters.game === 'all' || mod.game === state.filters.game) &&
                mod.title.toLowerCase().includes(state.filters.search)
            )
            .sort((a, b) => {
                const aIsFeatured = featuredSet.has(a.modPageUrl);
                const bIsFeatured = featuredSet.has(b.modPageUrl);
                if (aIsFeatured !== bIsFeatured) return aIsFeatured ? -1 : 1;
                return state.filters.sort === 'newest' ? new Date(b.uploadDate) - new Date(a.uploadDate) : new Date(a.uploadDate) - new Date(b.uploadDate);
            });
        
        renderGrid();
        renderPagination();
        if (preserveScroll) window.scrollTo({ top: scrollY, behavior: 'instant' });
    };

    const init = () => {
        document.querySelectorAll('.filter-bar select, .filter-bar input').forEach(el => {
            el.addEventListener(el.type === 'search' ? 'input' : 'change', (e) => {
                const filterType = e.target.id.split('-')[0];
                state.filters[filterType] = e.target.value;
                state.currentPage = 1;
                updateView(e.type === 'change');
                if(e.type !== 'change') window.scrollTo(0, 0);
            });
        });

        paginationContainer.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-page]');
            if (button && !button.disabled) {
                state.currentPage = parseInt(button.dataset.page);
                updateView(true);
            }
        });

        modGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.mod-card');
            if (card?.dataset.modUrl) {
                const mod = modsData.find(m => m.modPageUrl === card.dataset.modUrl);
                if (mod) showModal(mod);
            }
        });

        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) hideModal(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideModal(); });

        document.getElementById('theme-switch').addEventListener('click', () => {
            const newTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
        });

        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = savedTheme;

        updateView();
    };

    init();
});
