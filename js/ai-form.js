// js/ai-form.js - KOMPLETT NEU UND KORRIGIERT

export const initAiForm = () => {
    console.log("🚀 Initialisiere AI-Form mit korrigiertem Buchungssystem");

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
    // GLOBALER BOOKING-STATE
    // ===================================================================
    let currentBookingState = {
        suggestions: [],
        selectedSlot: null,
        bookingData: null,
        step: 'initial'
    };

    // Macht currentBookingState global verfügbar für Debugging
    window.currentBookingState = currentBookingState;

    // ===================================================================
    // MODAL-STEUERUNG
    // ===================================================================
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

    // ===================================================================
    // CHAT-FUNKTIONEN
    // ===================================================================
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
        console.log("🔄 Initialisiere Chat mit Nachricht");
        
        if (!responseArea) {
            console.error("❌ responseArea nicht verfügbar!");
            return;
        }
        
        responseArea.innerHTML = '';
        addMessageToHistory(initialMessage, 'ai', isHtml);
    };

    // ===================================================================
    // BOOKING-FUNKTIONEN
    // ===================================================================
    
    const createInteractiveTerminMessage = (message, suggestions) => {
        console.log("📅 Erstelle interaktive Termin-Nachricht mit", suggestions?.length || 0, "Vorschlägen");
        
        let enhancedHtml = `
            <div class="booking-message">
                <div class="booking-text" style="margin-bottom: 20px; font-size: 1.1rem;">
                    Hier sind die nächsten 3 verfügbaren Rückruf-Termine:
                </div>
        `;
        
        if (suggestions && suggestions.length > 0) {
            enhancedHtml += `<div class="booking-buttons" style="margin-top: 20px;">`;
            
            suggestions.forEach((suggestion) => {
                const emoji = suggestion.isPreferredTime ? '⭐' : '📞';
                enhancedHtml += `
                    <button class="termin-button" 
                            data-slot="${suggestion.slot}" 
                            data-datetime="${suggestion.fullDateTime || ''}" 
                            data-formatted="${suggestion.formattedString || ''}"
                            style="
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
                            " 
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(255,193,7,0.4)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        ${emoji} Termin ${suggestion.slot}: ${suggestion.formattedString}
                    </button>
                `;
            });
            
            enhancedHtml += `</div>`;
        }
        
        enhancedHtml += `
            <div style="margin-top: 20px; padding: 15px; background: rgba(255,193,7,0.1); border-radius: 8px; border-left: 4px solid #ffc107;">
                <strong style="color: #ffc107;">💡 So funktioniert's:</strong><br>
                1. Klicke auf einen Termin oder schreibe "Termin 1", "Termin 2" oder "Termin 3"<br>
                2. Gib deine Kontaktdaten ein<br>
                3. Michael ruft dich zum vereinbarten Zeitpunkt an
            </div>
        </div>`;
        
        return enhancedHtml;
    };

    const handleBookingDataCollection = (data) => {
        console.log("📝 Sammle Kontaktdaten");
        currentBookingState.step = 'contact_data';
        addMessageToHistory(data.answer, 'ai', true);
    };

    const handleBookingConfirmation = async (data) => {
        console.log("✅ Booking-Bestätigung empfangen");
        console.log("📋 BookingData:", data.bookingData);
        
        // Speichere Booking-Daten
        currentBookingState.bookingData = data.bookingData;
        currentBookingState.step = 'confirming';
        
        // Zeige Bestätigungsnachricht
        addMessageToHistory(data.answer, 'ai', true);
        
        // Führe Buchung nach kurzer Verzögerung aus
        setTimeout(async () => {
            console.log("🚀 Führe Buchung aus...");
            try {
                await executeBooking();
            } catch (error) {
                console.error('❌ Buchungsfehler:', error);
                showBookingError(`Buchung fehlgeschlagen: ${error.message}`);
            }
        }, 2000);
    };

    // ===================================================================
    // KORRIGIERTE BOOKING-AUSFÜHRUNG
    // ===================================================================

