document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modListContainer = document.getElementById('mod-list-container');
    const paginationContainer = document.getElementById('pagination-container');
    const searchInput = document.getElementById('search-input');
    const gameSelect = document.getElementById('game-select');
    const versionSelect = document.getElementById('version-select');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupContent = document.getElementById('popup-content');

    // --- State ---
    let allMods = [];
    let filteredMods = [];
    let currentPage = 1;
    const modsPerPage = 9;

    // --- Main Function ---
    async function initialize() {
        try {
            const response = await fetch('./data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            allMods = data;
            applyFilters();
        } catch (error) {
            modListContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #000;">Error loading mods. The data file might be missing or invalid.</p>`;
            console.error('Error fetching mod data:', error);
        }
    }

    // --- Filtering and Rendering ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGame = gameSelect.value;
        const selectedVersion = versionSelect.value;

        filteredMods = allMods.filter(mod => {
            const matchesSearch = mod.title.toLowerCase().includes(searchTerm) || mod.description.toLowerCase().includes(searchTerm);
            const matchesGame = selectedGame === 'ALL' || mod.game === selectedGame;
            const matchesVersion = selectedVersion === 'ALL' || mod.version[selectedVersion.toLowerCase()];
            return matchesSearch && matchesGame && matchesVersion;
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

            postElement.innerHTML = `
                <a class="blog-post-image">
                    <img src="${mod.thumbnailUrl}" alt="${mod.title}" loading="lazy">
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
        nav.innerHTML = `
            <a class="pagination-previous"><i>arrow_left</i></a>
            <a class="pagination-next"><i>arrow_right</i></a>
            <ul class="pagination-list"></ul>
        `;
        
        const list = nav.querySelector('.pagination-list');
        for (let i = 1; i <= totalPages; i++) {
            list.innerHTML += `<li><a href="#" class="pagination-link ${i === currentPage ? 'is-current' : ''}" data-page="${i}">${i}</a></li>`;
        }

        paginationContainer.appendChild(nav);

        // Add event listeners for new pagination buttons
        const prevButton = nav.querySelector('.pagination-previous');
        const nextButton = nav.querySelector('.pagination-next');
        
        if (currentPage === 1) prevButton.setAttribute('disabled', true);
        if (currentPage === totalPages) nextButton.setAttribute('disabled', true);

        prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; render(); window.scrollTo(0, 0); }});
        nextButton.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; render(); window.scrollTo(0, 0); }});
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
            <div class="popup-blog-hero">
                <div class="popup-hero-image" style="background-image:url(${mod.thumbnailUrl})"></div>
                <div class="popup-hero-body">
                    <h1>${mod.title}</h1>
                </div>
            </div>
            <div class="popup-blog-content">
                <p>${mod.description}</p>
                <div class="popup-download-section">
                    <h3>Downloads</h3>
                    ${downloadLinksHtml || '<p>No direct download links found.</p>'}
                </div>
            </div>
        `;
        popupOverlay.style.display = 'flex';
    }

    // --- Event Listeners ---
    [searchInput, gameSelect, versionSelect].forEach(el => el.addEventListener('input', applyFilters));
    modListContainer.addEventListener('click', e => {
        const modCard = e.target.closest('.blog-post');
        if (modCard) showPopup(allMods[modCard.dataset.index]);
    });
    popupOverlay.addEventListener('click', e => {
        if (e.target === popupOverlay) popupOverlay.style.display = 'none';
    });

    // --- Start the application ---
    initialize();
});
