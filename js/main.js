// js/main.js

import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

/**
 * Initialisiert alle Skripte, die von den Elementen im geladenen Header 
 * und den Modals abhängen.
 */
function initializeDynamicContentScripts() {
    // --- Code für das Slide-in Menü ---
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const sideMenuPanel = document.getElementById('side-menu-panel');
    const closeMenuButton = document.getElementById('close-menu-button');

    if (menuToggleButton && sideMenuPanel && closeMenuButton) {
        menuToggleButton.addEventListener('click', () => sideMenuPanel.classList.add('is-active'));
        closeMenuButton.addEventListener('click', () => sideMenuPanel.classList.remove('is-active'));
        sideMenuPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => sideMenuPanel.classList.remove('is-active'));
        });
    }

    // --- Setzt den aktiven Menüpunkt ---
    const currentPageUrl = window.location.pathname.endsWith('/') 
        ? '/index.html' 
        : window.location.pathname;
        
    document.querySelectorAll('.side-menu-content li a').forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPageUrl) {
            link.parentElement.classList.add('active');
        }
    });

    // Initialisiere die Modals, jetzt wo sie im DOM sind
    initModals();
    console.log("Header- und Modal-spezifische Skripte initialisiert.");
}

/**
 * Lädt HTML-Inhalte aus einer Datei in ein bestimmtes Element.
 * @param {string} url - Der Pfad zur HTML-Datei.
 * @param {string} elementId - Die ID des Elements, in das der Inhalt geladen wird.
 * @returns {Promise<void>}
 */
function loadContent(url, elementId) {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        console.error(`Platzhalter-Element mit der ID '${elementId}' nicht gefunden.`);
        return Promise.reject(new Error(`Placeholder not found: ${elementId}`));
    }
    
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Netzwerk-Antwort war nicht ok für ${url}`);
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
        });
}

/**
 * Funktion, um den Besucher zu protokollieren.
 */
function trackVisitor() {
  fetch('/api/track-visitor')
    .then(response => response.ok ? console.log('Besucher erfasst.') : console.error('Fehler bei der Erfassung des Besuchers.'))
    .catch(error => console.error('Netzwerkfehler beim Tracking:', error));
}

/**
 * Haupt-Initialisierungsfunktion
 */
document.addEventListener('DOMContentLoaded', function() {
    // Definiere die Lade-Aktionen für Header und Modals
    const loadHeader = loadContent('/header.html', 'header-placeholder');
    const loadModals = loadContent('/modals.html', 'modal-container'); // Deine neue Modals-Datei

    // Warte, bis BEIDE Aktionen abgeschlossen sind
    Promise.all([loadHeader, loadModals])
        .then(() => {
            console.log("Header und Modals erfolgreich in das DOM geladen.");
            // Führe jetzt die Skripte aus, die auf diesen Inhalt angewiesen sind
            initializeDynamicContentScripts();
        })
        .catch(error => {
            console.error('Fehler beim Laden des dynamischen Inhalts:', error);
        });

    // Initialisiere alle Module, die NICHT vom Header oder den Modals abhängen
    initEffects();
    initTypewriters();
    initAiForm();
    initSilasForm();
    trackVisitor();

    console.log("Alle allgemeinen Module erfolgreich initialisiert.");
});
