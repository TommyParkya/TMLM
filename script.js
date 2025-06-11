// --- UI Functions ---
function UpdateBackgroundBasedOnScrollPosition() {
    if (!document.scrollingElement) return;
    const classes = document.getElementsByClassName("transition-header");
    for (let i = 0; i < classes.length; i++) {
        let delta = document.scrollingElement.scrollTop / 400;
        delta = Math.min(delta, 1);
        let opacity = Math.max(0.1, 1 - delta);
        const element = classes[i];
        element.style.opacity = opacity.toString();
        element.style.filter = `blur(${delta * 30}px)`;
    }
}
document.addEventListener("scroll", UpdateBackgroundBasedOnScrollPosition);

// --- MOD BROWSER LOGIC ---

let allModsData = [];
let currentPage = 1;
const MODS_PER_PAGE = 9;

async function getMods() {
    if (allModsData.length > 0) return allModsData;
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allModsData = await response.json();
        return allModsData;
    } catch (error) {
        console.error("Failed to fetch data.json:", error);
        return [];
    }
}

function createPagination(filteredModsCount, page) {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredModsCount / MODS_PER_PAGE);
    if (totalPages <= 1) return;

    const nav = document.createElement('nav');
    nav.className = 'pagination';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'pagination');

    const prevButton = document.createElement('a');
    prevButton.className = 'pagination-previous';
    prevButton.innerHTML = '<i>arrow_left</i>';
    if (page === 1) {
        prevButton.setAttribute('disabled', true);
    } else {
        prevButton.onclick = (e) => { e.preventDefault(); currentPage--; renderPage(); };
    }

    const nextButton = document.createElement('a');
    nextButton.className = 'pagination-next';
    nextButton.innerHTML = '<i>arrow_right</i>';
    if (page === totalPages) {
        nextButton.setAttribute('disabled', true);
    } else {
        nextButton.onclick = (e) => { e.preventDefault(); currentPage++; renderPage(); };
    }
    
    const ul = document.createElement('ul');
    ul.className = 'pagination-list';

    const pageLinks = new Set();
    pageLinks.add(1);

    if (page > 3) pageLinks.add('...');
    
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pageLinks.add(i);
    }

    if (page < totalPages - 2) pageLinks.add('...');
    
    pageLinks.add(totalPages);

    pageLinks.forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'pagination-link';
        if (p === '...') {
            a.classList.add('disabled');
            a.textContent = '...';
        } else {
            a.textContent = p;
            if (p === page) a.classList.add('is-current');
            a.onclick = (e) => { e.preventDefault(); currentPage = p; renderPage(); };
        }
        li.appendChild(a);
        ul.appendChild(li);
    });

    nav.append(prevButton, nextButton, ul);
    paginationContainer.appendChild(nav);
}

function renderModCards(modsToRender, isFeatured) {
    const container = document.querySelector('.blog-posts-container');
    if(isFeatured) {
        // Clear only if we are re-rendering the main list, not just the featured one.
        container.innerHTML = '';
    }
    
    if (modsToRender.length === 0 && !isFeatured) {
        container.innerHTML = `<p style="color: #000; text-align: center; font-size: 1.5rem;">No mods match your search.</p>`;
        return;
    }

    modsToRender.forEach(mod => {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        
        const date = new Date(mod.uploadDate);
        const displayDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        postElement.innerHTML = `
            <a href="mod.html?id=${mod.id}" class="blog-post-image">
                <img src="${mod.thumbnailUrl}" alt="Mod Thumbnail" onerror="this.onerror=null;this.src='https://files.facepunch.com/lewis/1b1911b115/placeholder2.jpg';">
            </a>
            <div class="blog-post-body">
                <div class="date">
                    <span class="icon"><i>schedule</i></span>
                    <span>${displayDate}</span>
                </div>
                <a href="mod.html?id=${mod.id}">
                    <h1 class="title is-size-4">${mod.title}</h1>
                </a>
                <p class="subtitle is-size-6">${mod.description}</p>
            </div>
        `;
        container.appendChild(postElement);
    });
}

function renderFeaturedHeader(mod) {
    const header = document.getElementById('featured-mod-header');
    if (!header || !mod) return;

    const date = new Date(mod.uploadDate);
    const displayDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    header.innerHTML = `
        <div class="blog-hero-image transition-header" style="background-image:url(${mod.thumbnailUrl})"></div>
        <div class="blog-list-header-body">
            <div class="container">
                <div class="tags">
                    <div class="tag secondary">
                        <span class="icon"><i>schedule</i></span>
                        ${displayDate}
                    </div>
                </div>
                <a href="mod.html?id=${mod.id}" class="blog-header-title">
                    <h1>${mod.title}</h1>
                </a>
                <p>${mod.description}</p>
                <a href="mod.html?id=${mod.id}" class="button is-secondary is-medium">Read more</a>
            </div>
        </div>
    `;
    UpdateBackgroundBasedOnScrollPosition();
}

