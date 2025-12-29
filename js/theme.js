// js/theme.js - UPDATED für neuen Toggle-Switch
import { updateParticleColors } from './effects.js';

function applyTheme(theme) {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (theme === 'light') {
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
    }
    
    // aria-checked für Accessibility aktualisieren
    if (themeToggle) {
        themeToggle.setAttribute('aria-checked', (theme === 'light').toString());
    }
    
    // Partikel-Farben anpassen
    if (typeof updateParticleColors === 'function') {
        // Kurze Verzögerung, damit CSS-Variablen aktualisiert werden
        setTimeout(() => {
            updateParticleColors();
        }, 50);
    }
}

function handleThemeToggle(e) {
    // Prevent default falls es ein Link oder Button ist
    if (e) {
        e.preventDefault();
    }
    
    const isLight = document.body.classList.contains('light-mode');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    // Custom Event für andere Komponenten
    window.dispatchEvent(new CustomEvent('themechange', { 
        detail: { theme: newTheme } 
    }));
    
    console.log("🌙 Theme gewechselt zu:", newTheme);
}

export function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        console.log("✅ Theme-Toggle gefunden.");
        
        // Gespeichertes Theme laden (Standard: dark)
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        
        // Alte Event-Listener entfernen (falls vorhanden)
        themeToggle.removeEventListener('click', handleThemeToggle);
        
        // Click Event
        themeToggle.addEventListener('click', handleThemeToggle);
        
        // Keyboard Support (Space & Enter für Accessibility)
        themeToggle.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleThemeToggle();
            }
        });
        
    } else {
        console.warn("⚠️ Theme-Toggle (#theme-toggle) nicht gefunden.");
    }
}

// Optionaler Export für direkten Zugriff
export { handleThemeToggle, applyTheme };
