// js/ai-form.js (VERSION MIT ERWEITERTEM LOGGING)
console.log("🟢 Modul: ai-form.js wird geladen...");

import { initBookingModal, showStep } from './booking.js';
console.log("✅ Import von booking.js in ai-form.js erfolgreich.");

export const initAiForm = () => {
    console.log("➡️ Funktion: initAiForm() wird ausgeführt.");
    
    const aiForm = document.getElementById('ai-form');
    // ... (der Rest des Codes bleibt unverändert) ...
    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-response-content-area');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    if (!aiForm) {
        console.warn("🔴 AI-Formular nicht gefunden. Initialisierung übersprungen.");
        return;
    }
    console.log("✅ AI-Formular gefunden, initialisiere Event-Listener.");

    const launchBookingModal = async () => { /* ... unverändert ... */ };
    const handleFormSubmit = async (event) => { /* ... unverändert ... */ };
    
    aiForm.addEventListener('submit', handleFormSubmit);

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    });
};
