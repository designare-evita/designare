// js/main.js

// Importiere alle notwendigen Initialisierungsfunktionen aus den anderen Modulen
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initModals, initLegalLinks, initContactForm, initCookieBanner } from './modals.js';
import { initTypewriter } from './typewriter.js';
import { initAIForm } from './ai-form.js';

/**
 * Lädt externe HTML-Komponenten (Header, Footer).
 * Dies ist der Schlüssel für ein einheitliches Design.
 */
async function loadComponent(elementId, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Datei nicht gefunden: ${url}`);
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) element.innerHTML = text;
    } catch (error) {
        console.error(`Fehler beim Laden von ${elementId}:`, error);
    }
}

/**
 * Die Hauptfunktion, die alles in der korrekten Reihenfolge startet.
 */
async function start() {
    // 1. Zuerst die HTML-Bausteine laden und darauf warten, dass sie fertig sind.
    await Promise.all([
        loadComponent('header', 'header.html'),
        loadComponent('footer', 'footer.html')
    ]);

    // 2. Erst DANACH alle anderen Funktionen initialisieren.
    // Jetzt sind alle Buttons und Elemente garantiert vorhanden.
    initTheme();
    initEffects();
    initTypewriter();
    initAIForm();
    initModals();
    initLegalLinks();
    initContactForm();
    initCookieBanner();
}

// Starte den gesamten Prozess, sobald die Seite geladen ist.
document.addEventListener('DOMContentLoaded', start);
