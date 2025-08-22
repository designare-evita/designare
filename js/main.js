// js/main.js

// Importiere alle deine externen Module
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

/**
 * Diese Funktion initialisiert alle Skripte, die von den Elementen
 * im geladenen Header abhängen (z.B. Menü-Button, Modal-Buttons).
 */
function initializeHeaderScripts() {
    // --- Code für das Slide-in Menü ---
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

    // --- Setzt den aktiven Menüpunkt ---
    // Diese Funktion markiert den Menüpunkt der aktuellen Seite.
    const currentPageUrl = window.location.pathname.endsWith('/') 
        ? '/index.html' 
        : window.location.pathname;
        
    const menuLinks = document.querySelectorAll('.side-menu-content li a');
    menuLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPageUrl) {
            link.parentElement.classList.add('active');
        }
    });

    // Initialisiere alle importierten Module, die auf den Header angewiesen sind
    initModals();
    console.log("Header-spezifische Skripte (Menü, Modals) initialisiert.");
}

/**
 * Haupt-Initialisierungsfunktion, die nach dem Laden des DOMs ausgeführt wird.
 */
document.addEventListener('DOMContentLoaded', function() {
    const headerPlaceholder = document.getElementById('header-placeholder');

    // Prüfen, ob der Platzhalter für den Header existiert
    if (headerPlaceholder) {
        // Lade den Header aus der externen Datei
        fetch('/header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netzwerk-Antwort war nicht ok.');
                }
                return response.text();
            })
            .then(data => {
                // Füge den Header-HTML-Code in den Platzhalter ein
                headerPlaceholder.innerHTML = data;
                
                // Führe alle Skripte aus, die auf den Header warten
                initializeHeaderScripts();
            })
            .catch(error => {
                console.error('Fehler beim Laden des Headers:', error);
                headerPlaceholder.innerHTML = "<p style='color:red; text-align:center;'>Fehler: Der Header konnte nicht geladen werden.</p>";
            });
    }

    // Initialisiere alle Module, die NICHT vom Header abhängen
    initEffects();
    initTypewriters();
    initAiForm();
    initSilasForm();

    // Starte hier die Besucher-Erfassung
    trackVisitor();

    console.log("Alle allgemeinen Module erfolgreich initialisiert.");
});


/**
 * Funktion, um den Besucher zu protokollieren.
 * Ruft die serverseitige Funktion auf.
 */
function trackVisitor() {
  fetch('/api/track-visitor')
    .then(response => {
      if (response.ok) {
        console.log('Besucher erfasst.');
      } else {
        console.error('Fehler bei der Erfassung des Besuchers.');
      }
    })
    .catch(error => console.error('Netzwerkfehler:', error));
}
