// --- UI Functions from original file (simplified for clarity) ---

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

// --- NEW MOD BROWSER LOGIC ---

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
        return []; // Return empty array on failure
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
        prevButton.onclick = () => {
            currentPage--;
            renderPage();
        };
    }

    const nextButton = document.createElement('a');
    nextButton.className = 'pagination-next';
    nextButton.innerHTML = '<i>arrow_right</i>';
    if (page === totalPages) {
        nextButton.setAttribute('disabled', true);
    } else {
        nextButton.onclick = () => {
            currentPage++;
            renderPage();
        };
    }
    
    const ul = document.createElement('ul');
    ul.className = 'pagination-list';

    const pageLinks = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pageLinks.push(i);
    } else {
        pageLinks.push(1);
        if (page > 3) pageLinks.push('...');
        
        let start = Math.max(2, page - 1);
        let end = Math.min(totalPages - 1, page + 1);

        if (page === 1) end = 3;
        if (page === totalPages) start = totalPages - 2;

        for (let i = start; i <= end; i++) pageLinks.push(i);

        if (page < totalPages - 2) pageLinks.push('...');
        pageLinks.push(totalPages);
    }

    [...new Set(pageLinks)].forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'pagination-link';
        if (p === '...') {
            a.classList.add('disabled');
            a.textContent = '...';
        } else {
            a.textContent = p;
            if (p === page) a.classList.add('is-current');
            a.onclick = () => { currentPage = p; renderPage(); };
        }
        li.appendChild(a);
        ul.appendChild(li);
    });

    nav.append(prevButton, nextButton, ul);
    paginationContainer.appendChild(nav);
}

function renderModCards(modsToRender) {
    const container = document.querySelector('.blog-posts-container');
    container.innerHTML = '';
    
    if (modsToRender.length === 0) {
        container.innerHTML = `<p style="color: #000; text-align: center; font-size: 1.5rem;">No mods match your search.</p>`;
        return;
    }

    modsToRender.forEach(mod => {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        
        const date = new Date(mod.uploadDate);
        const displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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

async function renderPage() {
    const allMods = await getMods();
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const gameFilter = document.getElementById('game-filter').value;
    const versionFilter = document.getElementById('version-filter').value;

    const filteredMods = allMods.filter(mod => {
        const title = mod.title.toLowerCase();
        const gameTag = mod.gameTag || '';
        const versionTag = mod.versionTag || '';
        
        const matchesSearch = title.includes(searchInput);
        const matchesGame = (gameFilter === 'all') || (gameTag === gameFilter);
        const matchesVersion = (versionFilter === 'all') || (versionTag === versionFilter);
        
        return matchesSearch && matchesGame && matchesVersion;
    });

    const paginatedMods = filteredMods.slice((currentPage - 1) * MODS_PER_PAGE, currentPage * MODS_PER_PAGE);
    
    renderModCards(paginatedMods);
    createPagination(filteredMods.length, currentPage);
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
        const displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.querySelector('#mod-date span').textContent = displayDate;
        document.getElementById('mod-title').textContent = mod.title;
        document.getElementById('mod-description-summary').textContent = mod.description;
        
        const downloadsContainer = document.getElementById('mod-downloads');
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
            downloadsContainer.innerHTML = '<p style="color:white; text-shadow:1px 1px 2px black;">No download links were found for this mod.</p>';
        }
    } catch (error) {
        console.error('Failed to load mod details:', error);
        document.body.innerHTML = `<h1 style="text-align:center; padding-top: 5rem; color: #000;">${error.message}</h1>`;
    }
}

function initializeSite() {
    const path = window.location.pathname.split('/').pop();
    if (path === '' || path === 'index.html') {
        loadIndexPage();
    } else if (path === 'mod.html') {
        loadModPage();
    }
    UpdateBackgroundBasedOnScrollPosition();
}

document.addEventListener("DOMContentLoaded", initializeSite);
