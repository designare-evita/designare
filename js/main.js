// js/main.js - KORRIGIERTE VERSION

import { initThemeToggle } from './theme.js';
import { initModals } from './modals.js';
import { initTypewriter } from './typewriter.js';
import { initEffects } from './effects.js';
// HINZUGEFÜGT: Importiert jetzt die Silas-Formular-Logik
import { initSilasForm } from './silas-form.js'; 

document.addEventListener('DOMContentLoaded', function() {
    // Header laden
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            // Theme Toggle nach dem Laden des Headers initialisieren
            initThemeToggle();
        })
        .catch(error => console.error('Fehler beim Laden des Headers:', error));

    // Alle Module initialisieren
    initModals();
    initTypewriter();
    initEffects();
    // HINZUGEFÜGT: Startet die Silas-Formular-Logik
    initSilasForm();

    // Cookie-Info Lightbox Logik
    const cookieLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieBtn = document.getElementById('acknowledge-cookie-lightbox');

    if (cookieLightbox && acknowledgeCookieBtn) {
        // Prüfen, ob der Cookie-Hinweis bereits bestätigt wurde
        if (!localStorage.getItem('cookieAcknowledged')) {
            cookieLightbox.style.display = 'flex';
        }

        acknowledgeCookieBtn.addEventListener('click', () => {
            localStorage.setItem('cookieAcknowledged', 'true');
            cookieLightbox.style.display = 'none';
        });
    }
});
