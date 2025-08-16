// js/main.js

import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js'; 
import { initSilasForm } from './silas-form.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialisiert alle importierten Module
    initEffects();
    initTypewriters();
    initModals();
    initAiForm();
initSilasForm(); 

    console.log("Alle Module erfolgreich initialisiert.");
});