function getFilteredMods() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const gameFilter = document.getElementById('game-filter').value;
    const versionFilter = document.getElementById('version-filter').value;

    return allModsData.filter(mod => {
        const title = mod.title.toLowerCase();
        const gameTag = mod.gameTag || '';
        const versionTag = mod.versionTag || '';
        
        const matchesSearch = title.includes(searchInput);
        const matchesGame = (gameFilter === 'all') || (gameTag === gameFilter);
        const matchesVersion = (versionFilter === 'all') || (versionTag === versionFilter);
        
        return matchesSearch && matchesGame && matchesVersion;
    });
}

function renderPage() {
    const filteredMods = getFilteredMods();
    let modsToDisplay = [...filteredMods]; // Create a mutable copy

    if (currentPage === 1 && document.getElementById('search-input').value === '' && document.getElementById('game-filter').value === 'all' && document.getElementById('version-filter').value === 'all' && modsToDisplay.length > 0) {
        renderFeaturedHeader(modsToDisplay[0]);
        modsToDisplay.shift(); // Remove the featured mod from the list to be displayed below
    } else {
        const header = document.getElementById('featured-mod-header');
        if(header) header.innerHTML = '';
    }

    const paginatedMods = modsToDisplay.slice((currentPage - 1) * MODS_PER_PAGE, currentPage * MODS_PER_PAGE);
    
    renderModCards(paginatedMods, true);
    createPagination(modsToDisplay.length, currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadIndexPage() {
    const container = document.querySelector('.blog-posts-container');
    if (!container) return;
    
    try {
        await getMods();
        document.getElementById('search-input').addEventListener('input', () => { currentPage = 1; renderPage(); });
        document.getElementById('game-filter').addEventListener('change', () => { currentPage = 1; renderPage(); });
        document.getElementById('version-filter').addEventListener('change', () => { currentPage = 1; renderPage(); });
        renderPage();
    } catch (error) {
        console.error('Failed to load mods:', error);
        container.innerHTML = '<p style="color: #f00; text-align: center; font-size: 1.5rem;">Failed to load mods. Please trigger the scraper action on GitHub and refresh.</p>';
    }
}

async function loadModPage() {
    try {
        const params = new URLSearchParams(window.location.search);
        const modId = params.get('id');
        if (!modId) throw new Error('Mod ID not specified in URL.');

        const mods = await getMods();
        const mod = mods.find(m => m.id === modId);
        if (!mod) throw new Error('Mod not found in data file.');

        document.title = `${mod.title} - Mod Details`;
        document.getElementById('mod-hero-image').style.backgroundImage = `url(${mod.thumbnailUrl})`;
        const date = new Date(mod.uploadDate);
        const displayDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        document.querySelector('#mod-date span').textContent = displayDate;
        document.getElementById('mod-title').textContent = mod.title;
        document.getElementById('mod-description-summary').textContent = mod.description;
        
        const contentContainer = document.getElementById('mod-content-container');
        contentContainer.querySelector('#mod-description').textContent = mod.description;
        
        const downloadsContainer = contentContainer.querySelector('#mod-downloads');
        downloadsContainer.innerHTML = '';
        if (mod.downloadLinks && mod.downloadLinks.length > 0) {
            mod.downloadLinks.forEach(link => {
                const button = document.createElement('a');
                button.href = link.url;
                button.className = 'button is-primary is-medium';
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
                button.textContent = link.displayText;
                downloadsContainer.appendChild(button);
            });
        } else {
            downloadsContainer.innerHTML = '<p style="color:#000;">No download links were found for this mod.</p>';
        }
    } catch (error) {
        console.error('Failed to load mod details:', error);
        document.body.innerHTML = `<h1 style="text-align:center; padding-top: 5rem; color: #000;">${error.message}</h1>`;
    }
}

function initializeSite() {
    const path = window.location.pathname.split('/').pop();
    if (path === '' || path === 'index.html' || path.startsWith('index.html?')) {
        loadIndexPage();
    } else if (path === 'mod.html' || path.startsWith('mod.html?')) {
        loadModPage();
    }
    UpdateBackgroundBasedOnScrollPosition();
}

document.addEventListener("DOMContentLoaded", initializeSite);
