// js/ai-form.js - KORRIGIERTE VERSION die das Booking-Modal Problem behebt

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
    // EVITA-KOMMUNIKATION
    // ===================================================================

    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende an Evita: "${userInput}"`);
        
        try {
            const data = await safeFetchAPI('/api/ask-gemini', {
                method: 'POST',
                body: JSON.stringify({ prompt: userInput }),
            });

            console.log(`📨 Evita Response:`, data);

            if (data.action === 'launch_booking_modal') {
                console.log("🎯 Rückruf-Anfrage erkannt → Starte Rückruf-Modal");
                
                const message = data.answer || "Einen Moment, ich öffne Michaels Kalender für dich...";
                
                if (!isFromChat) {
                    initializeChat(message);
                    showChatModal();
                    
                    setTimeout(() => {
                        console.log("⏰ Starte Rückruf-Modal nach Chat-Antwort");
                        launchBookingModal();
                    }, 1500);
                } else {
                    addMessageToHistory(message, 'ai');
                    
                    setTimeout(() => {
                        console.log("⏰ Starte Rückruf-Modal aus Chat");
                        launchBookingModal();
                    }, 500);
                }
                
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
    };

    // ===================================================================
    // KORRIGIERTES BOOKING-MODAL - VERWENDET INLINE-HTML STATT EXTERNES LADEN
    // ===================================================================

    const launchBookingModal = async () => {
        console.log("🚀 Starte korrigiertes Rückruf-Modal mit Inline-HTML");
        
        try {
            // Schließe Chat-Modal
            hideChatModal();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Entferne existierendes Modal
            const existingModal = document.getElementById('booking-modal');
            if (existingModal) {
                existingModal.remove();
                console.log("🗑️ Existierendes Modal entfernt");
            }
            
            // KORREKTUR: Verwende Inline-HTML statt externes Laden
            const modalHTML = createInlineModalHTML();
            
            // Füge Modal zum DOM hinzu
            const modalContainer = document.getElementById('modal-container') || document.body;
            modalContainer.insertAdjacentHTML('beforeend', modalHTML);
            
            // Stelle sicher, dass das Modal sichtbar ist
            const callbackModal = document.getElementById('booking-modal');
            if (callbackModal) {
                // Forciere Sichtbarkeit mit wichtigen Styles
                callbackModal.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0, 0, 0, 0.85) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 999999 !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                `;
                
                // Verhindere Body-Scrollen
                document.body.style.overflow = 'hidden';
                document.body.classList.add('no-scroll');
                
                // Lade verfügbare Rückruf-Termine
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
    // KORRIGIERTE INLINE-HTML FUNKTION
    // ===================================================================

    const createInlineModalHTML = () => {
        return `
            <div id="booking-modal" class="callback-modal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.85) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 999999 !important;
                opacity: 1 !important;
                visibility: visible !important;
            ">
                <div style="
                    background: white;
                    border-radius: 15px;
                    padding: 0;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90%;
                    overflow: hidden;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.3);
                    position: relative;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
                        padding: 25px;
                        text-align: center;
                        color: #1a1a1a;
                    ">
                        <div style="font-size: 2.5rem; margin-bottom: 10px;"></div>
                        <h2 style="margin: 0; font-size: 1.3rem; font-weight: bold;">
                            Rückruf-Termin buchen
                        </h2>
                        <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 0.95rem;">
                            Michael ruft dich zum gewünschten Zeitpunkt an
                        </p>
                    </div>
                    
                    <!-- Content Area -->
                    <div style="padding: 25px; max-height: 400px; overflow-y: auto;">
                        <!-- Schritt 1: Slot-Auswahl -->
                        <div id="step-slot-selection" class="callback-step" style="display: block;">
                            <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 1.15rem;">
                                Wähle deinen Rückruf-Termin:
                            </h3>
                            
                            <div id="callback-loading" style="text-align: center; display: block;">
                                <div style="color: #666; margin: 20px 0;">
                                    <div style="font-size: 1.5rem; margin-bottom: 10px;">⏳</div>
                                    Lade verfügbare Rückruf-Termine...
                                </div>
                            </div>
                            
                            <div id="callback-slots-container" style="display: flex; flex-direction: column; gap: 12px;">
                                <!-- Slots werden hier eingefügt -->
                            </div>
                            
                            <div id="no-slots-message" style="display: none; text-align: center; color: #666; margin: 20px 0;">
                                <!-- Wird von loadCallbackSlots() gefüllt -->
                            </div>
                        </div>
                        
                        <!-- Schritt 2: Kontaktdaten -->
                        <div id="step-contact-details" class="callback-step" style="display: none;">
                            <div style="margin-bottom: 20px;">
                                <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 1.15rem;">
                                    Deine Kontaktdaten:
                                </h3>
                                <div id="selected-slot-display" style="
                                    background: #fff9e6;
                                    padding: 12px;
                                    border-radius: 6px;
                                    color: #1a1a1a;
                                    font-size: 0.9rem;
                                    border-left: 4px solid #ffc107;
                                ">
                                    Ausgewählter Rückruf-Termin wird hier angezeigt
                                </div>
                            </div>
                            
                            <form id="callback-form">
                                <div style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 5px; color: #495057; font-weight: 500;">
                                        Dein Name *
                                    </label>
                                    <input type="text" id="callback-name" required 
                                           style="
                                               width: 100%;
                                               padding: 12px;
                                               border: 2px solid #e9ecef;
                                               border-radius: 6px;
                                               font-size: 1rem;
                                               box-sizing: border-box;
                                           ">
                                </div>
                                
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 5px; color: #495057; font-weight: 500;">
                                        Deine Telefonnummer *
                                    </label>
                                    <input type="tel" id="callback-phone" required 
                                           placeholder="z.B. 0664 123 45 67"
                                           style="
                                               width: 100%;
                                               padding: 12px;
                                               border: 2px solid #e9ecef;
                                               border-radius: 6px;
                                               font-size: 1rem;
                                               box-sizing: border-box;
                                           ">
                                </div>
                                
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 5px; color: #495057; font-weight: 500;">
                                        Dein Anliegen (optional)
                                    </label>
                                    <textarea id="callback-topic" rows="3" 
                                              placeholder="Kurze Beschreibung deines Anliegens..."
                                              style="
                                                  width: 100%;
                                                  padding: 12px;
                                                  border: 2px solid #e9ecef;
                                                  border-radius: 6px;
                                                  font-size: 1rem;
                                                  box-sizing: border-box;
                                                  resize: vertical;
                                              "></textarea>
                                </div>
                                
                                <div style="display: flex; gap: 10px; justify-content: space-between;">
                                    <button type="button" id="back-to-slots" style="
                                        background: #6c757d;
                                        color: white;
                                        border: none;
                                        padding: 12px 20px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 1rem;
                                    ">
                                        ← Zurück
                                    </button>
                                    
                                    <button type="submit" id="submit-callback" style="
                                        background: #28a745;
                                        color: white;
                                        border: none;
                                        padding: 12px 24px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 1rem;
                                        font-weight: bold;
                                    ">
                                         Rückruf buchen
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        <!-- Schritt 3: Bestätigung -->
                        <div id="step-confirmation" class="callback-step" style="display: none;">
                            <div style="text-align: center;">
                                <div style="font-size: 3rem; margin-bottom: 20px;"></div>
                                <h3 style="margin: 0 0 15px 0; color: #28a745; font-size: 1.3rem;">
                                    Rückruf-Termin erfolgreich gebucht!
                                </h3>
                                <div id="confirmation-details" style="
                                    background: #f8f9fa;
                                    padding: 20px;
                                    border-radius: 8px;
                                    margin: 20px 0;
                                    text-align: left;
                                    border-left: 4px solid #28a745;
                                ">
                                    <!-- Bestätigungsdetails werden hier eingefügt -->
                                </div>
                                <p style="color: #666; margin-bottom: 25px; font-size: 0.95rem;">
                                    <strong>Michael wird dich zum vereinbarten Zeitpunkt anrufen.</strong><br>
                                    Halte bitte dein Telefon 5 Minuten vor dem Termin bereit.
                                </p>
                                <button onclick="closeCallbackModal()" style="
                                    background: #ffc107;
                                    color: #1a1a1a;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 1rem;
                                    font-weight: bold;
                                ">
                                    Perfekt! 
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Close Button -->
                    <button onclick="closeCallbackModal()" style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: rgba(0,0,0,0.2);
                        border: none;
                        color: #1a1a1a;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 1.2rem;
                        font-weight: bold;
                    ">
                        ×
                    </button>
                </div>
            </div>
        `;
    };

    // ===================================================================
    // EMERGENCY FALLBACK MODAL (unverändert)
    // ===================================================================

    const createEmergencyFallbackModal = () => {
        console.log("🆘 Erstelle Emergency-Fallback-Modal...");
        
        const emergencyModal = document.createElement('div');
        emergencyModal.id = 'booking-modal';
        emergencyModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.9) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            opacity: 1 !important;
            visibility: visible !important;
        `;
        
        emergencyModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 10px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                overflow: hidden;
            ">
                <div style="
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    padding: 25px;
                    color: white;
                ">
                    <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                    <h2 style="margin: 0; font-size: 1.4rem;">Technisches Problem</h2>
                </div>
                
                <div style="padding: 30px;">
                    <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                        Das automatische Buchungssystem ist momentan nicht verfügbar.<br>
                        <strong>Kontaktiere Michael direkt für deinen Rückruf-Termin:</strong>
                    </p>
                    
                    <div style="margin-bottom: 25px;">
                        <a href="mailto:michael@designare.at?subject=Rückruf-Termin Anfrage (Technisches Problem)&body=Hallo Michael,%0D%0A%0D%0ADas automatische Buchungssystem hatte ein Problem. Ich möchte gerne einen Rückruf-Termin vereinbaren.%0D%0A%0D%0AMeine Telefonnummer: %0D%0AMein Anliegen: %0D%0AMeine Verfügbarkeit: %0D%0A%0D%0AVielen Dank!" 
                           style="
                               display: inline-block;
                               background: #ffc107;
                               color: #1a1a1a;
                               text-decoration: none;
                               padding: 15px 25px;
                               border-radius: 8px;
                               font-weight: bold;
                               margin-bottom: 15px;
                               transition: background-color 0.3s ease;
                           ">
                            📧 E-Mail für Rückruf-Termin senden
                        </a>
                    </div>
                    
                    <button onclick="closeCallbackModal()" 
                            style="
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 12px 20px;
                                border-radius: 6px;
                                cursor: pointer;
                            ">
                        Schließen
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(emergencyModal);
        document.body.style.overflow = 'hidden';
        
        console.log("✅ Emergency-Fallback-Modal erstellt");
        return emergencyModal;
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
                
                if (slotsContainer) slotsContainer.innerHTML = '';
                
                data.suggestions.forEach((suggestion, index) => {
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
                                <div style="font-weight: bold; color: #1a1a1a; margin-bottom: 4px;">
                                    Rückruf-Termin ${suggestion.slot}
                                </div>
                                <div style="color: #666; font-size: 0.9rem;">
                                    ${suggestion.formattedString}
                                </div>
                            </div>
                            <span style="color: #ffc107; font-size: 1.1rem;">→</span>
                        </div>
                    `;
                    
                    slotButton.style.cssText = `
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: left;
                        margin-bottom: 10px;
                    `;
                    
                    slotButton.addEventListener('mouseenter', () => {
                        slotButton.style.borderColor = '#ffc107';
                        slotButton.style.backgroundColor = '#fff9e6';
                        slotButton.style.transform = 'translateY(-1px)';
                    });
                    
                    slotButton.addEventListener('mouseleave', () => {
                        if (!slotButton.classList.contains('selected')) {
                            slotButton.style.borderColor = '#e9ecef';
                            slotButton.style.backgroundColor = 'white';
                            slotButton.style.transform = 'translateY(0)';
                        }
                    });
                    
                    slotButton.addEventListener('click', () => selectCallbackSlot(suggestion));
                    
                    if (slotsContainer) {
                        slotsContainer.appendChild(slotButton);
                    }
                });
                
            } else {
                console.warn("⚠️ Keine Rückruf-Slots verfügbar");
                if (noSlotsMessage) {
                    noSlotsMessage.style.display = 'block';
                    noSlotsMessage.innerHTML = `
                        <div style="font-size: 2rem; margin-bottom: 10px;">😔</div>
                        <p>Aktuell sind keine Rückruf-Termine verfügbar.</p>
                        <p style="font-size: 0.9rem;">Kontaktiere Michael direkt für einen Termin:</p>
                        <a href="mailto:michael@designare.at?subject=Rückruf-Anfrage&body=Hallo Michael,%0D%0A%0D%0AIch hätte gerne einen Rückruf-Termin.%0D%0A%0D%0AMeine Telefonnummer: %0D%0AMein Anliegen: %0D%0A%0D%0AVielen Dank!" 
                           style="color: #ffc107; text-decoration: none; font-weight: bold;">
                            📧 michael@designare.at
                        </a>
                    `;
                }
            }
            
        } catch (error) {
            console.error("❌ Fehler beim Laden der Rückruf-Slots:", error);
            
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (noSlotsMessage) {
                noSlotsMessage.style.display = 'block';
                
                let errorMsg = "Fehler beim Laden der Termine.";
                if (error.message.includes('Netzwerkfehler')) {
                    errorMsg = "Verbindungsproblem beim Laden der Termine.";
                } else if (error.message.includes('Server-Fehler')) {
                    errorMsg = "Server-Problem beim Laden der Termine.";
                }
                
                noSlotsMessage.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
                    <p>${errorMsg}</p>
                    <p style="font-size: 0.9rem;">Kontaktiere Michael direkt für einen Termin:</p>
                    <a href="mailto:michael@designare.at?subject=Rückruf-Anfrage (Fehler beim Laden)&body=Hallo Michael,%0D%0A%0D%0ADas automatische Buchungssystem hatte einen Fehler. Ich hätte gerne einen Rückruf-Termin.%0D%0A%0D%0AMeine Telefonnummer: %0D%0AMein Anliegen: %0D%0A%0D%0AVielen Dank!" 
                       style="color: #ffc107; text-decoration: none; font-weight: bold;">
                        📧 michael@designare.at
                    </a>
                `;
            }
        }
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
        
        if (!nameInput || !phoneInput || !selectedCallbackData) {
            showCallbackError('Bitte fülle alle Pflichtfelder aus');
            return;
        }
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const topic = topicInput ? topicInput.value.trim() : '';
        
        if (!name || !phone) {
            showCallbackError('Name und Telefonnummer sind erforderlich');
            return;
        }
        
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(phone)) {
            showCallbackError('Bitte gib eine gültige Telefonnummer ein');
            return;
        }
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '📞 Wird gebucht...';
        }
        
        try {
            const data = await safeFetchAPI('/api/book-appointment-phone', {
                method: 'POST',
                body: JSON.stringify({
                    slot: selectedCallbackData.fullDateTime,
                    name: name,
                    phone: phone,
                    topic: topic
                })
            });
            
            console.log("📊 Rückruf-Buchung Response:", data);
            
            if (data.success) {
                console.log("✅ Rückruf erfolgreich gebucht");
                
                const confirmationDetails = document.getElementById('confirmation-details');
                if (confirmationDetails) {
                    confirmationDetails.innerHTML = `
                        <div style="margin-bottom: 12px;">
                            <strong>📞 Rückruf-Termin:</strong><br>
                            <span style="color: #28a745;">${selectedCallbackData.formattedString}</span>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <strong>👤 Name:</strong> ${name}
                        </div>
                        <div style="margin-bottom: 12px;">
                            <strong>📱 Telefonnummer:</strong> ${phone}
                        </div>
                        ${topic ? `
                        <div style="margin-bottom: 12px;">
                            <strong>💬 Anliegen:</strong> ${topic}
                        </div>
                        ` : ''}
                        <div style="background: #e7f3ff; padding: 10px; border-radius: 5px; margin-top: 15px; font-size: 0.9rem;">
                            📋 <strong>Termin wurde erfolgreich in Michaels Kalender eingetragen</strong>
                        </div>
                    `;
                }
                
                showCallbackStep('step-confirmation');
                
            } else {
                throw new Error(data.message || 'Unbekannter Fehler bei der Rückruf-Buchung');
            }
            
        } catch (error) {
            console.error("❌ Rückruf-Buchung fehlgeschlagen:", error);
            
            let userMessage = error.message;
            
            if (error.message.includes('HTTP 409') || error.message.includes('conflict') || error.message.includes('bereits vergeben')) {
                userMessage = 'Dieser Rückruf-Termin ist leider bereits vergeben. Bitte wähle einen anderen Zeitslot.';
            } else if (error.message.includes('HTTP 500') || error.message.includes('Server-Fehler')) {
                userMessage = 'Server-Problem. Bitte versuche es später noch einmal oder kontaktiere Michael direkt.';
            } else if (error.message.includes('Netzwerkfehler')) {
                userMessage = 'Verbindungsproblem. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
            }
            
            showCallbackError(userMessage);
            
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '📞 Rückruf buchen';
            }
        }
    };

    // ===================================================================
    // HILFSFUNKTIONEN
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
            selectedDisplay.innerHTML = `
                <strong>📞 Ausgewählter Rückruf-Termin:</strong><br>
                <span style="color: #28a745; font-weight: bold;">${suggestion.formattedString}</span>
            `;
        }
        
        setTimeout(() => {
            showCallbackStep('step-contact-details');
        }, 800);
    };

    const showCallbackStep = (stepId) => {
        document.querySelectorAll('.callback-step').forEach(step => {
            step.style.display = 'none';
        });
        
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.style.display = 'block';
            console.log("✅ Wechsel zu Callback-Schritt:", stepId);
        }
    };

    const showCallbackError = (message) => {
        console.error("❌ Callback-Fehler:", message);
        
        let errorElement = document.getElementById('callback-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'callback-error-message';
            errorElement.style.cssText = `
                background: #ff4757;
                color: white;
                padding: 12px;
                border-radius: 6px;
                margin: 15px 0;
                display: none;
                font-size: 0.9rem;
                line-height: 1.4;
            `;
            
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
        if (!responseArea) {
            console.warn("⚠️ Response Area nicht gefunden");
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = message;
        
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
        
        console.log(`📝 Nachricht hinzugefügt (${sender})`);
    };

    const initializeChat = (initialMessage) => {
        if (!responseArea) {
            console.warn("⚠️ Response Area nicht gefunden für Chat-Initialisierung");
            return;
        }
        
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
            if (contentArea) {
                contentArea.appendChild(chatForm);
            }
            
            console.log("✅ Chat-Form erstellt");
        }
        
        addMessageToHistory(initialMessage, 'ai');
    };

    // ===================================================================
    // EVENT-LISTENER SETUP
    // ===================================================================

    // Hauptformular (Index-Seite)
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

    // Chat-Formular (Modal) - Event-Delegation
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

    // Chat-Modal schließen
    closeButtons.forEach(button => {
        button.addEventListener('click', hideChatModal);
    });

    // Event-Delegation für Rückruf-Modal Buttons
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
