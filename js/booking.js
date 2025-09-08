// js/booking.js (ERWEITERTE VERSION mit allen Empfehlungen)

// Zustands-Objekt für die Buchung
const bookingState = {
    selectedDay: null,
    selectedDate: null,
    selectedSlot: null,
    autoRefreshInterval: null, // Für automatische Aktualisierung
    lockedSlots: new Map() // Für optimistische Sperrung
};

// ===================================================================
// NEUE FUNKTION: FRONTEND-VALIDIERUNG
// ===================================================================
const validateBookingTime = (selectedSlot) => {
    console.log("🔍 Validiere Buchungszeit:", selectedSlot);
    
    try {
        // Parse das deutsche Datum
        const slotString = selectedSlot.replace(/\s+um\s+/, ' ').trim();
        const slotTime = new Date(slotString);
        
        if (isNaN(slotTime.getTime())) {
            console.warn("⚠️ Ungültiges Datum:", selectedSlot);
            showBookingError('Ungültiges Datumsformat. Bitte wähle einen anderen Slot.');
            return false;
        }
        
        const now = new Date();
        const minFutureTime = new Date(now.getTime() + 30 * 60000); // 30 Minuten Vorlauf
        
        if (slotTime <= minFutureTime) {
            console.warn("⚠️ Slot zu nah in der Zukunft:", slotTime.toLocaleString('de-DE'));
            showBookingError('Dieser Termin liegt zu nah in der Zukunft. Bitte wähle einen späteren Zeitpunkt.');
            return false;
        }
        
        // Prüfe auf gesperrte Slots
        if (isSlotLocked(selectedSlot)) {
            console.warn("⚠️ Slot ist temporär gesperrt:", selectedSlot);
            showBookingError('Dieser Termin wird gerade von einem anderen Nutzer gebucht. Bitte wähle einen anderen Slot.');
            return false;
        }
        
        console.log("✅ Slot-Validierung erfolgreich");
        return true;
        
    } catch (error) {
        console.error("❌ Fehler bei der Slot-Validierung:", error);
        showBookingError('Fehler bei der Terminvalidierung. Bitte versuche es erneut.');
        return false;
    }
};

// ===================================================================
// NEUE FUNKTION: OPTIMISTISCHE SLOT-SPERRUNG
// ===================================================================
const lockSlot = (slot) => {
    console.log("🔒 Sperre Slot temporär:", slot);
    const lockExpiry = Date.now() + 300000; // 5 Minuten
    bookingState.lockedSlots.set(slot, lockExpiry);
    sessionStorage.setItem(`locked_${slot}`, lockExpiry.toString());
};

const unlockSlot = (slot) => {
    console.log("🔓 Entsperre Slot:", slot);
    bookingState.lockedSlots.delete(slot);
    sessionStorage.removeItem(`locked_${slot}`);
};

const isSlotLocked = (slot) => {
    const now = Date.now();
    
    // Prüfe lokale Sperrung
    const localLock = bookingState.lockedSlots.get(slot);
    if (localLock && localLock > now) {
        return true;
    }
    
    // Prüfe SessionStorage (falls Seite neu geladen wurde)
    const sessionLock = sessionStorage.getItem(`locked_${slot}`);
    if (sessionLock && parseInt(sessionLock) > now) {
        bookingState.lockedSlots.set(slot, parseInt(sessionLock));
        return true;
    }
    
    // Entferne abgelaufene Sperren
    if (localLock && localLock <= now) {
        unlockSlot(slot);
    }
    
    return false;
};

// ===================================================================
// NEUE FUNKTION: AUTOMATISCHE SLOT-AKTUALISIERUNG
// ===================================================================
const startAutoRefresh = () => {
    if (bookingState.autoRefreshInterval) {
        clearInterval(bookingState.autoRefreshInterval);
    }
    
    console.log("🔄 Starte automatische Slot-Aktualisierung (alle 2 Minuten)");
    
    bookingState.autoRefreshInterval = setInterval(() => {
        const timeSelectionStep = document.getElementById('step-time-selection');
        if (timeSelectionStep && timeSelectionStep.classList.contains('active')) {
            const currentDay = bookingState.selectedDay;
            if (currentDay) {
                console.log("🔄 Aktualisiere Slots automatisch für:", currentDay);
                loadSlotsForDay(currentDay, true); // true = silent refresh
            }
        }
    }, 120000); // 2 Minuten
};

