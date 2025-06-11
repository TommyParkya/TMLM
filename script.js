// [ The ENTIRE content of SCRIPT JS.txt goes here. It is too long to paste again. ]
// ...
// ... After the last line of the original script.js ...
// ... which is: FixTextAreaSize(ta); }

// --- START OF DYNAMIC MOD BROWSER LOGIC ---

let allModsData = []; // Cache for mods data

// Function to fetch data, using cache if available
async function getMods() {
    if (allModsData.length > 0) {
        return allModsData;
    }
    const response = await fetch('./data.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    allModsData = await response.json();
    return allModsData;
}

// Function to render mod cards on the index page
function renderIndexMods(mods, container, searchTerm = '') {
    container.innerHTML = '';
    const filteredMods = mods.filter(mod => 
        mod.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredMods.length === 0) {
        container.innerHTML = `<p style="color: #000; text-align: center;">No mods match your search.</p>`;
        return;
    }

    filteredMods.forEach(mod => {
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

// Main logic for the index page
async function loadIndexPage() {
    const container = document.querySelector('.blog-posts-container');
    const searchInput = document.getElementById('search-input');
    if (!container) return;

    try {
        const mods = await getMods();
        renderIndexMods(mods, container);

        searchInput.addEventListener('input', (e) => {
            renderIndexMods(mods, container, e.target.value);
        });

    } catch (error) {
        console.error('Failed to load mods:', error);
        container.innerHTML = '<p style="color: #f00; text-align: center;">Failed to load mods. Run the scraper and ensure data.json exists.</p>';
    }
}

// Main logic for the mod detail page
async function loadModPage() {
    try {
        const params = new URLSearchParams(window.location.search);
        const modId = params.get('id');

        if (!modId) {
            document.body.innerHTML = '<h1>Mod ID not specified.</h1>';
            return;
        }

        const mods = await getMods();
        const mod = mods.find(m => m.id === modId);

        if (!mod) {
            document.getElementById('mod-content-container').innerHTML = '<h1>Mod not found.</h1>';
            return;
        }

        // Populate Head
        document.title = `${mod.title} - Mod Details`;

        // Populate Body
        document.getElementById('mod-hero-image').style.backgroundImage = `url(${mod.thumbnailUrl})`;
        const date = new Date(mod.uploadDate);
        const displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.querySelector('#mod-date').innerHTML = `<span class="icon"><i>schedule</i></span> ${displayDate}`;
        document.getElementById('mod-title').textContent = mod.title;
        document.getElementById('mod-description').textContent = mod.description;
        
        const downloadsContainer = document.getElementById('mod-downloads');
        downloadsContainer.innerHTML = ''; // Clear any loading text

        if (mod.downloadLinks && mod.downloadLinks.length > 0) {
            mod.downloadLinks.forEach(link => {
                const button = document.createElement('a');
                button.href = link.url;
                button.className = 'button is-primary is-medium';
                button.target = '_blank'; // Open in new tab
                button.rel = 'noopener noreferrer';
                button.textContent = link.displayText;
                downloadsContainer.appendChild(button);
            });
        } else {
            downloadsContainer.innerHTML = '<p>No download links were found for this mod.</p>';
        }

        // Re-bind lightbox for any images
        if (typeof Lightbox !== 'undefined') Lightbox.Bind(document.body);

    } catch (error) {
        console.error('Failed to load mod details:', error);
        const contentContainer = document.getElementById('mod-content-container');
        if(contentContainer) contentContainer.innerHTML = '<h1>Failed to load mod details.</h1>';
    }
}

// Main entry point for dynamic content
function initializeStaticSite() {
    const path = window.location.pathname.split('/').pop();
    if (path === '' || path === 'index.html') {
        loadIndexPage();
    } else if (path === 'mod.html') {
        loadModPage();
    }
}

document.addEventListener("DOMContentLoaded", initializeStaticSite);

// --- END OF DYNAMIC MOD BROWSER LOGIC ---