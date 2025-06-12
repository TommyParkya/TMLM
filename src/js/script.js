document.addEventListener('DOMContentLoaded', () => {
    const modsData = JSON.parse(document.getElementById('mod-data')?.textContent || '[]');
    const featuredData = JSON.parse(document.getElementById('featured-data')?.textContent || '[]');
    
    const postContainer = document.querySelector('.blog-posts-container');
    const paginationContainer = document.querySelector('.pagination-container');
    const loader = document.querySelector('.loader-wrapper');
    const filterControlsContainer = document.querySelector('.filter-controls');
    const searchInput = document.querySelector('.search-box input[name="search"]');

    if (!modsData.length || !postContainer || !paginationContainer || !filterControlsContainer) {
        if(loader) loader.classList.add('hidden');
        return;
    }

    // --- Setup Filter Controls ---
    filterControlsContainer.innerHTML = `
        <select id="platform-filter" aria-label="Platform">
            <option value="all">All Platforms</option>
            <option value="PC">PC</option>
            <option value="Mobile">Mobile</option>
            <option value="DE">Definitive Edition</option>
            <option value="PS2">PS2</option>
        </select>
        <select id="game-filter" aria-label="Game">
            <option value="all">All Games</option>
            <option value="SA">GTA SA</option>
            <option value="VC">GTA VC</option>
            <option value="III">GTA III</option>
        </select>
        <select id="sort-control" aria-label="Sort By">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
        </select>
    `;

    const platformFilter = document.getElementById('platform-filter');
    const gameFilter = document.getElementById('game-filter');
    const sortControl = document.getElementById('sort-control');

    let currentPage = 1;
    const MODS_PER_PAGE = 9;

    function getModSlug(modPageUrl) {
        try { return new URL(modPageUrl).pathname.split('/').filter(Boolean).pop() || 'mod'; }
        catch (e) { return 'mod-' + Math.random().toString(36).substring(2, 9); }
    }

    function renderMods(modsToRender) {
        postContainer.innerHTML = '';
        if (modsToRender.length === 0) {
            postContainer.innerHTML = '<p style="color: #000; grid-column: 1 / -1; text-align: center; font-size: 1.5rem;">No mods found matching your criteria.</p>';
            return;
        }

        const featuredSet = new Set(featuredData);
        const fragment = document.createDocumentFragment();

        modsToRender.forEach(mod => {
            const modPagePath = `mods/${getModSlug(mod.modPageUrl)}.html`;
            const isFeatured = featuredSet.has(mod.modPageUrl);

            const post = document.createElement('div');
            post.className = 'blog-post';
            // FIX: Ensure icon is always rendered correctly
            post.innerHTML = `
                <a href="${modPagePath}" class="blog-post-image">
                    <img src="${mod.thumbnailUrl}" alt="Mod Thumbnail">
                    <div class="dev-tags">${isFeatured ? '<img src="assets/Workshop_FeatureTag_new.png" alt="Featured" style="position: absolute; top: -5px; left: -5px; width: 64px; height: 64px; z-index: 10;">' : ''}</div>
                </a>
                <div class="blog-post-body">
                    <div class="date">
                        <span class="icon"><i>schedule</i></span>
                        <span>${new Date(mod.uploadDate).toDateString()}</span>
                    </div>
                    <a href="${modPagePath}">
                        <h1 class="title is-size-4">${mod.title}</h1>
                    </a>
                    <p class="subtitle is-size-6">${mod.description}</p>
                </div>
            `;
            fragment.appendChild(post);
        });
        postContainer.appendChild(fragment);
    }

    function renderPagination(totalMods, currentFilters) {
        const totalPages = Math.ceil(totalMods / MODS_PER_PAGE);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const urlParams = new URLSearchParams(currentFilters).toString();
        
        let paginationHTML = `<nav class="pagination" role="navigation" aria-label="pagination">
            <a class="pagination-previous" ${currentPage === 1 ? 'disabled' : ''} href="?page=${currentPage - 1}&${urlParams}"><i>arrow_left</i></a>
            <a class="pagination-next" ${currentPage === totalPages ? 'disabled' : ''} href="?page=${currentPage + 1}&${urlParams}"><i>arrow_right</i></a>
            <ul class="pagination-list">`;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<li><a class="pagination-link ${i === currentPage ? 'is-current' : ''}" href="?page=${i}&${urlParams}">${i}</a></li>`;
        }

        paginationHTML += `</ul></nav>`;
        paginationContainer.innerHTML = paginationHTML;
    }

    function updateView(preserveScroll = false) {
        const scrollY = window.scrollY;

        const currentFilters = {
            search: searchInput.value.toLowerCase(),
            platform: platformFilter.value,
            game: gameFilter.value,
            sort: sortControl.value
        };

        let filteredMods = modsData.filter(mod => {
            const titleMatch = mod.title.toLowerCase().includes(currentFilters.search);
            const platformMatch = currentFilters.platform === 'all' || mod.platform === currentFilters.platform;
            const gameMatch = currentFilters.game === 'all' || mod.title.includes(`[${currentFilters.game}]`);
            return titleMatch && platformMatch && gameMatch;
        });

        filteredMods.sort((a, b) => {
            const dateA = new Date(a.uploadDate);
            const dateB = new Date(b.uploadDate);
            return currentFilters.sort === 'newest' ? dateB - dateA : dateA - dateB;
        });

        const urlParams = new URLSearchParams(window.location.search);
        currentPage = parseInt(urlParams.get('page')) || 1;

        const startIndex = (currentPage - 1) * MODS_PER_PAGE;
        const modsForPage = filteredMods.slice(startIndex, startIndex + MODS_PER_PAGE);

        renderMods(modsForPage);
        renderPagination(filteredMods.length, currentFilters);
        
        if (preserveScroll) {
            window.scrollTo(0, scrollY);
        }
    }

    function handleFilterChange(e) {
        // Don't prevent default, let the URL change
        updateView(true); // Preserve scroll on filter change
    }
    
    // Use a single event listener on the container for efficiency
    paginationContainer.addEventListener('click', e => {
        if (e.target.tagName === 'A' && e.target.closest('.pagination')) {
            e.preventDefault();
            const url = new URL(e.target.href);
            window.history.pushState({}, '', url.search);
            updateView(); // Scroll to top on page change
        }
    });

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            window.history.pushState({}, '', '?page=1');
            updateView(true);
        }, 300);
    });
    
    searchInput.closest('form').addEventListener('submit', e => e.preventDefault());
    platformFilter.addEventListener('change', () => { window.history.pushState({}, '', '?page=1'); updateView(true); });
    gameFilter.addEventListener('change', () => { window.history.pushState({}, '', '?page=1'); updateView(true); });
    sortControl.addEventListener('change', () => { window.history.pushState({}, '', '?page=1'); updateView(true); });

    // Initial load
    updateView();
    if(loader) loader.classList.add('hidden');
});
