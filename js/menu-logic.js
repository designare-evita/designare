// js/menu-logic.js

export function initMenuInteractions() {
    const searchInput = document.getElementById('menu-topic-search');
    const buttons = document.querySelectorAll('.topic-btn');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();

        buttons.forEach(btn => {
            const keywords = btn.getAttribute('data-keywords').toLowerCase();
            const text = btn.innerText.toLowerCase();

            // Highlight wenn Begriff gefunden und Suche länger als 1 Zeichen
            if (term.length > 1 && (keywords.includes(term) || text.includes(term))) {
                btn.classList.add('highlight-active');
            } else {
                btn.classList.remove('highlight-active');
            }
        });
    });
}
