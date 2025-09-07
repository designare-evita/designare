// js/main.js (KORRIGIERT FÜR AI-FORM INIT)

// === 1. IMPORTE ===
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js'; // <-- GEÄNDERTER IMPORT
import { initSilasForm } from './silas-form.js';

// === 2. HELFERFUNKTIONEN ===
const loadContent = (url, elementId) => {
    // ... (Diese Funktion bleibt unverändert)
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

const trackVisitor = () => {
    // ... (Diese Funktion bleibt unverändert)
    fetch('/api/track-visitor')
        .then(response => response.ok ? console.log('Besucher erfasst.') : console.error('Fehler bei der Erfassung des Besuchers.'))
        .catch(error => console.error('Netzwerkfehler beim Tracking:', error));
};


// === 3. INITIALISIERUNGS-FUNKTIONEN ===
const initializeDynamicScripts = () => {
    console.log("Starte Initialisierung der dynamischen Skripte (Menü, Modals)...");
    initModals();
};

const initializeStaticScripts = () => {
    console.log("Starte Initialisierung der statischen Skripte...");
    initEffects();
    initTypewriters();
    initAiForm(); // <-- AUFRUF HIER HINZUGEFÜGT
    initSilasForm();
};


// === 4. HAUPTEINSTIEGSPUNKT ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM geladen. Start der Anwendung.");

    // Ruft die Skripte auf, die auf das initiale HTML angewiesen sind.
    initializeStaticScripts();

    const headerPromise = loadContent('/header.html', 'header-placeholder');
    const modalsPromise = loadContent('/modals.html', 'modal-container');

    Promise.all([headerPromise, modalsPromise])
        .then(() => {
            console.log("✅ Header und Modals erfolgreich geladen.");
            // Ruft die Skripte auf, die auf das nachgeladene HTML angewiesen sind.
            initializeDynamicScripts();
        })
        .catch(error => {
            console.error("❌ Kritischer Fehler beim Laden der Seitenstruktur:", error);
            document.body.innerHTML = `<p style='color:red; text-align:center;'>Fehler beim Laden der Seite.</p>`;
        });
        
    trackVisitor();
});
