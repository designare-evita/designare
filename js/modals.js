// js/modals.js - VOLLSTÄNDIGE VERSION mit AKTUELLER Booking-Funktion aus ai-form.js

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
// AI-SPEZIFISCHE FUNKTIONEN MIT EVITA CHAT UNTERSTÜTZUNG
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
// EVITA CHAT FUNKTIONEN MIT AKTUELLER BOOKING-INTEGRATION
// ===================================================================

export function initEvitaChat() {
    console.log("🤖 Initialisiere Evita Chat Funktionalität...");
    
    const modal = document.getElementById('ai-response-modal');
    const chatHistory = document.getElementById('ai-chat-history');
    
    if (modal && chatHistory) {
        // Setup Chat-Event-Listener
        setupAiChatFunctionality();
        console.log("✅ Evita Chat erfolgreich initialisiert");
        return true;
    } else {
        console.warn("⚠️ Evita Chat Komponenten nicht gefunden");
        return false;
    }
}

export function launchEvitaChatModal() {
    console.log("🚀 Starte Evita Chat Modal...");
    
    const modal = document.getElementById('ai-response-modal');
    const chatHistory = document.getElementById('ai-chat-history');
    
    if (!modal || !chatHistory) {
        console.error("❌ Chat Modal Komponenten nicht gefunden");
        return false;
    }
    
    // Leere vorherige Chat-Historie
    chatHistory.innerHTML = '';
    
    // Füge Begrüßungsnachricht hinzu
    const welcomeMessage = "Hallo! Ich bin Evita, Michaels KI-Assistentin. Wie kann ich dir heute helfen?";
    addMessageToHistory(welcomeMessage, 'ai');
    
    // Öffne Modal
    openModal(modal);
    
    // Fokus auf Chat-Input
    setTimeout(() => {
        const chatInput = document.getElementById('ai-chat-input');
        if (chatInput) {
            chatInput.focus();
        }
    }, 300);
    
    console.log("✅ Evita Chat Modal erfolgreich gestartet");
    return true;
}

// ===================================================================
// CHAT-FUNKTIONALITÄT MIT AKTUELLER BOOKING-LOGIK AUS AI-FORM.JS
// ===================================================================

function setupAiChatFunctionality() {
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');

    if (aiChatForm && aiChatInput) {
        // Verhindere doppelte Event-Listener
        if (aiChatForm.hasAttribute('data-evita-initialized')) {
            return;
        }
        aiChatForm.setAttribute('data-evita-initialized', 'true');

        aiChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userInput = aiChatInput.value.trim();
            if (!userInput) return;

            // User-Nachricht zur History hinzufügen
            addMessageToHistory(userInput, 'user');
            aiChatInput.value = '';

            // AKTUELLE BOOKING-LOGIK: Lokale Keyword-Erkennung wie in ai-form.js
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
            
            // Bei Booking-Keywords direkt Modal starten (AKTUELLE LOGIK)
            if (isLocalBookingRequest) {
                console.log("🎯 Booking-Keywords LOKAL erkannt → Starte Rückruf-Modal direkt");
                
                const message = "Perfekt! Ich öffne gleich Michaels Kalender für dich und zeige dir die verfügbaren Rückruf-Termine.";
                addMessageToHistory(message, 'ai');
                
                setTimeout(() => {
                    console.log("⏰ Starte AKTUELLE Rückruf-Modal aus Chat");
                    launchCurrentBookingModal();
                }, 800);
                
                return; // Beende hier ohne API-Call
            }

            // Normale API-Anfrage für andere Fragen
            try {
                // Zeige Typing-Indikator
                const typingId = showTypingIndicator();

                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userInput, source: 'evita' })
                });

                // Entferne Typing-Indikator
                removeTypingIndicator(typingId);

                const data = await response.json();
                
                // Prüfe auf Booking-Aktion von API
                if (data.action === 'launch_booking_modal') {
                    console.log("🎯 Booking-Anfrage von API erkannt");
                    
                    const message = data.answer || "Einen Moment, ich öffne Michaels Kalender für dich...";
                    addMessageToHistory(message, 'ai');
                    
                    setTimeout(() => {
                        console.log("⏰ Starte AKTUELLE Rückruf-Modal von API");
                        launchCurrentBookingModal();
                    }, 500);
                    
                } else {
                    // Normale AI-Antwort zur History hinzufügen
                    if (data.answer) {
                        addMessageToHistory(data.answer, 'ai');
                    } else if (data.message) {
                        addMessageToHistory(data.message, 'ai');
                    }
                }

            } catch (error) {
                console.error('Fehler bei AI-Chat:', error);
                
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
                
                addMessageToHistory(errorMessage, 'ai');
            }
        });

        console.log("✅ Chat-Funktionalität mit AKTUELLER Booking-Logik eingerichtet");
    }
}

