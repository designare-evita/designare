// js/ai-form.js - FINALE, SAUBERE & STABILE VERSION

/**
 * Initialisiert das gesamte AI-Chat- und Buchungssystem.
 * Diese Funktion wird von main.js aufgerufen.
 */
export const initAiForm = () => {
    console.log("🚀 Initialisiere AI-Form-Modul...");

    // ===================================================================
    // 1. VARIABLEN UND DOM-ELEMENTE
    // ===================================================================
    
    // Formulare & Container
    const aiForm = document.getElementById('ai-form');
    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');

    // Chat-Modal
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-chat-history');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    // Status-Variable für den Buchungsprozess
    let selectedCallbackData = null;

    // Prüfen, ob die grundlegenden Elemente vorhanden sind
    if (!aiForm || !modalOverlay) {
        console.warn("⚠️ Wesentliche AI-Form oder Modal-Elemente nicht im DOM gefunden. Modul wird nicht vollständig initialisiert.");
        return;
    }

    // ===================================================================
    // 2. KERNLOGIK: KOMMUNIKATION MIT DER AI
    // ===================================================================
    
    /**
     * Sendet die Benutzereingabe an die Gemini API und verarbeitet die Antwort.
     * @param {string} userInput - Die Frage oder Nachricht des Benutzers.
     * @param {boolean} isFromChat - True, wenn die Nachricht aus dem Chat-Modal kommt.
     */
    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende an Evita: "${userInput}"`);

        // UI für "Denken" vorbereiten
        if (!isFromChat) {
            aiStatus.style.display = 'block';
            aiStatus.textContent = 'Evita denkt nach...';
            aiForm.querySelector('button').disabled = true;
        }

        try {
            // API-Anfrage senden
            const data = await safeFetchAPI('/api/ask-gemini', {
                method: 'POST',
                body: JSON.stringify({ prompt: userInput }),
            });

            console.log(`📨 Evita Response:`, data);

            // Entscheiden, was basierend auf der API-Antwort zu tun ist
            if (data.action === 'launch_booking_modal') {
                handleBookingIntent(data, isFromChat);
            } else {
                handleStandardResponse(data, isFromChat);
            }

        } catch (error) {
            console.error(`❌ Schwerer Fehler in sendToEvita:`, error);
            handleFetchError(error, isFromChat);
        } finally {
            // UI wieder freigeben
            if (!isFromChat) {
                aiQuestion.value = '';
                aiStatus.style.display = 'none';
                aiForm.querySelector('button').disabled = false;
            }
        }
    };

    /**
     * Verarbeitet eine normale Text-Antwort der AI.
     */
    const handleStandardResponse = (data, isFromChat) => {
        const message = data.answer || "Ich konnte leider keine passende Antwort finden.";
        if (isFromChat) {
            addMessageToHistory(message, 'ai');
        } else {
            initializeChat(message);
            showChatModal();
        }
    };

    /**
     * Startet den "natürlichen" Buchungs-Flow, wenn die AI einen Terminwunsch erkennt.
     */
    const handleBookingIntent = (data, isFromChat) => {
        const initialMessage = data.answer || "Einen Moment, ich schaue in Michaels Kalender...";
        
        // Erste Nachricht anzeigen
        if (isFromChat) {
            addMessageToHistory(initialMessage, 'ai');
        } else {
            initializeChat(initialMessage);
            showChatModal();
        }
        
        // "Tipp"-Indikator anzeigen für realistisches Gefühl
        const typingId = isFromChat ? showTypingIndicator() : null;
        
        // Simuliere Kalendersuche (2 Sekunden)
        setTimeout(() => {
            if (typingId) removeTypingIndicator(typingId);
            
            // Zweite Nachricht anzeigen
            const followUpMessage = "Ich habe verfügbare Termine gefunden! Ich öffne die Buchung für dich.";
            if (isFromChat) addMessageToHistory(followUpMessage, 'ai');
            
            // Kurze Pause, damit die Nachricht gelesen werden kann (1.2 Sekunden)
            setTimeout(() => {
                launchBookingModal();
            }, 1200);

        }, 2000);
    };


    // ===================================================================
    // 3. BOOKING-MODAL LOGIK
    // ===================================================================

    /**
     * Erstellt und startet das komplette Rückruf-Buchungs-Modal.
     */
    const launchBookingModal = async () => {
        console.log("🚀 Starte Rückruf-Modal...");
        
        try {
            // Schließe das Chat-Fenster sanft
            hideChatModal();
            await new Promise(resolve => setTimeout(resolve, 300));

            // Altes Modal entfernen, falls vorhanden
            const existingModal = document.getElementById('booking-modal');
            if (existingModal) existingModal.remove();

            // Neues Modal aus HTML-String erstellen und einfügen
            document.body.insertAdjacentHTML('beforeend', createInlineModalHTML());
            
            const callbackModal = document.getElementById('booking-modal');
            if (!callbackModal) throw new Error("Modal konnte nicht im DOM erstellt werden.");

            // Modal sichtbar machen und Scrollen verhindern
            callbackModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Event-Listener für das neue Modal einrichten
            setupBookingModalEventListeners();
            
            // Verfügbare Termine laden
            loadCallbackSlots();
            
            console.log("✅ Rückruf-Modal erfolgreich gestartet.");

        } catch (error) {
            console.error("❌ Fehler beim Starten des Rückruf-Modals:", error);
            createEmergencyFallbackModal();
        }
    };

    /**
     * Lädt die verfügbaren Rückruf-Termine von der API.
     */
    const loadCallbackSlots = async () => {
        const loadingDiv = document.getElementById('callback-loading');
        const slotsContainer = document.getElementById('callback-slots-container');
        const noSlotsMessage = document.getElementById('no-slots-message');
        
        try {
            const data = await safeFetchAPI('/api/suggest-appointments');
            loadingDiv.style.display = 'none';

            if (data.success && data.suggestions?.length > 0) {
                slotsContainer.innerHTML = ''; // Container leeren
                data.suggestions.forEach(suggestion => {
                    const slotButton = document.createElement('button');
                    slotButton.className = 'callback-slot-button';
                    slotButton.dataset.slot = JSON.stringify(suggestion); // Ganzes Objekt speichern
                    
                    const icon = suggestion.isPreferredTime ? '⭐' : '📞';
                    slotButton.innerHTML = `
                        <div>${icon} Rückruf-Termin ${suggestion.slot}</div>
                        <span>${suggestion.formattedString}</span>`;
                        
                    slotButton.addEventListener('click', () => selectCallbackSlot(suggestion));
                    slotsContainer.appendChild(slotButton);
                });
            } else {
                noSlotsMessage.innerHTML = '😔 Aktuell sind leider keine Termine verfügbar. Bitte kontaktiere Michael direkt: <a href="mailto:michael@designare.at">michael@designare.at</a>';
                noSlotsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error("❌ Fehler beim Laden der Rückruf-Slots:", error);
            loadingDiv.style.display = 'none';
            noSlotsMessage.innerHTML = `⚠️ Fehler beim Laden der Termine. Bitte kontaktiere Michael direkt: <a href="mailto:michael@designare.at">michael@designare.at</a>`;
            noSlotsMessage.style.display = 'block';
        }
    };
    
    /**
     * Verarbeitet die Auswahl eines Termin-Slots.
     */
    const selectCallbackSlot = (suggestion) => {
        selectedCallbackData = suggestion;
        console.log("📞 Slot ausgewählt:", selectedCallbackData);

        // Update der Anzeige
        const selectedDisplay = document.getElementById('selected-slot-display');
        selectedDisplay.innerHTML = `<strong>Ausgewählt:</strong> ${suggestion.formattedString}`;
        
        // Wechsle zum nächsten Schritt
        showCallbackStep('step-contact-details');
    };

    /**
     * Verarbeitet die finale Buchung des Rückrufs.
     */
    const submitCallback = async (event) => {
        event.preventDefault();
        
        const nameInput = document.getElementById('callback-name');
        const phoneInput = document.getElementById('callback-phone');
        const topicInput = document.getElementById('callback-topic');
        const submitButton = document.getElementById('submit-callback');

        if (!nameInput.value.trim() || !phoneInput.value.trim() || !selectedCallbackData) {
            showCallbackError('Bitte fülle alle Pflichtfelder aus.');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Wird gebucht...';

        try {
            const data = await safeFetchAPI('/api/book-appointment-phone', {
                method: 'POST',
                body: JSON.stringify({
                    slot: selectedCallbackData.fullDateTime,
                    name: nameInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    topic: topicInput.value.trim()
                })
            });

            if (data.success) {
                const confirmationDetails = document.getElementById('confirmation-details');
                confirmationDetails.innerHTML = `
                    <p><strong>Termin:</strong> ${selectedCallbackData.formattedString}</p>
                    <p><strong>Name:</strong> ${nameInput.value.trim()}</p>
                    <p><strong>Telefon:</strong> ${phoneInput.value.trim()}</p>`;
                showCallbackStep('step-confirmation');
            } else {
                throw new Error(data.message || 'Unbekannter Fehler bei der Buchung.');
            }
        } catch (error) {
            console.error("❌ Fehler bei der Rückruf-Buchung:", error);
            showCallbackError(error.message.includes('409') ? 'Dieser Termin ist leider bereits vergeben.' : 'Ein Fehler ist aufgetreten.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Rückruf buchen';
        }
    };


    // ===================================================================
    // 4. HILFSFUNKTIONEN (UI, API, etc.)
    // ===================================================================

    /**
     * Sicherer Wrapper für die fetch-API mit Fehlerbehandlung.
     */
    const safeFetchAPI = async (url, options = {}) => {
        try {
            const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers }});
            if (!response.ok) {
                const errorText = await response.text().catch(() => `HTTP ${response.status}`);
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(`API-Fehler bei ${url}:`, error);
            throw new Error(error.message.includes('fetch') ? 'Netzwerkfehler' : error.message);
        }
    };

    const showChatModal = () => modalOverlay.classList.add('visible');
    const hideChatModal = () => modalOverlay.classList.remove('visible');

    const addMessageToHistory = (message, sender) => {
        if (!responseArea) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = message;
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
    };

    const initializeChat = (initialMessage) => {
        if (!responseArea) return;
        responseArea.innerHTML = '';
        addMessageToHistory(initialMessage, 'ai');
        // Sicherstellen, dass das Chat-Eingabeformular existiert
        if (!document.getElementById('ai-chat-form')) {
            const formHTML = `
                <form id="ai-chat-form" style="display: flex; margin-top: 1rem;">
                    <input type="text" id="ai-chat-input" placeholder="Deine Antwort..." style="flex: 1; padding: 0.5rem;">
                    <button type="submit" style="padding: 0.5rem 1rem;">Senden</button>
                </form>`;
            responseArea.insertAdjacentHTML('afterend', formHTML);
        }
    };
    
    const showTypingIndicator = () => {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'chat-message ai typing';
        typingDiv.innerHTML = `<span></span><span></span><span></span>`;
        responseArea.appendChild(typingDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
        return typingId;
    };

    const removeTypingIndicator = (id) => {
        const indicator = document.getElementById(id);
        if (indicator) indicator.remove();
    };

    const showCallbackStep = (stepId) => {
        document.querySelectorAll('.booking-step').forEach(step => step.classList.remove('active'));
        const targetStep = document.getElementById(stepId);
        if (targetStep) targetStep.classList.add('active');
    };

    const showCallbackError = (message) => {
        let errorElement = document.getElementById('callback-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'callback-error-message';
            errorElement.style.cssText = 'color: red; margin-top: 1rem;';
            document.getElementById('callback-form').prepend(errorElement);
        }
        errorElement.textContent = message;
    };

    const closeCallbackModal = () => {
        const modal = document.getElementById('booking-modal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
        selectedCallbackData = null;
    };
    
    /**
     * Erstellt ein Notfall-Modal, falls das Haupt-Booking-Modal fehlschlägt.
     */
    const createEmergencyFallbackModal = () => {
        const fallbackHTML = `
            <div id="booking-modal" class="callback-modal" style="display: flex;">
                <div class="booking-modal-content">
                    <h3>Technisches Problem</h3>
                    <p>Das Buchungssystem ist nicht verfügbar. Bitte kontaktieren Sie uns direkt:</p>
                    <a href="mailto:michael@designare.at">michael@designare.at</a>
                    <button id="close-fallback-modal" class="booking-btn">Schließen</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', fallbackHTML);
        document.getElementById('close-fallback-modal').addEventListener('click', closeCallbackModal);
    };

    /**
     * Behandelt API-Fehler und zeigt eine passende Nachricht an.
     */
    const handleFetchError = (error, isFromChat) => {
        let errorMessage = "Entschuldigung, es sind technische Schwierigkeiten aufgetreten.";
        if (error.message.includes('Netzwerkfehler')) {
            errorMessage = "🌐 Bitte überprüfe deine Internetverbindung.";
        }
        if (isFromChat) {
            addMessageToHistory(errorMessage, 'ai');
        } else {
            initializeChat(errorMessage);
            showChatModal();
        }
    };


    // ===================================================================
    // 5. EVENT LISTENERS
    // ===================================================================

    // Hauptformular auf der Startseite
    aiForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const question = aiQuestion.value.trim();
        if (question) sendToEvita(question, false);
    });

    // Event-Delegation für dynamisch erstellte Formulare (Chat & Booking)
    document.addEventListener('submit', (event) => {
        // Chat-Formular im Modal
        if (event.target.id === 'ai-chat-form') {
            event.preventDefault();
            const chatInput = document.getElementById('ai-chat-input');
            const userInput = chatInput.value.trim();
            if (userInput) {
                addMessageToHistory(userInput, 'user');
                chatInput.value = '';
                sendToEvita(userInput, true);
            }
        }
        // Booking-Formular im Modal
        if (event.target.id === 'callback-form') {
            submitCallback(event);
        }
    });
    
    // Buttons zum Schließen des Chat-Modals
    closeButtons.forEach(button => button.addEventListener('click', hideChatModal));

    // Event-Delegation für Klicks auf dynamisch erstellte Buttons im Booking-Modal
    document.addEventListener('click', (event) => {
        // "Zurück"-Button im Booking-Modal
        if (event.target.id === 'back-to-slots') {
            showCallbackStep('step-slot-selection');
        }
        // Haupt-Schließen-Button im Booking-Modal
        if (event.target.matches('.booking-modal-close-btn, .confirm-close-btn')) {
            closeCallbackModal();
        }
    });

    // ===================================================================
    // 6. GLOBALE VERFÜGBARKEIT
    // ===================================================================
    // Mache wichtige Funktionen global verfügbar, damit sie von anderen Skripten
    // oder aus der HTML aufgerufen werden können.
    
    window.sendToEvita = sendToEvita;
    window.closeCallbackModal = closeCallbackModal;

    console.log("✅ AI-Form-Modul erfolgreich initialisiert und global registriert.");
};


