document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modListContainer = document.getElementById('mod-list-container');
    const paginationContainer = document.getElementById('pagination-container');
    const searchInput = document.getElementById('search-input');
    const gameSelect = document.getElementById('game-select');
    const versionSelect = document.getElementById('version-select');

    // --- State ---
    let allMods = [];
    let filteredMods = [];
    let currentPage = 1;
    const modsPerPage = 9;

    // --- Main Function ---
    async function initialize() {
        // The loading spinner is visible by default in the HTML.
        try {
            const response = await fetch('./data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            allMods = data;
            // This is the first time we apply filters, which will then call render().
            applyFilters(); 
        } catch (error) {
            // If loading fails, remove the spinner and show an error.
            modListContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #000;">Error loading mods. The data file might be missing or invalid. Please run the scraper action on GitHub.</p>`;
        }
    }

    // --- Corrected Filter Logic ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGame = gameSelect.value;
        const selectedVersion = versionSelect.value;

        filteredMods = allMods.filter(mod => {
            const gameMatch = selectedGame === 'ALL' || mod.game === selectedGame;
            
            const versionKey = selectedVersion.toLowerCase();
            const versionMatch = selectedVersion === 'ALL' || (mod.version && mod.version[versionKey] === true);

            const searchMatch = mod.title.toLowerCase().includes(searchTerm) || mod.description.toLowerCase().includes(searchTerm);

            return gameMatch && versionMatch && searchMatch;
        });

        currentPage = 1;
        render();
    }

    function render() {
        renderModList();
        renderPagination();
    }

    function renderModList() {
        // This is where the functional loading animation works.
        // By clearing the container, we remove the spinner.
        modListContainer.innerHTML = ''; 
        
        if (filteredMods.length === 0) {
            modListContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #000;">No mods match your filters.</p>`;
            return;
        }

        const paginatedMods = filteredMods.slice((currentPage - 1) * modsPerPage, currentPage * modsPerPage);

        paginatedMods.forEach(mod => {
            const uploadDate = new Date(mod.uploadDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
            const thumbnailUrl = mod.thumbnailUrl || 'https://files.facepunch.com/lewis/1b1311b1/gmod-header.jpg';
            
            const downloadLinksHtml = mod.downloadLinks.map(link => 
                `<li><span>•</span><div class="entry"><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.displayText}</a></div></li>`
            ).join('');

            const modElement = document.createElement('div');
            modElement.className = 'changes-container';
            modElement.innerHTML = `
                <div class="changes-sidebar">
                    <div class="sidebar-section">
                        <span class="subtitle">Mod Title</span>
                        <a href="${mod.modPageUrl}" target="_blank" class="title">${mod.title}</a>
                    </div>
                    <div class="sidebar-section">
                        <a class="date">
                            <span class="icon"><i>date_range</i></span>
                            ${uploadDate}
                        </a>
                    </div>
                    <div class="sidebar-section">
                        <span class="subtitle">Game</span>
                        <a class="title">${mod.game}</a>
                    </div>
                </div>
                <div class="changes-body">
                    <div style="margin-bottom: 2rem;">
                        <img src="${thumbnailUrl}" alt="${mod.title}" style="width: 100%; border-radius: 10px; box-shadow: 0 5px 10px rgba(0,130,255,.2);">
                    </div>
                    <p style="color: #363636; line-height: 1.6;">${mod.description}</p>
                    <div class="changes-row features">
                        <div class="changes-row-header">
                            <span class="icon"><i>add_circle</i></span>
                            <h3>Downloads</h3>
                        </div>
                        <div class="changes-row-body">
                            <ul>${downloadLinksHtml || '<li>No download links found.</li>'}</ul>
                        </div>
                    </div>
                </div>
            `;
            modListContainer.appendChild(modElement);
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredMods.length / modsPerPage);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const nav = document.createElement('nav');
        nav.className = 'pagination';
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'pagination');

        const prevButton = `<a class="pagination-previous" ${currentPage === 1 ? 'disabled' : ''}><i>arrow_left</i></a>`;
        const nextButton = `<a class="pagination-next" ${currentPage === totalPages ? 'disabled' : ''}><i>arrow_right</i></a>`;
        
        let pageLinks = '';
        const pagesToShow = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
        } else {
            pagesToShow.push(1);
            if (currentPage > 3) pagesToShow.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pagesToShow.push(i);
            }
            if (currentPage < totalPages - 2) pagesToShow.push('...');
            pagesToShow.push(totalPages);
        }

        pagesToShow.forEach(page => {
            if (page === '...') {
                pageLinks += `<li><span class="pagination-ellipsis">…</span></li>`;
            } else {
                pageLinks += `<li><a href="#" class="pagination-link ${page === currentPage ? 'is-current' : ''}" data-page="${page}">${page}</a></li>`;
            }
        });

        nav.innerHTML = `${prevButton}${nextButton}<ul class="pagination-list">${pageLinks}</ul>`;
        paginationContainer.appendChild(nav);

        nav.querySelector('.pagination-previous').addEventListener('click', (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; render(); window.scrollTo(0, 0); }});
        nav.querySelector('.pagination-next').addEventListener('click', (e) => { e.preventDefault(); if (currentPage < totalPages) { currentPage++; render(); window.scrollTo(0, 0); }});
        nav.querySelectorAll('.pagination-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = parseInt(e.target.dataset.page);
                render();
                window.scrollTo(0, 0);
            });
        });
    }

    // --- Event Listeners ---
    [searchInput, gameSelect, versionSelect].forEach(el => {
        const eventType = el.tagName === 'INPUT' ? 'input' : 'change';
        el.addEventListener(eventType, applyFilters);
    });

    // --- Start the application ---
    initialize();
});
