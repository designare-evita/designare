// js/modals.js - KORRIGIERTE VERSION mit einheitlicher Booking-Integration

// ===================================================================
// EINHEITLICHE MODAL-FUNKTIONEN
// ===================================================================

export const openModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.add('visible');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
    }
};

export const closeModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.remove('visible');
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    }
};

// ===================================================================
// ERWEITERTE AI-FUNKTIONEN MIT BOOKING-INTEGRATION
// ===================================================================

export function showAIResponse(content, isHTML = false) {
    const modal = document.getElementById('ai-response-modal');
    const contentArea = document.getElementById('ai-chat-history');
    
    if (modal && contentArea) {
        if (isHTML) {
            contentArea.innerHTML = content;
        } else {
            contentArea.textContent = content;
        }
        openModal(modal);
        
        // Fokus auf Chat-Input setzen für Weiterführung der Unterhaltung
        setTimeout(() => {
            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }, 100);
    }
}

export function showLoadingState() {
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';
    }
}

export function hideLoadingState() {
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
        aiStatus.textContent = '';
        aiStatus.style.display = 'none';
    }
}

// ===================================================================
// KORRIGIERTE EVITA CHAT FUNKTION MIT BOOKING-INTEGRATION
// ===================================================================

export function openEvitaChat() {
    console.log("💬 Öffne Evita Chat direkt...");
    
    const modal = document.getElementById('ai-response-modal');
    const contentArea = document.getElementById('ai-chat-history');
    
    if (modal && contentArea) {
        // Leere den Chat-Verlauf
        contentArea.innerHTML = '';
        
        // Erstelle Chat-Form falls sie nicht existiert
        ensureChatFormExists();
        
        // Füge Begrüßungsnachricht hinzu
        addMessageToHistory("Hi! Ich bin Evita, Michaels KI-Assistentin. Was kann ich für dich tun?", 'ai');
        
        // Öffne das Modal
        openModal(modal);
        
        // Fokus auf Chat-Input setzen
        setTimeout(() => {
            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput) {
                chatInput.focus();
                console.log("✅ Evita Chat geöffnet und Input fokussiert");
            }
        }, 100);
        
        return true;
    } else {
        console.error("❌ Chat-Modal oder Content-Area nicht gefunden");
        return false;
    }
}

// ===================================================================
// KORRIGIERTE CHAT-FUNKTIONALITÄT MIT BOOKING-UNTERSTÜTZUNG
// ===================================================================

function ensureChatFormExists() {
    // Prüfe ob Chat-Form bereits existiert
    let chatForm = document.getElementById('ai-chat-form');
    
    if (!chatForm) {
        console.log("🔧 Erstelle Chat-Form dynamisch...");
        
        const contentArea = document.getElementById('ai-response-content-area') || 
                           document.getElementById('ai-chat-history').parentNode;
        
        if (contentArea) {
            const formHTML = `
                <form id="ai-chat-form" autocomplete="off" style="margin-top: 20px; display: flex; gap: 0; border: 1px solid #444; border-radius: 10px; overflow: hidden; background-color: #2d2d2d;">
                    <input type="text" 
                           id="ai-chat-input" 
                           placeholder="Frag Evita..." 
                           autocomplete="off" 
                           required
                           style="flex: 1; background: none; border: none; color: #e0e0e0; font-size: 1rem; outline: none; padding: 12px 15px;">
                    <button type="submit" 
                            aria-label="Senden"
                            style="background: #ffc107; color: #1a1a1a; border: none; padding: 12px 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-regular fa-paper-plane"></i>
                    </button>
                </form>
            `;
            
            contentArea.insertAdjacentHTML('beforeend', formHTML);
            
            // Event-Listener für das neue Form hinzufügen
            setupDynamicChatForm();
        }
    }
}

