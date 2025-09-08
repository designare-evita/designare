// js/ai-form.js - KOMPLETTE KORRIGIERTE FASSUNG

export const initAiForm = () => {
    console.log("🚀 initAiForm mit intelligenter Terminbuchung gestartet");

    const aiForm = document.getElementById('ai-form');
    if (!aiForm) {
        console.warn("⚠️ initAiForm: #ai-form nicht gefunden!");
        return;
    }

    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-chat-history');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    // Globale Variablen für Booking-State
    let currentBookingState = {
        suggestions: [],
        selectedSlot: null,
        bookingData: null,
        step: 'initial'
    };

    // Modal-Steuerung
    const showModal = () => {
        if (!modalOverlay) return;
        
        modalOverlay.classList.add('visible');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        modalOverlay.style.pointerEvents = 'auto';
        
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
    };

    const hideModal = () => {
        if (!modalOverlay) return;
        
        modalOverlay.classList.remove('visible');
        modalOverlay.style.display = 'none';
        modalOverlay.style.opacity = '0';
        modalOverlay.style.visibility = 'hidden';
        modalOverlay.style.pointerEvents = 'none';
        
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    };

    const addMessageToHistory = (message, sender, isHtml = false) => {
        if (!responseArea) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        if (isHtml || (message.includes('<') && message.includes('>'))) {
            messageDiv.innerHTML = message;
        } else {
            messageDiv.textContent = message;
        }
        
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
    };

    const initializeChat = (initialMessage, isHtml = false) => {
        if (!responseArea) return;
        
        responseArea.innerHTML = '';
        addMessageToHistory(initialMessage, 'ai', isHtml);
    };

    // ===================================================================
    // TERMINBUCHUNG - EINFACHE IMPLEMENTIERUNG
    // ===================================================================
    
    const createInteractiveTerminMessage = (message, suggestions) => {
        let enhancedHtml = `<div class="booking-message">
            <div class="booking-text">Hier sind die nächsten 3 verfügbaren Rückruftermine:</div>`;
        
        if (suggestions && suggestions.length > 0) {
            enhancedHtml += `<div class="booking-buttons" style="margin-top: 20px;">`;
            
            suggestions.forEach((suggestion, index) => {
                enhancedHtml += `
                    <button class="termin-button" data-slot="${suggestion.slot}" data-datetime="${suggestion.fullDateTime}" style="
                        display: block;
                        width: 100%;
                        margin-bottom: 12px;
                        padding: 15px 20px;
                        background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
                        color: #1a1a1a;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(255,193,7,0.4)'" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        Termin ${suggestion.slot}: ${suggestion.formattedString}
                    </button>`;
            });
            
            enhancedHtml += `</div>`;
        }
        
        enhancedHtml += `</div>`;
        return enhancedHtml;
    };

    const handleBookingDataCollection = (data) => {
        console.log("📝 Datensammlung:", data);
        currentBookingState.step = 'contact_data';
        addMessageToHistory(data.answer, 'ai');
    };

    const handleBookingConfirmation = async (data) => {
        console.log("✅ Booking-Bestätigung:", data);
        currentBookingState.bookingData = data.bookingData;
        currentBookingState.step = 'confirming';
        
        // Zeige Bestätigungsnachricht
        addMessageToHistory(data.answer, 'ai');
        
        // Führe die eigentliche Buchung durch
        try {
            await executeBooking();
        } catch (error) {
            console.error('Fehler bei der Buchung:', error);
            addMessageToHistory("❌ Fehler bei der Terminbuchung. Bitte versuche es erneut oder kontaktiere Michael direkt.", 'ai');
        }
    };

    const executeBooking = async () => {
        if (!currentBookingState.selectedSlot || !currentBookingState.bookingData) {
            console.error('Unvollständige Buchungsdaten');
            return;
        }

        try {
            const selectedSuggestion = currentBookingState.suggestions.find(s => s.slot === currentBookingState.selectedSlot);
            
            if (!selectedSuggestion) {
                throw new Error('Ausgewählter Slot nicht gefunden');
            }

            const response = await fetch('/api/book-appointment-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: selectedSuggestion.fullDateTime,
                    name: currentBookingState.bookingData.name,
                    phone: currentBookingState.bookingData.phone
                })
            });

            const result = await response.json();

            if (result.success) {
                addMessageToHistory(result.message, 'ai');
                // Reset booking state
                currentBookingState = { suggestions: [], selectedSlot: null, bookingData: null, step: 'initial' };
            } else {
                addMessageToHistory(`❌ ${result.message}`, 'ai');
            }

        } catch (error) {
            console.error('Booking execution error:', error);
            addMessageToHistory("❌ Entschuldigung, bei der Terminbuchung ist ein Fehler aufgetreten. Bitte kontaktiere Michael direkt unter michael@designare.at", 'ai');
        }
    };

    // ===================================================================
    // EVENT-HANDLER FÜR TERMIN-BUTTONS
    // ===================================================================
    
    const handleTerminButtonClick = (event) => {
        if (event.target.classList.contains('termin-button')) {
            const slotNumber = parseInt(event.target.dataset.slot);
            const datetime = event.target.dataset.datetime;
            
            console.log(`Termin ${slotNumber} ausgewählt:`, datetime);
            
            currentBookingState.selectedSlot = slotNumber;
            
            // Markiere ausgewählten Button
            document.querySelectorAll('.termin-button').forEach(btn => {
                btn.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                btn.style.color = '#fff';
            });
            
            event.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            event.target.style.color = '#fff';
            
            // Sende "Termin X" als Chat-Nachricht
            addMessageToHistory(`Termin ${slotNumber}`, 'user');
            
            // API-Aufruf für Datensammlung
            setTimeout(() => {
                sendToEvita(`Termin ${slotNumber}`, true);
            }, 500);
        }
    };

    // ===================================================================
    // API-KOMMUNIKATION
    // ===================================================================
    
    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende ${isFromChat ? 'Chat-' : ''}Anfrage:`, userInput);
        
        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput }),
            });

            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }

            const data = await response.json();
            console.log(`📨 ${isFromChat ? 'Chat-' : ''}Response:`, data);

            // ===================================================================
            // ANTWORT-BEHANDLUNG
            // ===================================================================
            
            if (data.action === 'smart_booking') {
                console.log("🎯 SMART BOOKING ERKANNT!");
                
                if (isFromChat) {
                    // Bei Chat-Aufruf: GAR NICHTS anzeigen
                    console.log("✅ Chat-Aufruf ignoriert");
                } else {
                    // Bei erster Anfrage: Modal mit Buttons zeigen
                    const enhancedMessage = createInteractiveTerminMessage(data.answer, data.suggestions);
                    initializeChat(enhancedMessage, true);
                    showModal();
                    currentBookingState.suggestions = data.suggestions || [];
                    currentBookingState.step = 'slot_selection';
                }
                return true;
            }
            
            if (data.action === 'collect_booking_data') {
                console.log("📝 DATENSAMMLUNG ERKANNT!");
                handleBookingDataCollection(data);
                return true;
            }
            
            if (data.action === 'confirm_booking') {
                console.log("✅ BOOKING-BESTÄTIGUNG ERKANNT!");
                await handleBookingConfirmation(data);
                return true;
            }

            // Normale Antworten
            if (data.answer) {
                if (isFromChat) {
                    addMessageToHistory(data.answer, 'ai');
                } else {
                    initializeChat(data.answer);
                    showModal();
                }
                return false;
            } else {
                const fallbackMessage = "Entschuldigung, ich konnte keine Antwort generieren.";
                if (isFromChat) {
                    addMessageToHistory(fallbackMessage, 'ai');
                } else {
                    initializeChat(fallbackMessage);
                    showModal();
                }
                return false;
            }

        } catch (error) {
            console.error(`❌ Fehler bei ${isFromChat ? 'Chat-' : ''}Anfrage:`, error);
            const errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.";
            
            if (isFromChat) {
                addMessageToHistory(errorMessage, 'ai');
            } else {
                initializeChat(errorMessage);
                showModal();
            }
            return false;
        }
    };

    // ===================================================================
    // STANDARD-EVENT-HANDLER
    // ===================================================================
    
    const handleFormSubmit = async (event) => {
        event.preventDefault();

        const question = aiQuestion.value.trim();
        if (!question) return;

        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';
        aiQuestion.disabled = true;
        aiForm.querySelector('button').disabled = true;

        try {
            await sendToEvita(question, false);
        } finally {
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
            aiQuestion.disabled = false;
            aiForm.querySelector('button').disabled = false;
        }
    };

    const handleChatSubmit = async (event) => {
        event.preventDefault();
        console.log("💬 Chat-Submit Handler aufgerufen");

        event.stopImmediatePropagation();

        const chatInput = document.getElementById('ai-chat-input');
        if (!chatInput) {
            console.warn("⚠️ Chat-Input nicht gefunden");
            return;
        }

        const userInput = chatInput.value.trim();
        console.log("🔍 Chat-Input Wert:", `"${userInput}"`);

        if (!userInput) {
            console.warn("⚠️ Leere Chat-Eingabe");
            return;
        }

        console.log("💬 Chat-Eingabe verarbeitet:", userInput);

        // Füge User-Nachricht sofort hinzu
        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        // Sende an Evita
        await sendToEvita(userInput, true);
    };

    // ===================================================================
    // EVENT-LISTENER SETUP
    // ===================================================================
    
    let chatFormHandled = false;

    // Event Listener für Hauptformular
    aiForm.addEventListener('submit', handleFormSubmit);
    console.log("✅ AI-Form Submit-Listener registriert");

    // Chat-Form Event Listener
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            console.log("🎯 Chat-Form Submit erkannt");
            
            if (chatFormHandled) {
                console.log("⚠️ Chat bereits behandelt, überspringe");
                return;
            }
            
            chatFormHandled = true;
            setTimeout(() => { chatFormHandled = false; }, 100);
            
            handleChatSubmit(e);
        }
    });
    console.log("✅ Chat-Submit-Listener registriert");

    // Event-Listener für Termin-Buttons (Event-Delegation)
    document.addEventListener('click', handleTerminButtonClick);
    console.log("✅ Termin-Button-Listener registriert");

    // Close-Button Event Listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideModal();
            // Reset booking state when closing
            currentBookingState = { suggestions: [], selectedSlot: null, bookingData: null, step: 'initial' };
        });
    });
    console.log("✅ Close-Button-Listener registriert");

    // Debug-Funktionen
    window.debugBookingState = () => console.log('Current Booking State:', currentBookingState);
    window.testSmartBooking = () => sendToEvita('Ich brauche einen Termin', false);

    console.log("✅ Evita AI-Form mit intelligenter Terminbuchung vollständig initialisiert");
    console.log("🔧 Debug-Funktionen verfügbar:");
    console.log("   - window.debugBookingState()");
    console.log("   - window.testSmartBooking()");
};
