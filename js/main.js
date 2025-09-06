// js/main.js

/**
 * ===================================================================
 * IMPORTE ALLER MODULE
 * ===================================================================
 * Hier werden alle JavaScript-Module importiert, die für die 
 * verschiedenen Funktionalitäten der Seite benötigt werden.
 */
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';


/**
 * ===================================================================
 * INITIALISIERUNG DER DYNAMISCHEN SCRIPTS
 * ===================================================================
 * Diese Funktion führt alle Skripte aus, die von den Inhalten
 * aus header.html und modals.html abhängen. Sie wird erst dann 
 * aufgerufen, wenn diese HTML-Dateien vollständig geladen sind.
 */
function initializeDynamicContentScripts() {
    console.log("Initialisiere Skripte für geladenen Header und Modals...");

    // --- Logik für das Slide-in Menü ---
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const sideMenuPanel = document.getElementById('side-menu-panel');
    const closeMenuButton = document.getElementById('close-menu-button');

    if (menuToggleButton && sideMenuPanel && closeMenuButton) {
        menuToggleButton.addEventListener('click', () => sideMenuPanel.classList.add('is-active'));
        closeMenuButton.addEventListener('click', () => sideMenuPanel.classList.remove('is-active'));
        
        // Menü schließen, wenn ein Link darin geklickt wird
        sideMenuPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => sideMenuPanel.classList.remove('is-active'));
        });
        console.log("Slide-in Menü initialisiert.");
    }

    // --- Logik für den aktiven Menüpunkt ---
    // Hebt den Menüpunkt der aktuell angezeigten Seite hervor.
    const currentPageUrl = window.location.pathname.endsWith('/') 
        ? '/index.html' 
        : window.location.pathname;
        
    document.querySelectorAll('.side-menu-content li a').forEach(link => {
        // Sicherstellen, dass der Link eine gültige URL hat, bevor wir darauf zugreifen
        try {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPageUrl) {
                link.parentElement.classList.add('active');
            }
        } catch (e) {
            // Ignoriere ungültige href-Attribute wie z.B. "#"
        }
    });
    console.log("Aktiver Menüpunkt gesetzt.");

    // --- Initialisierung der Modals ---
    // Diese Funktion enthält die Logik für alle Pop-ups (Kontakt, Cookies, etc.)
    initModals();
    console.log("Alle Modal-Skripte initialisiert.");
}

/**
 * ===================================================================
 * HELFERFUNKTION ZUM LADEN VON HTML-INHALTEN
 * ===================================================================
 * Lädt HTML-Code aus einer externen Datei und fügt ihn in ein
 * angegebenes Platzhalter-Element auf der Seite ein.
 * * @param {string} url - Der Pfad zur HTML-Datei (z.B. '/header.html').
 * @param {string} elementId - Die ID des Platzhalter-Elements.
 * @returns {Promise<void>} Ein Promise, das erfüllt ist, wenn der Inhalt geladen wurde.
 */
function loadContent(url, elementId) {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        const errorMsg = `Fehler: Platzhalter-Element mit der ID '${elementId}' wurde nicht gefunden.`;
        console.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Netzwerk-Antwort für ${url} war nicht ok: ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
        });
}

/**
 * ===================================================================
 * BESUCHER-TRACKING
 * ===================================================================
 * Ruft eine serverseitige Funktion auf, um den Besuch auf der
 * Seite zu protokollieren.
 */
function trackVisitor() {
  fetch('/api/track-visitor')
    .then(response => {
        if (response.ok) {
            console.log('Besucher erfolgreich erfasst.');
        } else {
            console.error('Fehler bei der Erfassung des Besuchers.');
        }
    })
    .catch(error => console.error('Netzwerkfehler beim Besucher-Tracking:', error));
}


/**
 * ===================================================================
 * HAUPTEINSTIEGSPUNKT (MAIN)
 * ===================================================================
 * Dieser Code wird ausgeführt, sobald die grundlegende HTML-Struktur
 * der Seite geladen ist (DOMContentLoaded).
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM vollständig geladen. Starte Initialisierung.");

    // Definiere die Lade-Aktionen für Header und Modals als Promises.
    const loadHeader = loadContent('/header.html', 'header-placeholder');
    const loadModals = loadContent('/modals.html', 'modal-container');

    // Promise.all wartet, bis BEIDE Lade-Aktionen (Header und Modals) abgeschlossen sind.
    // Das ist entscheidend, um Race Conditions zu vermeiden.
    Promise.all([loadHeader, loadModals])
        .then(() => {
            console.log("✅ Header und Modals erfolgreich in das DOM geladen.");
            // Führe erst JETZT die Skripte aus, die von diesem HTML-Code abhängen.
            initializeDynamicContentScripts();
        })
        .catch(error => {
            console.error("❌ Kritischer Fehler beim Laden von Header oder Modals:", error);
            // Informiere den Benutzer, dass etwas nicht stimmt.
            const body = document.querySelector('body');
            if (body) {
                body.innerHTML = `<p style='color:red; text-align:center; font-family: sans-serif; padding: 2rem;'>
                                    Ein kritischer Fehler ist aufgetreten. Die Seite kann nicht korrekt geladen werden.
                                  </p>`;
            }
        });

    // Diese Module sind unabhängig und können sofort initialisiert werden.
    console.log("Initialisiere allgemeine, unabhängige Module...");
    initEffects();
    initTypewriters();
    initAiForm();
    initSilasForm();
    
    // Starte das Besucher-Tracking.
    trackVisitor();

    console.log("Haupt-Initialisierung abgeschlossen. Warte auf dynamische Inhalte...");
});