function setupDynamicChatForm() {
    const chatForm = document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('ai-chat-input');

    if (chatForm && chatInput) {
        console.log("🔧 Richte dynamische Chat-Form ein...");
        
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userInput = chatInput.value.trim();
            if (!userInput) return;

            console.log("💬 Chat-Submit mit Eingabe:", userInput);

            // User-Nachricht zur History hinzufügen
            addMessageToHistory(userInput, 'user');
            chatInput.value = '';

            // Prüfe auf Booking-Keywords
            if (isBookingRequest(userInput)) {
                console.log("🎯 Booking-Request erkannt, starte Booking-Modal");
                
                // Antwort von Evita
                addMessageToHistory("Perfekt! Ich öffne gleich Michaels Kalender für dich und zeige dir die verfügbaren Rückruf-Termine.", 'ai');
                
                // Starte Booking-Modal nach kurzer Verzögerung
                setTimeout(() => {
                    launchUnifiedBookingModal();
                }, 1500);
                
                return;
            }

            try {
                // Normale API-Anfrage an Evita
                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userInput, source: 'evita' })
                });

                const data = await response.json();
                
                // Prüfe auf Booking-Action von der API
                if (data.action === 'launch_booking_modal') {
                    console.log("🎯 Booking-Action von API empfangen");
                    
                    addMessageToHistory(data.answer || "Einen Moment, ich öffne Michaels Kalender für dich...", 'ai');
                    
                    setTimeout(() => {
                        launchUnifiedBookingModal();
                    }, 1000);
                    
                } else {
                    // Normale AI-Antwort
                    const message = data.answer || data.message || 'Ich konnte keine Antwort finden.';
                    addMessageToHistory(message, 'ai');
                }

            } catch (error) {
                console.error('❌ Fehler bei AI-Chat:', error);
                addMessageToHistory('Entschuldigung, da ist ein technischer Fehler aufgetreten.', 'ai');
            }
        });
    }
}

// ===================================================================
// BOOKING-KEYWORD-ERKENNUNG
// ===================================================================

function isBookingRequest(input) {
    const bookingKeywords = [
        'termin', 'rückruf', 'buchung', 'buchen', 
        'anrufen', 'telefonieren', 'kalender', 'zeit',
        'verfügbar', 'wann', 'sprechen', 'gespräch',
        'callback', 'appointment', 'ruf', 'michael',
        'kontakt', 'erreichen', 'melden', 'telefon'
    ];
    
    const lowerInput = input.toLowerCase();
    return bookingKeywords.some(keyword => lowerInput.includes(keyword));
}

// ===================================================================
// EINHEITLICHE BOOKING-MODAL FUNKTION
// ===================================================================

