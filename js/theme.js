// js/theme.js

import { updateParticleColors } from './effects.js';

// KORREKTUR: Die Variablen werden hier nur deklariert, aber noch nicht zugewiesen.
let body, themeToggle;

function applyTheme(theme) {
    if (theme === 'dark') {
        // KORREKTUR: Wir fügen die Klasse jetzt zum <html>-Element hinzu,
        // damit es mit dem Anti-Flicker-Script übereinstimmt.
        document.documentElement.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
    }
    updateParticleColors();
}

function handleThemeToggle() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

// Die Haupt-Initialisierungsfunktion für dieses Modul
export function initTheme() {
    // KORREKTUR: Die Zuweisung der Elemente erfolgt erst jetzt,
    // nachdem die Seite vollständig geladen ist.
    body = document.body;
    themeToggle = document.getElementById('theme-toggle');

    if (themeToggle) {
        // Die Logik zum Anwenden des gespeicherten Themes ist nicht mehr nötig,
        // da das Anti-Flicker-Script dies bereits erledigt hat.
        themeToggle.addEventListener('click', handleThemeToggle);
        
        // Stellt sicher, dass die Partikel nach dem ersten Laden die richtige Farbe haben
        setTimeout(updateParticleColors, 500);
    }
}
