// js/main.js

import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

document.addEventListener('DOMContentLoaded', function() {

    // --- Code für das neue Page-Menü ---
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const pageMenuOverlay = document.getElementById('page-menu-overlay');

    if (menuToggleButton && pageMenuOverlay) {
        menuToggleButton.addEventListener('click', () => {
            menuToggleButton.classList.toggle('is-active');
            pageMenuOverlay.classList.toggle('is-active');
        });

        // Optional: Menü schließen, wenn ein Link geklickt wird
        pageMenuOverlay.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggleButton.classList.remove('is-active');
                pageMenuOverlay.classList.remove('is-active');
            });
        });
    } // Die if-Abfrage endet hier korrekterweise

    // Initialisiert alle importierten Module
    initEffects();
    initTypewriters();
    initModals();
    initAiForm();
    initSilasForm();

    console.log("Alle Module erfolgreich initialisiert.");

}); // Der DOMContentLoaded Listener endet hier korrekterweise
