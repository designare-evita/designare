// js/menu-logic.js

export function initMenuInteractions() {
    const searchInput = document.getElementById('menu-topic-search');
    const buttons = document.querySelectorAll('.topic-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            buttons.forEach(btn => {
                const keywords = btn.getAttribute('data-keywords')?.toLowerCase() || "";
                const text = btn.innerText.toLowerCase();

                if (term.length > 1 && (keywords.includes(term) || text.includes(term))) {
                    btn.classList.add('highlight-active');
                } else {
                    btn.classList.remove('highlight-active');
                }
            });
        });
    }

    // Starte die Inhaltsverzeichnis-Logik
    generateDynamicTOC();
}

function generateDynamicTOC() {
    const tocContainer = document.getElementById('dynamic-toc-container');
    const tocList = document.getElementById('toc-list');
    
    // Wir suchen nach h2 Überschriften im Hauptbereich (main oder article)
    const articleHeadings = document.querySelectorAll('main h2, article h2');

    if (articleHeadings.length > 0 && tocContainer && tocList) {
        // Container sichtbar machen
        tocContainer.classList.remove('hidden');
        tocList.innerHTML = ''; // Vorher leeren

        articleHeadings.forEach((heading, index) => {
            // Sicherstellen, dass die Überschrift eine ID für den Anker-Link hat
            if (!heading.id) {
                heading.id = `section-${index}`;
            }

            // Mini-Button für das TOC erstellen
            const tocBtn = document.createElement('button');
            tocBtn.className = 'topic-btn toc-mini';
            
            // KORREKTUR: Bindestrich (-) wurde zur Regex hinzugefügt
            tocBtn.innerText = heading.innerText.replace(/[:^\w\säöüÄÖÜß?-]/g, ''); 
            
            // Klick-Event: Zum Anker springen und Menü schließen
            tocBtn.onclick = () => {
                document.getElementById(heading.id).scrollIntoView({ behavior: 'smooth' });
                // Optional: Menü nach Klick schließen
                document.getElementById('side-menu-panel').classList.remove('visible');
                document.body.classList.remove('no-scroll');
            };

            tocList.appendChild(tocBtn);
        });
    }
}
