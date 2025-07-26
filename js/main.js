// js/main.js

import { initEffects } from './effects.js';
import { initTheme } from './theme.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js'; // NEU: Importiert das AI-Form-Modul

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialisiert alle importierten Module
    initEffects();
    initTheme();
    initTypewriters();
    initModals();
    initAiForm(); // NEU: Initialisiert das AI-Form-Modul

    console.log("Alle Module erfolgreich initialisiert.");
});
