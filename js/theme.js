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
    // Aktualisiert die Partikelfarben nach jeder Änderung.
    updateParticleColors();
}

function handleThemeToggle() {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

// Initialisiert das Theme und die Umschalt-Logik.
export function initTheme() {
    if (themeToggle) {
        // Stellt sicher, dass der Dark Mode der Standard ist, wenn nichts gespeichert ist.
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        themeToggle.addEventListener('click', handleThemeToggle);
    }
}
