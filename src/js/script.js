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

    filterControlsContainer.innerHTML = `
        <select id="platform-filter" aria-label="Platform"><option value="all">All Platforms</option><option value="PC">PC</option><option value="Mobile">Mobile</option><option value="DE">Definitive Edition</option><option value="PS2">PS2</option></select>
        <select id="game-filter" aria-label="Game"><option value="all">All Games</option><option value="SA">GTA SA</option><option value="VC">GTA VC</option><option value="III">GTA III</option></select>
        <select id="sort-control" aria-label="Sort By"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select>
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

    function formatDate(dateString) {
        return new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
    }

    function renderMods(modsToRender) {
        postContainer.innerHTML = '';
        if (modsToRender.length === 0) {
            postContainer.innerHTML = '<p style="color: #000; grid-column: 1 / -1; text-align: center; font-size: 1.5rem;">None Found.</p>';
            return;
        }

        const featuredSet = new Set(featuredData);
        const fragment = document.createDocumentFragment();

        modsToRender.forEach(mod => {
            const modPagePath = `mods/${getModSlug(mod.modPageUrl)}.html`;
            const isFeatured = featuredSet.has(mod.modPageUrl);

            const post = document.createElement('div');
            post.className = 'blog-post';
            post.innerHTML = `
                <a href="${modPagePath}" class="blog-post-image">
                    <img src="${mod.thumbnailUrl}" alt="Mod Thumbnail" loading="lazy" decoding="async">
                    <div class="dev-tags">${isFeatured ? '<img src="assets/Workshop_FeatureTag_new.png" alt="Featured" style="position: absolute; top: -5px; left: -5px; width: 64px; height: 64px; z-index: 10;">' : ''}</div>
                </a>
                <div class="blog-post-body">
                    <div class="date"><span class="icon"><i>schedule</i></span><span>${formatDate(mod.uploadDate)}</span></div>
                    <a href="${modPagePath}"><h1 class="title is-size-4">${mod.title}</h1></a>
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
            <a class="pagination-previous" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i>arrow_left</i></a>
            <a class="pagination-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i>arrow_right</i></a>
            <ul class="pagination-list">`;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<li><a class="pagination-link ${i === currentPage ? 'is-current' : ''}" data-page="${i}">${i}</a></li>`;
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

        const startIndex = (currentPage - 1) * MODS_PER_PAGE;
        const modsForPage = filteredMods.slice(startIndex, startIndex + MODS_PER_PAGE);

        renderMods(modsForPage);
        renderPagination(filteredMods.length, currentFilters);
        
        if (preserveScroll) {
            window.scrollTo(0, scrollY);
        } else {
            window.scrollTo(0, 0);
        }
    }

    paginationContainer.addEventListener('click', e => {
        const target = e.target.closest('a[data-page]');
        if (target && !target.hasAttribute('disabled')) {
            currentPage = parseInt(target.dataset.page);
            updateView();
        }
    });

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentPage = 1;
            updateView(true);
        }, 300);
    });
    
    searchInput.closest('form').addEventListener('submit', e => e.preventDefault());
    platformFilter.addEventListener('change', () => { currentPage = 1; updateView(true); });
    gameFilter.addEventListener('change', () => { currentPage = 1; updateView(true); });
    sortControl.addEventListener('change', () => { currentPage = 1; updateView(true); });

    updateView();
    if(loader) loader.classList.add('hidden');
});
