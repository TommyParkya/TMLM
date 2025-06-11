// script.js
document.addEventListener('DOMContentLoaded', () => {
    const modListContainer = document.getElementById('mod-list-container');
    const popupOverlay = document.getElementById('popup-overlay');
    const closeButton = document.querySelector('.close-button');

    fetch('./data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(modsData => {
            renderMods(modsData);
        })
        .catch(error => {
            modListContainer.innerHTML = '<p class="loading-text">Error loading mods. The data file might be missing or corrupt.</p>';
            console.error('Error fetching mod data:', error);
        });

    function renderMods(mods) {
        modListContainer.innerHTML = '';
        if (!mods || mods.length === 0) {
            modListContainer.innerHTML = '<p class="loading-text">No mods found. The scraper might need to be run.</p>';
            return;
        }

        // Sort mods by date, newest first
        mods.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        mods.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';
            
            // Format date for display
            const date = new Date(mod.uploadDate);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            card.innerHTML = `
                <img src="${mod.thumbnailUrl}" alt="${mod.title}" class="mod-card-thumbnail" loading="lazy">
                <div class="mod-card-body">
                    <h3>${mod.title}</h3>
                    <p>${formattedDate}</p>
                </div>
            `;

            card.addEventListener('click', () => showPopup(mod));
            modListContainer.appendChild(card);
        });
    }

    function showPopup(mod) {
        document.getElementById('popup-thumbnail').src = mod.thumbnailUrl;
        document.getElementById('popup-title').textContent = mod.title;
        document.getElementById('popup-description').textContent = mod.description;

        const downloadsContainer = document.getElementById('popup-downloads');
        downloadsContainer.innerHTML = '';

        if (mod.downloadLinks && mod.downloadLinks.length > 0) {
            mod.downloadLinks.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.textContent = link.displayText || 'Download Link';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                downloadsContainer.appendChild(a);
            });
        } else {
            downloadsContainer.innerHTML = '<p>No direct download links found.</p>';
        }

        popupOverlay.classList.add('visible');
    }

    function hidePopup() {
        popupOverlay.classList.remove('visible');
    }

    closeButton.addEventListener('click', hidePopup);
    popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) {
            hidePopup();
        }
    });
});