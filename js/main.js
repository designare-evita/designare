// js/main.js - FINALE HAUPTSTEUERUNG

// Importiert die Initialisierungsfunktionen aus allen anderen Modulen
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// Diese Funktion wird ausgeführt, sobald die Webseite vollständig geladen ist.
const startApp = () => {
    console.log("DOM geladen, starte alle Module...");
    
    // Ruft nacheinander die Startfunktionen der importierten Module auf
    initEffects();
    initTypewriters();
    initModals();
    initAiForm();
    initSilasForm();

    console.log("🎉 Alle Systeme sind online. Anwendung ist bereit!");
};

// Wartet auf das 'DOMContentLoaded'-Event, bevor die App gestartet wird.
document.addEventListener('DOMContentLoaded', startApp);
