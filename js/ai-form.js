// js/ai-form.js - NEUE EINHEITLICHE VERSION für Booking-Modal

export const initAiForm = () => {
    console.log("🚀 Initialisiere einheitliche AI-Form");

    const aiForm = document.getElementById('ai-form');
    if (!aiForm) {
        console.warn("⚠️ #ai-form nicht gefunden!");
        return;
    }

    // DOM-Elemente
    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-chat-history');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    // ===================================================================
    // HILFSFUNKTIONEN FÜR MODAL & CHAT
    // ===================================================================

    const showModal = () => {
        if (modalOverlay) modalOverlay.classList.add('visible');
        document.body.classList.add('no-scroll');
    };

    const hideModal = () => {
        if (modalOverlay) modalOverlay.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    };

    const addMessageToHistory = (message, sender) => {
        if (!responseArea) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = message;
        
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
    };

    const initializeChat = (initialMessage) => {
        if (responseArea) {
            responseArea.innerHTML = '';
            
            // Chat-Input hinzufügen (falls noch nicht vorhanden)
            if (!document.getElementById('ai-chat-input')) {
                const chatForm = document.createElement('form');
                chatForm.id = 'ai-chat-form';
                chatForm.innerHTML = `
                    <div style="display: flex; margin-top: 20px; gap: 10px;">
                        <input type="text" id="ai-chat-input" placeholder="Deine Antwort..." 
                               style="flex: 1; padding: 10px; border-radius: 5px; border: 1px solid #ccc; background: rgba(255,255,255,0.1); color: #fff;">
                        <button type="submit" style="padding: 10px 15px; background: #ffc107; border: none; border-radius: 5px; cursor: pointer; color: #1a1a1a; font-weight: bold;">
                            Senden
                        </button>
                    </div>
                `;
                document.getElementById('ai-response-content-area').appendChild(chatForm);
            }
        }
        
        addMessageToHistory(initialMessage, 'ai');
    };

    // ===================================================================
    // BOOKING-MODAL LAUNCHER (EINHEITLICH FÜR BEIDE WEGE)
    // ===================================================================

    const launchBookingModal = async () => {
        console.log("🚀 Starte einheitliches Booking-Modal");
        
        try {
            // 1. Schließe Chat-Modal falls offen
            hideModal();
            
            // 2. Warte kurz für smooth transition
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 3. Lade Booking-Modal falls nicht vorhanden
            let bookingModal = document.getElementById('booking-modal');
            
            if (!bookingModal) {
                console.log("📄 Lade booking-modal.html...");
                
                const response = await fetch('/booking-modal.html');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const html = await response.text();
                const modalContainer = document.getElementById('modal-container') || document.body;
                modalContainer.insertAdjacentHTML('beforeend', html);
                
                bookingModal = document.getElementById('booking-modal');
                console.log("✅ Booking-Modal HTML eingefügt");
            }
            
            // 4. Setup Event-Listener für Booking
            setupBookingEventListeners();
            
            // 5. Modal anzeigen
            if (bookingModal) {
                bookingModal.style.display = 'flex';
                bookingModal.style.opacity = '1';
                bookingModal.style.visibility = 'visible';
                bookingModal.style.pointerEvents = 'auto';
                
                document.body.style.overflow = 'hidden';
                document.body.classList.add('no-scroll');
                
                // Aktiviere ersten Schritt
                document.querySelectorAll('.booking-step').forEach(step => {
                    step.classList.remove('active');
                });
                
                const firstStep = document.getElementById('step-day-selection');
                if (firstStep) {
                    firstStep.classList.add('active');
                }
                
                console.log("✅ Booking-Modal erfolgreich gestartet");
                return true;
            }
            
        } catch (error) {
            console.error("❌ Booking-Modal Launch fehlgeschlagen:", error);
            
            // Fallback: Zeige Fehlermeldung im Chat
            if (responseArea) {
                addMessageToHistory("Entschuldigung, das Buchungssystem konnte nicht geladen werden. Bitte kontaktiere Michael direkt unter michael@designare.at", 'ai');
                showModal();
            }
            
            return false;
        }
    };

    // ===================================================================
    // BOOKING EVENT LISTENERS SETUP
    // ===================================================================

    const setupBookingEventListeners = () => {
        console.log("🔧 Richte Booking Event-Listener ein...");
        
        // Tag-Buttons
        document.querySelectorAll('.day-button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                button.addEventListener('click', handleDaySelection);
                button.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Zurück-Buttons
        document.querySelectorAll('.back-button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                button.addEventListener('click', handleBackButton);
                button.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Schließen-Button
        const closeButton = document.getElementById('close-booking-modal');
        if (closeButton && !closeButton.hasAttribute('data-listener-added')) {
            closeButton.addEventListener('click', closeBookingModal);
            closeButton.setAttribute('data-listener-added', 'true');
        }
        
        // Buchungsformular
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm && !bookingForm.hasAttribute('data-listener-added')) {
            bookingForm.addEventListener('submit', handleBookingSubmit);
            bookingForm.setAttribute('data-listener-added', 'true');
        }
        
        console.log("✅ Booking Event-Listener eingerichtet");
    };

    // ===================================================================
    // BOOKING EVENT-HANDLER
    // ===================================================================

    const handleDaySelection = async (event) => {
        const day = event.target.dataset.day;
        console.log("📅 Tag ausgewählt:", day);
        
        showLoadingForSlots();
        
        try {
            const response = await fetch(`/api/get-availability?day=${day}`);
            const data = await response.json();
            
            if (data.success && data.slots) {
                displaySlots(data.slots, day, data.date);
                showBookingStep('step-time-selection');
            } else {
                alert('Keine Termine verfügbar für ' + day);
            }
            
        } catch (error) {
            console.error('Fehler beim Laden der Slots:', error);
            alert('Fehler beim Laden der verfügbaren Termine');
        } finally {
            hideLoadingForSlots();
        }
    };

    const handleBackButton = (event) => {
        const targetStep = event.target.dataset.target;
        console.log("⬅️ Zurück zu:", targetStep);
        showBookingStep(targetStep);
    };

    const closeBookingModal = () => {
        console.log("❎ Schließe Booking-Modal");
        const bookingModal = document.getElementById('booking-modal');
        if (bookingModal) {
            bookingModal.style.display = 'none';
        }
        
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    };

    const handleBookingSubmit = async (event) => {
        event.preventDefault();
        
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const slotInput = document.getElementById('selected-slot-input');
        
        if (!nameInput.value || !emailInput.value || !slotInput.value) {
            alert('Bitte fülle alle Felder aus');
            return;
        }
        
        const submitButton = document.getElementById('submit-booking-button');
        const loader = document.getElementById('booking-loader');
        
        if (submitButton) submitButton.disabled = true;
        if (loader) loader.style.display = 'block';
        
        try {
            const response = await fetch('/api/create-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: slotInput.value,
                    name: nameInput.value,
                    email: emailInput.value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showBookingStep('step-confirmation');
                const confirmationMessage = document.getElementById('confirmation-message');
                if (confirmationMessage) {
                    confirmationMessage.textContent = data.message;
                }
            } else {
                alert('Fehler bei der Buchung: ' + data.message);
            }
            
        } catch (error) {
            console.error('Buchungsfehler:', error);
            alert('Fehler bei der Buchung. Bitte versuche es erneut.');
        } finally {
            if (submitButton) submitButton.disabled = false;
            if (loader) loader.style.display = 'none';
        }
    };

    // ===================================================================
    // BOOKING HILFSFUNKTIONEN
    // ===================================================================

    const showBookingStep = (stepId) => {
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.add('active');
        }
    };

    const displaySlots = (slots, day, date) => {
        const slotsContainer = document.getElementById('slots-container');
        const selectedDayDisplay = document.getElementById('selected-day-display');
        const selectedDateDisplay = document.getElementById('selected-date-display');
        
        if (selectedDayDisplay) selectedDayDisplay.textContent = day;
        if (selectedDateDisplay) selectedDateDisplay.textContent = date;
        
        if (slotsContainer) {
            slotsContainer.innerHTML = '';
            
            if (slots.length > 0) {
                slots.forEach(slot => {
                    const button = document.createElement('button');
                    button.className = 'slot-button';
                    button.textContent = slot.time;
                    button.addEventListener('click', () => selectSlot(slot.fullString));
                    slotsContainer.appendChild(button);
                });
            } else {
                slotsContainer.innerHTML = '<p>Keine Termine verfügbar</p>';
            }
        }
    };

    const selectSlot = (fullSlot) => {
        console.log("🕐 Slot ausgewählt:", fullSlot);
        
        const selectedSlotDisplay = document.getElementById('selected-slot-display');
        const selectedSlotInput = document.getElementById('selected-slot-input');
        
        if (selectedSlotDisplay) selectedSlotDisplay.textContent = fullSlot;
        if (selectedSlotInput) selectedSlotInput.value = fullSlot;
        
        showBookingStep('step-details');
    };

    const showLoadingForSlots = () => {
        const loader = document.getElementById('slots-loader');
        if (loader) loader.style.display = 'block';
    };

    const hideLoadingForSlots = () => {
        const loader = document.getElementById('slots-loader');
        if (loader) loader.style.display = 'none';
    };

    // ===================================================================
    // API-KOMMUNIKATION
    // ===================================================================

    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende an Evita:`, userInput);
        
        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput }),
            });
            
            if (!response.ok) throw new Error(`HTTP-Fehler: ${response.status}`);
            const data = await response.json();
            console.log(`📨 Evita Response:`, data);

            if (data.action === 'launch_booking_modal') {
                console.log("🎯 Booking-Anfrage erkannt → Starte Modal");
                
                // Antworte im Chat
                const message = data.answer || "Einen Moment, ich öffne den Kalender für dich...";
                if (!isFromChat) {
                    initializeChat(message);
                    showModal();
                    
                    // Nach kurzer Verzögerung: Modal schließen und Booking öffnen
                    setTimeout(() => {
                        launchBookingModal();
                    }, 1500);
                } else {
                    addMessageToHistory(message, 'ai');
                    
                    // Sofort Booking öffnen
                    setTimeout(() => {
                        launchBookingModal();
                    }, 500);
                }
                
            } else {
                // Normale Chat-Antworten
                const message = data.answer || "Ich konnte keine Antwort finden.";
                if (!isFromChat) {
                    initializeChat(message);
                    showModal();
                } else {
                    addMessageToHistory(message, 'ai');
                }
            }
            
        } catch (error) {
            console.error(`❌ Evita-Fehler:`, error);
            const errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.";
            
            if (isFromChat) {
                addMessageToHistory(errorMessage, 'ai');
            } else {
                initializeChat(errorMessage);
                showModal();
            }
        }
    };

    // ===================================================================
    // EVENT-LISTENER SETUP
    // ===================================================================

    // Hauptformular (Index-Seite)
    aiForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const question = aiQuestion.value.trim();
        if (!question) return;
        
        aiStatus.style.display = 'block';
        aiForm.querySelector('button').disabled = true;
        
        try {
            await sendToEvita(question, false);
        } finally {
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
            aiForm.querySelector('button').disabled = false;
        }
    });

    // Chat-Formular (Modal)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            e.preventDefault();
            const chatInput = document.getElementById('ai-chat-input');
            if (!chatInput) return;
            
            const userInput = chatInput.value.trim();
            if (!userInput) return;
            
            addMessageToHistory(userInput, 'user');
            chatInput.value = '';
            sendToEvita(userInput, true);
        }
    });

    // Modal schließen
    closeButtons.forEach(button => {
        button.addEventListener('click', hideModal);
    });

    // ===================================================================
    // GLOBALE FUNKTIONEN FÜR EXTERNE NUTZUNG
    // ===================================================================

    // Für externe Nutzung (z.B. Header-Button)
    window.launchBookingFromAnywhere = launchBookingModal;
    
    // Debug-Funktion
    window.debugBookingLaunch = launchBookingModal;
    
    console.log("✅ Einheitliche AI-Form initialisiert");
    console.log("🔧 Verfügbare Funktionen:");
    console.log("  - window.launchBookingFromAnywhere()");
    console.log("  - window.debugBookingLaunch()");
};
