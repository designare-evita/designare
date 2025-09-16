// js/ai-form.js - Komplett überarbeitete Version mit Pulsar-Animation und Mobile-Support

/**
 * Initialisiert das gesamte AI-Chat-Modul, einschließlich des Evita-Chats,
 * des Rückruf-Buchungs-Modals und der Circuit-Animation.
 */
export const initAiForm = () => {
    console.log("🚀 Initialisiere AI-Form-Modul (Komplette Neufassung mit Mobile-Support)");

    // ===================================================================
    // ZENTRALER ZUSTAND (State Management)
    // ===================================================================
    const state = {
        chatHistory: [], // Speichert die Konversationshistorie für die API
        selectedCallbackData: null, // Speichert die Daten des ausgewählten Rückruf-Termins
        typingIndicatorId: null, // Hält die ID des "tippt..."-Indikators
        animationRunning: false // Steuert die Circuit-Animation
    };

    // ===================================================================
    // DOM-ELEMENTE (Selektoren)
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

        // Dynamische Elemente (Getter für später geladene Elemente)
        get chatFormDynamic() {
            return document.getElementById('ai-chat-form');
        },
        get chatInputDynamic() {
            return document.getElementById('ai-chat-input');
        }
    };

    // ===================================================================
    // MODUL: Mobile Keyboard Handler
    // Behandelt mobile Tastatur-Events für bessere UX
    // ===================================================================
    const MobileKeyboardHandler = {
        /**
         * Erkennt Tastatur-Events und passt das Layout entsprechend an
         */
        init() {
            if (!this.isMobile()) return;
            
            console.log('📱 Mobile Keyboard Handler initialisiert');
            
            // Viewport-Höhen-Tracking
            this.setupViewportTracking();
            
            // Input-Focus-Events
            this.setupInputEvents();
            
            // Orientierungsänderungen
            this.setupOrientationChange();
        },

        /**
         * Prüft ob es sich um ein mobiles Gerät handelt
         */
        isMobile() {
            return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth <= 768;
        },

        /**
         * Überwacht Viewport-Änderungen (Tastatur auf/zu)
         */
        setupViewportTracking() {
            let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
            let isKeyboardOpen = false;

            const handleViewportChange = () => {
                const currentHeight = window.visualViewport?.height || window.innerHeight;
                const heightDifference = initialViewportHeight - currentHeight;
                
                // Tastatur ist wahrscheinlich offen wenn Höhe um >150px reduziert
                const keyboardOpen = heightDifference > 150;
                
                if (keyboardOpen !== isKeyboardOpen) {
                    isKeyboardOpen = keyboardOpen;
                    document.body.classList.toggle('keyboard-active', keyboardOpen);
                    
                    if (keyboardOpen) {
                        this.onKeyboardOpen();
                    } else {
                        this.onKeyboardClose();
                    }
                }
            };

            // Visual Viewport API (moderne Browser)
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', handleViewportChange);
            }
            
            // Fallback für ältere Browser
            window.addEventListener('resize', handleViewportChange);
        },

        /**
         * Input-Field Focus/Blur Events
         */
        setupInputEvents() {
            // Focus Event
            document.addEventListener('focusin', (e) => {
                if (e.target.matches('#ai-chat-input')) {
                    setTimeout(() => {
                        this.scrollToBottom();
                    }, 300); // Warten bis Tastatur vollständig geöffnet
                }
            });
            
            // Blur Event
            document.addEventListener('focusout', (e) => {
                if (e.target.matches('#ai-chat-input')) {
                    setTimeout(() => {
                        this.scrollToBottom();
                    }, 300);
                }
            });
        },

        /**
         * Orientierungsänderungen handhaben
         */
        setupOrientationChange() {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.scrollToBottom();
                }, 500); // Mehr Zeit für Orientierungsänderung
            });
        },

        /**
         * Wenn Tastatur geöffnet wird
         */
        onKeyboardOpen() {
            console.log('📱 Tastatur geöffnet');
            
            // Chat-Container anpassen
            setTimeout(() => {
                this.scrollToBottom();
            }, 100);
        },

        /**
         * Wenn Tastatur geschlossen wird
         */
        onKeyboardClose() {
            console.log('📱 Tastatur geschlossen');
            
            // Layout reset
            setTimeout(() => {
                this.scrollToBottom();
            }, 100);
        },

        /**
         * Scrollt zum Ende des Chats
         */
        scrollToBottom() {
            const chatHistory = document.getElementById('ai-chat-history');
            if (chatHistory) {
                chatHistory.scrollTo({
                    top: chatHistory.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    };

    // ===================================================================
    // MODUL: Circuit Animation
    // Steuert die Pulsar-Animation im Chat-Modal
    // ===================================================================
    const CircuitAnimation = {
        /**
         * Initialisiert die Pulsar-Animation an Grid-Knotenpunkten
         */
        init() {
            const modalContent = document.querySelector('#ai-response-modal .modal-content');
            if (!modalContent) {
                console.warn('Modal content nicht gefunden - Animation übersprungen');
                return;
            }

            console.log('🔵 Starte Grid-Knotenpunkt Pulsar-Animation...');

            // Existierende Dots entfernen
            this.cleanup();

            // Grid-Schnittpunkte berechnen
            const modalWidth = 800;
            const modalHeight = 600;
            const gridSize = 30;
            
            const gridPositions = [];
            for (let x = 15; x < modalWidth - 15; x += gridSize) {
                for (let y = 15; y < modalHeight - 15; y += gridSize) {
                    // Bereiche für Header und Footer aussparen
                    if (y > 60 && y < modalHeight - 60) {
                        gridPositions.push({ x, y });
                    }
                }
            }

            // Dots an Grid-Schnittpunkten erstellen
            const dots = gridPositions.map((pos) => {
                const dot = document.createElement('div');
                dot.className = 'circuit-pulse-dot';
                dot.style.left = pos.x + 'px';
                dot.style.top = pos.y + 'px';
                modalContent.appendChild(dot);
                return dot;
            });

            console.log(`Grid-Knotenpunkte erstellt: ${dots.length} Positionen`);

            state.animationRunning = true;

            // Pulsar-Sequenz starten
            const pulseNext = () => {
                if (!state.animationRunning) return;

                // Alle Dots deaktivieren
                dots.forEach(dot => dot.classList.remove('active'));
                
                // Zufälligen Knotenpunkt auswählen
                const randomIndex = Math.floor(Math.random() * dots.length);
                if (dots[randomIndex]) {
                    dots[randomIndex].classList.add('active');
                    
                    // Nach Animation deaktivieren (3.25s für CSS Animation)
                    setTimeout(() => {
                        if (dots[randomIndex] && state.animationRunning) {
                            dots[randomIndex].classList.remove('active');
                        }
                    }, 3250);
                }
                
                // Nächster Puls nach 5 Sekunden
                setTimeout(pulseNext, 5000);
            };

            // Erste Aktivierung nach 2 Sekunden
            setTimeout(pulseNext, 2000);
        },

        /**
         * Stoppt die Animation und entfernt alle Dots
         */
        stop() {
            state.animationRunning = false;
            this.cleanup();
            console.log('🔴 Pulsar-Animation gestoppt');
        },

        /**
         * Entfernt alle vorhandenen Pulse-Dots
         */
        cleanup() {
            const existingDots = document.querySelectorAll('.circuit-pulse-dot');
            existingDots.forEach(dot => dot.remove());
        }
    };

    // ===================================================================
    // MODUL: API Handler
    // Kümmert sich um die gesamte Kommunikation mit den Server-Endpunkten
    // ===================================================================
    const ApiHandler = {
        /**
         * Sichere Fetch-Funktion mit verbessertem Logging und Fehlerbehandlung
         */
        async safeFetch(url, options = {}) {
            console.log(`📤 API-Anfrage an: ${url}`);
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
         * Sendet Nutzer-Nachricht an die Gemini-API
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
         * Ruft verfügbare Rückruf-Termine ab
         */
        getAvailableSlots() {
            return this.safeFetch('/api/suggest-appointments');
        },
        
        /**
         * Bucht einen Rückruf-Termin
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
    // Verwaltet alle Interaktionen und Anzeigen im Chat-Fenster
    // ===================================================================
    const ChatUI = {
        /**
         * Fügt eine Nachricht zur Chat-Anzeige und zur Historie hinzu (Mobile-optimiert)
         */
        addMessage(message, sender) {
            if (!DOM.chatHistoryContainer) return;

            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${sender}`;
            msgDiv.textContent = message;
            DOM.chatHistoryContainer.appendChild(msgDiv);
            
            // Mobile-optimiertes Scrolling
            if (MobileKeyboardHandler.isMobile()) {
                setTimeout(() => {
                    MobileKeyboardHandler.scrollToBottom();
                }, 50);
            } else {
                DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
            }

            // Zur API-Historie hinzufügen
            state.chatHistory.push({ 
                role: sender === 'user' ? 'user' : 'assistant', 
                content: message 
            });
            
            // Historie begrenzen (letzte 20 Nachrichten)
            if (state.chatHistory.length > 20) {
                state.chatHistory = state.chatHistory.slice(-20);
            }
        },

        /**
         * Zeigt den "tippt..."-Indikator an
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
            
            // Mobile-optimiertes Scrolling
            if (MobileKeyboardHandler.isMobile()) {
                setTimeout(() => {
                    MobileKeyboardHandler.scrollToBottom();
                }, 50);
            } else {
                DOM.chatHistoryContainer.scrollTop = DOM.chatHistoryContainer.scrollHeight;
            }
        },

        /**
         * Entfernt den "tippt..."-Indikator
         */
        removeTypingIndicator() {
            if (state.typingIndicatorId) {
                const indicator = document.getElementById(state.typingIndicatorId);
                if (indicator) indicator.remove();
                state.typingIndicatorId = null;
            }
        },
        
        /**
         * Leert das Chat-Fenster und die Historie
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
    // Steuert das Öffnen und Schließen der verschiedenen Modals
    // ===================================================================
    const ModalController = {
        /**
         * Öffnet das AI-Chat-Modal mit Animation
         */
        openChatModal() {
            if (!DOM.modalOverlay) return;
            
            DOM.modalOverlay.style.display = 'flex';
            document.body.classList.add('no-scroll');
            
            setTimeout(() => {
                DOM.modalOverlay.classList.add('visible');
                
                // Mobile-optimierter Focus
                if (MobileKeyboardHandler.isMobile()) {
                    // Auf Mobile erst nach Animation fokussieren
                    setTimeout(() => {
                        DOM.chatInputDynamic?.focus();
                    }, 500);
                } else {
                    DOM.chatInputDynamic?.focus();
                }
                
                // Circuit-Animation nach Modal-Öffnung starten
                setTimeout(() => {
                    CircuitAnimation.init();
                }, 300);
            }, 10);
        },

        /**
         * Schließt das AI-Chat-Modal und stoppt Animation
         */
        closeChatModal() {
            if (!DOM.modalOverlay) return;
            
            // Animation stoppen
            CircuitAnimation.stop();
            
            DOM.modalOverlay.classList.remove('visible');
            setTimeout(() => {
                DOM.modalOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
                document.body.classList.remove('keyboard-active'); // Mobile cleanup
            }, 300);
        }
    };
    
    // ===================================================================
    // MODUL: Booking Modal
    // Enthält die gesamte Logik für das Rückruf-Buchungs-Modal
    // ===================================================================
    const BookingModal = {
        /**
         * Startet und zeigt das Rückruf-Buchungs-Modal an
         */
        async launch() {
            console.log("📞 Starte Rückruf-Modal");
            ModalController.closeChatModal();
            await new Promise(resolve => setTimeout(resolve, 300)); // UX-Pause

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
         * Entfernt das Buchungs-Modal aus dem DOM
         */
        remove() {
            const modal = document.getElementById('booking-modal');
            if (modal) modal.remove();
            
            document.body.classList.remove('no-scroll');
            state.selectedCallbackData = null;
            console.log("✅ Rückruf-Modal geschlossen.");
        },

        /**
         * Generiert das HTML für das Modal
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
                                        <textarea id="callback-topic" rows="3" placeholder="Worum geht es bei deinem Projekt?"></textarea>
                                    </div>
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
         * Richtet Event-Listener für das Buchungs-Modal ein
         */
        setupEventListeners() {
            const callbackForm = document.getElementById('callback-form');
            if (callbackForm) {
                callbackForm.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            const backButton = document.getElementById('back-to-slots');
            if (backButton) {
                backButton.addEventListener('click', () => this.showStep('step-slot-selection'));
            }
        },
        
        /**
         * Lädt verfügbare Termine und zeigt sie an
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
                    if (noSlotsMessage) noSlotsMessage.style.display = 'block';
                }
            } catch (error) {
                if (noSlotsMessage) {
                    noSlotsMessage.innerHTML = 'Fehler beim Laden der Termine. Bitte versuche es später erneut.';
                    noSlotsMessage.style.display = 'block';
                }
            }
        },

        /**
         * Verarbeitet die Auswahl eines Termin-Slots
         */
        selectSlot(suggestion) {
            state.selectedCallbackData = suggestion;
            const displayElement = document.getElementById('selected-slot-display');
            if (displayElement) {
                displayElement.innerHTML = `Dein Termin: <strong>${suggestion.formattedString}</strong>`;
            }
            this.showStep('step-contact-details');
        },

        /**
         * Verarbeitet das Absenden des Buchungs-Formulars
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
                    name, 
                    phone, 
                    topic
                });

                if (data.success) {
                    const confirmationDetails = document.getElementById('confirmation-details');
                    if (confirmationDetails) {
                        confirmationDetails.innerHTML = `
                            <div><strong>Termin:</strong> ${state.selectedCallbackData.formattedString}</div>
                            <div><strong>Name:</strong> ${name}</div>
                            <div><strong>Telefon:</strong> ${phone}</div>
                            ${topic ? `<div><strong>Anliegen:</strong> ${topic}</div>` : ''}
                        `;
                    }
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
         * Zeigt einen bestimmten Schritt im Modal an
         */
        showStep(stepId) {
            document.querySelectorAll('.booking-step').forEach(step => step.classList.remove('active'));
            const targetStep = document.getElementById(stepId);
            if (targetStep) targetStep.classList.add('active');
        }
    };
    
    // ===================================================================
    // KERNLOGIK: Conversation Flow
    // Steuert den Ablauf des Chats mit Evita
    // ===================================================================
    async function handleUserMessage(userInput) {
        ChatUI.addMessage(userInput, 'user');
        ChatUI.showTypingIndicator();

        try {
            const data = await ApiHandler.sendToEvita(userInput);
            ChatUI.removeTypingIndicator();

            let answer = "Entschuldigung, ich konnte keine passende Antwort finden.";
            if (typeof data === 'string') {
                answer = data;
            } else if (data?.answer) {
                answer = data.answer;
            } else if (data?.message) {
                answer = data.message;
            }
            
            ChatUI.addMessage(answer, 'ai');

            // Prüfen, ob Buchungs-Modal geöffnet werden soll
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
    // Verbindet die UI-Elemente mit den entsprechenden Aktionen
    // ===================================================================
    function initializeEventListeners() {
        // Mobile Keyboard Handler initialisieren
        MobileKeyboardHandler.init();

        // Haupt-Formular auf der Startseite
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

        // Chat-Formular im Modal (dynamisch)
        const setupChatFormListener = () => {
            const chatForm = DOM.chatFormDynamic;
            if (chatForm && !chatForm.hasAttribute('data-listener-added')) {
                chatForm.setAttribute('data-listener-added', 'true');
                chatForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const chatInput = DOM.chatInputDynamic;
                    const userInput = chatInput?.value.trim();
                    if (userInput) {
                        await handleUserMessage(userInput);
                        chatInput.value = '';
                        
                        // Mobile: Focus wieder setzen nach Nachricht
                        if (MobileKeyboardHandler.isMobile()) {
                            setTimeout(() => {
                                chatInput.focus();
                            }, 100);
                        }
                    }
                });
            }
        };

        // Observer für dynamisches Chat-Formular
        const observer = new MutationObserver(setupChatFormListener);
        observer.observe(document.body, { childList: true, subtree: true });

        // Header-Chat-Button
        if (DOM.headerChatButton) {
            DOM.headerChatButton.addEventListener('click', (e) => {
                e.preventDefault();
                ChatUI.resetChat();
                ChatUI.addMessage("Hallo! Ich bin Evita, Michaels persönliche KI-Assistentin. Womit kann ich dir heute helfen?", 'ai');
                ModalController.openChatModal();
            });
        }

        // Modal schließen
        DOM.closeModalButtons.forEach(button => {
            button.addEventListener('click', ModalController.closeChatModal);
        });

        if (DOM.modalOverlay) {
            DOM.modalOverlay.addEventListener('click', (e) => {
                if (e.target === DOM.modalOverlay) {
                    ModalController.closeChatModal();
                }
            });
        }
    }

    // ===================================================================
    // GLOBALE FUNKTIONEN
    // ===================================================================
    window.launchCallbackFromAnywhere = () => BookingModal.launch();
    window.closeCallbackModal = () => BookingModal.remove();

    // ===================================================================
    // INITIALISIERUNG
    // ===================================================================
    initializeEventListeners();
    console.log("✅ AI-Form-Modul erfolgreich initialisiert mit Mobile-Support.");
};
