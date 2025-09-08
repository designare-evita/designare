// js/ai-form.js - KOMPLETT KORRIGIERTE FASSUNG

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
    // TERMINBUCHUNG - KORREKTE IMPLEMENTIERUNG
    // ===================================================================
    
    const handleSmartBookingResponse = (data) => {
        console.log("📅 Smart Booking Response erhalten:", data);
        
        // Speichere Terminvorschläge
        currentBookingState.suggestions = data.suggestions || [];
        currentBookingState.step = 'slot_selection';
        
        // Erstelle Terminliste mit klickbaren Text-Optionen
        const enhancedMessage = createInteractiveTerminMessage(data.answer, data.suggestions);
        addMessageToHistory(enhancedMessage, 'ai', true);
    };

    const createInteractiveTerminMessage = (message, suggestions) => {
        let enhancedHtml = `<div class="booking-message">
            <div class="booking-text">${message.replace(/\n/g, '<br>')}</div>`;
        
        if (suggestions && suggestions.length > 0) {
            enhancedHtml += `<div class="booking-options" style="margin-top: 15px;">`;
            
            suggestions.forEach((suggestion, index) => {
                const emoji = suggestion.isPreferredTime ? '⭐' : '📞';
                enhancedHtml += `
                    <div class="termin-option" data-slot="${suggestion.slot}" data-datetime="${suggestion.fullDateTime}" style="
                        padding: 12px 15px;
                        margin-bottom: 8px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        border-left: 4px solid #ffc107;
                        font-weight: bold;
                    " onmouseover="this.style.background='rgba(255,193,7,0.2)'" 
                       onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        ${emoji} <strong>Termin ${suggestion.slot}:</strong> ${suggestion.formattedString}
                    </div>`;
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
    // EVENT-HANDLER FÜR TERMIN-OPTIONEN
    // ===================================================================
    
    const handleTerminOptionClick = (event) => {
        const terminDiv = event.target.closest('.termin-option');
        if (terminDiv) {
            const slotNumber = parseInt(terminDiv.dataset.slot);
            const datetime = terminDiv.dataset.datetime;
            
            console.log(`Termin ${slotNumber} ausgewählt:`, datetime);
            
            currentBookingState.selectedSlot = slotNumber;
            
            // Markiere ausgewählte Option
            document.querySelectorAll('.termin-option').forEach(div => {
                div.style.background = 'rgba(255,255,255,0.1)';
                div.style.borderLeft = '4px solid #ffc107';
            });
            
            terminDiv.style.background = 'rgba(40,167,69,0.3)';
            terminDiv.style.borderLeft = '4px solid #28a745';
            
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
    // Bei Chat-Aufruf: GAR NICHTS tun
    console.log("✅ Chat-Aufruf ignoriert");
} else {
    // Bei erster Anfrage: NUR den Text zeigen, OHNE zusätzliche Optionen
    initializeChat(data.answer, false);  // ✅ Nur der Text
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

    // Event-Listener für Termin-Optionen (Event-Delegation)
    document.addEventListener('click', handleTerminOptionClick);
    console.log("✅ Termin-Option-Listener registriert");

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
