// js/main.js

import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

document.addEventListener('DOMContentLoaded', function() {

   // --- Code für das neue Slide-in Menü ---
const menuToggleButton = document.getElementById('menu-toggle-button');
const sideMenuPanel = document.getElementById('side-menu-panel');
const closeMenuButton = document.getElementById('close-menu-button');

if (menuToggleButton && sideMenuPanel && closeMenuButton) {

    // Menü öffnen
    menuToggleButton.addEventListener('click', () => {
        sideMenuPanel.classList.add('is-active');
    });

    // Menü mit dem "X" schließen
    closeMenuButton.addEventListener('click', () => {
        sideMenuPanel.classList.remove('is-active');
    });

    // Menü schließen, wenn ein Link geklickt wird
    sideMenuPanel.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            sideMenuPanel.classList.remove('is-active');
        });
    });
}

    // Initialisiert alle importierten Module
    initEffects();
    initTypewriters();
    initModals();
    initAiForm();
    initSilasForm();

    console.log("Alle Module erfolgreich initialisiert.");

}); // Der DOMContentLoaded Listener endet hier korrekterweise
