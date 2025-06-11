document.addEventListener('DOMContentLoaded', () => {
    const modListContainer = document.getElementById('mod-list-container');
    const paginationContainer = document.getElementById('pagination-container');
    const searchInput = document.getElementById('search-input');
    const gameSelect = document.getElementById('game-select');
    const versionSelect = document.getElementById('version-select');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupContent = document.getElementById('popup-content');

    let allMods = [];
    let filteredMods = [];
    let currentPage = 1;
    const modsPerPage = 9;

    async function initialize() {
        try {
            const response = await fetch('./data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            allMods = data;
            applyFilters();
        } catch (error) {
            modListContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #000;">Error loading mods. The data file might be missing or invalid.</p>`;
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGame = gameSelect.value;
        const selectedVersion = versionSelect.value;

        filteredMods = allMods.filter(mod => {
            const gameMatch = selectedGame === 'ALL' || mod.game === selectedGame;
            
            let versionMatch = selectedVersion === 'ALL';
            if (selectedVersion !== 'ALL') {
                const versionKey = selectedVersion.toLowerCase();
                versionMatch = mod.version && mod.version[versionKey] === true;
            }
            
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
        modListContainer.innerHTML = '';
        if (filteredMods.length === 0) {
            modListContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #000;">No mods match your filters.</p>`;
            return;
        }

        const paginatedMods = filteredMods.slice((currentPage - 1) * modsPerPage, currentPage * modsPerPage);

        paginatedMods.forEach(mod => {
            const globalIndex = allMods.findIndex(m => m.modPageUrl === mod.modPageUrl);
            const postElement = document.createElement('div');
            postElement.className = 'blog-post';
            postElement.setAttribute('data-index', globalIndex);
            
            const uploadDate = new Date(mod.uploadDate).toLocaleDateString();
            const thumbnailUrl = mod.thumbnailUrl || 'https://files.facepunch.com/lewis/1b1311b1/gmod-header.jpg';

            postElement.innerHTML = `
                <a class="blog-post-image">
                    <img src="${thumbnailUrl}" alt="${mod.title}" loading="lazy">
                </a>
                <div class="blog-post-body">
                    <div class="date">
                        <span class="icon"><i>schedule</i></span>
                        <span>${uploadDate}</span>
                    </div>
                    <a><h1 class="title is-size-4">${mod.title}</h1></a>
                    <p class="subtitle is-size-6">${mod.description}</p>
                </div>
            `;
            modListContainer.appendChild(postElement);
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

    function showPopup(mod) {
        const downloadLinksHtml = mod.downloadLinks.map(link => 
            `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.displayText}</a>`
        ).join('');

        popupContent.innerHTML = `
            <h1>${mod.title}</h1>
            <p>${mod.description}</p>
            <div class="download-section">
                <h3>Downloads</h3>
                ${downloadLinksHtml || '<p>No direct download links found.</p>'}
            </div>
        `;
        popupOverlay.style.display = 'flex';
    }

    [searchInput, gameSelect, versionSelect].forEach(el => {
        const eventType = el.tagName === 'INPUT' ? 'input' : 'change';
        el.addEventListener(eventType, applyFilters);
    });
    modListContainer.addEventListener('click', e => {
        const modCard = e.target.closest('.blog-post');
        if (modCard) showPopup(allMods[modCard.dataset.index]);
    });
    popupOverlay.addEventListener('click', e => {
        if (e.target === popupOverlay) popupOverlay.style.display = 'none';
    });

    initialize();
});
