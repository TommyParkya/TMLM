document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let allMods = [];
    let filteredMods = [];
    let currentPage = 1;
    const modsPerPage = 9;

    // --- DOM ELEMENTS ---
    const loader = document.getElementById('loader');
    const modListContainer = document.getElementById('mod-list');
    const paginationContainer = document.getElementById('pagination');
    const searchBar = document.getElementById('search-bar');
    const gameSelect = document.getElementById('game-select');
    const versionSelect = document.getElementById('version-select');
    
    // Popup Elements
    const popupOverlay = document.getElementById('popup-overlay');
    const popupBox = document.getElementById('popup-box');
    const popupClose = document.getElementById('popup-close');
    const popupTitle = document.getElementById('popup-title');
    const popupThumbnail = document.getElementById('popup-thumbnail');
    const popupDescription = document.getElementById('popup-description');
    const popupDownloads = document.getElementById('popup-downloads');

    // --- INITIALIZATION ---
    async function initialize() {
        try {
            loader.style.display = 'flex';
            const response = await fetch('./data.json');
            if (!response.ok) throw new Error('Failed to load mod data.');
            allMods = await response.json();
            filteredMods = allMods;
            renderPage();
        } catch (error) {
            modListContainer.innerHTML = `<p style="color: red; text-align: center;">${error.message}</p>`;
        } finally {
            loader.style.display = 'none';
        }
    }

    // --- RENDERING LOGIC ---
    function renderPage() {
        applyFilters();
        modListContainer.innerHTML = '';
        
        const totalPages = Math.ceil(filteredMods.length / modsPerPage);
        if (currentPage > totalPages) currentPage = 1;

        const startIndex = (currentPage - 1) * modsPerPage;
        const endIndex = startIndex + modsPerPage;
        const modsForPage = filteredMods.slice(startIndex, endIndex);

        if (modsForPage.length === 0) {
            modListContainer.innerHTML = `<p style="text-align: center;">No mods found matching your criteria.</p>`;
        } else {
            modsForPage.forEach(mod => {
                const modCard = createModCard(mod);
                modListContainer.appendChild(modCard);
            });
        }
        
        renderPagination();
    }

    function createModCard(mod) {
        const card = document.createElement('a');
        card.className = 'blog-post';
        card.onclick = () => showPopup(mod);

        const uploadDate = new Date(mod.uploadDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        card.innerHTML = `
            <div class="blog-post-image">
                <img src="${mod.thumbnailUrl}" alt="${mod.title} thumbnail">
            </div>
            <div class="blog-post-body">
                <div class="date">
                    <i class="icon">schedule</i>
                    <span>${uploadDate}</span>
                </div>
                <h1>${mod.title}</h1>
                <p>${mod.description.substring(0, 100)}...</p>
            </div>
        `;
        return card;
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredMods.length / modsPerPage);

        if (totalPages <= 1) return;

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-previous';
        prevButton.innerHTML = '<i><</i>';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage();
            }
        };
        paginationContainer.appendChild(prevButton);

        // Page Number Buttons
        const pageList = document.createElement('ul');
        pageList.className = 'pagination-list';
        
        const pages = getPaginationNumbers(currentPage, totalPages);
        pages.forEach(page => {
            if (page === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.innerHTML = '…';
                pageList.appendChild(ellipsis);
            } else {
                const pageLink = document.createElement('a');
                pageLink.className = 'pagination-link';
                pageLink.textContent = page;
                if (page === currentPage) {
                    pageLink.classList.add('is-current');
                }
                pageLink.onclick = () => {
                    currentPage = page;
                    renderPage();
                };
                pageList.appendChild(pageLink);
            }
        });
        paginationContainer.appendChild(pageList);

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-next';
        nextButton.innerHTML = '<i>></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage();
            }
        };
        paginationContainer.appendChild(nextButton);
    }

    // --- FILTERING & EVENT HANDLING ---
    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        const selectedGame = gameSelect.value;
        const selectedVersion = versionSelect.value;

        filteredMods = allMods.filter(mod => {
            const matchesSearch = mod.title.toLowerCase().includes(searchTerm);
            const matchesGame = selectedGame === 'all' || mod.game === selectedGame;
            const matchesVersion = selectedVersion === 'all' || mod.versions.includes(selectedVersion);
            return matchesSearch && matchesGame && matchesVersion;
        });
        currentPage = 1; // Reset to first page after filtering
    }

    searchBar.addEventListener('input', renderPage);
    gameSelect.addEventListener('change', renderPage);
    versionSelect.addEventListener('change', renderPage);

    // --- POPUP LOGIC ---
    function showPopup(mod) {
        popupTitle.textContent = mod.title;
        popupThumbnail.src = mod.thumbnailUrl;
        popupDescription.textContent = mod.description;
        
        popupDownloads.innerHTML = '';
        mod.downloadLinks.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.textContent = link.displayText;
            a.target = '_blank'; // Open in new tab
            popupDownloads.appendChild(a);
        });

        popupOverlay.style.display = 'flex';
    }

    function hidePopup() {
        popupOverlay.style.display = 'none';
    }

    popupClose.addEventListener('click', hidePopup);
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            hidePopup();
        }
    });

    // --- UTILITY ---
    function getPaginationNumbers(current, total) {
        const delta = 1;
        const range = [];
        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
            range.push(i);
        }
        if (current - delta > 2) range.unshift('...');
        if (current + delta < total - 1) range.push('...');
        range.unshift(1);
        if (total > 1) range.push(total);
        return range;
    }

    // --- START THE APP ---
    initialize();
});