// ===================================================================
// AKTUELLE BOOKING-MODAL FUNKTION WIE IN AI-FORM.JS
// ===================================================================

const launchCurrentBookingModal = async () => {
    console.log("🚀 Starte AKTUELLES Rückruf-Modal (wie in ai-form.js)");
    
    try {
        // Schließe Chat-Modal
        const chatModal = document.getElementById('ai-response-modal');
        if (chatModal) {
            closeModal(chatModal);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Entferne existierendes Modal
        const existingModal = document.getElementById('booking-modal');
        if (existingModal) {
            existingModal.remove();
            console.log("🗑️ Existierendes Modal entfernt");
        }
        
        // Verwende die AKTUELLE Inline-HTML Funktion
        const modalHTML = createCurrentInlineModalHTML();
        
        // Füge Modal zum DOM hinzu
        const modalContainer = document.getElementById('modal-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        // Stelle sicher, dass das Modal sichtbar ist
        const callbackModal = document.getElementById('booking-modal');
        if (callbackModal) {
            // Forciere Sichtbarkeit (AKTUELLE Methode)
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
            
            // Setup Event Listeners für das AKTUELLE Booking Modal
            setupCurrentBookingModalEventListeners();
            
            // Lade verfügbare Rückruf-Termine (AKTUELLE Funktion)
            setTimeout(() => {
                loadCurrentCallbackSlots();
            }, 500);
            
            console.log("✅ AKTUELLES Rückruf-Modal erfolgreich gestartet");
            return true;
        } else {
            throw new Error("Modal konnte nicht im DOM erstellt werden");
        }
        
    } catch (error) {
        console.error("❌ AKTUELLES Rückruf-Modal fehlgeschlagen:", error);
        createCurrentEmergencyFallbackModal();
        return false;
    }
};

// ===================================================================
// AKTUELLE INLINE-HTML FUNKTION WIE IN AI-FORM.JS
// ===================================================================

const createCurrentInlineModalHTML = () => {
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
                        
                        <div id="callback-loading">
                            <div>
                                Lade verfügbare Rückruf-Termine...
                            </div>
                        </div>
                        
                        <div id="callback-slots-container">
                            </div>
                        
                        <div id="no-slots-message">
                            </div>
                    </div>
                    
                    <div id="step-contact-details" class="booking-step">
                        <h3 class="booking-step-title">Deine Kontaktdaten:</h3>
                        <div id="selected-slot-display">
                            Ausgewählter Rückruf-Termin wird hier angezeigt
                        </div>
                        
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
                            <div id="confirmation-details">
                                </div>
                            <p class="confirmation-subtext"><strong>Michael wird dich zum vereinbarten Zeitpunkt anrufen.</strong><br>
                                Halte bitte dein Telefon 5 Minuten vor dem Termin bereit.
                            </p>
                            <button onclick="closeCurrentCallbackModal()" class="booking-btn confirm-close-btn">Perfekt! 👍</button>
                        </div>
                    </div>
                </div>
                
                <button onclick="closeCurrentCallbackModal()" class="booking-modal-close-btn" aria-label="Schließen">×</button>
            </div>
        </div>
    `;
};

// ===================================================================
// AKTUELLE EVENT LISTENERS WIE IN AI-FORM.JS
// ===================================================================

const setupCurrentBookingModalEventListeners = () => {
    console.log("🔧 Setze AKTUELLE Booking-Modal Event Listeners auf...");
    
    // Callback Form Submit (AKTUELLE Logik)
    const callbackForm = document.getElementById('callback-form');
    if (callbackForm) {
        callbackForm.addEventListener('submit', submitCurrentCallback);
    }
    
    // Zurück Button (AKTUELLE Logik)
    const backButton = document.getElementById('back-to-slots');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showCurrentCallbackStep('step-slot-selection');
            // Reset Slot-Buttons (AKTUELLE Methode)
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
// AKTUELLE SLOT-LOADING FUNKTION WIE IN AI-FORM.JS
// ===================================================================

const loadCurrentCallbackSlots = async () => {
    console.log("📞 Lade Rückruf-Slots (AKTUELLE Methode)...");
    
    const loadingDiv = document.getElementById('callback-loading');
    const slotsContainer = document.getElementById('callback-slots-container');
    const noSlotsMessage = document.getElementById('no-slots-message');
    
    try {
        // AKTUELLE API-Anfrage
        const data = await fetch('/api/suggest-appointments').then(res => res.json());
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        if (data.success && data.suggestions && data.suggestions.length > 0) {
            console.log("✅ Rückruf-Slots erfolgreich geladen:", data.suggestions.length);
            
            if (slotsContainer) {
                slotsContainer.innerHTML = '';
                
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
                    
                    // AKTUELLE Slot-Button Styles
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
                    
                    // AKTUELLE Event-Listener
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
                    
                    slotButton.addEventListener('click', () => selectCurrentCallbackSlot(suggestion));
                    
                    if (slotsContainer) {
                        slotsContainer.appendChild(slotButton);
                    }
                });
            }
            
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
// WEITERE AKTUELLE BOOKING-FUNKTIONEN
// ===================================================================

let selectedCallbackData = null;

const selectCurrentCallbackSlot = (suggestion) => {
    console.log("📞 Rückruf-Slot ausgewählt (AKTUELLE Methode):", suggestion);
    
    selectedCallbackData = suggestion;
    
    // AKTUELLE Slot-Selection Logik
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
        showCurrentCallbackStep('step-contact-details');
    }, 800);
};

const submitCurrentCallback = async (event) => {
    event.preventDefault();
    console.log("📞 AKTUELLE Rückruf-Buchung gestartet");
    
    const nameInput = document.getElementById('callback-name');
    const phoneInput = document.getElementById('callback-phone');
    const topicInput = document.getElementById('callback-topic');
    const submitButton = document.getElementById('submit-callback');
    
    if (!nameInput || !phoneInput || !selectedCallbackData) {
        showCurrentCallbackError('Bitte fülle alle Pflichtfelder aus');
        return;
    }
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const topic = topicInput ? topicInput.value.trim() : '';
    
    if (!name || !phone) {
        showCurrentCallbackError('Name und Telefonnummer sind erforderlich');
        return;
    }
    
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
    if (!phoneRegex.test(phone)) {
        showCurrentCallbackError('Bitte gib eine gültige Telefonnummer ein');
        return;
    }
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '📞 Wird gebucht...';
    }
    
    try {
        // AKTUELLE API-Anfrage
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
        
        const data = await response.json();
        console.log("📊 AKTUELLE Rückruf-Buchung Response:", data);
        
        if (data.success) {
            console.log("✅ Rückruf erfolgreich gebucht (AKTUELLE Methode)");
            
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
            
            showCurrentCallbackStep('step-confirmation');
            
        } else {
            throw new Error(data.message || 'Unbekannter Fehler bei der Rückruf-Buchung');
        }
        
    } catch (error) {
        console.error("❌ AKTUELLE Rückruf-Buchung fehlgeschlagen:", error);
        
        let userMessage = error.message;
        
        if (error.message.includes('HTTP 409') || error.message.includes('conflict') || error.message.includes('bereits vergeben')) {
            userMessage = 'Dieser Rückruf-Termin ist leider bereits vergeben. Bitte wähle einen anderen Zeitslot.';
        } else if (error.message.includes('HTTP 500') || error.message.includes('Server-Fehler')) {
            userMessage = 'Server-Problem. Bitte versuche es später noch einmal oder kontaktiere Michael direkt.';
        } else if (error.message.includes('Netzwerkfehler')) {
            userMessage = 'Verbindungsproblem. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
        }
        
        showCurrentCallbackError(userMessage);
        
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '📞 Rückruf buchen';
        }
    }
};

// ===================================================================
// AKTUELLE HILFSFUNKTIONEN
// ===================================================================

const showCurrentCallbackStep = (stepId) => {
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    
    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.classList.add('active');
        console.log("✅ Wechsel zu AKTUELLEM Callback-Schritt:", stepId);
    }
};

const showCurrentCallbackError = (message) => {
    console.error("❌ AKTUELLER Callback-Fehler:", message);
    
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

const createCurrentEmergencyFallbackModal = () => {
    console.log("🆘 Erstelle AKTUELLES Emergency-Fallback-Modal...");
    
    const emergencyModal = document.createElement('div');
    emergencyModal.id = 'booking-modal';
    
    emergencyModal.innerHTML = `
        <div class="booking-modal-content fallback-modal-content">
            <div class="fallback-modal-header">
                <div class="fallback-icon">⚠️</div>
                <h2 class="fallback-title">Technisches Problem</h2>
            </div>
            
            <div class="fallback-modal-body">
                <p>
                    Das automatische Buchungssystem ist momentan nicht verfügbar.<br>
                    <strong>Kontaktiere Michael direkt für deinen Rückruf-Termin:</strong>
                </p>
                
                <div>
                    <a href="mailto:michael@designare.at?subject=Rückruf-Termin Anfrage&body=Hallo Michael,%0D%0A%0D%0AIch möchte gerne einen Rückruf-Termin vereinbaren.%0D%0A%0D%0AMeine Telefonnummer: %0D%0AMein Anliegen: %0D%0A%0D%0AVielen Dank!" 
                       class="fallback-email-link">
                        📧 E-Mail für Rückruf-Termin senden
                    </a>
                </div>
                
                <button onclick="closeCurrentCallbackModal()" class="booking-btn fallback-close-btn">
                    Schließen
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(emergencyModal);
    document.body.style.overflow = 'hidden';
    
    console.log("✅ AKTUELLES Emergency-Fallback-Modal erstellt");
    return emergencyModal;
};

// ===================================================================
// AKTUELLE GLOBALE CLOSE-FUNKTION
// ===================================================================

window.closeCurrentCallbackModal = () => {
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
    document.body.classList.remove('no-scroll');
    selectedCallbackData = null;
    console.log("✅ AKTUELLES Rückruf-Modal geschlossen");
};

// ===================================================================
// CHAT MESSAGE HISTORY FUNKTIONEN
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

function showTypingIndicator() {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) return null;

    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'chat-message ai typing';
    typingDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Evita tippt...';
    
    chatHistory.appendChild(typingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return typingId;
}

function removeTypingIndicator(typingId) {
    if (typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }
}

// ===================================================================
// STANDARD MODAL SETUP FUNKTIONEN
// ===================================================================

function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    // Cookie Modal automatisch anzeigen
    if (cookieInfoLightbox && !localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openModal(cookieInfoLightbox), 2000);
    }

    // Cookie akzeptieren
    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', () => {
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
            closeModal(cookieInfoLightbox);
        });
    }

    // Datenschutz-Link
    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) closeModal(cookieInfoLightbox);
            loadLegalContentWithPagination('datenschutz.html');
        });
    }

    // Cookie-Info Button im Header
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

    // Kontakt-Modal öffnen
    if (contactButton) {
        contactButton.addEventListener('click', (e) => {
            e.preventDefault();
            resetContactModal();
            openModal(contactModal);
        });
    }

    // Kontakt-Modal schließen
    if (closeContactModalBtn) {
        closeContactModalBtn.addEventListener('click', () => closeModal(contactModal));
    }

    // Erfolgs-Modal schließen
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(contactModal);
        });
    }

    // Formular-Submit
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Hier könntest du echte Formular-Verarbeitung einfügen
            // Für jetzt zeigen wir die Erfolgsmeldung
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
        // About-Content direkt kopieren (es ist bereits im DOM verfügbar)
        const content = aboutContent.innerHTML;
        
        // Erstelle manuell sinnvolle Seitenaufteilungen basierend auf dem Inhalt
        const pages = splitAboutContentManually(content);
        
        // Pagination-State initialisieren
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

    // Impressum Link
    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContentWithPagination('impressum.html');
        });
    }

    // Datenschutz Link
    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContentWithPagination('datenschutz.html');
        });
    }

    // Legal Modal schließen
    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => {
            const legalModal = document.getElementById('legal-modal');
            closeModal(legalModal);
        });
    }
}

