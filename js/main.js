// js/main.js
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// Hilfsfunktion zum Laden von HTML-Dateien
const loadContent = async (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) return;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const html = await response.text();
        placeholder.innerHTML = html;
    } catch (error) {
        console.warn(`⚠️ Fehler beim Laden von ${url}:`, error);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Zuerst alle HTML-Komponenten laden und abwarten
        await Promise.all([
            loadContent('header.html', 'header-placeholder'),
            loadContent('modals.html', 'modal-container'),
            loadContent('footer.html', 'footer-placeholder'),
            loadContent('side-menu.html', 'side-menu-placeholder')
        ]);

        console.log("✅ HTML-Komponenten im DOM vorhanden.");

        // 2. Theme & Modals initialisieren
        // Diese Funktionen binden die Event-Listener an die Buttons im Header
        initTheme();  
        initModals(); 

        // 3. Restliche dynamische Inhalte mit einer minimalen Verzögerung starten
        setTimeout(() => {
            initEffects();
            initTypewriters();
            initAiForm();
            initSilasForm();
        }, 50);

        // Seite einblenden
        document.body.classList.add('page-loaded');

    } catch (error) {
        console.error("❌ Fehler bei der Initialisierung:", error);
        document.body.classList.add('page-loaded');
    }
});
