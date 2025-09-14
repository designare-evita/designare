// js/modals.js - BEREINIGTE & FINALE VERSION

// === 1. ZENTRALE HELFERFUNKTIONEN ===
// Diese Funktionen können von überall genutzt werden, um Modals zu steuern.


export const openModal = (modalElement) => { /* ... (Code wie vorher) */ };
export const closeModal = (modalElement) => { /* ... (Code wie vorher) */ };

// "export" macht diese Funktion für main.js sichtbar
export function initModals() {
    console.log("Initialisiere Standard-Modals...");
    setupSpecificModal('contact-modal-trigger', 'contact-modal');
    setupSpecificModal('impressum-trigger', 'legal-modal-impressum');
    setupSpecificModal('datenschutz-trigger', 'legal-modal-datenschutz');
    setupModalBackgroundClose();
    console.log("✅ Standard-Modals initialisiert.");
}

// === 3. INTERNE SETUP-FUNKTIONEN ===

// Verbindet einen Trigger-Button mit einem Modal
const setupSpecificModal = (triggerId, modalId) => {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    
    if (trigger && modal) {
        // Öffnen
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(modal);
        });

        // Schließen mit jedem Button, der die Klasse 'close-modal' hat
        modal.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => closeModal(modal));
        });
    }
};

// Ermöglicht das Schließen von Modals durch Klick auf den dunklen Hintergrund
const setupModalBackgroundClose = () => {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (event) => {
            // Nur schließen, wenn direkt auf den Hintergrund geklickt wird
            if (event.target === overlay) {
                closeModal(overlay);
            }
        });
    });
};

// HINWEIS: Alle AI-spezifischen Logiken wurden entfernt, da sie nun zentral
// und konfliktfrei in `ai-form.js` verwaltet werden.
