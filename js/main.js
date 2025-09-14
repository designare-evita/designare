// js/main.js - FINALE VERSION

import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// Hauptfunktion, wird ausgeführt, wenn das DOM geladen ist
const startApp = () => {
    console.log("DOM geladen, starte App-Initialisierung...");
    
    // Visuelle Effekte und UI-Komponenten
    initEffects();
    initTypewriters();
    initModals(); // Initialisiert nur noch Standard-Modals
    
    // Formular-Logiken
    initAiForm(); // Initialisiert das gesamte AI-System
    initSilasForm();

    // Richte den Evita Chat Button ein
    setupEvitaChatButton();

    console.log("🎉 Anwendung vollständig initialisiert!");
};

// Event Listener, der auf das Laden des DOMs wartet
document.addEventListener('DOMContentLoaded', startApp);


// Richtet den Klick-Listener für den Evita Chat Button ein
const setupEvitaChatButton = () => {
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (!evitaChatButton) return;
    
    console.log("🤖 Richte Evita Chat Button ein...");

    evitaChatButton.addEventListener('click', () => {
        console.log('🤖 Evita Chat Button geklickt.');
        
        // Greife direkt auf die globale Funktion aus ai-form.js zu
        // `sendToEvita` wird dort in `window.sendToEvita` umbenannt und verfügbar gemacht
        if (typeof sendToEvita === 'function') {
            // Startet den Chat mit einer neutralen Begrüßung
             sendToEvita("Hallo", false); 
        } else {
            console.error('❌ Funktion sendToEvita ist nicht verfügbar. ai-form.js wurde eventuell nicht korrekt geladen.');
            alert('Der Chat konnte nicht gestartet werden.');
        }
    });
};