const stopAutoRefresh = () => {
    if (bookingState.autoRefreshInterval) {
        console.log("⏹️ Stoppe automatische Slot-Aktualisierung");
        clearInterval(bookingState.autoRefreshInterval);
        bookingState.autoRefreshInterval = null;
    }
};

// ===================================================================
// ERWEITERTE FUNKTION: SLOTS LADEN (mit Auto-Refresh Support)
// ===================================================================
const loadSlotsForDay = async (day, silentRefresh = false) => {
    console.log("📅 Lade Slots für Tag:", day, silentRefresh ? "(silent)" : "");
    
    const dayLoader = document.getElementById('day-loader');
    const slotsLoader = document.getElementById('slots-loader');
    const slotsContainer = document.getElementById('slots-container');
    const selectedDayDisplay = document.getElementById('selected-day-display');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const noSlotsMessage = document.getElementById('no-slots-message');

    // Zeige Loading nur bei nicht-stiller Aktualisierung
    if (!silentRefresh) {
        if (dayLoader) dayLoader.style.display = 'block';
        if (slotsLoader) slotsLoader.style.display = 'block';
    }
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
            const previousSlots = Array.from(slotsContainer.children).map(child => child.dataset.fullSlot);
            slotsContainer.innerHTML = '';
            
            if (data.slots && data.slots.length > 0) {
                let newSlotsCount = 0;
                let removedSlotsCount = 0;
                
                data.slots.forEach(slot => {
                    // Prüfe ob Slot gesperrt ist
                    if (isSlotLocked(slot.fullString)) {
                        console.log("🔒 Überspringe gesperrten Slot:", slot.fullString);
                        return;
                    }
                    
                    const slotButton = document.createElement('button');
                    slotButton.className = 'slot-button';
                    slotButton.textContent = slot.time;
                    slotButton.dataset.fullSlot = slot.fullString;
                    slotButton.addEventListener('click', () => selectSlot(slot.fullString));
                    slotsContainer.appendChild(slotButton);
                    
                    // Zähle neue Slots
                    if (!previousSlots.includes(slot.fullString)) {
                        newSlotsCount++;
                    }
                });
                
                // Zähle entfernte Slots
                removedSlotsCount = previousSlots.length - (data.slots.length - newSlotsCount);
                
                if (silentRefresh && (newSlotsCount > 0 || removedSlotsCount > 0)) {
                    console.log(`🔄 Slots aktualisiert: +${newSlotsCount}, -${removedSlotsCount}`);
                    // Optionale Benachrichtigung bei Änderungen
                    showSlotUpdateNotification(newSlotsCount, removedSlotsCount);
                }
                
                console.log(`✅ ${data.slots.length} Slots geladen`);
            } else {
                if (noSlotsMessage) noSlotsMessage.style.display = 'block';
                console.warn("⚠️ Keine Slots verfügbar für", day);
            }
        }

        // Wechsle zum nächsten Schritt nur bei nicht-stiller Aktualisierung
        if (!silentRefresh) {
            showStep('step-time-selection');
            startAutoRefresh(); // Starte Auto-Refresh für diesen Tag
        }

    } catch (error) {
        console.error('❌ Fehler beim Laden der Slots:', error);
        if (!silentRefresh) {
            showBookingError(`Fehler beim Laden der Termine: ${error.message}`);
        }
    } finally {
        // Verstecke Loading-Anzeigen
        if (!silentRefresh) {
            if (dayLoader) dayLoader.style.display = 'none';
            if (slotsLoader) slotsLoader.style.display = 'none';
        }
    }
};

