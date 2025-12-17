// js/theme.js
import { updateParticleColors } from './effects.js';

const body = document.body;
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (theme === 'light') {
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
    }
    // Wichtig: Partikel-Farben anpassen, damit sie auf hellem Grund sichtbar sind
    updateParticleColors();
}

function handleThemeToggle() {
    // Wenn light-mode aktiv ist, wechsle zu dark (Standard), sonst zu light
    const newTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

export function initTheme() {
    if (themeToggle) {
        // Holen des gespeicherten Themes oder Standard "dark"
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        themeToggle.addEventListener('click', handleThemeToggle);
    }
}
