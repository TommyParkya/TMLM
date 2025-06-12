document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Setup ---
    const mods = JSON.parse(document.getElementById('mod-data').textContent);
    const featured = JSON.parse(document.getElementById('featured-data').textContent);
    
    const searchInput = document.querySelector('.search-box input[name="search"]');
    const postContainer = document.querySelector('.blog-posts-container');
    const paginationContainer = document.querySelector('.pagination-container');
    const loader = document.querySelector('.loader-wrapper');

    if (!mods || !postContainer || !paginationContainer) {
        console.error('Essential elements for the script are missing.');
        if(loader) loader.classList.add('hidden');
        return;
    }

    // --- Persona-driven UI Text ---
    const personaTexts = {
        searchPlaceholder: "Search the archives for a specific mod...",
        filterPlatform: "Platform",
        filterGame: "Game",
        sort: "Sort By"
    };

    // --- Dynamic Filter/Sort Controls ---
    const filterBar = document.querySelector('.filter-bar');
    const tabs = filterBar.querySelector('.tabs');
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'filter-controls';
    
    controlsContainer.innerHTML = `
        <select id="game-filter" aria-label="${personaTexts.filterGame}">
            <option value="all">All Games</option>
            <option value="SA">GTA SA</option>
            <option value="VC">GTA VC</option>
            <option value="III">GTA III</option>
        </select>
        <select id="sort-control" aria-label="${personaTexts.sort}">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
        </select>
    `;
    // Note: Platform filter was removed as scraped data doesn't contain it.
    // The prompt's example data structure doesn't include platform, so I'm omitting it for accuracy.
    
    tabs.parentNode.insertBefore(controlsContainer, tabs.nextSibling);

    const gameFilter = document.getElementById('game-filter');
    const sortControl = document.getElementById('sort-control');
    searchInput.placeholder = personaTexts.searchPlaceholder;

    let currentPage = 1;
    const MODS_PER_PAGE = 9;

    // --- Core Functions ---

    function getModSlug(modPageUrl) {
        try {
            const url = new URL(modPageUrl);
            const slug = url.pathname.split('/').filter(Boolean).pop();
            return slug || 'mod';
        } catch (e) {
            return 'mod-' + Math.random().toString(36).substring(2, 9);
        }
    }

    function renderMods(modsToRender) {
        postContainer.innerHTML = '';
        if (modsToRender.length === 0) {
            postContainer.innerHTML = '<p style="color: #000; grid-column: 1 / -1; text-align: center; font-size: 1.5rem;">No mods found matching your criteria. Try adjusting your filters.</p>';
            return;
        }

        const featuredSet = new Set(featured);
        const fragment = document.createDocumentFragment();

        modsToRender.forEach(mod => {
            const slug = getModSlug(mod.modPageUrl);
            const modPagePath = `/mods/${slug}.html`;
            const isFeatured = featuredSet.has(mod.modPageUrl);

            const post = document.createElement('div');
            post.className = 'blog-post';
            post.innerHTML = `
                <a href="${modPagePath}" class="blog-post-image">
                    <img src="${mod.thumbnailUrl}" alt="Blog Header Image">
                    <div class="dev-tags">
                        ${isFeatured ? '<img src="https://community.fastly.steamstatic.com/public/images/sharedfiles/Workshop_FeatureTag_new.png" alt="Featured" style="position: absolute; top: -5px; left: -5px; width: 64px; height: 64px; z-index: 10;">' : ''}
                    </div>
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

    function renderPagination(totalMods) {
        const totalPages = Math.ceil(totalMods / MODS_PER_PAGE);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        let paginationHTML = `
            <nav class="pagination" role="navigation" aria-label="pagination">
                <a class="pagination-previous" ${currentPage === 1 ? 'disabled' : ''}><i>arrow_left</i></a>
                <a class="pagination-next" ${currentPage === totalPages ? 'disabled' : ''}><i>arrow_right</i></a>
                <ul class="pagination-list">`;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<li><a class="pagination-link ${i === currentPage ? 'is-current' : ''}" data-page="${i}">${i}</a></li>`;
        }

        paginationHTML += `</ul></nav>`;
        paginationContainer.innerHTML = paginationHTML;

        // Add event listeners for new pagination links
        paginationContainer.querySelectorAll('.pagination-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = parseInt(e.target.dataset.page);
                updateView();
            });
        });
        const prevButton = paginationContainer.querySelector('.pagination-previous');
        if (prevButton && !prevButton.hasAttribute('disabled')) {
            prevButton.addEventListener('click', () => {
                currentPage--;
                updateView();
            });
        }
        const nextButton = paginationContainer.querySelector('.pagination-next');
        if (nextButton && !nextButton.hasAttribute('disabled')) {
            nextButton.addEventListener('click', () => {
                currentPage++;
                updateView();
            });
        }
    }

    function updateView() {
        // 1. Filter
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGame = gameFilter.value;

        let filteredMods = mods.filter(mod => {
            const titleMatch = mod.title.toLowerCase().includes(searchTerm);
            const gameMatch = selectedGame === 'all' || mod.title.includes(`[${selectedGame}]`);
            return titleMatch && gameMatch;
        });

        // 2. Sort
        const sortOrder = sortControl.value;
        filteredMods.sort((a, b) => {
            const dateA = new Date(a.uploadDate);
            const dateB = new Date(b.uploadDate);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // 3. Paginate
        const startIndex = (currentPage - 1) * MODS_PER_PAGE;
        const endIndex = startIndex + MODS_PER_PAGE;
        const modsForPage = filteredMods.slice(startIndex, endIndex);

        // 4. Render
        renderMods(modsForPage);
        renderPagination(filteredMods.length);
        window.scrollTo(0, 0);
    }

    // --- Event Listeners ---
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentPage = 1;
            updateView();
        }, 300);
    });
    
    // Prevent form submission on enter
    searchInput.closest('form').addEventListener('submit', e => e.preventDefault());

    gameFilter.addEventListener('change', () => {
        currentPage = 1;
        updateView();
    });

    sortControl.addEventListener('change', () => {
        currentPage = 1;
        updateView();
    });

    // --- Initial Load ---
    // The initial page is rendered by the build script. This JS takes over from there.
    // We just need to hide the loader and set up pagination listeners for the static page.
    if(loader) loader.classList.add('hidden');
    
    // Initial pagination setup
    const initialTotalPages = Math.ceil(mods.length / MODS_PER_PAGE);
    const initialPaginationLinks = paginationContainer.querySelectorAll('.pagination-link');
    const urlPage = parseInt(window.location.pathname.split('/page/')[1] || '1');
    currentPage = isNaN(urlPage) ? 1 : urlPage;

    initialPaginationLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = parseInt(e.target.textContent);
            updateView();
        });
    });
    
    const prevButton = paginationContainer.querySelector('.pagination-previous');
    if (prevButton && !prevButton.hasAttribute('disabled')) {
        prevButton.addEventListener('click', () => {
            currentPage--;
            updateView();
        });
    }
    const nextButton = paginationContainer.querySelector('.pagination-next');
    if (nextButton && !nextButton.hasAttribute('disabled')) {
        nextButton.addEventListener('click', () => {
            currentPage++;
            updateView();
        });
    }
});