const executeBooking = async () => {
    console.log('🔍 executeBooking gestartet mit korrigierter Logik');
    console.log('📋 Aktueller State:', currentBookingState);

    // Validiere Booking-Daten
    if (!currentBookingState.bookingData?.name || !currentBookingState.bookingData?.phone) {
        throw new Error('Unvollständige Buchungsdaten. Name oder Telefonnummer fehlen.');
    }

    try {
        // Bestimme Termin-Zeit
        let appointmentSlot;
        if (currentBookingState.selectedSlot && currentBookingState.suggestions?.length > 0) {
            const selectedSuggestion = currentBookingState.suggestions.find(s => s.slot === currentBookingState.selectedSlot);
            if (selectedSuggestion) {
                appointmentSlot = selectedSuggestion.formattedString || selectedSuggestion.fullDateTime;
                console.log('✅ Verwende ausgewählten Termin:', appointmentSlot);
            } else {
                console.warn('⚠️ Ausgewählter Termin nicht in Suggestions gefunden, verwende Fallback');
                appointmentSlot = generateFallbackSlot();
            }
        } else {
            console.warn('⚠️ Kein Termin ausgewählt, verwende Fallback');
            appointmentSlot = generateFallbackSlot();
        }

        const bookingPayload = {
            slot: appointmentSlot,
            // KORREKTUR 1: Telefonnummer zum Namen hinzufügen für Sichtbarkeit
            name: `${currentBookingState.bookingData.name} (Tel: ${currentBookingState.bookingData.phone})`,
            // KORREKTUR 2: Statische, gültige E-Mail verwenden, um API-Fehler zu vermeiden
            email: `rueckruf@designare.at`
        };

        console.log('📅 Finale Buchungsdaten an API:', bookingPayload);

        // API-Aufruf an create-appointment
        const response = await fetch('/api/create-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        const responseText = await response.text();
        console.log('📨 Raw API Response:', responseText);

        if (!response.ok) {
            // Versuche, JSON zu parsen, auch bei Fehlern
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.message || `HTTP ${response.status}`);
            } catch (e) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }
        }

        const result = JSON.parse(responseText);
        console.log('📨 Parsed Result:', result);

        if (result.success) {
            showBookingSuccess(result, appointmentSlot);
            resetBookingState();
        } else {
            throw new Error(result.message || 'Unbekannter API-Fehler');
        }

    } catch (error) {
        console.error('❌ Kritischer Fehler bei der Buchungsausführung:', error);
        // Wirf den Fehler weiter, damit er im aufrufenden try/catch behandelt wird
        throw error;
    }
};

    const generateFallbackSlot = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Überspringe Wochenenden
        while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
            tomorrow.setDate(tomorrow.getDate() + 1);
        }
        
        // Setze auf 9:00 Uhr
        tomorrow.setHours(9, 0, 0, 0);
        
        // Formatiere im deutschen Format für create-appointment
        const fallbackSlot = `${tomorrow.toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })} um 09:00`;
        
        console.log('🔄 Generierter Fallback-Slot:', fallbackSlot);
        return fallbackSlot;
    };

    const showBookingSuccess = (result, appointmentSlot) => {
        const successMessage = `
            <div style="
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 25px;
                border-radius: 12px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                text-align: center;
            ">
                <div style="font-size: 3rem; margin-bottom: 15px;">🎉</div>
                <h3 style="margin: 0 0 20px 0; font-size: 1.5rem;">
                    Perfekt! Dein Termin ist gebucht!
                </h3>
                <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="text-align: left;">
                        <strong>📋 Termin-Details:</strong><br>
                        <strong>Name:</strong> ${currentBookingState.bookingData.name}<br>
                        <strong>Telefon:</strong> ${currentBookingState.bookingData.phone}<br>
                        <strong>Termin:</strong> ${appointmentSlot}
                    </div>
                </div>
                <p style="margin: 15px 0 0 0; font-size: 0.9rem; opacity: 0.9;">
                    📞 Michael ruft dich etwa 15 Minuten vor dem Termin an.<br>
                    Bei Fragen: <a href="mailto:michael@designare.at" style="color: #ffc107;">michael@designare.at</a>
                </p>
            </div>
        `;
        
        addMessageToHistory(successMessage, 'ai', true);
    };

    const showBookingError = (errorMessage) => {
        const errorHtml = `
            <div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px; margin: 10px 0;">
                <strong>❌ Fehler bei der Terminbuchung</strong><br><br>
                <strong>Details:</strong> ${errorMessage}<br><br>
                Bitte versuche es erneut oder kontaktiere Michael direkt:<br>
                📧 <a href="mailto:michael@designare.at" style="color: #ffc107;">michael@designare.at</a>
            </div>
        `;
        
        addMessageToHistory(errorHtml, 'ai', true);
    };

    const resetBookingState = () => {
        currentBookingState = {
            suggestions: [],
            selectedSlot: null,
            bookingData: null,
            step: 'initial'
        };
        window.currentBookingState = currentBookingState;
        console.log('🔄 Booking-State zurückgesetzt');
    };

    // ===================================================================
    // EVENT-HANDLER FÜR TERMIN-BUTTONS
    // ===================================================================
    const handleTerminButtonClick = (event) => {
        if (event.target.classList.contains('termin-button')) {
            const slotNumber = parseInt(event.target.dataset.slot);
            const datetime = event.target.dataset.datetime;
            const formatted = event.target.dataset.formatted;
            
            console.log(`✅ Termin ${slotNumber} ausgewählt:`, formatted || datetime);
            
            currentBookingState.selectedSlot = slotNumber;
            
            // Visuelles Feedback
            document.querySelectorAll('.termin-button').forEach(btn => {
                btn.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
                btn.style.color = '#fff';
            });
            
            event.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            event.target.style.color = '#fff';
            
            // Sende Termin-Auswahl als Chat-Nachricht
            addMessageToHistory(`Termin ${slotNumber}`, 'user');
            
            // API-Aufruf für Kontaktdaten-Sammlung
            setTimeout(() => {
                sendToEvita(`Termin ${slotNumber}`, true);
            }, 500);
        }
    };

    // ===================================================================
    // KORRIGIERTE API-KOMMUNIKATION
    // ===================================================================
    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende an Evita:`, userInput, isFromChat ? '(Chat)' : '(Form)');
        
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
            console.log(`📨 Evita Response:`, data);

            // Verarbeite verschiedene Antwort-Typen
            if (data.action === 'smart_booking') {
                console.log("🎯 Smart Booking erkannt!");
                
                if (!isFromChat) {
                    // Erste Anfrage: Zeige Modal mit interaktiven Buttons
                    const enhancedMessage = createInteractiveTerminMessage(data.answer, data.suggestions);
                    initializeChat(enhancedMessage, true);
                    showModal();
                    
                    currentBookingState.suggestions = data.suggestions || [];
                    currentBookingState.step = 'slot_selection';
                }
                // Bei Chat-Aufrufen: nichts anzeigen (Button-Handler übernimmt)
                
            } else if (data.action === 'collect_booking_data') {
                console.log("📝 Kontaktdaten-Sammlung");
                handleBookingDataCollection(data);
                
            } else if (data.action === 'confirm_booking') {
                console.log("✅ Booking-Bestätigung");
                await handleBookingConfirmation(data);
                
            } else {
                // Normale Chat-Antworten
                if (data.answer) {
                    if (isFromChat) {
                        addMessageToHistory(data.answer, 'ai');
                    } else {
                        initializeChat(data.answer);
                        showModal();
                    }
                } else {
                    const fallbackMessage = "Entschuldigung, ich konnte keine Antwort generieren.";
                    if (isFromChat) {
                        addMessageToHistory(fallbackMessage, 'ai');
                    } else {
                        initializeChat(fallbackMessage);
                        showModal();
                    }
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
    // KORRIGIERTE EVENT-HANDLER
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
        event.stopImmediatePropagation();

        const chatInput = document.getElementById('ai-chat-input');
        if (!chatInput) {
            console.warn("⚠️ Chat-Input nicht gefunden");
            return;
        }

        const userInput = chatInput.value.trim();
        console.log("💬 Chat-Eingabe:", `"${userInput}"`);

        if (!userInput) {
            console.warn("⚠️ Leere Chat-Eingabe");
            return;
        }

        // User-Nachricht hinzufügen
        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        // An Evita senden
        await sendToEvita(userInput, true);
    };

    // ===================================================================
    // EVENT-LISTENER SETUP
    // ===================================================================
    
    // Hauptformular
    aiForm.addEventListener('submit', handleFormSubmit);
    console.log("✅ AI-Form Submit-Listener registriert");

    // Chat-Form (mit verbesserter Event-Delegation)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            console.log("💬 Chat-Form Submit erkannt");
            handleChatSubmit(e);
        }
    });
    console.log("✅ Chat-Submit-Listener registriert");

    // Termin-Button Clicks (Event-Delegation)
    document.addEventListener('click', handleTerminButtonClick);
    console.log("✅ Termin-Button-Listener registriert");

    // Modal Close-Buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideModal();
            resetBookingState();
        });
    });
    console.log("✅ Close-Button-Listener registriert");

    // ===================================================================
    // DEBUG-FUNKTIONEN (nur in Development)
    // ===================================================================
    if (window.location.hostname.includes('localhost') || window.location.search.includes('debug=true')) {
        window.debugBookingState = () => {
            console.log('📋 Current Booking State:', currentBookingState);
            return currentBookingState;
        };
        
        window.testSmartBooking = () => sendToEvita('Ich brauche einen Termin', false);
        
        window.forceExecuteBooking = () => {
            // Für Debug: Setze Test-Daten und führe Buchung aus
            currentBookingState.bookingData = { name: 'Test User', phone: '0123456789' };
            currentBookingState.selectedSlot = 1;
            return executeBooking();
        };
        
        console.log("🔧 Debug-Funktionen aktiviert:");
        console.log("   - window.debugBookingState()");
        console.log("   - window.testSmartBooking()");
        console.log("   - window.forceExecuteBooking()");
    }

    console.log("✅ AI-Form mit korrigiertem Buchungssystem vollständig initialisiert");
};
