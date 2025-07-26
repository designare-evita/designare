// js/main.js
import { initTheme } from './theme.js';
import './modals.js'; 
import { initEffects } from './effects.js';
import { initChatbot } from './chatbot.js';

// Funktion zum Laden von HTML-Komponenten (Header, Footer)
async function loadComponent(elementId, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Datei nicht gefunden: ${url}`);
        const data = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = data;
        }
    } catch (error) {
        console.error(`Fehler beim Laden von ${url}:`, error);
    }
}

// Hauptfunktion, die nach dem Laden des DOMs ausgeführt wird
document.addEventListener('DOMContentLoaded', async () => {
    // Lade zuerst die grundlegenden Bausteine der Seite
    await Promise.all([
        loadComponent('header', 'header.html'),
        loadComponent('footer', 'footer.html')
    ]);

    // Initialisiere danach alle Skripte, die Elemente aus Header/Footer benötigen
    initTheme();      // Initialisiert den Dark/Light-Mode-Button im Header
    initEffects();    // Initialisiert Effekte auf der Seite
    initChatbot();    // Initialisiert den Chatbot
    // modals.js initialisiert sich dank des eigenen DOMContentLoaded-Listeners von selbst
});