// ===================================================================
// NEUE FUNKTION: SLOT-UPDATE-BENACHRICHTIGUNG
// ===================================================================
const showSlotUpdateNotification = (newSlots, removedSlots) => {
    if (newSlots === 0 && removedSlots === 0) return;
    
    let message = '';
    if (newSlots > 0 && removedSlots > 0) {
        message = `${newSlots} neue Termine verfügbar, ${removedSlots} wurden gebucht`;
    } else if (newSlots > 0) {
        message = `${newSlots} neue Termine verfügbar`;
    } else if (removedSlots > 0) {
        message = `${removedSlots} Termine wurden gebucht`;
    }
    
    // Erstelle kleine, unaufdringliche Benachrichtigung
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 0.9rem;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Einblenden
    setTimeout(() => notification.style.opacity = '1', 100);
    
    // Ausblenden und entfernen
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
};

// Funktion zum Anzeigen eines bestimmten Schritts
export const showStep = (stepId) => {
    console.log("📋 Zeige Buchungsschritt:", stepId);
    
    // Stoppe Auto-Refresh wenn wir den Zeit-Auswahl-Schritt verlassen
    if (stepId !== 'step-time-selection') {
        stopAutoRefresh();
    }
    
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

// ERWEITERTE FUNKTION: Slot-Auswahl mit Validierung und Sperrung
const selectSlot = (slot) => {
    console.log("🕐 Slot ausgewählt:", slot);
    
    // Validiere den Slot vor der Auswahl
    if (!validateBookingTime(slot)) {
        return; // Fehler wurde bereits angezeigt
    }
    
    // Sperre den Slot temporär
    lockSlot(slot);
    
    bookingState.selectedSlot = slot;
    
    const selectedSlotDisplay = document.getElementById('selected-slot-display');
    const selectedSlotInput = document.getElementById('selected-slot-input');
    
    if (selectedSlotDisplay) selectedSlotDisplay.textContent = slot;
    if (selectedSlotInput) selectedSlotInput.value = slot;
    
    showStep('step-details');
};

// ERWEITERTE FUNKTION: Buchungsformular mit verbesserter Validierung
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

    // ZUSÄTZLICHE VALIDIERUNG: Nochmalige Prüfung des Slots
    if (!validateBookingTime(slot)) {
        return; // Fehler wurde bereits angezeigt
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
            // Entsperre den Slot (Buchung erfolgreich)
            unlockSlot(slot);
            
            // Zeige Bestätigung
            const confirmationMessage = document.getElementById('confirmation-message');
            if (confirmationMessage) {
                confirmationMessage.textContent = data.message;
            }
            showStep('step-confirmation');
            console.log("✅ Buchung erfolgreich");
        } else {
            // Entsperre den Slot (Buchung fehlgeschlagen)
            unlockSlot(slot);
            throw new Error(data.message || 'Unbekannter Fehler bei der Buchung');
        }

    } catch (error) {
        console.error('❌ Fehler bei der Buchung:', error);
        
        // Entsperre den Slot
        unlockSlot(slot);
        
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
                
                // Entsperre aktuell gesperrten Slot wenn wir zurückgehen
                if (bookingState.selectedSlot) {
                    unlockSlot(bookingState.selectedSlot);
                    bookingState.selectedSlot = null;
                }
                
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
                
                // Aufräumen beim Schließen
                stopAutoRefresh();
                if (bookingState.selectedSlot) {
                    unlockSlot(bookingState.selectedSlot);
                }
                
                document.getElementById('booking-modal').style.display = 'none';
            });
        }

        if (closeConfirmationButton) {
            closeConfirmationButton.addEventListener('click', () => {
                console.log("❎ Bestätigungs-Modal schließen");
                
                // Aufräumen beim Schließen
                stopAutoRefresh();
                
                document.getElementById('booking-modal').style.display = 'none';
            });
        }

        // Cleanup bei Seitenwechsel
        window.addEventListener('beforeunload', () => {
            stopAutoRefresh();
            if (bookingState.selectedSlot) {
                unlockSlot(bookingState.selectedSlot);
            }
        });

        console.log("✅ Buchungs-Modal vollständig initialisiert");
        
    }, 100);
};
