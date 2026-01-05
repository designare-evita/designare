// ===================================================================
// SEARCH MODAL SETUP (Powered by existing Knowledge Base)
// ===================================================================

let siteContentIndex = [];
let isIndexLoaded = false;

// 1. Daten laden (Aus deiner existierenden knowledge.json)
function loadSearchIndex() {
    if (isIndexLoaded) return;

    fetch('/knowledge.json')
        .then(response => {
            if (!response.ok) throw new Error("knowledge.json nicht gefunden");
            return response.json();
        })
        .then(data => {
            // WICHTIG: Deine generate-knowledge.js speichert die Seiten unter "pages"
            // Wir prüfen, ob es data.pages gibt, sonst nehmen wir data direkt (Falls sich Struktur ändert)
            const pagesArray = data.pages ? data.pages : (Array.isArray(data) ? data : []);

            siteContentIndex = pagesArray.map(item => ({
                title: item.title,
                // Deine URL hat schon einen Slash (z.B. "/index.html"), das passt
                url: item.url, 
                // item.text ist der gesäuberte Volltext aus deinem Script
                content: item.text || "", 
                // Meta Description für die hübsche Anzeige
                desc: item.meta_description || item.text.substring(0, 100) + "..."
            }));

            isIndexLoaded = true;
            console.log(`🧠 Evita-Knowledge geladen: ${siteContentIndex.length} Seiten indexiert.`);
        })
        .catch(err => {
            console.error('Fehler beim Laden der Knowledge-Base:', err);
        });
}

// 2. Hauptfunktion
export function setupSearchModal() {
    loadSearchIndex(); // Index laden anstoßen

    const searchInput = document.getElementById('site-search-input');
    const resultsList = document.getElementById('search-results-list');
    const sitemapContainer = document.getElementById('sitemap-container');
    const resultsContainer = document.getElementById('search-results-container');
    
    // Buttons & Modal Logik
    const searchModal = document.getElementById('search-modal');
    const searchButtons = document.querySelectorAll('#search-button, .open-search-modal, .footer-btn.open-search-modal'); 
    const closeSearchBtn = document.getElementById('close-search-modal');

    // Helper: Modal öffnen/schließen
    const openModal = (modal) => {
        modal.classList.add('visible');
        modal.style.display = 'flex';
        document.body.classList.add('no-scroll');
    };
    
    const closeModal = (modal) => {
        modal.classList.remove('visible');
        modal.style.display = 'none';
        document.body.classList.remove('no-scroll');
    };

    // Event Listener für Öffnen
    searchButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchModal) {
                openModal(searchModal);
                setTimeout(() => searchInput && searchInput.focus(), 100);
            }
        });
    });

    // Schließen
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            if (searchModal) closeModal(searchModal);
        });
    }

    // VOLLTEXT-SUCHLOGIK
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            // Umschalten zwischen Sitemap und Ergebnissen
            if (query.length === 0) {
                if (sitemapContainer) sitemapContainer.style.display = 'block';
                if (resultsContainer) resultsContainer.style.display = 'none';
            } else {
                if (sitemapContainer) sitemapContainer.style.display = 'none';
                if (resultsContainer) resultsContainer.style.display = 'block';

                // Filtern: Sucht im Titel UND im gesamten Text (content)
                const results = siteContentIndex.filter(page => 
                    (page.title && page.title.toLowerCase().includes(query)) || 
                    (page.content && page.content.toLowerCase().includes(query))
                );

                renderSearchResults(results, resultsList, query, searchModal, closeModal);
            }
        });
    }
}

// Render Funktion mit Snippet-Highlighting
function renderSearchResults(results, listElement, query, modal, closeFunc) {
    if (!listElement) return;
    listElement.innerHTML = '';

    if (results.length === 0) {
        listElement.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--text-color-muted);">Keine Ergebnisse gefunden.</li>';
        return;
    }

    results.forEach(page => {
        const li = document.createElement('li');
        
        // Snippet generieren: Zeige den relevanten Textausschnitt
        let snippet = page.desc;
        if (page.content) {
            const index = page.content.toLowerCase().indexOf(query);
            if (index > -1) {
                // Text um den Treffer herum ausschneiden (30 Zeichen davor, 80 danach)
                const start = Math.max(0, index - 30);
                const end = Math.min(page.content.length, index + 80);
                snippet = "..." + page.content.substring(start, end) + "...";
                
                // Suchbegriff hervorheben (case-insensitive replace)
                const regex = new RegExp(`(${query})`, 'gi');
                snippet = snippet.replace(regex, '<span style="color: var(--accent-color); font-weight: 600;">$1</span>');
            }
        }

        li.innerHTML = `
            <a href="${page.url}" class="search-result-link">
                <span class="search-result-title">${page.title}</span>
                <span class="search-result-snippet">${snippet}</span>
            </a>
        `;
        
        // Klick schließt Modal
        const link = li.querySelector('a');
        link.addEventListener('click', () => {
             if (modal && closeFunc) closeFunc(modal);
        });
        
        listElement.appendChild(li);
    });
}
