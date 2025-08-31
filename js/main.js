// js/main.js - KORRIGIERTE VERSION

import { initTheme } from './theme.js';  // KORRIGIERT: war initThemeToggle
import { initModals } from './modals.js';
import { initTypewriters } from './typewriter.js';  // KORRIGIERT: war initTypewriter
import { initEffects } from './effects.js';
import { initSilasForm } from './silas-form.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM geladen, initialisiere Module...');
    
    // Header laden
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            // Theme nach dem Laden des Headers initialisieren
            initTheme();
        })
        .catch(error => console.error('Fehler beim Laden des Headers:', error));

    // Alle Module initialisieren
    try {
        initModals();
        console.log('✅ Modals initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Modals:', error);
    }

    try {
        initTypewriters();
        console.log('✅ Typewriters initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Typewriters:', error);
    }

    try {
        initEffects();
        console.log('✅ Effects initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Effects:', error);
    }

    try {
        initSilasForm();
        console.log('✅ Silas Form initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Silas Form:', error);
    }

    // Cookie-Info Lightbox Logik
    const cookieLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieBtn = document.getElementById('acknowledge-cookie-lightbox');

    if (cookieLightbox && acknowledgeCookieBtn) {
        if (!localStorage.getItem('cookieAcknowledged')) {
            cookieLightbox.style.display = 'flex';
        }

        acknowledgeCookieBtn.addEventListener('click', () => {
            localStorage.setItem('cookieAcknowledged', 'true');
            cookieLightbox.style.display = 'none';
        });
    }
});
