// js/booking.js

// Zustands-Objekt, um die Auswahl des Benutzers zu speichern
const bookingState = {
    selectedDay: null,
    selectedDate: null,
    selectedSlot: null,
};

// Funktion zum Anzeigen eines bestimmten Schritts und Ausblenden der anderen
const showStep = (stepId) => {
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
    // Fehlerleiste bei Schrittwechsel zurücksetzen
    document.getElementById('booking-error-message').style.display = 'none';
};

// Funktion zum Anzeigen von Fehlermeldungen
const showBookingError = (message) => {
    const errorElement = document.getElementById('booking-error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
};

// Lädt verfügbare Slots für einen ausgewählten Tag
const loadSlotsForDay = async (day) => {
    bookingState.selectedDay = day;
    const slotsContainer = document.getElementById('slots-container');
    const slotsLoader = document.getElementById('slots-loader');
    const noSlotsMessage = document.getElementById('no-slots-message');

    slotsLoader.style.display = 'block';
    slotsContainer.innerHTML = '';
    noSlotsMessage.style.display = 'none';
    showStep('step-time-selection');

    try {
        const response = await fetch(`/api/get-availability?day=${day}`);
        if (!response.ok) {
            throw new Error('Netzwerkfehler beim Laden der Termine.');
        }
        const data = await response.json();

        if (data.success && data.slots.length > 0) {
            bookingState.selectedDate = data.date;
            document.getElementById('selected-day-display').textContent = data.day.charAt(0).toUpperCase() + data.day.slice(1);
            document.getElementById('selected-date-display').textContent = data.date;

            data.slots.forEach(slot => {
                const slotButton = document.createElement('button');
                slotButton.className = 'slot-button';
                slotButton.textContent = slot.time;
                slotButton.dataset.fullstring = slot.fullString;
                slotButton.onclick = () => selectSlot(slot);
                slotsContainer.appendChild(slotButton);
            });
        } else {
            noSlotsMessage.style.display = 'block';
        }

    } catch (error) {
        console.error('Fehler:', error);
        showBookingError('Termine konnten nicht geladen werden. Bitte versuche es später erneut.');
        showStep('step-day-selection'); // Zurück zum ersten Schritt
    } finally {
        slotsLoader.style.display = 'none';
    }
};

// Behandelt die Auswahl eines Zeit-Slots
const selectSlot = (slot) => {
    bookingState.selectedSlot = slot.fullString;
    document.getElementById('selected-slot-display').textContent = slot.fullString;
    document.getElementById('selected-slot-input').value = slot.fullString;
    showStep('step-details');
};

// Behandelt das Absenden des Buchungsformulars
const handleBookingSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitButton = document.getElementById('submit-booking-button');
    const bookingLoader = document.getElementById('booking-loader');
    
    submitButton.disabled = true;
    bookingLoader.style.display = 'block';

    const formData = new FormData(form);
    const data = {
        slot: formData.get('slot'),
        name: formData.get('name'),
        email: formData.get('email'),
    };

    try {
        const response = await fetch('/api/create-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            document.getElementById('confirmation-message').textContent = result.message;
            showStep('step-confirmation');
        } else {
            // Zeige spezifische Fehlermeldung vom Backend an
            throw new Error(result.message || 'Ein unbekannter Fehler ist aufgetreten.');
        }

    } catch (error) {
        console.error('Buchungsfehler:', error);
        showBookingError(error.message);
        showStep('step-details'); // Bleibe auf dem Detail-Schritt
    } finally {
        submitButton.disabled = false;
        bookingLoader.style.display = 'none';
    }
};

// Initialisiert die Event-Listener für das Buchungs-Modal
export const initBookingModal = () => {
    console.log("Initialisiere Buchungs-Modal...");
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
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);

    // Schließen-Buttons
    document.getElementById('close-booking-modal').addEventListener('click', () => {
        document.getElementById('booking-modal').style.display = 'none';
    });
     document.getElementById('close-confirmation-button').addEventListener('click', () => {
        document.getElementById('booking-modal').style.display = 'none';
    });
};