// ===================================================================
// PAGINATION FUNKTIONALITÄT
// ===================================================================

function loadLegalContentWithPagination(page) {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    
    if (!legalContentArea) return;

    // Loading-Anzeige
    legalContentArea.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Lade Inhalt...</div>';
    openModal(legalModal);

    // Lade den Inhalt der entsprechenden Seite
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Extrahiere den Inhalt
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Suche nach dem legal-container
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
        // Datenschutz: Teilung bei jedem H3
        pages = splitContentByH3(content);
    } else {
        // Impressum: 50% Teilung
        pages = splitContentByHalf(content);
    }
    
    // Pagination-State initialisieren
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
            // Neue Seite beginnen bei H3
            pages.push(`<div class="legal-container">${currentPageContent.map(el => el.outerHTML).join('')}</div>`);
            currentPageContent = [element];
        } else {
            currentPageContent.push(element);
        }
    });
    
    // Letzte Seite hinzufügen
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
    
    // Seiteninhalt anzeigen
    legalContentArea.innerHTML = state.pages[pageIndex];
    
    // Pagination-Buttons hinzufügen (wenn mehr als 1 Seite)
    if (state.totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'legal-modal-pagination-buttons';
        
        // Zurück-Button
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Zurück';
        prevButton.disabled = pageIndex === 0;
        prevButton.addEventListener('click', () => {
            if (pageIndex > 0) {
                showModalPage(pageIndex - 1);
                window.modalPaginationState.currentPage = pageIndex - 1;
            }
        });
        
        // Weiter-Button
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

    // Setup Chat-Funktionalität
    setupAiChatFunctionality();
    
    // Initialisiere Evita Chat
    initEvitaChat();
}

