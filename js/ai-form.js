// js/ai-form.js - Refactored for Clarity and Maintainability

/**
 * Initialisiert das gesamte AI-Chat-Modul, einschließlich des Evita-Chats
 * und des Rückruf-Buchungs-Modals.
 * Dieses Skript ist so konzipiert, dass es auf allen Seiten der Website funktioniert.
 */
export const initAiForm = () => {
    console.log("🚀 Initialisiere AI-Form-Modul (Refactored Version)");

    // ===================================================================
    // ZENTRALER ZUSTAND (State Management)
    // ===================================================================
    const state = {
        chatHistory: [], // Speichert die Konversationshistorie für die API
        selectedCallbackData: null, // Speichert die Daten des ausgewählten Rückruf-Termins
        typingIndicatorId: null // Hält die ID des "tippt..."-Indikators
    };

    // ===================================================================
    // Puls
    // ===================================================================


    function initCircuitAnimation() {
    const modalContent = document.querySelector('#ai-response-modal .modal-content');
    if (!modalContent) return;

    // Definiere die Knotenpunkt-Positionen (relativ zum 30px Grid)
    const nodePositions = [
        { x: 15, y: 15 },
        { x: 45, y: 45 }, 
        { x: 75, y: 15 },
        { x: 15, y: 75 },
        { x: 60, y: 30 }
    ];

    // Erstelle die Pulse-Dots
    const dots = nodePositions.map((pos, index) => {
        const dot = document.createElement('div');
        dot.className = 'circuit-pulse-dot';
        dot.style.left = pos.x + 'px';
        dot.style.top = pos.y + 'px';
        modalContent.appendChild(dot);
        return dot;
    });

    let currentIndex = 0;

    function pulseNext() {
        // Alle Punkte ausschalten
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Nächsten Punkt einschalten
        dots[currentIndex].classList.add('active');
        
        // Nach 800ms wieder ausschalten
        setTimeout(() => {
            dots[currentIndex].classList.remove('active');
        }, 800);
        
        // Nächster Index
        currentIndex = (currentIndex + 1) % dots.length;
        
        // Nächsten Puls nach 3-5 Sekunden (zufällig)
        setTimeout(pulseNext, 3000 + Math.random() * 2000);
    }

    // Erste Aktivierung nach 2 Sekunden
    setTimeout(pulseNext, 2000);
}

// Rufe die Funktion auf, wenn das Modal geöffnet wird
const originalOpenChatModal = ModalController.openChatModal;
ModalController.openChatModal = function() {
    originalOpenChatModal.call(this);
    setTimeout(initCircuitAnimation, 500);
};

    // ===================================================================
    // DOM-ELEMENTE (Selektoren an einem Ort)
    // ===================================================================
    const DOM = {
        // Haupt-Formular auf der Startseite
        aiForm: document.getElementById('ai-form'),
        aiQuestionInput: document.getElementById('ai-question'),
        aiStatus: document.getElementById('ai-status'),

        // Chat-Modal
        modalOverlay: document.getElementById('ai-response-modal'),
        closeModalButtons: document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom'),
        chatHistoryContainer: document.getElementById('ai-chat-history'),
        chatForm: document.getElementById('ai-chat-form'),
        chatInput: document.getElementById('ai-chat-input'),

        // Header Button
        headerChatButton: document.getElementById('evita-chat-button'),

        // Dynamische Elemente (werden später gesucht)
        get chatForm() {
            return document.getElementById('ai-chat-form');
        },
        get chatInput() {
            return document.getElementById('ai-chat-input');
        }
    };

    // ===================================================================
    // MODUL: API Handler
    // Kümmert sich um die gesamte Kommunikation mit den Server-Endpunkten.
    // ===================================================================
    const ApiHandler = {
        /**
         * Eine sichere Fetch-Funktion mit verbessertem Logging und Fehlerbehandlung.
         * @param {string} url - Die Endpunkt-URL.
         * @param {object} options - Fetch-Optionen (z.B. method, body).
         * @returns {Promise<object|string>} - Die geparste JSON-Antwort oder Text.
         */
        async safeFetch(url, options = {}) {
            console.log(`🔄 API-Anfrage an: ${url}`);
            if (options.body) {
                console.log(`📤 Sende Daten:`, JSON.parse(options.body));
            }

            try {
                const response = await fetch(url, {
                    ...options,
                    headers: { 'Content-Type': 'application/json', ...options.headers }
                });

                console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ API-Fehler: ${response.status} - ${errorText}`);
                    throw new Error(`Serverfehler: ${response.statusText}`);
                }

                const contentType = response.headers.get('content-type');
                const responseData = contentType?.includes('application/json')
                    ? await response.json()
                    : await response.text();
                
                console.log(`📋 API-Antwort erhalten:`, responseData);
                return responseData;

            } catch (error) {
                console.error(`❌ Kritischer API-Fehler bei ${url}:`, error);
                throw error;
            }
        },

        /**
         * Sendet die Nutzer-Nachricht und die Historie an die Gemini-API.
         * @param {string} userInput - Die aktuelle Nachricht des Nutzers.
         * @returns {Promise<object>} - Die Antwort der KI.
         */
        sendToEvita(userInput) {
            const requestData = {
                history: state.chatHistory,
                message: userInput
            };
            return this.safeFetch('/api/ask-gemini', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
        },

        /**
         * Ruft die verfügbaren Rückruf-Termine ab.
         * @returns {Promise<object>} - Die Liste der verfügbaren Termine.
         */
        getAvailableSlots() {
            return this.safeFetch('/api/suggest-appointments');
        },
        
        /**
         * Bucht einen Rückruf-Termin.
         * @param {object} bookingData - Die Daten für die Buchung (slot, name, phone, topic).
         * @returns {Promise<object>} - Die Bestätigung der Buchung.
         */
        bookAppointment(bookingData) {
            return this.safeFetch('/api/book-appointment-phone', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });
        }
    };
    
    // ===================================================================
    // MODUL: Chat UI
    // Verwaltet alle Interaktionen und Anzeigen im Chat-Fenster.
    // ===================================================================
    const ChatUI = {
        /**
         * Fügt eine Nachricht zur Chat-Anzeige und zur `state.chatHistory` hinzu.
         * @param {string} message - Der Text der Nachricht.
         * @param {string} sender - 'user' oder 'ai'.
         */
        addMessage(message, sender) {
            if (!DOM.chatHistoryContainer) return;

            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${sender}`;
            msgDiv.textContent = message;
            DOM.chatHistoryContainer.appendChild(msgDiv);
            DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;

            // Zur API-Historie hinzufügen
            state.chatHistory.push({ role: sender === 'user' ? 'user' : 'assistant', content: message });
            
            // Historie begrenzen, um den Kontext nicht zu überladen
            if (state.chatHistory.length > 20) {
                state.chatHistory = state.chatHistory.slice(-20);
            }
        },

        /**
         * Zeigt den "tippt..."-Indikator an.
         */
        showTypingIndicator() {
            this.removeTypingIndicator(); // Sicherstellen, dass kein alter Indikator existiert
            if (!DOM.chatHistoryContainer) return;
            
            const indicator = document.createElement('div');
            state.typingIndicatorId = 'typing-' + Date.now();
            indicator.id = state.typingIndicatorId;
            indicator.className = 'chat-message ai';
            indicator.innerHTML = '<i>Evita tippt...</i>';
            DOM.chatHistoryContainer.appendChild(indicator);
            DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
        },

        /**
         * Entfernt den "tippt..."-Indikator.
         */
        removeTypingIndicator() {
            if (state.typingIndicatorId) {
                const indicator = document.getElementById(state.typingIndicatorId);
                if (indicator) indicator.remove();
                state.typingIndicatorId = null;
            }
        },
        
        /**
         * Leert das Chat-Fenster und die Historie für eine neue Konversation.
         */
        resetChat() {
            if (DOM.chatHistoryContainer) {
                DOM.chatHistoryContainer.innerHTML = '';
            }
            state.chatHistory = [];
        }
    };

    // ===================================================================
    // MODUL: Modal Controller
    // Steuert das Öffnen und Schließen der verschiedenen Modals.
    // ===================================================================
    const ModalController = {
        /**
         * Öffnet das AI-Chat-Modal.
         */
        openChatModal() {
            if (!DOM.modalOverlay) return;
            DOM.modalOverlay.style.display = 'flex';
            document.body.classList.add('no-scroll');
            
            setTimeout(() => {
                DOM.modalOverlay.classList.add('visible');
                DOM.chatInput?.focus();
            }, 10);
        },

        /**
         * Schließt das AI-Chat-Modal.
         */
        closeChatModal() {
            if (!DOM.modalOverlay) return;
            DOM.modalOverlay.classList.remove('visible');
            setTimeout(() => {
                DOM.modalOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }, 300);
        }
    };
    
    // ===================================================================
    // MODUL: Booking Modal
    // Enthält die gesamte Logik für das Rückruf-Buchungs-Modal.
    // ===================================================================
    const BookingModal = {
        /**
         * Startet und zeigt das Rückruf-Buchungs-Modal an.
         */
        async launch() {
            console.log("📞 Starte Rückruf-Modal");
            ModalController.closeChatModal();
            await new Promise(resolve => setTimeout(resolve, 300)); // Kurze Pause für UX

            this.remove(); // Altes Modal sicherheitshalber entfernen
            
            const modalHTML = this.createHTML();
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modal = document.getElementById('booking-modal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.classList.add('no-scroll');
                this.setupEventListeners();
                this.loadSlots();
            } else {
                 console.error("❌ Rückruf-Modal konnte nicht erstellt werden.");
            }
        },

        /**
         * Entfernt das Buchungs-Modal aus dem DOM.
         */
        remove() {
            const modal = document.getElementById('booking-modal');
            if (modal) {
                modal.remove();
            }
            document.body.classList.remove('no-scroll');
            state.selectedCallbackData = null;
            console.log("✅ Rückruf-Modal geschlossen.");
        },

        /**
         * Generiert das HTML für das clean gestaltete Modal.
         * @returns {string} - Das HTML-Markup für das Modal.
         */
        createHTML() {
             return `
                <div id="booking-modal" class="callback-modal">
                    <div class="booking-modal-content">
                        <div class="booking-modal-header">
                            <h2 class="booking-modal-title">Rückruf vereinbaren</h2>
                            <p class="booking-modal-subtitle">Wähle einen passenden Zeitpunkt für unser Gespräch.</p>
                        </div>
                        <div class="booking-modal-body">
                            <div id="step-slot-selection" class="booking-step active">
                                <h3 class="booking-step-title">Verfügbare Termine</h3>
                                <div id="callback-loading">Lade Termine...</div>
                                <div id="callback-slots-container"></div>
                                <div id="no-slots-message" style="display: none;">
                                    <p>Aktuell sind leider keine Termine verfügbar.<br>
                                    Bitte kontaktiere Michael direkt per E-Mail: 
                                    <a href="mailto:michael@designare.at">michael@designare.at</a></p>
                                </div>
                            </div>
                            <div id="step-contact-details" class="booking-step">
                                <div id="selected-slot-display"></div>
                                <h3 class="booking-step-title">Deine Kontaktdaten</h3>
                                <form id="callback-form">
                                    <div class="booking-form-group"><label for="callback-name">Dein Name *</label><input type="text" id="callback-name" required></div>
                                    <div class="booking-form-group"><label for="callback-phone">Deine Telefonnummer *</label><input type="tel" id="callback-phone" required placeholder="z.B. 0664 123 45 67"></div>
                                    <div class="booking-form-group"><label for="callback-topic">Dein Anliegen (optional)</label><textarea id="callback-topic" rows="3" placeholder="Worum geht es bei deinem Projekt?"></textarea></div>
                                    <div class="booking-form-actions">
                                        <button type="button" id="back-to-slots" class="booking-btn back-btn">Zurück</button>
                                        <button type="submit" id="submit-callback" class="booking-btn submit-btn">Rückruf buchen</button>
                                    </div>
                                </form>
                            </div>
                            <div id="step-confirmation" class="booking-step">
                                <div class="confirmation-content">
                                    <div class="confirmation-icon">✓</div>
                                    <h3 class="confirmation-title">Termin erfolgreich gebucht!</h3>
                                    <p class="confirmation-subtext">Michael wird sich zum vereinbarten Zeitpunkt bei dir melden.</p>
                                    <div id="confirmation-details"></div>
                                    <button onclick="closeCallbackModal()" class="booking-btn confirm-close-btn">Fenster schließen</button>
                                </div>
                            </div>
                        </div>
                        <button onclick="closeCallbackModal()" class="booking-modal-close-btn">&times;</button>
                    </div>
                </div>
            `;
        },

        /**
         * Richtet die Event-Listener für das Buchungs-Modal ein.
         */
        setupEventListeners() {
            document.getElementById('callback-form')?.addEventListener('submit', (e) => this.handleSubmit(e));
            document.getElementById('back-to-slots')?.addEventListener('click', () => this.showStep('step-slot-selection'));
        },
        
        /**
         * Lädt die verfügbaren Termine und zeigt sie an.
         */
        async loadSlots() {
            const loadingDiv = document.getElementById('callback-loading');
            const slotsContainer = document.getElementById('callback-slots-container');
            const noSlotsMessage = document.getElementById('no-slots-message');

            try {
                const data = await ApiHandler.getAvailableSlots();
                if (loadingDiv) loadingDiv.style.display = 'none';

                if (data.success && data.suggestions?.length > 0) {
                    slotsContainer.innerHTML = '';
                    data.suggestions.forEach(suggestion => {
                        const button = document.createElement('button');
                        button.className = 'callback-slot-button';
                        button.innerHTML = `
                            <div class="slot-info">
                                <div class="slot-time">${suggestion.formattedString.split(', ')[1]}</div>
                                <div class="slot-day">${suggestion.formattedString.split(', ')[0]}</div>
                            </div>
                            <div class="slot-arrow">→</div>
                        `;
                        button.onclick = () => this.selectSlot(suggestion);
                        slotsContainer.appendChild(button);
                    });
                } else {
                    noSlotsMessage.style.display = 'block';
                }
            } catch (error) {
                noSlotsMessage.innerHTML = 'Fehler beim Laden der Termine. Bitte versuche es später erneut.';
                noSlotsMessage.style.display = 'block';
            }
        },

        /**
         * Verarbeitet die Auswahl eines Termin-Slots.
         * @param {object} suggestion - Die Daten des ausgewählten Termins.
         */
        selectSlot(suggestion) {
            state.selectedCallbackData = suggestion;
            document.getElementById('selected-slot-display').innerHTML = `Dein Termin: <strong>${suggestion.formattedString}</strong>`;
            this.showStep('step-contact-details');
        },

        /**
         * Verarbeitet das Absenden des Buchungs-Formulars.
         * @param {Event} event - Das Submit-Event.
         */
        async handleSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const submitButton = form.querySelector('#submit-callback');
            const name = form.querySelector('#callback-name').value.trim();
            const phone = form.querySelector('#callback-phone').value.trim();
            const topic = form.querySelector('#callback-topic').value.trim();

            if (!name || !phone || !state.selectedCallbackData) {
                alert('Bitte fülle alle Pflichtfelder aus.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Wird gebucht...';

            try {
                const data = await ApiHandler.bookAppointment({
                    slot: state.selectedCallbackData.fullDateTime,
                    name, phone, topic
                });

                if (data.success) {
                    document.getElementById('confirmation-details').innerHTML = `
                        <div><strong>Termin:</strong> ${state.selectedCallbackData.formattedString}</div>
                        <div><strong>Name:</strong> ${name}</div>
                        <div><strong>Telefon:</strong> ${phone}</div>
                        ${topic ? `<div><strong>Anliegen:</strong> ${topic}</div>` : ''}
                    `;
                    this.showStep('step-confirmation');
                } else {
                    throw new Error(data.message || 'Unbekannter Buchungsfehler');
                }
            } catch (error) {
                alert(`Buchung fehlgeschlagen: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Rückruf buchen';
            }
        },

        /**
         * Zeigt einen bestimmten Schritt im Modal an (z.B. Terminauswahl, Bestätigung).
         * @param {string} stepId - Die ID des anzuzeigenden Schritts.
         */
        showStep(stepId) {
            document.querySelectorAll('.booking-step').forEach(step => step.classList.remove('active'));
            document.getElementById(stepId)?.classList.add('active');
        }
    };
    
    // ===================================================================
    // KERNLOGIK: Conversation Flow
    // Steuert den Ablauf des Chats mit Evita.
    // ===================================================================
    async function handleUserMessage(userInput) {
        ChatUI.addMessage(userInput, 'user');
        ChatUI.showTypingIndicator();

        try {
            const data = await ApiHandler.sendToEvita(userInput);
            ChatUI.removeTypingIndicator();

            let answer = "Entschuldigung, ich konnte keine passende Antwort finden.";
            if (typeof data === 'string') answer = data;
            else if (data?.answer) answer = data.answer;
            else if (data?.message) answer = data.message;
            
            ChatUI.addMessage(answer, 'ai');

            // Prüfen, ob eine Aktion ausgelöst werden soll (z.B. Buchungs-Modal öffnen)
            if (data?.action === 'launch_booking_modal' || answer.includes('[buchung_starten]')) {
                setTimeout(() => BookingModal.launch(), 800);
            }

        } catch (error) {
            ChatUI.removeTypingIndicator();
            ChatUI.addMessage(`Entschuldigung, es ist ein technischer Fehler aufgetreten: ${error.message}`, 'ai');
        }
    }
    
    // ===================================================================
    // EVENT LISTENERS SETUP
    // Verbindet die UI-Elemente mit den entsprechenden Aktionen.
    // ===================================================================
    function initializeEventListeners() {
        // Listener für das Hauptformular auf der Startseite (falls vorhanden)
        if (DOM.aiForm) {
            DOM.aiForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const userInput = DOM.aiQuestionInput.value.trim();
                if (userInput) {
                    ChatUI.resetChat();
                    ModalController.openChatModal();
                    handleUserMessage(userInput);
                    DOM.aiQuestionInput.value = '';
                }
            });
        }

        // Listener für das Chat-Formular im Modal (wird dynamisch eingerichtet)
        const setupChatFormListener = () => {
            const chatForm = DOM.chatForm; // Getter verwenden
            if (chatForm && !chatForm.hasAttribute('data-listener-added')) {
                chatForm.setAttribute('data-listener-added', 'true');
                chatForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const chatInput = DOM.chatInput; // Getter verwenden
                    const userInput = chatInput.value.trim();
                    if (userInput) {
                        await handleUserMessage(userInput);
                        chatInput.value = '';
                    }
                });
            }
        };
        // Observer, um das Chat-Formular zu finden, sobald es im DOM ist
        new MutationObserver(setupChatFormListener).observe(document.body, { childList: true, subtree: true });

        // Listener für den Header-Chat-Button
        DOM.headerChatButton?.addEventListener('click', (e) => {
            e.preventDefault();
            ChatUI.resetChat();
            ChatUI.addMessage("Hallo! Ich bin Evita, Michaels persönliche KI-Assistentin. Womit kann ich dir heute helfen?", 'ai');
            ModalController.openChatModal();
        });

        // Listener zum Schließen des Chat-Modals
        DOM.closeModalButtons.forEach(button => button.addEventListener('click', ModalController.closeChatModal));
        DOM.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === DOM.modalOverlay) ModalController.closeChatModal();
        });
    }

    // ===================================================================
    // GLOBALE FUNKTIONEN (falls von außerhalb benötigt)
    // ===================================================================
    window.launchCallbackFromAnywhere = () => BookingModal.launch();
    window.closeCallbackModal = () => BookingModal.remove();

    // ===================================================================
    // INITIALISIERUNG
    // ===================================================================
    initializeEventListeners();
    console.log("✅ AI-Form-Modul erfolgreich initialisiert.");
};
