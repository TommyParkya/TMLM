document.addEventListener('DOMContentLoaded', () => {
    const MODS_PER_PAGE = 9;
    let allMods = [];
    let currentPage = 1;
    let filters = {
        game: 'all',
        version: 'all',
        search: ''
    };

    const loadingSpinner = document.getElementById('loading-spinner');
    const modListContainer = document.getElementById('mod-list-container');
    const paginationContainer = document.getElementById('pagination-container');
    const heroImage = document.getElementById('hero-image');

    // Filter elements
    const searchInput = document.getElementById('search-input');
    const gameSelect = document.getElementById('game-select');
    const versionSelect = document.getElementById('version-select');

    // Popup elements
    const popupOverlay = document.getElementById('popup-overlay');
    const popupClose = document.getElementById('popup-close');

    function applyFilters() {
        const search = filters.search.toLowerCase();
        return allMods
            .filter(mod => filters.game === 'all' || mod.game === filters.game)
            .filter(mod => filters.version === 'all' || mod.versions.includes(filters.version))
            .filter(mod => mod.title.toLowerCase().includes(search) || mod.description.toLowerCase().includes(search))
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    function render() {
        const filteredMods = applyFilters();
        renderModList(filteredMods);
        renderPagination(filteredMods.length);
        updateHeroImage(filteredMods);
    }

    function renderModList(filteredMods) {
        modListContainer.innerHTML = '';
        const startIndex = (currentPage - 1) * MODS_PER_PAGE;
        const endIndex = startIndex + MODS_PER_PAGE;
        const pageMods = filteredMods.slice(startIndex, endIndex);

        if (pageMods.length === 0) {
            modListContainer.innerHTML = `<p style="color: #929497; text-align: center; grid-column: 1 / -1;">No mods found matching your criteria.</p>`;
            return;
        }

        pageMods.forEach((mod, index) => {
            const modIndex = allMods.findIndex(m => m.modPageUrl === mod.modPageUrl);
            const modElement = document.createElement('div');
            modElement.className = 'blog-post';
            modElement.dataset.modId = modIndex;

            const uploadDate = new Date(mod.uploadDate);
            const formattedDate = uploadDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            modElement.innerHTML = `
                <a href="#" class="blog-post-image">
                    <img src="${mod.thumbnailUrl}" alt="Mod Thumbnail">
                </a>
                <div class="blog-post-body">
                    <div class="date">
                        <span class="icon"><i>schedule</i></span>
                        <span>${formattedDate}</span>
                    </div>
                    <a href="#">
                        <h1 class="title is-size-4">${mod.title}</h1>
                    </a>
                    <p class="subtitle is-size-6">${mod.description.substring(0, 100)}...</p>
                </div>
            `;
            modListContainer.appendChild(modElement);
        });
    }

    function renderPagination(totalItems) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / MODS_PER_PAGE);
        if (totalPages <= 1) return;

        const nav = document.createElement('nav');
        nav.className = 'pagination';
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'pagination');

        const prevButton = document.createElement('a');
        prevButton.className = 'pagination-previous';
        prevButton.innerHTML = '<i>arrow_left</i>';
        if (currentPage === 1) prevButton.disabled = true;
        prevButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                render();
            }
        });

        const nextButton = document.createElement('a');
        nextButton.className = 'pagination-next';
        nextButton.innerHTML = '<i>arrow_right</i>';
        if (currentPage === totalPages) nextButton.disabled = true;
        nextButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                render();
            }
        });

        const ul = document.createElement('ul');
        ul.className = 'pagination-list';

        // Pagination number logic
        const pageNumbers = getPageNumbers(totalPages, currentPage);
        pageNumbers.forEach(page => {
            const li = document.createElement('li');
            if (page === '...') {
                li.innerHTML = `<a class="pagination-link disabled">...</a>`;
            } else {
                const a = document.createElement('a');
                a.className = 'pagination-link';
                if (page === currentPage) a.classList.add('is-current');
                a.textContent = page;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = page;
                    render();
                });
                li.appendChild(a);
            }
            ul.appendChild(li);
        });

        nav.appendChild(prevButton);
        nav.appendChild(nextButton);
        nav.appendChild(ul);
        paginationContainer.appendChild(nav);
    }
    
    function getPageNumbers(totalPages, currentPage) {
        const delta = 2;
        const range = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }
        if (currentPage - delta > 2) range.unshift('...');
        if (currentPage + delta < totalPages - 1) range.push('...');
        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);
        return range;
    }

    function updateHeroImage(filteredMods) {
        if (filteredMods.length > 0 && filteredMods[0].thumbnailUrl) {
            heroImage.style.backgroundImage = `url(${filteredMods[0].thumbnailUrl})`;
        } else {
            heroImage.style.backgroundImage = `url(https://files.facepunch.com/lewis/1b1311b1/gmod-header.jpg)`; // Fallback
        }
    }

    function showPopup(modId) {
        const mod = allMods[modId];
        if (!mod) return;

        document.getElementById('popup-thumbnail').src = mod.thumbnailUrl;
        document.getElementById('popup-title').textContent = mod.title;
        document.getElementById('popup-description').textContent = mod.description;
        
        const downloadsDiv = document.getElementById('popup-downloads');
        downloadsDiv.innerHTML = '';
        mod.downloadLinks.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.textContent = link.displayText;
            a.target = '_blank';
            downloadsDiv.appendChild(a);
        });

        popupOverlay.style.display = 'flex';
    }

    // Event Listeners
    searchInput.addEventListener('input', () => {
        filters.search = searchInput.value;
        currentPage = 1;
        render();
    });

    gameSelect.addEventListener('change', () => {
        filters.game = gameSelect.value;
        currentPage = 1;
        render();
    });

    versionSelect.addEventListener('change', () => {
        filters.version = versionSelect.value;
        currentPage = 1;
        render();
    });

    popupClose.addEventListener('click', () => popupOverlay.style.display = 'none');
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            popupOverlay.style.display = 'none';
        }
    });

    modListContainer.addEventListener('click', (e) => {
        const modCard = e.target.closest('.blog-post');
        if (modCard && modCard.dataset.modId) {
            e.preventDefault();
            showPopup(parseInt(modCard.dataset.modId));
        }
    });

    // Initial Fetch
    fetch('./data.json')
        .then(response => response.json())
        .then(data => {
            allMods = data;
            loadingSpinner.style.display = 'none';
            render();
        })
        .catch(error => {
            console.error('Error fetching mod data:', error);
            loadingSpinner.style.display = 'none';
            modListContainer.innerHTML = `<p style="color: #c72a2a; text-align: center; grid-column: 1 / -1;">Failed to load mod data. Please check the console.</p>`;
        });
});