function setupModalBackgroundClose() {
    // Schließe Modals beim Klick auf den Hintergrund
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });

    // Schließe Modals mit ESC-Taste
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
    // Seite 1: Bis einschließlich "Der Mann hinter den Pixeln" Abschnitt
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
    
    // Seite 2: Der Rest des Inhalts
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
// EVITA CHAT BUTTON SPEZIFISCHE FUNKTIONEN
// ===================================================================

export function setupEvitaChatButton() {
    console.log("🤖 Richte Evita Chat Button ein...");
    
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (!evitaChatButton) {
        console.warn("⚠️ Evita Chat Button nicht im DOM gefunden");
        return false;
    }

    // Verhindere doppelte Event-Listener
    if (evitaChatButton.hasAttribute('data-evita-ready')) {
        console.log("✅ Evita Chat Button bereits eingerichtet");
        return true;
    }

    // Markiere Button als eingerichtet
    evitaChatButton.setAttribute('data-evita-ready', 'true');

    // Event Listener für Evita Chat Button
    evitaChatButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("🤖 Evita Chat Button geklickt");
        
        // Loading-State anzeigen
        evitaChatButton.classList.add('loading');
        
        try {
            // Stelle sicher, dass das AI-Modal verfügbar ist
            const success = await ensureAiModalReady();
            
            if (success) {
                // Starte Evita Chat
                const chatStarted = launchEvitaChatModal();
                
                if (chatStarted) {
                    console.log("✅ Evita Chat erfolgreich gestartet");
                } else {
                    throw new Error("Chat konnte nicht gestartet werden");
                }
            } else {
                throw new Error("AI-Modal nicht verfügbar");
            }
        } catch (error) {
            console.error("❌ Fehler beim Öffnen des Evita Chats:", error);
            alert("Entschuldigung, der Chat konnte nicht geöffnet werden. Bitte versuche es später noch einmal.");
        } finally {
            // Loading-State entfernen
            evitaChatButton.classList.remove('loading');
        }
    });

    console.log("✅ Evita Chat Button erfolgreich eingerichtet");
    return true;
}