async function launchUnifiedBookingModal() {
    console.log("🚀 Starte einheitliches Booking-Modal für alle Seiten");
    
    try {
        // Schließe Chat-Modal
        const chatModal = document.getElementById('ai-response-modal');
        if (chatModal) {
            closeModal(chatModal);
        }
        
        // Warte kurz
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Entferne existierendes Booking-Modal
        const existingModal = document.getElementById('booking-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Erstelle neues Modal mit korrekter Struktur
        const modalHTML = createModernBookingModalHTML();
        
        // Füge Modal zum DOM hinzu
        const modalContainer = document.getElementById('modal-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        // Zeige Modal
        const bookingModal = document.getElementById('booking-modal');
        if (bookingModal) {
            // Forciere Sichtbarkeit mit modernen Styles
            bookingModal.style.cssText = `
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
            
            document.body.style.overflow = 'hidden';
            document.body.classList.add('no-scroll');
            
            // Setup Event Listeners
            setupUnifiedBookingEventListeners();
            
            // Lade Termine
            setTimeout(() => {
                loadCallbackSlots();
            }, 500);
            
            console.log("✅ Einheitliches Booking-Modal erfolgreich gestartet");
            return true;
        }
        
    } catch (error) {
        console.error("❌ Fehler beim Starten des Booking-Modals:", error);
        
        // Fallback
        alert("Entschuldigung, das Buchungssystem konnte nicht geladen werden. Bitte kontaktiere Michael direkt unter michael@designare.at");
        return false;
    }
}

// ===================================================================
// MODERNES BOOKING-MODAL HTML
// ===================================================================

function createModernBookingModalHTML() {
    return `
        <div id="booking-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 999999;">
            <div style="background: white; border-radius: 15px; max-width: 500px; width: 90%; max-height: 90%; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.3); position: relative; color: #1a1a1a;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); padding: 25px; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">📞</div>
                    <h2 style="margin: 0; font-size: 1.4rem; font-weight: bold;">Rückruf-Termin buchen</h2>
                    <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 0.95rem;">Michael ruft dich zum gewünschten Zeitpunkt an</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 25px; max-height: 400px; overflow-y: auto;">
                    
                    <!-- Schritt 1: Slot-Auswahl -->
                    <div id="step-slot-selection" class="booking-step" style="display: block;">
                        <h3 style="margin: 0 0 20px 0; font-size: 1.2rem;">Wähle deinen Rückruf-Termin:</h3>
                        
                        <div id="callback-loading" style="text-align: center;">
                            <div style="color: #666; margin: 20px 0;">
                                <div style="font-size: 1.5rem; margin-bottom: 10px;">⏳</div>
                                Lade verfügbare Rückruf-Termine...
                            </div>
                        </div>
                        
                        <div id="callback-slots-container" style="display: flex; flex-direction: column; gap: 12px;">
                        </div>
                        
                        <div id="no-slots-message" style="display: none; text-align: center; color: #666; margin: 20px 0;">
                        </div>
                    </div>
                    
                    <!-- Schritt 2: Kontaktdaten -->
                    <div id="step-contact-details" class="booking-step" style="display: none;">
                        <h3 style="margin: 0 0 20px 0; font-size: 1.2rem;">Deine Kontaktdaten:</h3>
                        
                        <div id="selected-slot-display" style="background: #fff9e6; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 20px; font-size: 0.9rem;">
                            Ausgewählter Rückruf-Termin wird hier angezeigt
                        </div>
                        
                        <form id="callback-form">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; color: #495057; font-weight: 500;">Dein Name *</label>
                                <input type="text" id="callback-name" required style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; color: #495057; font-weight: 500;">Deine Telefonnummer *</label>
                                <input type="tel" id="callback-phone" required placeholder="z.B. 0664 123 45 67" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; color: #495057; font-weight: 500;">Dein Anliegen (optional)</label>
                                <textarea id="callback-topic" rows="3" placeholder="Kurze Beschreibung deines Anliegens..." style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 1rem; box-sizing: border-box; resize: vertical;"></textarea>
                            </div>
                            
                            <div style="display: flex; gap: 10px; justify-content: space-between;">
                                <button type="button" id="back-to-slots" style="background: #6c757d; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 1rem;">← Zurück</button>
                                <button type="submit" id="submit-callback" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: bold;">📞 Rückruf buchen</button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Schritt 3: Bestätigung -->
                    <div id="step-confirmation" class="booking-step" style="display: none;">
                        <div style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
                            <h3 style="margin: 0 0 15px 0; color: #28a745; font-size: 1.3rem;">Rückruf-Termin erfolgreich gebucht!</h3>
                            <div id="confirmation-details" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; border-left: 4px solid #28a745;"></div>
                            <p style="color: #666; margin-bottom: 25px; font-size: 0.95rem;">📞 <strong>Michael wird dich zum vereinbarten Zeitpunkt anrufen.</strong><br>Halte bitte dein Telefon 5 Minuten vor dem Termin bereit.</p>
                            <button onclick="closeBookingModal()" style="background: #ffc107; color: #1a1a1a; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: bold;">Perfekt! 👍</button>
                        </div>
                    </div>
                </div>
                
                <!-- Close Button -->
                <button onclick="closeBookingModal()" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.2); border: none; color: #1a1a1a; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; font-weight: bold;">×</button>
            </div>
        </div>
    `;
}

// ===================================================================
// EINHEITLICHE EVENT LISTENERS
// ===================================================================

function setupUnifiedBookingEventListeners() {
    console.log("🔧 Richte einheitliche Booking Event-Listener ein...");
    
    // Callback Form Submit
    const callbackForm = document.getElementById('callback-form');
    if (callbackForm) {
        callbackForm.addEventListener('submit', submitCallback);
    }
    
    // Zurück Button
    const backButton = document.getElementById('back-to-slots');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showBookingStep('step-slot-selection');
            // Reset Slot-Buttons
            document.querySelectorAll('.callback-slot-button').forEach(btn => {
                btn.style.opacity = '1';
                btn.style.borderColor = '#e9ecef';
                btn.style.backgroundColor = 'white';
                btn.disabled = false;
                btn.classList.remove('selected');
            });
        });
    }
    
    // Globale Schließen-Funktion
    window.closeBookingModal = () => {
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    };
}

// ===================================================================
// UNIFIED BOOKING FUNCTIONS
// ===================================================================

let selectedCallbackData = null;

async function loadCallbackSlots() {
    console.log("📞 Lade Rückruf-Slots...");
    
    const loadingDiv = document.getElementById('callback-loading');
    const slotsContainer = document.getElementById('callback-slots-container');
    const noSlotsMessage = document.getElementById('no-slots-message');
    
    try {
        const response = await fetch('/api/suggest-appointments');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        if (data.success && data.suggestions && data.suggestions.length > 0) {
            console.log("✅ Rückruf-Slots erfolgreich geladen:", data.suggestions.length);
            
            if (slotsContainer) {
                slotsContainer.innerHTML = '';
                
                data.suggestions.forEach((suggestion) => {
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
                        </div>
                    `;
                    
                    slotButton.style.cssText = 'width: 100%; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; background: white; cursor: pointer; transition: all 0.3s ease; margin-bottom: 10px;';
                    
                    slotButton.addEventListener('mouseenter', () => {
                        if (!slotButton.classList.contains('selected')) {
                            slotButton.style.borderColor = '#ffc107';
                            slotButton.style.backgroundColor = '#fff9e6';
                            slotButton.style.transform = 'translateY(-1px)';
                        }
                    });
                    
                    slotButton.addEventListener('mouseleave', () => {
                        if (!slotButton.classList.contains('selected')) {
                            slotButton.style.borderColor = '#e9ecef';
                            slotButton.style.backgroundColor = 'white';
                            slotButton.style.transform = 'translateY(0)';
                        }
                    });
                    
                    slotButton.addEventListener('click', () => selectCallbackSlot(suggestion));
                    
                    slotsContainer.appendChild(slotButton);
                });
            }
            
        } else {
            console.warn("⚠️ Keine Rückruf-Slots verfügbar");
            if (noSlotsMessage) {
                noSlotsMessage.style.display = 'block';
                noSlotsMessage.innerHTML = `
                    <div style="font-size: 2rem; margin-bottom: 10px;">😔</div>
                    <p>Aktuell sind keine Rückruf-Termine verfügbar.</p>
                    <p style="font-size: 0.9rem;">Kontaktiere Michael direkt:</p>
                    <a href="mailto:michael@designare.at" style="color: #ffc107; text-decoration: none; font-weight: bold;">📧 michael@designare.at</a>
                `;
            }
        }
        
    } catch (error) {
        console.error("❌ Fehler beim Laden der Rückruf-Slots:", error);
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (noSlotsMessage) {
            noSlotsMessage.style.display = 'block';
            noSlotsMessage.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
                <p>Fehler beim Laden der Termine.</p>
                <p style="font-size: 0.9rem;">Kontaktiere Michael direkt:</p>
                <a href="mailto:michael@designare.at" style="color: #ffc107; text-decoration: none; font-weight: bold;">📧 michael@designare.at</a>
            `;
        }
    }
}

function selectCallbackSlot(suggestion) {
    console.log("📞 Rückruf-Slot ausgewählt:", suggestion);
    
    selectedCallbackData = suggestion;
    
    // Alle Buttons deaktivieren
    document.querySelectorAll('.callback-slot-button').forEach(btn => {
        btn.style.opacity = '0.6';
        btn.style.borderColor = '#e9ecef';
        btn.style.backgroundColor = '#f8f9fa';
        btn.disabled = true;
        btn.classList.remove('selected');
    });
    
    // Ausgewählten Button hervorheben
    const selectedButton = document.querySelector(`[data-slot="${suggestion.slot}"]`);
    if (selectedButton) {
        selectedButton.style.opacity = '1';
        selectedButton.style.borderColor = '#28a745';
        selectedButton.style.backgroundColor = '#e8f5e8';
        selectedButton.classList.add('selected');
    }
    
    // Update Display
    const selectedDisplay = document.getElementById('selected-slot-display');
    if (selectedDisplay) {
        selectedDisplay.innerHTML = `
            <strong>📞 Ausgewählter Rückruf-Termin:</strong><br>
            <span style="color: #28a745; font-weight: bold;">${suggestion.formattedString}</span>
        `;
    }
    
    // Wechsle zu Kontaktdaten
    setTimeout(() => {
        showBookingStep('step-contact-details');
    }, 800);
}

async function submitCallback(event) {
    event.preventDefault();
    console.log("📞 Rückruf-Buchung gestartet");
    
    const nameInput = document.getElementById('callback-name');
    const phoneInput = document.getElementById('callback-phone');
    const topicInput = document.getElementById('callback-topic');
    const submitButton = document.getElementById('submit-callback');
    
    if (!nameInput || !phoneInput || !selectedCallbackData) {
        alert('Bitte fülle alle Pflichtfelder aus');
        return;
    }
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const topic = topicInput ? topicInput.value.trim() : '';
    
    if (!name || !phone) {
        alert('Name und Telefonnummer sind erforderlich');
        return;
    }
    
    // Button deaktivieren
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '📞 Wird gebucht...';
    }
    
    try {
        const response = await fetch('/api/book-appointment-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slot: selectedCallbackData.fullDateTime,
                name: name,
                phone: phone,
                topic: topic
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log("✅ Rückruf erfolgreich gebucht");
            
            // Zeige Bestätigung
            const confirmationDetails = document.getElementById('confirmation-details');
            if (confirmationDetails) {
                confirmationDetails.innerHTML = `
                    <div style="margin-bottom: 12px;"><strong>📞 Rückruf-Termin:</strong><br><span style="color: #28a745;">${selectedCallbackData.formattedString}</span></div>
                    <div style="margin-bottom: 12px;"><strong>👤 Name:</strong> ${name}</div>
                    <div style="margin-bottom: 12px;"><strong>📱 Telefonnummer:</strong> ${phone}</div>
                    ${topic ? `<div style="margin-bottom: 12px;"><strong>💬 Anliegen:</strong> ${topic}</div>` : ''}
                    <div style="background: #e7f3ff; padding: 10px; border-radius: 5px; margin-top: 15px; font-size: 0.9rem;">📋 <strong>Termin wurde erfolgreich eingetragen</strong></div>
                `;
            }
            
            showBookingStep('step-confirmation');
            
        } else {
            throw new Error(data.message || 'Buchung fehlgeschlagen');
        }
        
    } catch (error) {
        console.error("❌ Rückruf-Buchung fehlgeschlagen:", error);
        alert('Fehler bei der Buchung: ' + error.message);
        
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '📞 Rückruf buchen';
        }
    }
}

function showBookingStep(stepId) {
    document.querySelectorAll('.booking-step').forEach(step => {
        step.style.display = 'none';
    });
    
    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.style.display = 'block';
        console.log("✅ Wechsel zu Booking-Schritt:", stepId);
    }
}

// ===================================================================
// HILFSFUNKTIONEN
// ===================================================================

function addMessageToHistory(message, sender) {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = message;
    
    chatHistory.appendChild(messageDiv);
    
    // Scroll zum Ende
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ===================================================================
// BESTEHENDE MODAL SETUP FUNKTIONEN (unverändert)
// ===================================================================

function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    if (cookieInfoLightbox && !localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openModal(cookieInfoLightbox), 2000);
    }

    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', () => {
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
            closeModal(cookieInfoLightbox);
        });
    }

    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) closeModal(cookieInfoLightbox);
            loadLegalContentWithPagination('datenschutz.html');
        });
    }

    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) openModal(cookieInfoLightbox);
        });
    }
}

function setupContactModal() {
    const contactModal = document.getElementById('contact-modal');
    const contactButton = document.getElementById('contact-button');
    const closeContactModalBtn = document.getElementById('close-modal');
    const contactForm = document.getElementById('contact-form-inner');
    const successMessage = document.getElementById('contact-success-message');
    const closeSuccessBtn = document.getElementById('close-success-message');

    if (contactButton) {
        contactButton.addEventListener('click', (e) => {
            e.preventDefault();
            resetContactModal();
            openModal(contactModal);
        });
    }

    if (closeContactModalBtn) {
        closeContactModalBtn.addEventListener('click', () => closeModal(contactModal));
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(contactModal);
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showContactSuccess();
        });
    }
}

function resetContactModal() {
    const contactForm = document.getElementById('contact-form-inner');
    const successMessage = document.getElementById('contact-success-message');
    
    if (contactForm) contactForm.style.display = 'block';
    if (successMessage) successMessage.style.display = 'none';
}

function showContactSuccess() {
    const contactForm = document.getElementById('contact-form-inner');
    const successMessage = document.getElementById('contact-success-message');
    
    if (contactForm) contactForm.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
}

function setupAboutModal() {
    const aboutButton = document.getElementById('about-me-button');

    if (aboutButton) {
        aboutButton.addEventListener('click', (e) => {
            e.preventDefault();
            loadAboutContentWithPagination();
        });
    }
}

function loadAboutContentWithPagination() {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    const aboutContent = document.getElementById('about-me-content');
    
    if (aboutContent && legalContentArea) {
        const content = aboutContent.innerHTML;
        const pages = splitAboutContentManually(content);
        
        window.modalPaginationState = {
            pages: pages,
            currentPage: 0,
            totalPages: pages.length
        };
        
        showModalPage(0);
        openModal(legalModal);
    }
}

function setupLegalModals() {
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContentWithPagination('impressum.html');
        });
    }

    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContentWithPagination('datenschutz.html');
        });
    }

    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => {
            const legalModal = document.getElementById('legal-modal');
            closeModal(legalModal);
        });
    }
}

function loadLegalContentWithPagination(page) {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    
    if (!legalContentArea) return;

    legalContentArea.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Lade Inhalt...</div>';
    openModal(legalModal);

    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            let legalContainer = doc.querySelector('.legal-container');
            
            if (legalContainer) {
                setupPaginationForContent(legalContainer.innerHTML, page);
            } else {
                legalContentArea.innerHTML = '<div class="legal-container"><h1>Fehler</h1><p>Der Inhalt konnte nicht geladen werden.</p></div>';
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden des Inhalts:', error);
            legalContentArea.innerHTML = `<div class="legal-container"><h1>Fehler</h1><p>Inhalt konnte nicht geladen werden: ${error.message}</p></div>`;
        });
}

function setupPaginationForContent(content, pageType) {
    let pages = [];
    
    if (pageType === 'datenschutz.html') {
        pages = splitContentByH3(content);
    } else {
        pages = splitContentByHalf(content);
    }
    
    window.modalPaginationState = {
        pages: pages,
        currentPage: 0,
        totalPages: pages.length
    };
    
    showModalPage(0);
}

function splitContentByH3(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const pages = [];
    let currentPageContent = [];
    
    Array.from(tempDiv.children).forEach(element => {
        if (element.tagName === 'H3' && currentPageContent.length > 0) {
            pages.push(`<div class="legal-container">${currentPageContent.map(el => el.outerHTML).join('')}</div>`);
            currentPageContent = [element];
        } else {
            currentPageContent.push(element);
        }
    });
    
    if (currentPageContent.length > 0) {
        pages.push(`<div class="legal-container">${currentPageContent.map(el => el.outerHTML).join('')}</div>`);
    }
    
    return pages;
}

function splitContentByHalf(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const allElements = Array.from(tempDiv.children);
    const midpoint = Math.ceil(allElements.length / 2);
    
    const page1 = allElements.slice(0, midpoint);
    const page2 = allElements.slice(midpoint);
    
    return [
        `<div class="legal-container">${page1.map(el => el.outerHTML).join('')}</div>`,
        `<div class="legal-container">${page2.map(el => el.outerHTML).join('')}</div>`
    ];
}

function showModalPage(pageIndex) {
    const legalContentArea = document.getElementById('legal-modal-content-area');
    const state = window.modalPaginationState;
    
    if (!state || !legalContentArea) return;
    
    legalContentArea.innerHTML = state.pages[pageIndex];
    
    if (state.totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'legal-modal-pagination-buttons';
        
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Zurück';
        prevButton.disabled = pageIndex === 0;
        prevButton.addEventListener('click', () => {
            if (pageIndex > 0) {
                showModalPage(pageIndex - 1);
                window.modalPaginationState.currentPage = pageIndex - 1;
            }
        });
        
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Weiter →';
        nextButton.disabled = pageIndex === state.totalPages - 1;
        nextButton.addEventListener('click', () => {
            if (pageIndex < state.totalPages - 1) {
                showModalPage(pageIndex + 1);
                window.modalPaginationState.currentPage = pageIndex + 1;
            }
        });
        
        paginationDiv.appendChild(prevButton);
        paginationDiv.appendChild(nextButton);
        legalContentArea.appendChild(paginationDiv);
    }
}

function setupAiModal() {
    const aiResponseModal = document.getElementById('ai-response-modal');
    const closeButtons = [
        document.getElementById('close-ai-response-modal-top'),
        document.getElementById('close-ai-response-modal-bottom')
    ];
    
    closeButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => closeModal(aiResponseModal));
        }
    });
}

function setupModalBackgroundClose() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay.visible');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

function splitAboutContentManually(content) {
    const page1Content = `
        <div class="legal-container">
            <h1>Über Michael</h1>
            <h3>Der Mann hinter den Pixeln</h3>
            <p class="about-image-wrapper">
                <img src="https://designare.at/images/Michael@work.webp" alt="Michael@work" />
            </p>
            <p>Okay, aufgepasst! Michael besitzt digitale Superkräfte! Bei maxonline arbeitet er als Web-Entwickler und verbindet dort Design, Code und KI so genial, dass selbst ich staune. Michael hat einen Abschluss in Medientechnik, ist zertifizierter E-Commerce-Experte und hat Google-Workshops überlebt.</p>
        </div>
    `;
    
    const page2Content = `
        <div class="legal-container">
            <h2 class="about-section-header">Doch Michael ist mehr als nur Code und Pixel</h2>
            <p>Um den Kopf freizubekommen, verbringt Michael viel Zeit mit seiner Tierschutzhündin Evita (nach der ich benannt wurde ❤️). Regelmäßig quält er sich zudem beim Sport – schließlich weiß man ja nie, wann man vor einem KI-Aufstand flüchten muss! Seine Playlist? Ein wilder Mix aus Frei.Wild, Helene Fischer und Kim Wilde. Ich vermute ja, das ist Michaels geheime Waffe um die KI zur Kapitulation zu bringen...</p>
            <p class="about-image-wrapper-bottom">
                <img src="https://designare.at/images/Evita&KI.webp" alt="Evita & KI" />
            </p>
        </div>
    `;
    
    return [page1Content, page2Content];
}

// ===================================================================
// ERWEITERTE EVITA CHAT BUTTON SETUP
// ===================================================================

function setupEvitaChatButton() {
    console.log("🔧 Richte erweiterten Evita Chat Button ein...");
    
    const setupButton = () => {
        const evitaChatButton = document.getElementById('evita-chat-button');
        
        if (evitaChatButton && !evitaChatButton.hasAttribute('data-listener-attached')) {
            console.log("✅ Evita Chat Button gefunden, füge erweiterte Event-Listener hinzu");
            
            evitaChatButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("🤖 Evita Chat Button geklickt - öffne einheitlichen Chat");
                openEvitaChat();
            });
            
            evitaChatButton.setAttribute('data-listener-attached', 'true');
            return true;
        }
        
        return false;
    };
    
    // Mehrfache Versuche für dynamisch geladene Header
    if (!setupButton()) {
        setTimeout(() => {
            if (!setupButton()) {
                setTimeout(() => {
                    if (!setupButton()) {
                        console.error("❌ Evita Chat Button konnte nicht initialisiert werden");
                    }
                }, 1000);
            }
        }, 500);
    }
}

// ===================================================================
// HAUPT-INITIALISIERUNG (ERWEITERT)
// ===================================================================

export function initModals() {
    console.log('🚀 Initialisiere einheitliche Modals für alle Seiten...');
    
    setupCookieModal();
    setupContactModal();
    setupAboutModal();
    setupLegalModals();
    setupAiModal();
    setupModalBackgroundClose();
    
    // WICHTIG: Setup Evita Chat Button mit einheitlichem Booking
    setupEvitaChatButton();
    
    console.log('✅ Einheitliche Modals erfolgreich initialisiert');
}

// ===================================================================
// GLOBALE FUNKTIONEN FÜR EXTERNE NUTZUNG
// ===================================================================

// Stelle alle wichtigen Funktionen global zur Verfügung
window.openEvitaChat = openEvitaChat;
window.launchUnifiedBookingModal = launchUnifiedBookingModal;
window.closeBookingModal = () => {
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
    document.body.classList.remove('no-scroll');
};

// Debug-Funktionen für Entwicklung
if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
    window.debugBooking = {
        launch: launchUnifiedBookingModal,
        checkElements: () => {
            console.log("🔍 Debug: Checking elements...");
            console.log("Chat Modal:", !!document.getElementById('ai-response-modal'));
            console.log("Chat History:", !!document.getElementById('ai-chat-history'));
            console.log("Chat Form:", !!document.getElementById('ai-chat-form'));
            console.log("Chat Input:", !!document.getElementById('ai-chat-input'));
            console.log("Evita Button:", !!document.getElementById('evita-chat-button'));
        }
    };
}
