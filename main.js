document.addEventListener('DOMContentLoaded', () => {
    const modsContainer = document.getElementById('mods-container');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageIndicator = document.getElementById('page-indicator');
    const modal = document.getElementById('mod-modal');
    const imageModal = document.getElementById('image-modal');
    const modalBody = document.getElementById('modal-body');
    const modalImage = document.getElementById('modal-image');
    const closeButtons = document.querySelectorAll('.close-button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');


    let modsData = [];
    let currentPage = 1;
    const modsPerPage = 9;

    async function fetchMods() {
        try {
            const response = await fetch('mods.json');
            modsData = await response.json();
            renderPage();
        } catch (error) {
            console.error('Error fetching mods data:', error);
            modsContainer.innerHTML = '<p>Could not load mods data.</p>';
        }
    }

    function renderPage() {
        modsContainer.innerHTML = '';
        const start = (currentPage - 1) * modsPerPage;
        const end = start + modsPerPage;
        const modsToDisplay = modsData.slice(start, end);

        modsToDisplay.forEach(mod => {
            const modCard = document.createElement('div');
            modCard.className = 'mod-card';
            if(mod.isFeatured) {
                modCard.classList.add('featured');
            }

            // Formatting the date
            const date = new Date(mod.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });


            modCard.innerHTML = `
                <img src="${mod.thumbnail}" alt="${mod.title}">
                <div class="mod-card-content">
                    <h3 class="mod-title">${mod.title}</h3>
                    <p class="mod-date">${formattedDate}</p>
                </div>
            `;
            modCard.addEventListener('click', () => openModal(mod));
            modsContainer.appendChild(modCard);
        });

        pageIndicator.textContent = `Page ${currentPage}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = end >= modsData.length;
    }

    function openModal(mod) {
        let downloadsHTML = mod.downloadLinks.map((link, index) => `
            <a href="${link.url}" class="button" target="_blank" title="${link.host}">
                <img src="https://www.google.com/s2/favicons?domain=${link.host}" alt="${link.host} favicon">
                Download ${index + 1}
            </a>
        `).join(' ');

        modalBody.innerHTML = `
            <h2>${mod.title}</h2>
            <div class="changes-row">
                <h3>Mod Details</h3>
                <p>${mod.description}</p>
            </div>
            <div class="downloads">
                ${downloadsHTML}
            </div>
            <div class="gallery">
                ${mod.images.map(img => `<img src="${img}" class="thumbnail" alt="Mod image">`).join('')}
            </div>
        `;
        modal.style.display = 'block';
        document.querySelectorAll('.gallery .thumbnail').forEach(img => {
            img.addEventListener('click', () => openImageModal(img.src));
        });
    }

    function openImageModal(src) {
        modalImage.src = src;
        imageModal.style.display = 'block';
    }


    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
            imageModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal || event.target == imageModal) {
            modal.style.display = 'none';
            imageModal.style.display = 'none';
        }
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });

    nextPageButton.addEventListener('click', () => {
        if ((currentPage * modsPerPage) < modsData.length) {
            currentPage++;
            renderPage();
        }
    });

     darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    fetchMods();
});
