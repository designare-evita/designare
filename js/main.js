// js/main.js
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

const loadContent = async (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) return;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        placeholder.innerHTML = await response.text();
    } catch (error) {
        console.warn(`⚠️ Fehler bei ${url}:`, error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Grund-Layout laden (Header, Footer, etc.)
    try {
        await Promise.all([
            loadContent('header.html', 'header-placeholder'),
            loadContent('modals.html', 'modal-container'),
            loadContent('footer.html', 'footer-placeholder'),
            loadContent('side-menu.html', 'side-menu-placeholder')
        ]);

        console.log("✅ HTML-Komponenten geladen.");

        // 2. JETZT erst die Scripte initialisieren, da die Buttons nun im DOM sind
        initTheme();  // Registriert den Klick-Event für #theme-toggle
        initModals(); // Registriert Klicks für #contact-button, #about-me-button etc.

        // 3. Restliche Effekte und Formulare
        setTimeout(() => {
            initEffects();
            initTypewriters();
            initAiForm();
            initSilasForm();
        }, 50);

        document.body.classList.add('page-loaded');

    } catch (error) {
        console.error("❌ Fehler:", error);
        document.body.classList.add('page-loaded');
    }
});
