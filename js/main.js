// js/main.js (VERSION MIT ERWEITERTEM LOGGING)

// === 1. IMPORTE ===
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// === 2. HELFERFUNKTIONEN ===
const loadContent = (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        return Promise.reject(`Platzhalter-Element '${elementId}' nicht gefunden.`);
    }
    return fetch(url).then(response => {
        if (!response.ok) throw new Error(`Fehler beim Laden von ${url}`);
        return response.text();
    }).then(data => {
        placeholder.innerHTML = data;
    });
};

const trackVisitor = () => {
    fetch('/api/track-visitor')
        .then(response => response.ok ? console.log('Besucher erfasst.') : console.error('Fehler bei der Erfassung des Besuchers.'))
        .catch(error => console.error('Netzwerkfehler beim Tracking:', error));
};

// === 3. INITIALISIERUNGS-FUNKTIONEN ===
const initializeDynamicScripts = () => {
    console.log("Starte Initialisierung der dynamischen Skripte (Menü, Modals)...");
    try {
        initModals();
        console.log("✅ Erfolgreich: initModals()");
    } catch (error) {
        console.error("❌ Fehler in initializeDynamicScripts:", error);
    }
};

const initializeStaticScripts = () => {
    console.log("Starte Initialisierung der statischen Skripte...");
    try {
        console.log("➡️ Aufruf: initEffects()");
        initEffects();
        console.log("✅ Erfolgreich: initEffects()");

        console.log("➡️ Aufruf: initTypewriters()");
        initTypewriters();
        console.log("✅ Erfolgreich: initTypewriters()");

        console.log("➡️ Aufruf: initAiForm()");
        initAiForm();
        console.log("✅ Erfolgreich: initAiForm()");

        console.log("➡️ Aufruf: initSilasForm()");
        initSilasForm();
        console.log("✅ Erfolgreich: initSilasForm()");
    } catch (error) {
        console.error("❌ Kritischer Fehler in initializeStaticScripts:", error);
    }
};

// === 4. HAUPTEINSTIEGSPUNKT ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM geladen. Start der Anwendung.");
    initializeStaticScripts();

    const headerPromise = loadContent('/header.html', 'header-placeholder');
    const modalsPromise = loadContent('/modals.html', 'modal-container');

    Promise.all([headerPromise, modalsPromise])
        .then(() => {
            console.log("✅ Header und Modals erfolgreich geladen.");
            initializeDynamicScripts();
        })
        .catch(error => {
            console.error("❌ Kritischer Fehler beim Laden der Seitenstruktur:", error);
        });
        
    trackVisitor();
});
