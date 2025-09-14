// js/modals.js - BEREINIGTE & FINALE VERSION

// === 1. EINHEITLICHE MODAL-HELFER ===
// Diese zentralen Funktionen können von überall in der App genutzt werden.

export const openModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.add('visible');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
    }
};

export const closeModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.remove('visible');
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    }
};

// === 2. MODAL-INITIALISIERUNG ===
// Diese Funktion richtet die Event-Listener für alle Standard-Modals ein.

export function initModals() {
    console.log("Initialisiere Standard-Modals...");

    // Schließt alle Modals, wenn auf den Hintergrund geklickt wird
    setupModalBackgroundClose();

    // Setup für spezifische Modals (Beispiele)
    setupSpecificModal('contact-modal-trigger', 'contact-modal');
    setupSpecificModal('about-modal-trigger', 'about-modal');
    setupSpecificModal('impressum-trigger', 'legal-modal-impressum');
    setupSpecificModal('datenschutz-trigger', 'legal-modal-datenschutz');
    setupSpecificModal('cookie-settings-trigger', 'cookie-modal'); // Falls vorhanden

    console.log("✅ Standard-Modals erfolgreich initialisiert.");
}


// === 3. SETUP-FUNKTIONEN ===

const setupSpecificModal = (triggerId, modalId) => {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    
    if (trigger && modal) {
        // Öffnen des Modals
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(modal);
        });

        // Schließen mit Buttons, die die Klasse 'close-modal' haben
        modal.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => closeModal(modal));
        });
    }
};

const setupModalBackgroundClose = () => {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (event) => {
            // Schließt das Modal nur, wenn direkt auf den Overlay-Hintergrund geklickt wird
            if (event.target === overlay) {
                closeModal(overlay);
            }
        });
    });
};


// === 4. ALTLASTEN ENTFERNT ===
// Der gesamte Code bezüglich `setupAiModal`, `checkForBookingKeywords`, 
// `launchCurrentBookingModal` und die zugehörigen globalen Funktionen wurde entfernt.
// Diese Logik gehört ausschließlich zu `ai-form.js`, um Konflikte zu vermeiden.
// `modals.js` ist jetzt nur noch für allgemeine, nicht-KI-spezifische Modals zuständig.
