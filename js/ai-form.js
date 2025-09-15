// js/ai-form.js - KORREKTE VERSION mit booking.css und Conversation Memory

export const initAiForm = () => {
    console.log("🚀 Initialisiere AI-Form mit Evita Conversation Memory");

    const aiForm = document.getElementById('ai-form');
    if (!aiForm) {
        console.warn("Warning: #ai-form nicht gefunden!");
        return;
    }

    // DOM-Elemente
    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    // Chat-Historie für Evita's Gedächtnis
    let chatHistory = [];

    // ===================================================================
    // HILFSFUNKTIONEN
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

    const addMessageToHistory = (message, sender) => {
        console.log(`💬 Nachricht hinzufügen: ${sender}: ${message.substring(0, 50)}...`);
        
        const chatHistoryDiv = document.getElementById('ai-chat-history');
        if (!chatHistoryDiv) {
            console.warn("Chat-History Div nicht gefunden");
            return;
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.textContent = message;
        
        chatHistoryDiv.appendChild(msgDiv);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        // Füge zur Evita's Gedächtnis hinzu
        chatHistory.push({ role: sender === 'user' ? 'user' : 'assistant', content: message });
        
        // Begrenze Historie auf 20 Nachrichten (10 Runden)
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
    };

    const openAIModal = () => {
        console.log("🔓 Öffne AI-Modal");
        if (modalOverlay) {
            modalOverlay.classList.add('visible');
            modalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('no-scroll');
            
            // Fokus auf Chat-Input setzen
            setTimeout(() => {
                const chatInput = document.getElementById('ai-chat-input');
                if (chatInput) {
                    chatInput.focus();
                }
            }, 300);
        }
    };

    const closeAIModal = () => {
        console.log("🔒 Schließe AI-Modal");
        if (modalOverlay) {
            modalOverlay.classList.remove('visible');
            modalOverlay.style.display = 'none';
            document.body.style.overflow = '';
            document.body.classList.remove('no-scroll');
        }
    };

    // ===================================================================
    // RÜCKRUF-MODAL MIT BOOKING.CSS
    // ===================================================================

    const launchCallbackModal = async () => {
        console.log("📞 Starte Rückruf-Modal (mit booking.css)");
        
        // Schließe Chat-Modal
        closeAIModal();
        
        // Kurze Pause für bessere UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Entferne existierendes Rückruf-Modal zur Sicherheit
        const existingModal = document.getElementById('booking-modal');
        if (existingModal) existingModal.remove();
        
        // Erstelle das Rückruf-Modal HTML (nutzt booking.css Klassen)
        const modalHTML = createCallbackModalHTML();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const callbackModal = document.getElementById('booking-modal');
        if (callbackModal) {
            callbackModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('no-scroll');
            
            // Event-Listener für das Rückruf-Modal einrichten
            setupCallbackModalEventListeners();
            
            // Lade verfügbare Rückruf-Termine
            loadCallbackSlots();
            
            console.log("✅ Rückruf-Modal erfolgreich gestartet");
        } else {
            console.error("❌ Rückruf-Modal konnte nicht erstellt werden");
            createEmergencyFallbackModal();
        }
    };

    const createCallbackModalHTML = () => {
        return `
            <div id="booking-modal" class="callback-modal">
                <div class="booking-modal-content">
                    <div class="booking-modal-header">
                        <div class="booking-modal-header-icon">📞</div>
                        <h2 class="booking-modal-title">Rückruf-Termin buchen</h2>
                        <p class="booking-modal-subtitle">Michael ruft dich zum gewünschten Zeitpunkt an</p>
                    </div>
                    
                    <div class="booking-modal-body">
                        <!-- Schritt 1: Slot-Auswahl -->
                        <div id="step-slot-selection" class="booking-step active">
                            <h3 class="booking-step-title">Wähle deinen Rückruf-Termin:</h3>
                            
                            <div id="callback-loading">
                                <div>
                                    <div class="loader-icon">⏳</div>
                                    Lade verfügbare Rückruf-Termine...
                                </div>
                            </div>
                            
                            <div id="callback-slots-container"></div>
                            
                            <div id="no-slots-message">
                                <div class="icon">😔</div>
                                Aktuell sind leider keine Termine verfügbar.<br>
                                Bitte kontaktiere Michael direkt per E-Mail: 
                                <a href="mailto:michael@designare.at">michael@designare.at</a>
                            </div>
                        </div>
                        
                        <!-- Schritt 2: Kontaktdaten -->
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
                                    <textarea id="callback-topic" rows="3" placeholder="Kurze Beschreibung deines Anliegens..."></textarea>
                                </div>
                                
                                <div class="booking-form-actions">
                                    <button type="button" id="back-to-slots" class="booking-btn back-btn">← Zurück</button>
                                    <button type="submit" id="submit-callback" class="booking-btn submit-btn">📞 Rückruf buchen</button>
                                </div>
                            </form>
                        </div>
                        
                        <!-- Schritt 3: Bestätigung -->
                        <div id="step-confirmation" class="booking-step">
                            <div class="confirmation-content">
                                <div class="confirmation-icon">🎉</div>
                                <h3 class="confirmation-title">Rückruf-Termin erfolgreich gebucht!</h3>
                                <div id="confirmation-details"></div>
                                <p class="confirmation-subtext">📞 <strong>Michael wird dich zum vereinbarten Zeitpunkt anrufen.</strong><br>Halte bitte dein Telefon 5 Minuten vor dem Termin bereit.</p>
                                <button onclick="closeCallbackModal()" class="booking-btn confirm-close-btn">Perfekt! 👍</button>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="closeCallbackModal()" class="booking-modal-close-btn">×</button>
                </div>
            </div>
        `;
    };

    const setupCallbackModalEventListeners = () => {
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
                    button.innerHTML = `
                        <div class="slot-icon">📅</div>
                        <div class="slot-info">
                            <div class="slot-title">Slot ${suggestion.slot}</div>
                            <div class="slot-time">${suggestion.formattedString}</div>
                        </div>
                        <div class="slot-arrow">→</div>
                    `;
                    button.onclick = () => selectCallbackSlot(suggestion);
                    slotsContainer.appendChild(button);
                });
            } else {
                noSlotsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error("Fehler beim Laden der Rückruf-Termine:", error);
            noSlotsMessage.innerHTML = `
                <div class="icon">❌</div>
                Fehler beim Laden der Termine.<br>
                Bitte versuche es später erneut oder kontaktiere Michael direkt.
            `;
            noSlotsMessage.style.display = 'block';
        }
    };

    let selectedCallbackData = null;
    
    const selectCallbackSlot = (suggestion) => {
        console.log("📞 Rückruf-Slot ausgewählt:", suggestion);
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
                    <div><strong>Termin:</strong> ${selectedCallbackData.formattedString}</div>
                    <div><strong>Name:</strong> ${name}</div>
                    <div><strong>Telefon:</strong> ${phone}</div>
                    ${topic ? `<div><strong>Anliegen:</strong> ${topic}</div>` : ''}
                    <div class="confirmation-notice">
                        <strong>Wichtig:</strong> Michael wird dich ca. 5 Minuten vor dem Termin anrufen.
                    </div>
                `;
                showCallbackStep('step-confirmation');
            } else {
                throw new Error(data.message || 'Unbekannter Fehler');
            }
        } catch (error) {
            alert(`Buchung fehlgeschlagen: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '📞 Rückruf buchen';
        }
    };

    const showCallbackStep = (stepId) => {
        document.querySelectorAll('.booking-step').forEach(step => step.classList.remove('active'));
        document.getElementById(stepId).classList.add('active');
    };

    const createEmergencyFallbackModal = () => {
        const fallbackHTML = `
            <div id="booking-modal" class="callback-modal">
                <div class="fallback-modal-content">
                    <div class="fallback-modal-header">
                        <div class="fallback-icon">😔</div>
                        <h2 class="fallback-title">Rückruf-System nicht verfügbar</h2>
                    </div>
                    <div class="fallback-modal-body">
                        <p>Das Rückruf-System konnte leider nicht geladen werden.</p>
                        <a href="mailto:michael@designare.at" class="fallback-email-link">📧 Michael direkt kontaktieren</a>
                        <button onclick="closeCallbackModal()" class="booking-btn fallback-close-btn">Schließen</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', fallbackHTML);
        document.getElementById('booking-modal').style.display = 'flex';
    };

    // ===================================================================
    // EVITA CONVERSATION - MIT GEDÄCHTNIS UND RÜCKFRAGE
    // ===================================================================

    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log("🤖 Sende an Evita (mit Gedächtnis):", userInput);
        
        if (isFromChat) {
            showTypingIndicator();
        } else {
            if (aiStatus) aiStatus.textContent = 'Evita denkt nach...';
        }

        try {
            // Sende die KOMPLETTE Chat-Historie an Evita (für Gedächtnis)
            const data = await safeFetchAPI('/api/ask-gemini', {
                method: 'POST',
                body: JSON.stringify({
                    history: chatHistory, // <-- WICHTIG: Evita's Gedächtnis
                    message: userInput
                })
            });

            if (isFromChat) removeTypingIndicator();

            // Prüfe ob Evita das Rückruf-Modal öffnen möchte
            if (data.action === 'launch_booking_modal') {
                const message = data.answer || "Einen Moment, ich öffne den Kalender für dich...";
                addMessageToHistory(message, 'ai');
                setTimeout(() => launchCallbackModal(), 500);
            } else {
                const answer = data.answer || data.message || "Es gab ein Problem mit der Antwort.";
                addMessageToHistory(answer, 'ai');
                
                // Prüfe auf Booking-Trigger in Evita's Antwort
                if (answer.includes('[buchung_starten]')) {
                    setTimeout(() => launchCallbackModal(), 800);
                }
            }
        } catch (error) {
            const errorMessage = "Entschuldigung, es ist ein technischer Fehler aufgetreten.";
            if (isFromChat) removeTypingIndicator();
            addMessageToHistory(errorMessage, 'ai');
            console.error("Evita Conversation Error:", error);
        } finally {
            if (!isFromChat && aiStatus) aiStatus.textContent = '';
        }
    };

    // ===================================================================
    // TYPING INDICATORS
    // ===================================================================

    let typingIndicatorId = null;
    
    const showTypingIndicator = () => {
        const chatHistoryDiv = document.getElementById('ai-chat-history');
        if (!chatHistoryDiv) return;
        
        removeTypingIndicator();
        
        const indicator = document.createElement('div');
        typingIndicatorId = 'typing-' + Date.now();
        indicator.id = typingIndicatorId;
        indicator.className = 'chat-message ai';
        indicator.innerHTML = '<i>Evita tippt...</i>';
        chatHistoryDiv.appendChild(indicator);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    };
    
    const removeTypingIndicator = () => {
        if (typingIndicatorId) {
            const indicator = document.getElementById(typingIndicatorId);
            if (indicator) indicator.remove();
            typingIndicatorId = null;
        }
    };

    // ===================================================================
    // EVENT LISTENERS
    // ===================================================================

    // Haupt-Formular (Index-Seite)
    aiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = aiQuestion.value.trim();
        if (userInput) {
            // Modal öffnen
            openAIModal();
            
            // User-Nachricht hinzufügen und verarbeiten
            addMessageToHistory(userInput, 'user');
            sendToEvita(userInput, true);
            
            aiQuestion.value = '';
        }
    });

    // Chat-Form im Modal (dynamisch)
    const setupChatFormListener = () => {
        const aiChatForm = document.getElementById('ai-chat-form');
        const aiChatInput = document.getElementById('ai-chat-input');
        
        if (aiChatForm && aiChatInput && !aiChatForm.hasAttribute('data-listener-added')) {
            console.log("🔧 Richte Chat-Form Event-Listener ein");
            
            aiChatForm.setAttribute('data-listener-added', 'true');
            
            aiChatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userInput = aiChatInput.value.trim();
                if (!userInput) return;
                
                console.log("💬 Chat-Form Submit:", userInput);
                addMessageToHistory(userInput, 'user');
                await sendToEvita(userInput, true);
                aiChatInput.value = '';
            });
            
            console.log("✅ Chat-Form Event-Listener eingerichtet");
        } else {
            setTimeout(setupChatFormListener, 100);
        }
    };

    // Modal-Schließen Event-Listener
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAIModal);
    });

    // Hintergrund-Klick zum Schließen
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeAIModal();
        }
    });

    // Observer für dynamisch geladene Chat-Form
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                setupChatFormListener();
            }
        });
    });

    const modalContainer = document.getElementById('ai-response-content-area');
    if (modalContainer) {
        observer.observe(modalContainer, {
            childList: true,
            subtree: true
        });
    }

    // Starte Chat-Form Listener Setup
    setupChatFormListener();

    // ===================================================================
    // GLOBALE FUNKTIONEN
    // ===================================================================

    window.launchCallbackFromAnywhere = launchCallbackModal;
    
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

    console.log("✅ AI-Form mit Evita Gedächtnis und booking.css vollständig initialisiert");
};
