// js/main.js

// === 1. IMPORTE ===
// Alle benötigten Module werden hier importiert.
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// === 2. HELFERFUNKTIONEN ===

/**
 * Lädt externen HTML-Inhalt in ein Platzhalter-Element.
 * @param {string} url - Der Pfad zur HTML-Datei.
 * @param {string} elementId - Die ID des Platzhalters.
 * @returns {Promise<void>}
 */
const loadContent = (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        return Promise.reject(`Platzhalter-Element '${elementId}' nicht gefunden.`);
    }
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Fehler beim Laden von ${url}`);
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
        });
};

/**
 * Protokolliert den Besuch serverseitig.
 */
const trackVisitor = () => {
    fetch('/api/track-visitor')
        .then(response => response.ok ? console.log('Besucher erfasst.') : console.error('Fehler bei der Erfassung des Besuchers.'))
        .catch(error => console.error('Netzwerkfehler beim Tracking:', error));
};


// === 3. INITIALISIERUNGS-FUNKTIONEN ===

/**
 * Initialisiert alle Skripte, die von den geladenen HTML-Inhalten (Header, Modals) abhängen.
 * WIRD ERST NACH DEM FETCH AUFGERUFEN.
 */
const initializeDynamicScripts = () => {
    console.log("Starte Initialisierung der dynamischen Skripte (Menü, Modals)...");
    
    // Menü-Logik
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

    // Aktiven Menüpunkt setzen
    const currentPageUrl = window.location.pathname.endsWith('/') ? '/index.html' : window.location.pathname;
    document.querySelectorAll('.side-menu-content li a').forEach(link => {
        try {
            if (new URL(link.href).pathname === currentPageUrl) {
                link.parentElement.classList.add('active');
            }
        } catch (e) { /* Ignoriere ungültige Links */ }
    });
    
    // Modal-Logik initialisieren
    initModals();
};

/**
 * Initialisiert alle Skripte, die NICHT von externen Inhalten abhängen.
 * KANN SOFORT AUSGEFÜHRT WERDEN.
 */
const initializeStaticScripts = () => {
    console.log("Starte Initialisierung der statischen Skripte...");
    initEffects();
    initTypewriters();
    initAiForm();
    initSilasForm();
};


// === 4. HAUPTEINSTIEGSPUNKT ===
// Dieser Code wird ausgeführt, sobald das grundlegende HTML-Dokument bereit ist.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM geladen. Start der Anwendung.");

    // Zuerst die unabhängigen Skripte starten
    initializeStaticScripts();

    // Definiere die Lade-Aktionen für die HTML-Teile
    const headerPromise = loadContent('/header.html', 'header-placeholder');
    const modalsPromise = loadContent('/modals.html', 'modal-container');

    // Warte mit Promise.all, bis BEIDE Teile geladen sind
    Promise.all([headerPromise, modalsPromise])
        .then(() => {
            console.log("✅ Header und Modals erfolgreich geladen.");
            // Erst jetzt, wo das HTML da ist, die abhängigen Skripte initialisieren
            initializeDynamicScripts();
        })
        .catch(error => {
            console.error("❌ Kritischer Fehler beim Laden der Seitenstruktur:", error);
            document.body.innerHTML = `<p style='color:red; text-align:center;'>Fehler beim Laden der Seite.</p>`;
        });

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
