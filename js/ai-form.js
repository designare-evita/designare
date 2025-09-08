// VEREINFACHTES BUCHUNGSSYSTEM - Ersetze deine ai-form.js damit

export const initAiForm = () => {
    console.log("🚀 initAiForm mit Ein-Schritt-Buchung gestartet");

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
    // EIN-SCHRITT BUCHUNGSSYSTEM
    // ===================================================================

    const handleDirectBooking = async () => {
        console.log("📞 Lade Ein-Schritt-Buchungsformular");
        
        try {
            // Lade verfügbare Termine
            const response = await fetch('/api/suggest-appointments');
            const data = await response.json();
            
            if (!data.success || !data.suggestions.length) {
                const fallbackHtml = `
                    <div class="booking-error">
                        😔 <strong>Momentan keine Termine verfügbar</strong><br><br>
                        <strong>Alternative Optionen:</strong><br>
                        📧 E-Mail: michael@designare.at<br>
                        📝 Beschreibe dein Anliegen und deine Verfügbarkeit<br><br>
                        Michael meldet sich dann mit alternativen Rückruf-Zeiten!
                    </div>
                `;
                initializeChat(fallbackHtml, true);
                showModal();
                return;
            }
            
            // Erstelle komplettes Buchungsformular
            const bookingFormHtml = `
                <div class="direct-booking-container">
                    <div class="booking-header">
                        <h2>📞 Rückruf-Termin buchen</h2>
                        <p>Michael ruft dich zum vereinbarten Zeitpunkt an.</p>
                    </div>
                    
                    <div class="booking-step">
                        <h3>Schritt 1: Wähle einen Termin</h3>
                        <div class="slots-container">
                            ${data.suggestions.map(slot => `
                                <label class="slot-option">
                                    <input type="radio" name="selected-slot" value="${slot.slot}" 
                                           data-datetime="${slot.fullDateTime}" 
                                           data-formatted="${slot.formattedString}">
                                    <div class="slot-display">
                                        <span class="slot-emoji">${slot.isPreferredTime ? '⭐' : '📞'}</span>
                                        <div class="slot-info">
                                            <strong>Termin ${slot.slot}</strong>
                                            <div class="slot-time">${slot.formattedString}</div>
                                        </div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="booking-step">
                        <h3>Schritt 2: Deine Kontaktdaten</h3>
                        <div class="contact-form">
                            <input type="text" id="booking-name" placeholder="Dein Name" required>
                            <input type="tel" id="booking-phone" placeholder="Deine Telefonnummer" required>
                            <div class="form-hint">Format: Max Mustermann, 0664 123 45 67</div>
                        </div>
                    </div>
                    
                    <div class="booking-actions">
                        <button id="confirm-booking-btn" class="booking-btn primary">
                            📞 Rückruf-Termin bestätigen
                        </button>
                        <button id="cancel-booking-btn" class="booking-btn secondary">
                            Abbrechen
                        </button>
                    </div>
                    
                    <div id="booking-status" class="booking-status hidden"></div>
                </div>
                
                <style>
                .direct-booking-container {
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #fff;
                    font-family: 'Poppins', sans-serif;
                }
                
                .booking-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #ffc107;
                }
                
                .booking-header h2 {
                    color: #ffc107;
                    margin-bottom: 10px;
                }
                
                .booking-step {
                    margin-bottom: 25px;
                }
                
                .booking-step h3 {
                    color: #ffc107;
                    margin-bottom: 15px;
                    font-size: 1.1rem;
                }
                
                .slots-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .slot-option {
                    display: block;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .slot-option input[type="radio"] {
                    display: none;
                }
                
                .slot-display {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border: 2px solid transparent;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                
                .slot-option:hover .slot-display {
                    background: rgba(255,193,7,0.2);
                    border-color: #ffc107;
                }
                
                .slot-option input[type="radio"]:checked + .slot-display {
                    background: rgba(255,193,7,0.3);
                    border-color: #ffc107;
                    box-shadow: 0 4px 15px rgba(255,193,7,0.3);
                }
                
                .slot-emoji {
                    font-size: 1.5rem;
                    margin-right: 15px;
                }
                
                .slot-info {
                    flex-grow: 1;
                }
                
                .slot-info strong {
                    color: #ffc107;
                    font-size: 1rem;
                }
                
                .slot-time {
                    color: #ccc;
                    font-size: 0.9rem;
                    margin-top: 5px;
                }
                
                .contact-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .contact-form input {
                    padding: 15px;
                    border: 2px solid #444;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }
                
                .contact-form input:focus {
                    outline: none;
                    border-color: #ffc107;
                    box-shadow: 0 0 10px rgba(255,193,7,0.3);
                }
                
                .contact-form input::placeholder {
                    color: #999;
                }
                
                .form-hint {
                    font-size: 0.8rem;
                    color: #999;
                    font-style: italic;
                }
                
                .booking-actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                }
                
                .booking-btn {
                    flex: 1;
                    padding: 15px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                
                .booking-btn.primary {
                    background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
                    color: #1a1a1a;
                }
                
                .booking-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255,193,7,0.4);
                }
                
                .booking-btn.secondary {
                    background: #6c757d;
                    color: #fff;
                }
                
                .booking-btn.secondary:hover {
                    background: #5a6268;
                }
                
                .booking-status {
                    margin-top: 20px;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    font-weight: bold;
                }
                
                .booking-status.success {
                    background: rgba(40,167,69,0.2);
                    color: #28a745;
                    border: 2px solid #28a745;
                }
                
                .booking-status.error {
                    background: rgba(220,53,69,0.2);
                    color: #dc3545;
                    border: 2px solid #dc3545;
                }
                
                .booking-status.loading {
                    background: rgba(255,193,7,0.2);
                    color: #ffc107;
                    border: 2px solid #ffc107;
                }
                
                .booking-error {
                    text-align: center;
                    padding: 30px;
                    color: #fff;
                    line-height: 1.6;
                }
                
                .hidden {
                    display: none;
                }
                
                @media (max-width: 600px) {
                    .direct-booking-container {
                        padding: 15px;
                    }
                    
                    .booking-actions {
                        flex-direction: column;
                    }
                    
                    .slot-display {
                        padding: 12px;
                    }
                }
                </style>
            `;
            
            // Zeige das Formular
            initializeChat(bookingFormHtml, true);
            showModal();
            
            // Setup Event-Listener
            setTimeout(() => {
                setupBookingFormListeners();
            }, 100);
            
        } catch (error) {
            console.error('Fehler beim Laden der Buchung:', error);
            initializeChat("Fehler beim Laden der Termine. Bitte versuche es später erneut.", false);
            showModal();
        }
    };

    const setupBookingFormListeners = () => {
        const confirmBtn = document.getElementById('confirm-booking-btn');
        const cancelBtn = document.getElementById('cancel-booking-btn');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', handleBookingConfirmation);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                hideModal();
            });
        }
    };

    const handleBookingConfirmation = async () => {
        const selectedSlot = document.querySelector('input[name="selected-slot"]:checked');
        const nameInput = document.getElementById('booking-name');
        const phoneInput = document.getElementById('booking-phone');
        const statusDiv = document.getElementById('booking-status');
        
        // Validierung
        if (!selectedSlot) {
            showBookingStatus('Bitte wähle einen Termin aus.', 'error');
            return;
        }
        
        if (!nameInput?.value.trim()) {
            showBookingStatus('Bitte gib deinen Namen ein.', 'error');
            nameInput?.focus();
            return;
        }
        
        if (!phoneInput?.value.trim()) {
            showBookingStatus('Bitte gib deine Telefonnummer ein.', 'error');
            phoneInput?.focus();
            return;
        }
        
        // Loading-Status
        showBookingStatus('Erstelle Rückruf-Termin...', 'loading');
        
        try {
            const response = await fetch('/api/book-appointment-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: selectedSlot.dataset.datetime,
                    name: nameInput.value.trim(),
                    phone: phoneInput.value.trim()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showBookingStatus(`
                    ✅ <strong>Rückruf-Termin erfolgreich gebucht!</strong><br><br>
                    <strong>Termin:</strong> ${selectedSlot.dataset.formatted}<br>
                    <strong>Name:</strong> ${nameInput.value.trim()}<br>
                    <strong>Telefon:</strong> ${phoneInput.value.trim()}<br><br>
                    Michael ruft dich zum vereinbarten Zeitpunkt an!
                `, 'success');
                
                // Formular verstecken
                document.querySelector('.booking-step')?.style.setProperty('display', 'none');
                document.querySelectorAll('.booking-step')[1]?.style.setProperty('display', 'none');
                document.querySelector('.booking-actions')?.style.setProperty('display', 'none');
                
            } else {
                showBookingStatus(`Fehler bei der Buchung: ${result.message}`, 'error');
            }
            
        } catch (error) {
            console.error('Buchungsfehler:', error);
            showBookingStatus('Fehler bei der Buchung. Bitte versuche es erneut.', 'error');
        }
    };

    const showBookingStatus = (message, type) => {
        const statusDiv = document.getElementById('booking-status');
        if (statusDiv) {
            statusDiv.innerHTML = message;
            statusDiv.className = `booking-status ${type}`;
        }
    };

    // ===================================================================
    // NORMALE API-KOMMUNIKATION
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

            // Prüfe auf Buchungsanfrage
            if (data.action === 'smart_booking') {
                console.log("🎯 BOOKING REQUEST ERKANNT!");
                await handleDirectBooking();
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
            }

        } catch (error) {
            console.error(`❌ Fehler bei ${isFromChat ? 'Chat-' : ''}Anfrage:`, error);
            const errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten.";
            
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
    // EVENT-HANDLER
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
        const chatInput = document.getElementById('ai-chat-input');
        if (!chatInput) return;

        const userInput = chatInput.value.trim();
        if (!userInput) return;

        addMessageToHistory(userInput, 'user');
        chatInput.value = '';
        await sendToEvita(userInput, true);
    };

    // Event-Listener Setup
    aiForm.addEventListener('submit', handleFormSubmit);
    
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            handleChatSubmit(e);
        }
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', hideModal);
    });

    console.log("✅ Ein-Schritt-Buchungssystem initialisiert");
};
