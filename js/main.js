// js/main.js

import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialisiert alle Module. 
    // initTheme() wird jetzt sicher von initEffects() aufgerufen.
    initEffects();
    initTypewriters();
    initModals();
    initAiForm();

    console.log("Alle Module erfolgreich initialisiert.");
});
