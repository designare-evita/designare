// js/theme.js - KORRIGIERTE VERSION

import { updateParticleColors } from './effects.js';

const body = document.body;

function applyTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
    // Nach jeder Theme-Änderung die Partikelfarben aktualisieren
    if (typeof updateParticleColors === 'function') {
        updateParticleColors();
    }
}

function handleThemeToggle() {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

// KORRIGIERT: Funktion heißt jetzt 'initTheme' statt 'initThemeToggle'
export function initTheme() {
    // Warte kurz, bis der Header geladen ist
    const checkForThemeToggle = () => {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            applyTheme(savedTheme);
            themeToggle.addEventListener('click', handleThemeToggle);
            console.log('✅ Theme-Toggle initialisiert');
        } else {
            // Versuche es nochmal in 100ms, falls Header noch nicht geladen
            setTimeout(checkForThemeToggle, 100);
        }
    };
    
    checkForThemeToggle();
}

// ZUSÄTZLICH: Export der alten Funktion für Rückwärtskompatibilität
export function initThemeToggle() {
    console.warn('initThemeToggle ist deprecated, verwende initTheme');
    initTheme();
}
