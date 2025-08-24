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
 * WICHTIG: Diese Funktion wird erst aufgerufen, NACHDEM der Header.html geladen wurde.
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

        // KORREKTUR: Menü schließen, wenn ein Link geklickt wird.
        // Dieser Code funktioniert jetzt zuverlässig, da die Links bereits im DOM sind.
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
        // new URL(link.href) stellt sicher, dass der Pfad korrekt extrahiert wird.
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPageUrl) {
            link.parentElement.classList.add('active');
        }
    });

    // Initialisiere die Modals, da die Buttons dafür im Header sind.
    initModals();
    
    console.log("Header-spezifische Skripte (Menü, Modals) erfolgreich initialisiert.");
}

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
    .catch(error => console.error('Netzwerkfehler bei der Besucher-Erfassung:', error));
}

/**
 * Haupt-Initialisierungsfunktion, die nach dem Laden des DOMs ausgeführt wird.
 */
document.addEventListener('DOMContentLoaded', function() {
    // SICHERHEITS-CHECK: Verhindert, dass die Seite bei einem Fehler blockiert bleibt.
    setTimeout(() => {
        const isModalVisible = document.querySelector('.modal-overlay.visible');
        if (document.body.style.overflow === 'hidden' && !isModalVisible) {
            console.warn('Overflow war "hidden" ohne sichtbares Modal - wird korrigiert.');
            document.body.style.overflow = '';
        }
    }, 2000);
    
    const headerPlaceholder = document.getElementById('header-placeholder');

    // KORREKTUR: Die Logik zum Laden des Headers wurde optimiert.
    if (headerPlaceholder) {
        fetch('header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Netzwerk-Antwort war nicht ok. Status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                // 1. Füge den Header-HTML-Code in den Platzhalter ein.
                headerPlaceholder.innerHTML = data;
                
                // 2. Führe erst DANACH alle Skripte aus, die auf den Header angewiesen sind.
                //    Dies behebt das Problem der nicht funktionierenden Links.
                initializeHeaderScripts();
            })
            .catch(error => {
                console.error('Fehler beim Laden des Headers:', error);
                headerPlaceholder.innerHTML = "<p style='color:red; text-align:center;'>Fehler: Der Header konnte nicht geladen werden.</p>";
            });
    } else {
        // Falls es keinen Header-Platzhalter gibt, trotzdem versuchen, die Skripte zu starten.
        // Nützlich für Seiten, die den Header vielleicht nicht verwenden.
        initializeHeaderScripts();
    }

    // Initialisiere alle Module, die NICHT vom Header abhängen.
    // Diese können sofort und unabhängig vom Header-Ladevorgang gestartet werden.
    initEffects();
    initTypewriters();
    initAiForm();
    initSilasForm();

    // Starte hier die Besucher-Erfassung.
    trackVisitor();

    console.log("Alle allgemeinen Module erfolgreich initialisiert.");
});
