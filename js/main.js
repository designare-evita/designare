// js/main.js

import { initEffects } from './effects.js';
// Der direkte Import von initTheme ist nicht mehr nötig, da effects.js dies übernimmt.
// import { initTheme } from './theme.js'; 
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialisiert alle importierten Module.
    // initTheme() wird jetzt automatisch von initEffects() aufgerufen,
    // sobald die Partikel-Animation bereit ist.
    initEffects();
    initTypewriters();
    initModals();
    initAiForm();

    console.log("Alle Module erfolgreich initialisiert.");
});
