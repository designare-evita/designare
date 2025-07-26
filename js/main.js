// js/main.js

// Importiere alle notwendigen Module
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initModals, initLegalLinks, initContactForm } from './modals.js';
import { initTypewriter, initAIForm } from './chatbot.js';

/**
 * Lädt externe HTML-Komponenten (wie Header und Footer) in die Seite.
 * @param {string} elementId - Die ID des Elements, in das der Inhalt geladen wird.
 * @param {string} url - Der Pfad zur HTML-Datei, die geladen werden soll.
 */
async function loadComponent(elementId, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Komponente konnte nicht geladen werden: ${url}`);
        }
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = text;
        } else {
            console.warn(`Element mit der ID '${elementId}' nicht gefunden.`);
        }
    } catch (error) {
        console.error(`Fehler beim Laden der Komponente '${elementId}':`, error);
    }
}

/**
 * Hauptfunktion, die nach dem vollständigen Laden des DOMs ausgeführt wird.
 * Sie orchestriert das Laden der Komponenten und die Initialisierung der Skripte.
 */
async function main() {
    // 1. Lade zuerst die grundlegenden Bausteine der Seite (Header, Footer).
    // Promise.all sorgt dafür, dass wir warten, bis BEIDE geladen sind.
    await Promise.all([
        loadComponent('header', 'header.html'),
        loadComponent('footer', 'footer.html')
    ]);

    // 2. Initialisiere DANACH alle Funktionen, die von diesen Komponenten abhängen.
    // Die Reihenfolge hier ist jetzt sicher.
    initTheme();
    initEffects();
    initModals();
    initLegalLinks();
    initContactForm();
    initTypewriter();
    initAIForm();
}

// Starte den gesamten Prozess, sobald die HTML-Struktur bereit ist.
document.addEventListener('DOMContentLoaded', main);