// ===================================================================
// 7. HTML-TEMPLATES
// ===================================================================
// Das Auslagern von HTML in eine Funktion hält den Code sauber.

function createInlineModalHTML() {
    return `
        <div id="booking-modal" class="callback-modal">
            <div class="booking-modal-content">
                <button class="booking-modal-close-btn">×</button>
                <div class="booking-modal-header">
                    <h2>Rückruf-Termin buchen</h2>
                    <p>Michael ruft dich zum gewünschten Zeitpunkt an.</p>
                </div>
                <div class="booking-modal-body">
                    <div id="step-slot-selection" class="booking-step active">
                        <h3>Wähle deinen Rückruf-Termin:</h3>
                        <div id="callback-loading">Lade verfügbare Termine...</div>
                        <div id="callback-slots-container"></div>
                        <div id="no-slots-message" style="display:none;"></div>
                    </div>
                    <div id="step-contact-details" class="booking-step">
                        <h3>Deine Kontaktdaten:</h3>
                        <div id="selected-slot-display"></div>
                        <form id="callback-form">
                            <div id="callback-error-message"></div>
                            <input type="text" id="callback-name" placeholder="Dein Name *" required>
                            <input type="tel" id="callback-phone" placeholder="Deine Telefonnummer *" required>
                            <textarea id="callback-topic" placeholder="Dein Anliegen (optional)"></textarea>
                            <button type="button" id="back-to-slots">← Zurück</button>
                            <button type="submit" id="submit-callback">Rückruf buchen</button>
                        </form>
                    </div>
                    <div id="step-confirmation" class="booking-step">
                        <h3>Rückruf erfolgreich gebucht!</h3>
                        <div id="confirmation-details"></div>
                        <p>Michael wird dich zum vereinbarten Zeitpunkt anrufen.</p>
                        <button class="booking-btn confirm-close-btn">Perfekt! 👍</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
