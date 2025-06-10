// script.js
document.addEventListener('DOMContentLoaded', () => {
    const modListContainer = document.getElementById('mod-list-container');
    const popupOverlay = document.getElementById('popup-overlay');
    const closeButton = document.querySelector('.close-button');

    // Fetch the data from our JSON file
    fetch('./data.json')
        .then(response => response.json())
        .then(modsData => {
            renderMods(modsData);
        })
        .catch(error => {
            modListContainer.innerHTML = '<p class="loading-text">Error loading updates. Please try again later.</p>';
            console.error('Error fetching mod data:', error);
        });

    function renderMods(mods) {
        modListContainer.innerHTML = ''; // Clear the "Loading..." text
        if (mods.length === 0) {
            modListContainer.innerHTML = '<p class="loading-text">No updates found.</p>';
            return;
        }

        mods.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';
            
            card.innerHTML = `
                <img src="${mod.thumbnailUrl}" alt="${mod.title}" class="mod-card-thumbnail">
                <div class="mod-card-body">
                    <h3>${mod.title}</h3>
                    <p>${mod.uploadDate}</p>
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
        downloadsContainer.innerHTML = ''; // Clear previous links

        mod.downloadLinks.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.textContent = link.displayText;
            a.target = '_blank'; // Open in a new tab
            downloadsContainer.appendChild(a);
        });

        popupOverlay.style.display = 'flex';
    }

    function hidePopup() {
        popupOverlay.style.display = 'none';
    }

    // Event listeners to close the popup
    closeButton.addEventListener('click', hidePopup);
    popupOverlay.addEventListener('click', (event) => {
        // Only close if the overlay itself is clicked, not the content inside
        if (event.target === popupOverlay) {
            hidePopup();
        }
    });
});