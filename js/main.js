// js/main.js

// === 1. IMPORTE ===
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// === 2. CONTENT LOADING HELPER ===
const loadContent = async (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) return;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error ${response.status} bei ${url}`);
        const data = await response.text();
        placeholder.innerHTML = data;
    } catch (error) {
        console.warn(`⚠️ Konnte ${url} nicht in #${elementId} laden:`, error);
    }
};

const loadFeedback = async () => {
    const placeholder = document.getElementById('feedback-placeholder');
    if (!placeholder) return;
    
    try {
        const response = await fetch('blog-feedback.html');
        if (response.ok) {
            placeholder.innerHTML = await response.text();
        }
    } catch (e) {
        console.log("Info: Feedback-Sektion nicht geladen (optional).");
    }
};

// === 3. INITIALISIERUNGS-LOGIK ===
const initializeStaticScripts = () => {
    initModals();
};

const initializeDynamicScripts = () => {
    initEffects();
    initTypewriters();
};

const initializeForms = async () => {
    try { 
        await initAiForm(); 
    } catch (e) { 
        console.warn("AI-Form konnte nicht initialisiert werden:", e); 
    }
    try { 
        initSilasForm(); 
    } catch (e) { 
        console.warn("Silas-Form konnte nicht initialisiert werden:", e); 
    }
};

// === 4. MAIN EVENT LISTENER ===
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Theme sofort initialisieren
    // Das setzt die korrekten CSS-Klassen basierend auf dem LocalStorage
    initTheme();

    // 2. Statische Komponenten (Modals) bereitstellen
    initializeStaticScripts();

    try {
        // 3. Alle externen HTML-Komponenten parallel laden
        await Promise.all([
            loadContent('header.html', 'header-placeholder'),
            loadContent('modals.html', 'modal-container'),
            loadContent('footer.html', 'footer-placeholder'),
            loadContent('side-menu.html', 'side-menu-placeholder'),
            loadFeedback()
        ]);

        console.log("✅ Layout erfolgreich geladen.");
        
        // 4. Dynamische Scripte und Formulare starten
        // Ein kleiner Timeout gibt dem DOM Zeit, die geladenen Inhalte zu verarbeiten
        setTimeout(() => {
            initializeDynamicScripts();
            initializeForms();
        }, 50);

        // Seite sichtbar machen
        document.body.classList.add('page-loaded');

    } catch (error) {
        console.error("❌ Kritischer Fehler beim Laden der Seite:", error);
        document.body.classList.add('page-loaded'); // Fallback: Seite trotzdem zeigen
    }
});

// === 5. OBSERVER FÜR ANIMATIONEN ===
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

// Alle Performance-Tips und speziellen Container observieren
document.querySelectorAll('.performance-tip, .ai-container, .keyword-list-container').forEach(el => {
    observer.observe(el);
});
