// ===================================================================
// SEARCH MODAL SETUP (Dynamic + Sitemap Version)
// ===================================================================

let siteContentIndex = [];
let isIndexLoaded = false;

// 1. Daten laden (Statisch + Dynamic aus knowledge.json)
function loadSearchIndex() {
    if (isIndexLoaded) return;

    // A) Deine statischen Seiten
    const staticPages = [
        { 
            title: "Michael Kanda & Evita - Startseite", 
            url: "index.html", 
            keywords: "home startseite michael kanda webentwickler wien",
            desc: "Willkommen im privaten Code-Labor von Michael & Evita. Webentwicklung, KI-Experimente und digitale Abenteuer."
        },
        { 
            title: "Impressum & Kontakt", 
            url: "impressum.html", 
            keywords: "kontakt adresse rechtliches",
            desc: "Impressum und rechtliche Informationen."
        }
    ];

    // B) Dynamische Daten holen
    fetch('/knowledge.json')
        .then(response => response.json())
        .then(data => {
            const dynamicPages = data.map(item => ({
                title: item.title,
                url: item.url || (item.slug ? `${item.slug}.html` : '#'),
                keywords: item.title + " " + (item.text || ""),
                desc: getShortDesc(item.text || item.content)
            }));

            siteContentIndex = [...staticPages, ...dynamicPages];
            isIndexLoaded = true;
            console.log('Such-Index geladen:', siteContentIndex.length, 'Einträge');
        })
        .catch(err => {
            console.error('Fehler beim Laden des Such-Index:', err);
            siteContentIndex = staticPages;
        });
}

// Hilfsfunktion: Kurzbeschreibung
function getShortDesc(text) {
    if (!text) return "";
    return text.substring(0, 100).replace(/<[^>]*>?/gm, '') + "...";
}

// 2. Hauptfunktion (EXPORTIERT für main.js)
export function setupSearchModal() {  // <--- HIER WAR DAS PROBLEM
    // Index sofort laden
    loadSearchIndex();

    const searchModal = document.getElementById('search-modal');
    // Suche nach verschiedenen Button-IDs/Klassen
    const searchButtons = document.querySelectorAll('#search-button, .open-search-modal'); 
    const closeSearchBtn = document.getElementById('close-search-modal');
    const searchInput = document.getElementById('site-search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsList = document.getElementById('search-results-list');
    const sitemapContainer = document.getElementById('sitemap-container');

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

    // Event Listener für Buttons
    searchButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchModal) {
                openModal(searchModal);
                setTimeout(() => searchInput && searchInput.focus(), 100);
            }
        });
    });

    // Schließen Button
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            if (searchModal) closeModal(searchModal);
        });
    }

    // Suchlogik im Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (query.length === 0) {
                // Leer -> Sitemap zeigen
                if (sitemapContainer) sitemapContainer.style.display = 'block';
                if (resultsContainer) resultsContainer.style.display = 'none';
            } else {
                // Eingabe -> Ergebnisse zeigen
                if (sitemapContainer) sitemapContainer.style.display = 'none';
                if (resultsContainer) resultsContainer.style.display = 'block';

                const results = siteContentIndex.filter(page => 
                    (page.title && page.title.toLowerCase().includes(query)) || 
                    (page.keywords && page.keywords.toLowerCase().includes(query)) ||
                    (page.desc && page.desc.toLowerCase().includes(query))
                );

                renderSearchResults(results, resultsList, searchModal, closeModal);
            }
        });
    }
}

// Render Funktion
function renderSearchResults(results, listElement, modal, closeFunc) {
    if (!listElement) return;
    listElement.innerHTML = '';

    if (results.length === 0) {
        listElement.innerHTML = '<li style="color: var(--text-color-muted); text-align: center; padding: 20px;">Keine Ergebnisse gefunden.</li>';
        return;
    }

    results.forEach(page => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="${page.url}" class="search-result-link">
                <span class="search-result-title">${page.title}</span>
                <span class="search-result-snippet">${page.desc}</span>
            </a>
        `;
        
        const link = li.querySelector('a');
        link.addEventListener('click', () => {
             if (modal && closeFunc) closeFunc(modal);
        });
        
        listElement.appendChild(li);
    });
}
