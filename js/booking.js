// js/booking.js (REPARIERTE VERSION)

// Zustands-Objekt für die Buchung
const bookingState = {
    selectedDay: null,
    selectedDate: null,
    selectedSlot: null,
};

// Funktion zum Anzeigen eines bestimmten Schritts
export const showStep = (stepId) => {
    console.log("📋 Zeige Buchungsschritt:", stepId);
    
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    
    const stepElement = document.getElementById(stepId);
    if (stepElement) {
        stepElement.classList.add('active');
        console.log("✅ Schritt aktiviert:", stepId);
    } else {
        console.warn("⚠️ Schritt nicht gefunden:", stepId);
    }
    
    const errorElement = document.getElementById('booking-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
};

// Funktion zum Anzeigen von Fehlermeldungen
const showBookingError = (message) => {
    console.error("❌ Booking-Fehler:", message);
    const errorElement = document.getElementById('booking-error-message');
    if(errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        alert(message); // Fallback
    }
};

// Lädt verfügbare Slots für einen ausgewählten Tag
const loadSlotsForDay = async (day) => {
    console.log("📅 Lade Slots für Tag:", day);
    
    const dayLoader = document.getElementById('day-loader');
    const slotsLoader = document.getElementById('slots-loader');
    const slotsContainer = document.getElementById('slots-container');
    const selectedDayDisplay = document.getElementById('selected-day-display');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const noSlotsMessage = document.getElementById('no-slots-message');

    // Zeige Loading-Anzeige
    if (dayLoader) dayLoader.style.display = 'block';
    if (slotsLoader) slotsLoader.style.display = 'block';
    if (noSlotsMessage) noSlotsMessage.style.display = 'none';

    try {
        const response = await fetch(`/api/get-availability?day=${day}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("📨 Verfügbarkeits-Response:", data);

        if (!data.success) {
            throw new Error(data.message || 'Fehler beim Laden der Verfügbarkeit');
        }

        // Speichere Auswahl
        bookingState.selectedDay = day;
        bookingState.selectedDate = data.date;

        // Update Display
        if (selectedDayDisplay) selectedDayDisplay.textContent = day;
        if (selectedDateDisplay) selectedDateDisplay.textContent = data.date;

        // Zeige Slots
        if (slotsContainer) {
            slotsContainer.innerHTML = '';
            
            if (data.slots && data.slots.length > 0) {
                data.slots.forEach(slot => {
                    const slotButton = document.createElement('button');
                    slotButton.className = 'slot-button';
                    slotButton.textContent = slot.time;
                    slotButton.dataset.fullSlot = slot.fullString;
                    slotButton.addEventListener('click', () => selectSlot(slot.fullString));
                    slotsContainer.appendChild(slotButton);
                });
                console.log(`✅ ${data.slots.length} Slots geladen`);
            } else {
                if (noSlotsMessage) noSlotsMessage.style.display = 'block';
                console.warn("⚠️ Keine Slots verfügbar für", day);
            }
        }

        // Wechsle zum nächsten Schritt
        showStep('step-time-selection');

    } catch (error) {
        console.error('❌ Fehler beim Laden der Slots:', error);
        showBookingError(`Fehler beim Laden der Termine: ${error.message}`);
    } finally {
        // Verstecke Loading-Anzeigen
        if (dayLoader) dayLoader.style.display = 'none';
        if (slotsLoader) slotsLoader.style.display = 'none';
    }
};

// Behandelt die Auswahl eines Zeit-Slots
const selectSlot = (slot) => {
    console.log("🕐 Slot ausgewählt:", slot);
    
    bookingState.selectedSlot = slot;
    
    const selectedSlotDisplay = document.getElementById('selected-slot-display');
    const selectedSlotInput = document.getElementById('selected-slot-input');
    
    if (selectedSlotDisplay) selectedSlotDisplay.textContent = slot;
    if (selectedSlotInput) selectedSlotInput.value = slot;
    
    showStep('step-details');
};

// Behandelt das Absenden des Buchungsformulars
const handleBookingSubmit = async (event) => {
    event.preventDefault();
    console.log("📝 Buchungsformular abgesendet");

    const bookingLoader = document.getElementById('booking-loader');
    const submitButton = document.getElementById('submit-booking-button');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const slotInput = document.getElementById('selected-slot-input');

    if (!nameInput || !emailInput || !slotInput) {
        showBookingError('Formular-Elemente nicht gefunden');
        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const slot = slotInput.value;

    if (!name || !email || !slot) {
        showBookingError('Bitte fülle alle Felder aus');
        return;
    }

    // Zeige Loading
    if (bookingLoader) bookingLoader.style.display = 'block';
    if (submitButton) submitButton.disabled = true;

    try {
        const response = await fetch('/api/create-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot, name, email })
        });

        const data = await response.json();
        console.log("📨 Buchungs-Response:", data);

        if (data.success) {
            // Zeige Bestätigung
            const confirmationMessage = document.getElementById('confirmation-message');
            if (confirmationMessage) {
                confirmationMessage.textContent = data.message;
            }
            showStep('step-confirmation');
            console.log("✅ Buchung erfolgreich");
        } else {
            throw new Error(data.message || 'Unbekannter Fehler bei der Buchung');
        }

    } catch (error) {
        console.error('❌ Fehler bei der Buchung:', error);
        showBookingError(`Buchung fehlgeschlagen: ${error.message}`);
    } finally {
        // Verstecke Loading
        if (bookingLoader) bookingLoader.style.display = 'none';
        if (submitButton) submitButton.disabled = false;
    }
};

// Initialisiert die Event-Listener für das Buchungs-Modal
export const initBookingModal = () => {
    console.log("🚀 Initialisiere Buchungs-Modal...");

    // Warte kurz, damit das HTML geladen ist
    setTimeout(() => {
        const bookingForm = document.getElementById('booking-form');
        const closeButton = document.getElementById('close-booking-modal');
        const closeConfirmationButton = document.getElementById('close-confirmation-button');
        
        console.log("🔧 Booking-Form gefunden?", !!bookingForm);
        console.log("🔧 Close-Button gefunden?", !!closeButton);

        if (!bookingForm) {
            console.error("❌ Booking-Form nicht gefunden!");
            return;
        }

        // Event-Listener für Tagesauswahl
        document.querySelectorAll('.day-button').forEach(button => {
            button.addEventListener('click', () => {
                const day = button.dataset.day;
                console.log("📅 Tag-Button geklickt:", day);
                loadSlotsForDay(day);
            });
        });
        console.log("✅ Tag-Buttons Event-Listener registriert");

        // Event-Listener für Zurück-Buttons
        document.querySelectorAll('.back-button').forEach(button => {
            button.addEventListener('click', () => {
                const target = button.dataset.target;
                console.log("⬅️ Zurück zu:", target);
                showStep(target);
            });
        });
        console.log("✅ Zurück-Buttons Event-Listener registriert");
        
        // Formular-Submit-Listener
        bookingForm.addEventListener('submit', handleBookingSubmit);
        console.log("✅ Formular-Submit Event-Listener registriert");

        // Schließen-Buttons
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                console.log("❎ Booking-Modal schließen");
                document.getElementById('booking-modal').style.display = 'none';
            });
        }

        if (closeConfirmationButton) {
            closeConfirmationButton.addEventListener('click', () => {
                console.log("❎ Bestätigungs-Modal schließen");
                document.getElementById('booking-modal').style.display = 'none';
            });
        }

        console.log("✅ Buchungs-Modal vollständig initialisiert");
        
    }, 100); // Kleine Verzögerung für DOM-Bereitschaft
};
