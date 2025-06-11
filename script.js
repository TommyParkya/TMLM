document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modListContainer = document.getElementById('mod-list-container');
    const paginationContainer = document.getElementById('pagination-container');
    const searchInput = document.getElementById('search-input');
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allMods = data;
            filteredMods = data;
            render();
        } catch (error) {
            modListContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #000;">Error loading mods. The data file might be missing or invalid. Please try running the scraper action on GitHub.</p>`;
            console.error('Error fetching or parsing mod data:', error);
        }
    }

    // --- Rendering Functions ---
    function render() {
        renderModList();
        renderPagination();
    }

    function renderModList() {
        modListContainer.innerHTML = '';
        if (filteredMods.length === 0) {
            modListContainer.innerHTML = `<p style="text-align: center; width: 100%; color: #000;">No mods match your search.</p>`;
            return;
        }

        const startIndex = (currentPage - 1) * modsPerPage;
        const endIndex = startIndex + modsPerPage;
        const paginatedMods = filteredMods.slice(startIndex, endIndex);

        paginatedMods.forEach((mod, index) => {
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
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'pagination');

        const list = document.createElement('ul');
        list.className = 'pagination-list';

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'pagination-link';
            if (i === currentPage) {
                a.classList.add('is-current');
            }
            a.textContent = i;
            a.setAttribute('aria-label', `Page ${i}`);
            a.href = '#';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                render();
                window.scrollTo(0, 0);
            });
            li.appendChild(a);
            list.appendChild(li);
        }
        nav.appendChild(list);
        paginationContainer.appendChild(nav);
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

    // --- Event Listeners ---
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filteredMods = allMods.filter(mod => 
            mod.title.toLowerCase().includes(searchTerm) || 
            mod.description.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        render();
    });

    modListContainer.addEventListener('click', (event) => {
        const modCard = event.target.closest('.blog-post');
        if (modCard) {
            const modIndex = modCard.getAttribute('data-index');
            const mod = allMods[modIndex];
            showPopup(mod);
        }
    });

    popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) {
            popupOverlay.style.display = 'none';
        }
    });

    // --- Start the application ---
    initialize();
});
