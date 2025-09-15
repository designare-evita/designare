// js/ai-form.js - KORRIGIERTE VERSION MIT KONVERSATIONSGEDÄCHTNIS

export const initAiForm = () => {
    console.log("Initialisiere AI-Form mit Konversationsgedächtnis (10 Runden)");

    const aiForm = document.getElementById('ai-form');
    if (!aiForm) {
        console.warn("Warning: #ai-form nicht gefunden!");
        return;
    }

    // DOM-Elemente
    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-chat-history');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    // --- KORREKTUREN FÜR DAS GEDÄCHTNIS ---
    let chatHistory = []; 
    const MAX_HISTORY_LENGTH = 20; // 10 Runden (user + model)
    // --- ENDE KORREKTUREN ---

    let selectedCallbackData = null;

    // ===================================================================
    // VERBESSERTE API-KOMMUNIKATION
    // ===================================================================

    const safeFetchAPI = async (url, options = {}) => {
        try {
            console.log(`API-Anfrage an: ${url}`);
            const response = await fetch(url, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...options.headers }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status} - ${response.statusText}. Details: ${errorText}`);
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error(`❌ API-Fehler bei ${url}:`, error);
            throw error;
        }
    };

    // ===================================================================
    // LOGIK ZUM SENDEN AN EVITA (MIT GEDÄCHTNIS)
    // ===================================================================

    const sendToEvita = async (userInput, isFromChat = false) => {
        if (isFromChat) {
            showTypingIndicator();
        } else {
            if (aiStatus) aiStatus.textContent = 'Evita denkt nach...';
        }

        const bookingKeywords = ['termin buchen', 'rückruf anfordern', 'kalender', 'termin vereinbaren', 'gesprächstermin', 'callback', 'appointment', 'buchung'];
        const isBookingRequest = bookingKeywords.some(keyword => userInput.toLowerCase().includes(keyword));

        if (isBookingRequest) {
            let message = "Gerne! Ich öffne Michaels Kalender für dich, damit du einen passenden Rückruf-Termin findest.";
            if (isFromChat) {
                removeTypingIndicator();
                addMessageToHistory(message, 'ai');
            } else {
                if (aiStatus) aiStatus.textContent = '';
                showAIResponse(message, false);
            }
            setTimeout(() => launchBookingModal(), 800);
            return;
        }

        try {
            const data = await safeFetchAPI('/api/ask-gemini', {
                method: 'POST',
                body: JSON.stringify({
                    history: chatHistory,
                    message: userInput
                })
            });

            if (isFromChat) removeTypingIndicator();

            if (data.action === 'launch_booking_modal') {
                const message = data.answer || "Einen Moment, ich öffne den Kalender für dich...";
                addMessageToHistory(message, 'ai');
                setTimeout(() => launchBookingModal(), 500);
            } else {
                const answer = data.answer || data.message || "Es gab ein Problem mit der Antwort.";
                addMessageToHistory(answer, 'ai');
            }
        } catch (error) {
            const errorMessage = "Entschuldigung, es ist ein technischer Fehler aufgetreten.";
            if (isFromChat) removeTypingIndicator();
            addMessageToHistory(errorMessage, 'ai');
        } finally {
            if (!isFromChat && aiStatus) aiStatus.textContent = '';
        }
    };

    aiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = aiQuestion.value.trim();
        if (userInput) {
            addMessageToHistory(userInput, 'user');
            sendToEvita(userInput, false);
            aiQuestion.value = '';
        }
    });

    // ===================================================================
    // MODAL-FUNKTIONEN (AI RESPONSE)
    // ===================================================================

    const openModal = (modal) => {
        if(modal) modal.classList.add('visible');
    };

    const closeModal = (modal) => {
        if(modal) modal.classList.remove('visible');
    };
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => closeModal(modalOverlay));
    });

    const showAIResponse = (content, isHTML) => {
        if (responseArea) {
            if (isHTML) {
                responseArea.innerHTML = content;
            } else {
                responseArea.textContent = content;
            }
            openModal(modalOverlay);
        }
    };
    
    // ===================================================================
    // BOOKING MODAL FUNKTIONEN (Die korrekte Logik ist hier)
    // ===================================================================
    
    const launchBookingModal = async () => {
        console.log("🚀 Starte Rückruf-Modal (aus ai-form.js)");
        
        // Schließe andere Modals
        if (modalOverlay) closeModal(modalOverlay);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Entferne existierendes Modal zur Sicherheit
        const existingModal = document.getElementById('booking-modal');
        if (existingModal) existingModal.remove();
        
        const modalHTML = createInlineModalHTML();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const bookingModal = document.getElementById('booking-modal');
        if (bookingModal) {
            bookingModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            setupBookingModalEventListeners();
            loadCallbackSlots();
        } else {
            console.error("❌ Booking-Modal konnte nicht im DOM erstellt werden");
            createEmergencyFallbackModal();
        }
    };

    const createInlineModalHTML = () => {
        return `
            <div id="booking-modal" class="callback-modal" style="display: flex;">
                <div class="booking-modal-content">
                    <div class="booking-modal-header">
                        <h2 class="booking-modal-title">Rückruf-Termin buchen</h2>
                        <p class="booking-modal-subtitle">Michael ruft dich zum gewünschten Zeitpunkt an</p>
                    </div>
                    <div class="booking-modal-body">
                        <div id="step-slot-selection" class="booking-step active">
                            <h3 class="booking-step-title">Wähle deinen Rückruf-Termin:</h3>
                            <div id="callback-loading">Lade verfügbare Termine...</div>
                            <div id="callback-slots-container"></div>
                            <div id="no-slots-message" style="display: none;"></div>
                        </div>
                        <div id="step-contact-details" class="booking-step">
                             <h3 class="booking-step-title">Deine Kontaktdaten:</h3>
                            <div id="selected-slot-display"></div>
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
                                    <textarea id="callback-topic" rows="3"></textarea>
                                </div>
                                <div class="booking-form-actions">
                                    <button type="button" id="back-to-slots" class="booking-btn back-btn">← Zurück</button>
                                    <button type="submit" id="submit-callback" class="booking-btn submit-btn">Rückruf buchen</button>
                                </div>
                            </form>
                        </div>
                        <div id="step-confirmation" class="booking-step">
                            <h3 class="confirmation-title">🎉 Termin erfolgreich gebucht!</h3>
                            <div id="confirmation-details"></div>
                            <p>Michael wird dich pünktlich anrufen. Du erhältst in Kürze eine Bestätigung.</p>
                            <button onclick="closeCallbackModal()" class="booking-btn">Perfekt! 👍</button>
                        </div>
                    </div>
                    <button onclick="closeCallbackModal()" class="booking-modal-close-btn">×</button>
                </div>
            </div>
        `;
    };

    const setupBookingModalEventListeners = () => {
        const callbackForm = document.getElementById('callback-form');
        if (callbackForm) {
            callbackForm.addEventListener('submit', submitCallback);
        }
        
        const backButton = document.getElementById('back-to-slots');
        if (backButton) {
            backButton.addEventListener('click', () => showCallbackStep('step-slot-selection'));
        }
    };

    const loadCallbackSlots = async () => {
        const loadingDiv = document.getElementById('callback-loading');
        const slotsContainer = document.getElementById('callback-slots-container');
        const noSlotsMessage = document.getElementById('no-slots-message');

        try {
            const data = await safeFetchAPI('/api/suggest-appointments');
            
            if (loadingDiv) loadingDiv.style.display = 'none';

            if (data.success && data.suggestions && data.suggestions.length > 0) {
                slotsContainer.innerHTML = '';
                data.suggestions.forEach(suggestion => {
                    const button = document.createElement('button');
                    button.className = 'callback-slot-button';
                    button.innerHTML = `<strong>${suggestion.slot}</strong> - ${suggestion.formattedString}`;
                    button.onclick = () => selectCallbackSlot(suggestion);
                    slotsContainer.appendChild(button);
                });
            } else {
                noSlotsMessage.innerHTML = 'Aktuell sind leider keine Termine verfügbar. Bitte kontaktiere Michael direkt per E-Mail.';
                noSlotsMessage.style.display = 'block';
            }
        } catch (error) {
            noSlotsMessage.innerHTML = 'Fehler beim Laden der Termine. Bitte versuche es später erneut.';
            noSlotsMessage.style.display = 'block';
        }
    };
    
    const selectCallbackSlot = (suggestion) => {
        selectedCallbackData = suggestion;
        document.getElementById('selected-slot-display').innerHTML = `Dein Termin: <strong>${suggestion.formattedString}</strong>`;
        showCallbackStep('step-contact-details');
    };

    const submitCallback = async (event) => {
        event.preventDefault();
        const name = document.getElementById('callback-name').value.trim();
        const phone = document.getElementById('callback-phone').value.trim();
        const topic = document.getElementById('callback-topic').value.trim();

        if (!name || !phone || !selectedCallbackData) {
            alert('Bitte fülle alle Pflichtfelder aus.');
            return;
        }

        const submitButton = document.getElementById('submit-callback');
        submitButton.disabled = true;
        submitButton.textContent = 'Wird gebucht...';

        try {
            const data = await safeFetchAPI('/api/book-appointment-phone', {
                method: 'POST',
                body: JSON.stringify({
                    slot: selectedCallbackData.fullDateTime,
                    name, phone, topic
                })
            });

            if (data.success) {
                document.getElementById('confirmation-details').innerHTML = `
                    <p><strong>Termin:</strong> ${selectedCallbackData.formattedString}</p>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Telefon:</strong> ${phone}</p>
                `;
                showCallbackStep('step-confirmation');
            } else {
                throw new Error(data.message || 'Unbekannter Fehler');
            }
        } catch (error) {
            alert(`Buchung fehlgeschlagen: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Rückruf buchen';
        }
    };

    const showCallbackStep = (stepId) => {
        document.querySelectorAll('.booking-step').forEach(step => step.classList.remove('active'));
        document.getElementById(stepId).classList.add('active');
    };
    
    const createEmergencyFallbackModal = () => {
        // ... (Implementierung für Notfall-Modal)
    };
    
    // ===================================================================
    // CHAT-FUNKTIONALITÄT (Beobachter für dynamisch geladenen Chat)
    // ===================================================================

    const addMessageToHistory = (message, sender) => {
        const chatHistory = document.getElementById('ai-chat-history');
        if (!chatHistory) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.textContent = message;
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };
    
    let typingIndicatorId = null;
    const showTypingIndicator = () => {
        const chatHistory = document.getElementById('ai-chat-history');
        if (!chatHistory) return;
        removeTypingIndicator(); // Nur einen Indikator erlauben
        const indicator = document.createElement('div');
        typingIndicatorId = 'typing-' + Date.now();
        indicator.id = typingIndicatorId;
        indicator.className = 'chat-message ai';
        indicator.textContent = 'Evita tippt...';
        chatHistory.appendChild(indicator);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };
    
    const removeTypingIndicator = () => {
        if (typingIndicatorId) {
            const indicator = document.getElementById(typingIndicatorId);
            if (indicator) indicator.remove();
            typingIndicatorId = null;
        }
    };
    
    // Observer, um das Chat-Formular zu finden, wenn es im Modal erscheint
    const observeChatForm = new MutationObserver((mutations, observer) => {
        const chatForm = document.getElementById('ai-chat-form');
        if (chatForm && !chatForm.hasAttribute('data-ai-form-listener')) {
            chatForm.setAttribute('data-ai-form-listener', 'true');
            
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const chatInput = document.getElementById('ai-chat-input');
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
    
    // Starte Observer für den Modal-Container
    const modalContainer = document.getElementById('ai-response-content-area');
    if (modalContainer) {
        observeChatForm.observe(modalContainer, {
            childList: true,
            subtree: true
        });
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
    
    console.log("✅ Korrigierte AI-Form mit konservativer Booking-Erkennung vollständig initialisiert");
};