async function ensureAiModalReady() {
    console.log("🔍 Überprüfe AI-Modal Verfügbarkeit...");
    
    const modal = document.getElementById('ai-response-modal');
    const chatHistory = document.getElementById('ai-chat-history');
    const chatForm = document.getElementById('ai-chat-form');
    
    if (modal && chatHistory && chatForm) {
        console.log("✅ AI-Modal bereits verfügbar");
        
        // Stelle sicher, dass Chat-Funktionalität initialisiert ist
        if (!chatForm.hasAttribute('data-evita-initialized')) {
            setupAiChatFunctionality();
        }
        
        return true;
    }
    
    console.warn("⚠️ AI-Modal Komponenten fehlen");
    return false;
}

// ===================================================================
// HAUPT-INITIALISIERUNG MIT AKTUELLER BOOKING-FUNKTION
// ===================================================================

export function initModals() {
    console.log('Initialisiere erweiterte Modals mit AKTUELLER Booking-Funktion...');
    
    setupCookieModal();
    setupContactModal();
    setupAboutModal();
    setupLegalModals();
    setupAiModal();
    setupModalBackgroundClose();
    
    // Zusätzliche Evita Chat Button Einrichtung mit Retry
    setTimeout(() => {
        setupEvitaChatButton();
    }, 200);
    
    // Retry-Mechanismus für Evita Button
    setTimeout(() => {
        const button = document.getElementById('evita-chat-button');
        if (button && !button.hasAttribute('data-evita-ready')) {
            setupEvitaChatButton();
        }
    }, 1000);
    
    // GLOBALE FUNKTION FÜR BOOKING-AUFRUF VON ÜBERALL
    window.launchBookingFromAnywhere = launchCurrentBookingModal;
    
    console.log('Erweiterte Modals mit AKTUELLER Booking-Funktion erfolgreich initialisiert');
}
