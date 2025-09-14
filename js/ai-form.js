// js/ai-form.js - VOLLSTÄNDIGE KORRIGIERTE VERSION

export const initAiForm = () => {
    console.log("🚀 Initialisiere korrigierte AI-Form mit funktionierendem Booking-System");

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

    // Globale Variable für ausgewählten Rückruf-Slot
    let selectedCallbackData = null;

    // ===================================================================
    // VERBESSERTE API-KOMMUNIKATION
    // ===================================================================

    const safeFetchAPI = async (url, options = {}) => {
        try {
            console.log(`🌐 API-Anfrage an: ${url}`);
            console.log(`📦 Request Data:`, options.body);
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorText = await response.text();
                    console.error(`❌ Error Response:`, errorText);
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch (jsonError) {
                        if (errorText && errorText.length < 200) {
                            errorMessage = errorText;
                        }
                    }
                } catch (textError) {
                    console.error(`❌ Fehler beim Lesen der Error-Response:`, textError);
                }
                
                throw new Error(errorMessage);
            }
            
            const responseText = await response.text();
            console.log(`📝 Raw Response (first 200 chars):`, responseText.substring(0, 200));
            
            if (!responseText || responseText.trim().length === 0) {
                throw new Error('Leere Antwort vom Server erhalten');
            }
            
            try {
                const jsonData = JSON.parse(responseText);
                console.log(`✅ JSON erfolgreich geparst`);
                return jsonData;
            } catch (parseError) {
                console.error(`❌ JSON Parse Error:`, parseError);
                
                if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
                    throw new Error('Server-Fehler: HTML-Seite statt JSON erhalten');
                } else if (responseText.includes('Internal Server Error')) {
                    throw new Error('Interner Server-Fehler');
                } else if (responseText.includes('502') || responseText.includes('503')) {
                    throw new Error('Server temporär nicht verfügbar');
                } else {
                    throw new Error(`Ungültige Server-Antwort: ${parseError.message}`);
                }
            }
            
        } catch (fetchError) {
            console.error(`❌ Fetch Error:`, fetchError);
            
            if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
                throw new Error('Netzwerkfehler - bitte überprüfe deine Internetverbindung');
            }
            
            if (fetchError.name === 'AbortError') {
                throw new Error('Anfrage-Timeout - Server antwortet nicht');
            }
            
            throw fetchError;
        }
    };

    // ===================================================================
    // KORRIGIERTE EVITA-KOMMUNIKATION MIT LOKALER BOOKING-ERKENNUNG
    // ===================================================================
    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende an Evita: "${userInput}" (fromChat: ${isFromChat})`);
        
        // LOKALE BOOKING-KEYWORD-ERKENNUNG
        const bookingKeywords = [
            'termin', 'rückruf', 'buchung', 'buchen', 
            'anrufen', 'telefonieren', 'kalender', 'zeit',
            'verfügbar', 'wann', 'sprechen', 'gespräch',
            'callback', 'appointment', 'ruf', 'michael',
            'kontakt', 'erreichen', 'melden', 'telefon'
        ];
        
        const lowerInput = userInput.toLowerCase();
        const isLocalBookingRequest = bookingKeywords.some(keyword => lowerInput.includes(keyword));
        
        console.log(`🔍 Booking-Keywords gefunden: ${isLocalBookingRequest}`);
        
        // NEUER VERBESSERTER BOOKING-FLOW
        if (isLocalBookingRequest) {
            console.log("🎯 Booking-Keywords LOKAL erkannt → Starte natürlichen Flow");
            
            // SCHRITT 1: Zeige natürliche Antwort
            const naturalResponse = "Einen Moment, ich schaue in Michaels Kalender und suche die besten verfügbaren Termine für dich...";
            
            if (!isFromChat) {
                initializeChat(naturalResponse);
                showChatModal();
            } else {
                addMessageToHistory(naturalResponse, 'ai');
            }
            
            // SCHRITT 2: Zeige Typing-Indikator für Realismus
            let typingIndicatorId = null;
            if (isFromChat) {
                typingIndicatorId = showTypingIndicator(); // KORREKT: Funktion wird hier aufgerufen
            }
            
            // SCHRITT 3: Warte 2-3 Sekunden für natürlichen Flow
            setTimeout(() => {
                // Entferne Typing-Indikator
                if (typingIndicatorId) {
                    removeTypingIndicator(typingIndicatorId); // KORREKT: Funktion wird hier aufgerufen
                }
                
                // Zweite Nachricht mit Kalenderergebnis
                const calendarResponse = "Perfekt! Ich habe verfügbare Termine gefunden. Öffne jetzt die Terminbuchung für dich.";
                
                if (isFromChat) {
                    addMessageToHistory(calendarResponse, 'ai');
                }
                
                // SCHRITT 4: Öffne Booking-Modal nach weiterer kurzer Pause
                setTimeout(() => {
                    console.log("⏰ Starte Rückruf-Modal nach natürlicher Verzögerung");
                    launchBookingModal();
                }, 1500); // 1.5 Sekunden nach der zweiten Nachricht
                
            }, 2500); // 2.5 Sekunden für "Kalender-Suche"
            
            return; // Beende hier ohne API-Call
        }
        
        // REST DER FUNKTION BLEIBT GLEICH...
        // Normale API-Anfrage für andere Fragen
        try {
            const data = await safeFetchAPI('/api/ask-gemini', {
                method: 'POST',
                body: JSON.stringify({ prompt: userInput }),
            });

            console.log(`📨 Evita Response:`, data);

            if (data.action === 'launch_booking_modal') {
                console.log("🎯 Rückruf-Anfrage von API erkannt → Starte natürlichen Flow");
                
                const message = data.answer || "Einen Moment, ich schaue in Michaels Kalender...";
                
                if (!isFromChat) {
                    initializeChat(message);
                    showChatModal();
                } else {
                    addMessageToHistory(message, 'ai');
                }
                
                let typingId = null;
                if (isFromChat) {
                    typingId = showTypingIndicator();
                }
                
                setTimeout(() => {
                    if (typingId) removeTypingIndicator(typingId);
                    
                    const followUpMessage = "Ich habe verfügbare Termine gefunden! Öffne die Buchung für dich.";
                    if (isFromChat) {
                        addMessageToHistory(followUpMessage, 'ai');
                    }
                    
                    setTimeout(() => {
                        launchBookingModal();
                    }, 1200);
                }, 2000);
                
            } else {
                const message = data.answer || "Ich konnte keine Antwort finden.";
                
                if (!isFromChat) {
                    initializeChat(message);
                    showChatModal();
                } else {
                    addMessageToHistory(message, 'ai');
                }
            }
            
        } catch (error) {
            console.error(`❌ Evita-Fehler:`, error);
            
            let errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten.";
            
            if (error.message.includes('Netzwerkfehler')) {
                errorMessage = "🌐 Verbindungsproblem erkannt. Bitte überprüfe deine Internetverbindung und versuche es erneut.";
            } else if (error.message.includes('Server-Fehler') || error.message.includes('HTML-Seite')) {
                errorMessage = "🔧 Server-Problem erkannt. Bitte versuche es in ein paar Minuten noch einmal.";
            } else if (error.message.includes('Timeout')) {
                errorMessage = "⏱️ Der Server antwortet nicht. Bitte versuche es später noch einmal.";
            } else if (error.message.includes('502') || error.message.includes('503')) {
                errorMessage = "🚧 Server wird gerade gewartet. Bitte versuche es in ein paar Minuten erneut.";
            }
            
            errorMessage += "\n\nFür dringende Anfragen: michael@designare.at";
            
            if (isFromChat) {
                addMessageToHistory(errorMessage, 'ai');
            } else {
                initializeChat(errorMessage);
                showChatModal();
            }
        }
    }; // HIER ENDET die sendToEvita Funktion

    // ===================================================================
    // KORRIGIERTES BOOKING-MODAL
    // ===================================================================

    const launchBookingModal = async () => {
        console.log("🚀 Starte korrigiertes Rückruf-Modal");
        
        try {
            hideChatModal();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const existingModal = document.getElementById('booking-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            const modalHTML = createInlineModalHTML();
            const modalContainer = document.getElementById('modal-container') || document.body;
            modalContainer.insertAdjacentHTML('beforeend', modalHTML);
            
            const callbackModal = document.getElementById('booking-modal');
            if (callbackModal) {
                callbackModal.style.cssText = `
                    position: fixed !important; top: 0 !important; left: 0 !important;
                    width: 100% !important; height: 100% !important;
                    background: rgba(0, 0, 0, 0.85) !important;
                    display: flex !important; align-items: center !important; justify-content: center !important;
                    z-index: 999999 !important; opacity: 1 !important; visibility: visible !important;
                `;
                
                document.body.style.overflow = 'hidden';
                document.body.classList.add('no-scroll');
                
                setupBookingModalEventListeners();
                
                setTimeout(() => {
                    loadCallbackSlots();
                }, 500);
                
                console.log("✅ Korrigiertes Rückruf-Modal erfolgreich gestartet");
                return true;
            } else {
                throw new Error("Modal konnte nicht im DOM erstellt werden");
            }
            
        } catch (error) {
            console.error("❌ Rückruf-Modal fehlgeschlagen:", error);
            createEmergencyFallbackModal();
            return false;
        }
    };

    // ===================================================================
    // INLINE-HTML FUNKTION
    // ===================================================================

    const createInlineModalHTML = () => {
        return `
            <div id="booking-modal" class="callback-modal">
                <div class="booking-modal-content">
                    <div class="booking-modal-header">
                        <h2 class="booking-modal-title">Rückruf-Termin buchen</h2>
                        <p class="booking-modal-subtitle">Michael ruft dich zum gewünschten Zeitpunkt an</p>
                    </div>
                    
                    <div class="booking-modal-body">
                        <div id="step-slot-selection" class="booking-step active">
                            <h3 class="booking-step-title">Wähle deinen Rückruf-Termin:</h3>
                            <div id="callback-loading"><div>Lade verfügbare Rückruf-Termine...</div></div>
                            <div id="callback-slots-container"></div>
                            <div id="no-slots-message"></div>
                        </div>
                        
                        <div id="step-contact-details" class="booking-step">
                            <h3 class="booking-step-title">Deine Kontaktdaten:</h3>
                            <div id="selected-slot-display">Ausgewählter Rückruf-Termin wird hier angezeigt</div>
                            <form id="callback-form">
                                <div class="booking-form-group">
                                    <label for="callback-name">Dein Name *</label>
                                    <input type="text" id="callback-name" required>
                                </div>
                                <div class="booking-form-group">
                                    <label for="callback-phone">Deine Telefonnummer *</label>
                                    <input type="tel" id="callback-phone" required placeholder="z.B. 0664 123 45 67">
                                </div>
                                <div class="booking-form-group">
                                    <label for="callback-topic">Dein Anliegen (optional)</label>
                                    <textarea id="callback-topic" rows="3" placeholder="Kurze Beschreibung deines Anliegens..."></textarea>
                                </div>
                                <div class="booking-form-actions">
                                    <button type="button" id="back-to-slots" class="booking-btn back-btn">← Zurück</button>
                                    <button type="submit" id="submit-callback" class="booking-btn submit-btn">Rückruf buchen</button>
                                </div>
                            </form>
                        </div>
                        
                        <div id="step-confirmation" class="booking-step">
                            <div class="confirmation-content">
                                <h3 class="confirmation-title">Rückruf-Termin erfolgreich gebucht!</h3>
                                <div id="confirmation-details"></div>
                                <p class="confirmation-subtext"><strong>Michael wird dich zum vereinbarten Zeitpunkt anrufen.</strong><br>
                                    Halte bitte dein Telefon 5 Minuten vor dem Termin bereit.
                                </p>
                                <button onclick="closeCallbackModal()" class="booking-btn confirm-close-btn">Perfekt! 👍</button>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="closeCallbackModal()" class="booking-modal-close-btn" aria-label="Schließen">×</button>
                </div>
            </div>
        `;
    };

    // ===================================================================
    // EMERGENCY FALLBACK MODAL
    // ===================================================================

    const createEmergencyFallbackModal = () => {
        console.log("🆘 Erstelle Emergency-Fallback-Modal...");
        
        const emergencyModal = document.createElement('div');
        emergencyModal.id = 'booking-modal';
        emergencyModal.innerHTML = `
            <div class="booking-modal-content fallback-modal-content">
                <div class="fallback-modal-header"><div class="fallback-icon">⚠️</div><h2 class="fallback-title">Technisches Problem</h2></div>
                <div class="fallback-modal-body">
                    <p>Das automatische Buchungssystem ist momentan nicht verfügbar.<br><strong>Kontaktiere Michael direkt für deinen Rückruf-Termin:</strong></p>
                    <div>
                        <a href="mailto:michael@designare.at?subject=Rückruf-Termin Anfrage&body=Hallo Michael,%0D%0A%0D%0AIch möchte gerne einen Rückruf-Termin vereinbaren.%0D%0A%0D%0AMeine Telefonnummer: %0D%0AMein Anliegen: %0D%0A%0D%0AVielen Dank!" class="fallback-email-link">
                            📧 E-Mail für Rückruf-Termin senden
                        </a>
                    </div>
                    <button onclick="closeCallbackModal()" class="booking-btn fallback-close-btn">Schließen</button>
                </div>
            </div>
        `;
        document.body.appendChild(emergencyModal);
        document.body.style.overflow = 'hidden';
        console.log("✅ Emergency-Fallback-Modal erstellt");
        return emergencyModal;
    };

    // ===================================================================
    // EVENT LISTENERS FÜR BOOKING MODAL
    // ===================================================================

    const setupBookingModalEventListeners = () => {
        console.log("🔧 Setze Booking-Modal Event Listeners auf...");
        const callbackForm = document.getElementById('callback-form');
        if (callbackForm) {
            callbackForm.addEventListener('submit', submitCallback);
        }
        const backButton = document.getElementById('back-to-slots');
        if (backButton) {
            backButton.addEventListener('click', () => {
                showCallbackStep('step-slot-selection');
                selectedCallbackData = null;
                document.querySelectorAll('.callback-slot-button').forEach(btn => {
                    btn.style.opacity = '1';
                    btn.style.borderColor = '#e9ecef';
                    btn.style.backgroundColor = 'white';
                    btn.disabled = false;
                    btn.classList.remove('selected');
                });
            });
        }
    };

    // ===================================================================
    // RÜCKRUF-SLOT-LOADING
    // ===================================================================

    const loadCallbackSlots = async () => {
        console.log("📞 Lade Rückruf-Slots...");
        const loadingDiv = document.getElementById('callback-loading');
        const slotsContainer = document.getElementById('callback-slots-container');
        const noSlotsMessage = document.getElementById('no-slots-message');
        try {
            const data = await safeFetchAPI('/api/suggest-appointments');
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (data.success && data.suggestions && data.suggestions.length > 0) {
                console.log("✅ Rückruf-Slots erfolgreich geladen:", data.suggestions.length);
                if (slotsContainer) {
                    slotsContainer.innerHTML = '';
                    data.suggestions.forEach(suggestion => {
                        const slotButton = document.createElement('button');
                        slotButton.className = 'callback-slot-button';
                        slotButton.dataset.slot = suggestion.slot;
                        slotButton.dataset.datetime = suggestion.fullDateTime;
                        slotButton.dataset.formatted = suggestion.formattedString;
                        const icon = suggestion.isPreferredTime ? '⭐' : '📞';
                        slotButton.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 1.2rem;">${icon}</span>
                                <div style="flex: 1; text-align: left;">
                                    <div style="font-weight: bold; color: #1a1a1a; margin-bottom: 4px;">Rückruf-Termin ${suggestion.slot}</div>
                                    <div style="color: #666; font-size: 0.9rem;">${suggestion.formattedString}</div>
                                </div>
                                <span style="color: #ffc107; font-size: 1.1rem;">→</span>
                            </div>`;
                        slotButton.style.cssText = `width: 100%; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s ease; text-align: left; margin-bottom: 10px;`;
                        slotButton.addEventListener('mouseenter', () => { slotButton.style.borderColor = '#ffc107'; slotButton.style.backgroundColor = '#fff9e6'; slotButton.style.transform = 'translateY(-1px)'; });
                        slotButton.addEventListener('mouseleave', () => { if (!slotButton.classList.contains('selected')) { slotButton.style.borderColor = '#e9ecef'; slotButton.style.backgroundColor = 'white'; slotButton.style.transform = 'translateY(0)'; } });
                        slotButton.addEventListener('click', () => selectCallbackSlot(suggestion));
                        slotsContainer.appendChild(slotButton);
                    });
                }
            } else {
                console.warn("⚠️ Keine Rückruf-Slots verfügbar");
                if (noSlotsMessage) {
                    noSlotsMessage.style.display = 'block';
                    noSlotsMessage.innerHTML = `<div style="font-size: 2rem; margin-bottom: 10px;">😔</div><p>Aktuell sind keine Rückruf-Termine verfügbar.</p><p style="font-size: 0.9rem;">Kontaktiere Michael direkt für einen Termin:</p><a href="mailto:michael@designare.at?subject=Rückruf-Anfrage&body=Hallo Michael,%0D%0A%0D%0AIch hätte gerne einen Rückruf-Termin.%0D%0A%0D%0AMeine Telefonnummer: %0D%0AMein Anliegen: %0D%0A%0D%0AVielen Dank!" style="color: #ffc107; text-decoration: none; font-weight: bold;">📧 michael@designare.at</a>`;
                }
            }
        } catch (error) {
            console.error("❌ Fehler beim Laden der Rückruf-Slots:", error);
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (noSlotsMessage) {
                noSlotsMessage.style.display = 'block';
                let errorMsg = "Fehler beim Laden der Termine.";
                if (error.message.includes('Netzwerkfehler')) errorMsg = "Verbindungsproblem beim Laden der Termine.";
                else if (error.message.includes('Server-Fehler')) errorMsg = "Server-Problem beim Laden der Termine.";
                noSlotsMessage.innerHTML = `<div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div><p>${errorMsg}</p><p style="font-size: 0.9rem;">Kontaktiere Michael direkt für einen Termin:</p><a href="mailto:michael@designare.at?subject=Rückruf-Anfrage (Fehler beim Laden)&body=Hallo Michael,%0D%0A%0D%0ADas automatische Buchungssystem hatte einen Fehler. Ich hätte gerne einen Rückruf-Termin.%0D%0A%0D%0AMeine Telefonnummer: %0D%0AMein Anliegen: %0D%0A%0D%0AVielen Dank!" style="color: #ffc107; text-decoration: none; font-weight: bold;">📧 michael@designare.at</a>`;
            }
        }
    };

    // ===================================================================
    // SLOT AUSWÄHLEN
    // ===================================================================

    const selectCallbackSlot = (suggestion) => {
        console.log("📞 Rückruf-Slot ausgewählt:", suggestion);
        selectedCallbackData = suggestion;
        document.querySelectorAll('.callback-slot-button').forEach(btn => {
            btn.style.opacity = '0.6';
            btn.style.borderColor = '#e9ecef';
            btn.style.backgroundColor = '#f8f9fa';
            btn.disabled = true;
            btn.classList.remove('selected');
        });
        const selectedButton = document.querySelector(`[data-slot="${suggestion.slot}"]`);
        if (selectedButton) {
            selectedButton.style.opacity = '1';
            selectedButton.style.borderColor = '#28a745';
            selectedButton.style.backgroundColor = '#e8f5e8';
            selectedButton.classList.add('selected');
        }
        const selectedDisplay = document.getElementById('selected-slot-display');
        if (selectedDisplay) {
            selectedDisplay.innerHTML = `<strong>📞 Ausgewählter Rückruf-Termin:</strong><br><span style="color: #28a745; font-weight: bold;">${suggestion.formattedString}</span>`;
        }
        setTimeout(() => {
            showCallbackStep('step-contact-details');
        }, 800);
    };

    // ===================================================================
    // RÜCKRUF-BUCHUNG
    // ===================================================================

    const submitCallback = async (event) => {
        event.preventDefault();
        console.log("📞 Rückruf-Buchung gestartet");
        const nameInput = document.getElementById('callback-name');
        const phoneInput = document.getElementById('callback-phone');
        const topicInput = document.getElementById('callback-topic');
        const submitButton = document.getElementById('submit-callback');
        if (!nameInput || !phoneInput || !selectedCallbackData) { showCallbackError('Bitte fülle alle Pflichtfelder aus'); return; }
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const topic = topicInput ? topicInput.value.trim() : '';
        if (!name || !phone) { showCallbackError('Name und Telefonnummer sind erforderlich'); return; }
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(phone)) { showCallbackError('Bitte gib eine gültige Telefonnummer ein'); return; }
        if (submitButton) { submitButton.disabled = true; submitButton.textContent = '📞 Wird gebucht...'; }
        try {
            const data = await safeFetchAPI('/api/book-appointment-phone', {
                method: 'POST',
                body: JSON.stringify({ slot: selectedCallbackData.fullDateTime, name: name, phone: phone, topic: topic })
            });
            console.log("📊 Rückruf-Buchung Response:", data);
            if (data.success) {
                console.log("✅ Rückruf erfolgreich gebucht");
                const confirmationDetails = document.getElementById('confirmation-details');
                if (confirmationDetails) {
                    confirmationDetails.innerHTML = `
                        <div style="margin-bottom: 12px;"><strong>📞 Rückruf-Termin:</strong><br><span style="color: #28a745;">${selectedCallbackData.formattedString}</span></div>
                        <div style="margin-bottom: 12px;"><strong>👤 Name:</strong> ${name}</div>
                        <div style="margin-bottom: 12px;"><strong>📱 Telefonnummer:</strong> ${phone}</div>
                        ${topic ? `<div style="margin-bottom: 12px;"><strong>💬 Anliegen:</strong> ${topic}</div>` : ''}
                        <div style="background: #e7f3ff; padding: 10px; border-radius: 5px; margin-top: 15px; font-size: 0.9rem;">📋 <strong>Termin wurde erfolgreich in Michaels Kalender eingetragen</strong></div>`;
                }
                showCallbackStep('step-confirmation');
            } else {
                throw new Error(data.message || 'Unbekannter Fehler bei der Rückruf-Buchung');
            }
        } catch (error) {
            console.error("❌ Rückruf-Buchung fehlgeschlagen:", error);
            let userMessage = error.message;
            if (error.message.includes('HTTP 409') || error.message.includes('conflict') || error.message.includes('bereits vergeben')) userMessage = 'Dieser Rückruf-Termin ist leider bereits vergeben. Bitte wähle einen anderen Zeitslot.';
            else if (error.message.includes('HTTP 500') || error.message.includes('Server-Fehler')) userMessage = 'Server-Problem. Bitte versuche es später noch einmal oder kontaktiere Michael direkt.';
            else if (error.message.includes('Netzwerkfehler')) userMessage = 'Verbindungsproblem. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
            showCallbackError(userMessage);
        } finally {
            if (submitButton) { submitButton.disabled = false; submitButton.textContent = '📞 Rückruf buchen'; }
        }
    };

    // ===================================================================
    // HILFSFUNKTIONEN
    // ===================================================================
    
    // ⬇️ VERSCHOBEN: Diese Funktionen sind jetzt hier im Haupt-Scope von initAiForm
    
    /**
     * Zeigt einen "Tipp-Indikator" im Chat an, um eine Antwort zu simulieren.
     * @returns {string} Die ID des erstellten Indikator-Elements.
     */
    const showTypingIndicator = () => {
        const chatHistory = document.getElementById('ai-chat-history');
        if (!chatHistory) return null;

        const typingDiv = document.createElement('div');
        const typingId = 'typing-' + Date.now();
        typingDiv.id = typingId;
        typingDiv.className = 'chat-message ai typing';
        typingDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span>Evita schaut in den Kalender...</span>
            </div>
        `;
        
        chatHistory.appendChild(typingDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        return typingId;
    };

    /**
     * Entfernt einen "Tipp-Indikator" aus dem Chat.
     * @param {string} typingId - Die ID des zu entfernenden Indikators.
     */
    const removeTypingIndicator = (typingId) => {
        if (typingId) {
            const typingDiv = document.getElementById(typingId);
            if (typingDiv) {
                typingDiv.remove();
            }
        }
    };

    const showCallbackStep = (stepId) => {
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.add('active');
            console.log("✅ Wechsel zu Callback-Schritt:", stepId);
        }
    };

    const showCallbackError = (message) => {
        console.error("❌ Callback-Fehler:", message);
        let errorElement = document.getElementById('callback-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'callback-error-message';
            errorElement.style.cssText = `background: #ff4757; color: white; padding: 12px; border-radius: 6px; margin: 15px 0; display: none; font-size: 0.9rem; line-height: 1.4;`;
            const form = document.getElementById('callback-form');
            if (form) {
                form.parentNode.insertBefore(errorElement, form);
            }
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 8000);
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const showChatModal = () => {
        if (modalOverlay) {
            modalOverlay.classList.add('visible');
            document.body.classList.add('no-scroll');
            console.log("✅ Chat-Modal geöffnet");
        }
    };

    const hideChatModal = () => {
        if (modalOverlay) {
            modalOverlay.classList.remove('visible');
            document.body.classList.remove('no-scroll');
            console.log("✅ Chat-Modal geschlossen");
        }
    };

    const addMessageToHistory = (message, sender) => {
        if (!responseArea) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = message;
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
        console.log(`📝 Nachricht hinzugefügt (${sender})`);
    };

    const initializeChat = (initialMessage) => {
        if (!responseArea) return;
        responseArea.innerHTML = '';
        const existingChatForm = document.getElementById('ai-chat-form');
        if (!existingChatForm) {
            const chatForm = document.createElement('form');
            chatForm.id = 'ai-chat-form';
            chatForm.style.cssText = 'margin-top: 20px; display: flex; gap: 10px;';
            const chatInput = document.createElement('input');
            chatInput.type = 'text';
            chatInput.id = 'ai-chat-input';
            chatInput.placeholder = 'Deine Antwort...';
            chatInput.style.cssText = 'flex: 1; padding: 10px; border-radius: 5px; border: 1px solid #ccc; background: rgba(255,255,255,0.1); color: #fff;';
            const chatButton = document.createElement('button');
            chatButton.type = 'submit';
            chatButton.textContent = 'Senden';
            chatButton.style.cssText = 'padding: 10px 15px; background: #ffc107; border: none; border-radius: 5px; cursor: pointer; color: #1a1a1a; font-weight: bold;';
            chatForm.appendChild(chatInput);
            chatForm.appendChild(chatButton);
            const contentArea = document.getElementById('ai-response-content-area');
            if (contentArea) contentArea.appendChild(chatForm);
            console.log("✅ Chat-Form erstellt");
        }
        addMessageToHistory(initialMessage, 'ai');
    };

    // ===================================================================
    // EVENT-LISTENER SETUP
    // ===================================================================

    aiForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const question = aiQuestion.value.trim();
        if (!question) return;
        console.log("📝 Haupt-Form submitted:", question);
        aiStatus.style.display = 'block';
        aiStatus.textContent = 'Evita denkt nach...';
        aiForm.querySelector('button').disabled = true;
        try {
            await sendToEvita(question, false);
        } finally {
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
            aiForm.querySelector('button').disabled = false;
        }
    });

    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            e.preventDefault();
            const chatInput = document.getElementById('ai-chat-input');
            if (!chatInput) return;
            const userInput = chatInput.value.trim();
            if (!userInput) return;
            console.log("💬 Chat-Form submitted:", userInput);
            addMessageToHistory(userInput, 'user');
            chatInput.value = '';
            sendToEvita(userInput, true);
        }
        if (e.target.id === 'callback-form') {
            submitCallback(e);
        }
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', hideChatModal);
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'back-to-slots') {
            showCallbackStep('step-slot-selection');
            selectedCallbackData = null;
            document.querySelectorAll('.callback-slot-button').forEach(btn => {
                btn.style.opacity = '1';
                btn.style.borderColor = '#e9ecef';
                btn.style.backgroundColor = 'white';
                btn.disabled = false;
                btn.classList.remove('selected');
            });
        }
    });
    
    const observeChatForm = new MutationObserver(() => {
        const chatForm = document.getElementById('ai-chat-form');
        const chatInput = document.getElementById('ai-chat-input');
        if (chatForm && chatInput && !chatForm.hasAttribute('data-listener-attached')) {
            console.log("💬 Chat-Form gefunden, füge Event-Listener hinzu");
            chatForm.setAttribute('data-listener-attached', 'true');
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userInput = chatInput.value.trim();
                if (!userInput) return;
                console.log("💬 Chat-Submit (Observer) mit Eingabe:", userInput);
                addMessageToHistory(userInput, 'user');
                chatInput.value = '';
                await sendToEvita(userInput, true);
            });
            console.log("✅ Chat-Form Event-Listener via Observer hinzugefügt");
        }
    });
    
    const modalContainer = document.getElementById('ai-response-content-area');
    if (modalContainer) {
        observeChatForm.observe(modalContainer, { childList: true, subtree: true });
    }

    // ===================================================================
    // GLOBALE FUNKTIONEN FÜR EXTERNE NUTZUNG
    // ===================================================================

    window.launchBookingFromAnywhere = launchBookingModal;
    window.debugBookingLaunch = launchBookingModal;
    window.debugCreateFallback = createEmergencyFallbackModal;
    
    window.closeCallbackModal = () => {
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
        selectedCallbackData = null;
        console.log("✅ Rückruf-Modal geschlossen");
    };
    
    console.log("✅ Korrigierte AI-Form mit funktionierendem Booking-System vollständig initialisiert");
};
