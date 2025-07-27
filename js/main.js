// js/main.js

import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialisiert alle übrigen Module. Die Theme-Logik wurde entfernt.
    initEffects();
    initTypewriters();
    initModals();
    initAiForm();

    console.log("Alle Module (ohne Theme) erfolgreich initialisiert.");
});
