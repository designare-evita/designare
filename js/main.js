// js/main.js

import { initEffects } from './effects.js';
import { initTheme } from './theme.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';

// Event-Listener, der wartet, bis die Seite komplett geladen ist.
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialisiert alle importierten Module in der gewünschten Reihenfolge.
    initEffects();
    initTheme();
    initTypewriters();
    initModals();

    console.log("Alle Module erfolgreich initialisiert.");
});
