document.addEventListener('DOMContentLoaded', () => {
    const modListContainer = document.getElementById('mod-list-container');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupContent = document.getElementById('popup-content');
    let modsData = [];

    // Fetch the generated data
    fetch('./data.json')
        .then(response => response.json())
        .then(data => {
            modsData = data;
            renderModList(modsData);
        })
        .catch(error => {
            modListContainer.innerHTML = '<p>Error loading mods. Please try again later.</p>';
            console.error('Error fetching mod data:', error);
        });

    function renderModList(mods) {
        if (mods.length === 0) {
            modListContainer.innerHTML = '<p>No mods found.</p>';
            return;
        }

        modListContainer.innerHTML = ''; // Clear "Loading..." message
        mods.forEach((mod, index) => {
            const postElement = document.createElement('div');
            postElement.className = 'blog-post';
            postElement.setAttribute('data-index', index); // Set index for popup
            
            const uploadDate = new Date(mod.uploadDate).toLocaleDateString();

            postElement.innerHTML = `
                <a class="blog-post-image">
                    <img src="${mod.thumbnailUrl}" alt="${mod.title}">
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

    // Event listener for showing the popup
    modListContainer.addEventListener('click', (event) => {
        const modCard = event.target.closest('.blog-post');
        if (modCard) {
            const modIndex = modCard.getAttribute('data-index');
            const mod = modsData[modIndex];
            showPopup(mod);
        }
    });

    function showPopup(mod) {
        let downloadLinksHtml = mod.downloadLinks.map(link => 
            `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.displayText}</a>`
        ).join('');

        popupContent.innerHTML = `
            <h1>${mod.title}</h1>
            <p>${mod.description}</p>
            <div class="download-section">
                <h3>Downloads</h3>
                ${downloadLinksHtml}
            </div>
        `;
        popupOverlay.style.display = 'flex';
    }

    // Close popup when clicking on the overlay
    popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) {
            popupOverlay.style.display = 'none';
        }
    });
});
