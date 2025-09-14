// js/main.js - BEREINIGTE & FINALE VERSION

// === 1. IMPORTE ===
// HINWEIS: chat-booking-integration.js wurde entfernt, da seine Logik jetzt in ai-form.js liegt.
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js'; // Behalten für andere Modals, falls vorhanden
import { initAiForm } from './ai-form.js'; // Die einzige Quelle für AI-Logik
import { initSilasForm } from './silas-form.js';

// === 2. GLOBALE INITIALISIERUNG ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM geladen, starte App-Initialisierung...");
    
    // Visuelle Effekte und UI-Komponenten
    initEffects();
    initTypewriters();
    initModals();
    
    // Formular-Logiken
    initAiForm(); // Initialisiert das gesamte AI-System
    initSilasForm();

    // Richte den Evita Chat Button ein (falls vorhanden)
    setupEvitaChatButton();

    // Tracking für Analytics
    trackVisitor();

    console.log("🎉 Anwendung mit Evita Chat Support vollständig initialisiert!");
});


// === 3. HELFERFUNKTIONEN ===
const trackVisitor = () => {
    fetch('/api/track-visitor')
        .then(response => response.ok ? console.log('Besucher erfasst.') : console.error('Fehler bei der Erfassung des Besuchers.'))
        .catch(error => console.error('Netzwerkfehler beim Tracking:', error));
};


// === 4. EVITA CHAT BUTTON LOGIK ===
const setupEvitaChatButton = () => {
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (!evitaChatButton) {
        console.log("ℹ️ Kein Evita Chat Button auf dieser Seite gefunden.");
        return;
    }
    
    console.log("🤖 Richte Event Listener für Evita Chat Button ein...");

    evitaChatButton.addEventListener('click', () => {
        console.log('🤖 Evita Chat Button geklickt. Starte Chat...');
        
        // Greife direkt auf die globale Funktion aus ai-form.js zu.
        // Diese Funktion kümmert sich um alles: Modal öffnen, erste Nachricht senden etc.
        if (typeof window.sendToEvita === 'function') {
            window.sendToEvita("Hallo, ich habe eine Frage", false); // `false` da es der erste Klick ist, nicht aus einem Chat heraus
        } else {
            console.error('❌ window.sendToEvita ist nicht verfügbar. Wurde ai-form.js korrekt initialisiert?');
            alert('Der Chat konnte nicht gestartet werden. Bitte versuchen Sie, die Seite neu zu laden.');
        }
    });

    evitaChatButton.setAttribute('data-evita-ready', 'true');
    console.log("✅ Evita Chat Button ist bereit.");
};

// === 5. ALTLASTEN ENTFERNT ===
// Der gesamte Code bezüglich `initializeChatBookingIntegration` und der `MutationObserver` 
// wurde entfernt. `ai-form.js` ist jetzt die einzige "Single Source of Truth" für die 
// gesamte Chat- und Buchungs-Interaktion. Das verhindert Konflikte und sorgt für
// ein vorhersehbares, korrektes Verhalten.
