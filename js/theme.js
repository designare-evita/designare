// js/theme.js

import { updateParticleColors } from './effects.js';

const body = document.body;
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
    // Nach jeder Theme-Änderung die Partikelfarben aktualisieren
    updateParticleColors();
}

function handleThemeToggle() {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

// Exportiert eine Haupt-Initialisierungsfunktion für das Theme
export function initTheme() {
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        themeToggle.addEventListener('click', handleThemeToggle);
    }
}
