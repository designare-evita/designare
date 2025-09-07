// js/booking.js (ROBUSTERE VERSION)

// Zustands-Objekt, um die Auswahl des Benutzers zu speichern
const bookingState = {
    selectedDay: null,
    selectedDate: null,
    selectedSlot: null,
};

// Funktion zum Anzeigen eines bestimmten Schritts und Ausblenden der anderen
export const showStep = (stepId) => {
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    const stepElement = document.getElementById(stepId);
    if (stepElement) {
        stepElement.classList.add('active');
    }
    const errorElement = document.getElementById('booking-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
};

// Funktion zum Anzeigen von Fehlermeldungen
const showBookingError = (message) => {
    const errorElement = document.getElementById('booking-error-message');
    if(errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
};

// Lädt verfügbare Slots für einen ausgewählten Tag
const loadSlotsForDay = async (day) => {
    // ... (Diese Funktion bleibt unverändert)
};

// Behandelt die Auswahl eines Zeit-Slots
const selectSlot = (slot) => {
    // ... (Diese Funktion bleibt unverändert)
};

// Behandelt das Absenden des Buchungsformulars
const handleBookingSubmit = async (event) => {
    // ... (Diese Funktion bleibt unverändert)
};


// Initialisiert die Event-Listener für das Buchungs-Modal
export const initBookingModal = () => {
    console.log("Versuche, Buchungs-Modal zu initialisieren...");

    // Sicherheitsprüfung: Stelle sicher, dass die Elemente existieren, bevor Listener hinzugefügt werden.
    const bookingForm = document.getElementById('booking-form');
    const closeButton = document.getElementById('close-booking-modal');
    
    if (!bookingForm || !closeButton) {
        console.warn("Buchungs-Modal-Elemente noch nicht im DOM. Initialisierung wird übersprungen.");
        return; // Bricht die Funktion ab, wenn die Elemente nicht da sind.
    }
    
    console.log("Buchungs-Modal-Elemente gefunden. Initialisiere Event-Listener.");

    // Klick-Listener für die Tagesauswahl-Buttons
    document.querySelectorAll('.day-button').forEach(button => {
        button.addEventListener('click', () => {
            loadSlotsForDay(button.dataset.day);
        });
    });

    // Klick-Listener für die "Zurück"-Buttons
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            showStep(button.dataset.target);
        });
    });
    
    // Formular-Submit-Listener
    bookingForm.addEventListener('submit', handleBookingSubmit);

    // Schließen-Buttons
    closeButton.addEventListener('click', () => {
        document.getElementById('booking-modal').style.display = 'none';
    });
    const closeConfirmationButton = document.getElementById('close-confirmation-button');
    if(closeConfirmationButton) {
        closeConfirmationButton.addEventListener('click', () => {
            document.getElementById('booking-modal').style.display = 'none';
        });
    }
};
