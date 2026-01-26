// js/ai-form.js - MIT DIREKTEM MODAL-ÖFFNEN BEI KLICK AUF #ai-question
let isKeyboardListenerActive = false;

export const initAiForm = () => {
    console.log("🚀 Initialisiere AI-Form-Modul");

    // ===================================================================
    // ZENTRALER ZUSTAND (State Management)
    // ===================================================================
    const state = {
        chatHistory: [],
        selectedCallbackData: null,
        typingIndicatorId: null,
        animationRunning: false,
        apiFailureCount: 0,
        lastApiError: null,
        initialized: false
    };

    // ===================================================================
    // FALLBACK-ANTWORTEN SYSTEM
    // ===================================================================
    const FallbackResponses = {
        responses: {
            greeting: [
                "Hallo! 👋 Ich bin Evita, Michaels digitale Assistentin. Gerade bin ich etwas überlastet, aber ich helfe dir trotzdem gerne! Was möchtest du wissen?",
                "Hi! Schön, dass du da bist! Mein KI-Gehirn macht gerade eine kleine Pause, aber die Basics kann ich dir trotzdem verraten.",
                "Hey! Willkommen bei designare. Ich bin Evita – aktuell im Energiesparmodus, aber für dich da!"
            ],
            
            contact: [
                "📧 **Michael erreichst du am besten so:**\n\n• E-Mail: michael@designare.at\n• Oder nutze das Kontaktformular auf der Seite\n\nEr meldet sich normalerweise innerhalb von 24 Stunden!",
                "Du willst direkt mit Michael sprechen? Kein Problem!\n\n**E-Mail:** michael@designare.at\n\nFür einen Rückruf-Termin sag einfach Bescheid!"
            ],
            
            services: [
                "🛠️ **Michaels Spezialgebiete:**\n\n• **WordPress-Entwicklung** – Custom Themes & Plugins\n• **Performance-Optimierung** – Schnelle Ladezeiten\n• **KI-Integration** – Chatbots & Automatisierung\n• **SEO** – Technische Optimierung\n\nFür Details schreib ihm eine Mail an michael@designare.at!",
                "Michael ist Web-Purist und KI-Komplize! Er macht:\n\n• Maßgeschneiderte WordPress-Lösungen\n• Performance-Tuning (Core Web Vitals)\n• KI-Assistenten wie mich 😊\n• Technisches SEO\n\nInteressiert? → michael@designare.at"
            ],
            
            pricing: [
                "💰 **Zu Preisen:**\n\nJedes Projekt ist individuell, daher gibt's keine Pauschalpreise. Am besten beschreibst du Michael dein Vorhaben per Mail (michael@designare.at) und er macht dir ein faires Angebot!",
                "Preise hängen vom Projektumfang ab. Michael arbeitet transparent und fair. Schreib ihm einfach, was du brauchst: michael@designare.at"
            ],
            
            booking: [
                "📅 **Termin vereinbaren?**\n\nSuper Idee! Schreib Michael eine kurze Mail an michael@designare.at mit:\n• Worum geht's?\n• Wann passt es dir?\n\nEr meldet sich schnell zurück!",
                "Einen Rückruf oder Termin kannst du direkt per Mail anfragen: michael@designare.at\n\nMichael ist flexibel und findet sicher einen passenden Slot!"
            ],
            
            about: [
                "👨‍💻 **Über Michael:**\n\nMichael Kanda ist Web-Purist aus Wien. Tagsüber zähmt er WordPress für maxonline Marketing, in seiner Freizeit baut er eigene Tools – wie mich!\n\nSein Motto: *Sauberer Code, kaum Wartung, smarte Lösungen.*",
                "Michael ist ein Code-Tüftler aus Wien, der WordPress liebt (fast so sehr wie seinen Hund Evita 🐕). Er entwickelt performante Websites und KI-Lösungen.\n\nMehr auf: designare.at"
            ],
            
            evita: [
                "🤖 **Das bin ich – Evita!**\n\nIch bin Michaels digitale Assistentin, benannt nach seinem Hund (ja, wirklich!). Ich basiere auf einer RAG-Architektur und helfe hier auf der Website.\n\nDie echte Evita ist übrigens eine Tierschutz-Export-Hundedame und die wahre Chefin! 🐕",
                "Ich bin Evita, die digitale Version! Mein Namensvetter ist ein Hund – Michaels vierbeinige Chefin. Ich bin die geduldige Variante und beantworte Fragen rund um die Uhr... naja, meistens. 😅"
            ],
            
            tools: [
                "🔧 **Michaels Tools:**\n\n• **DataPeak** – Sein eigenes SEO-Dashboard mit KI\n• **Silas** – Content-Generator für Keywords\n• **Evita** (das bin ich!) – KI-Assistentin\n\nAlle selbst entwickelt, weil: *Wenn's kein passendes Tool gibt, baut man es halt selbst!*"
            ],
            
            error: [
                "🔄 Hmm, mein KI-Gehirn stockt gerade etwas. Kannst du die Frage anders formulieren oder es gleich nochmal versuchen?",
                "Ups, da hab ich kurz gehakt! Versuch's bitte nochmal – manchmal brauche ich einen zweiten Anlauf.",
                "Entschuldige, ich bin gerade etwas verwirrt. Probier's in ein paar Sekunden noch einmal!"
            ],
            
            rateLimit: [
                "⏳ **Kurze Verschnaufpause!**\n\nIch bin gerade sehr gefragt und muss kurz durchatmen. Bitte versuch es in etwa einer Minute noch einmal.\n\n*Dringende Fragen? → michael@designare.at*",
                "🫠 Puh, ganz schön viel los hier! Mein API-Kontingent ist kurz erschöpft. Gib mir eine Minute, dann bin ich wieder fit!\n\nOder schreib direkt an: michael@designare.at"
            ],
            
            default: [
                "Interessante Frage! Leider bin ich gerade im Offline-Modus und kann nicht voll antworten. Schreib Michael direkt: michael@designare.at",
                "Da müsste ich nachdenken, aber mein Gehirn macht gerade Pause. Michael kann dir sicher helfen: michael@designare.at",
                "Gute Frage! Im Moment kann ich sie nicht richtig beantworten. Am besten fragst du Michael direkt: michael@designare.at"
            ]
        },

        keywords: {
            greeting: ['hallo', 'hi', 'hey', 'guten', 'servus', 'grüß', 'moin', 'was geht', 'wie geht'],
            contact: ['kontakt', 'erreichen', 'mail', 'email', 'anrufen', 'telefon', 'schreiben', 'melden'],
            services: ['angebot', 'service', 'leistung', 'macht ihr', 'machst du', 'bietet', 'können', 'hilfe bei', 'wordpress', 'website', 'webseite', 'homepage'],
            pricing: ['preis', 'kosten', 'kostet', 'budget', 'teuer', 'günstig', 'zahlen', 'euro', 'geld'],
            booking: ['termin', 'buchung', 'buchen', 'rückruf', 'treffen', 'gespräch', 'call', 'meeting', 'vereinbaren'],
            about: ['wer ist', 'über michael', 'michael kanda', 'wer bist', 'erzähl', 'hintergrund', 'erfahrung'],
            evita: ['evita', 'ki', 'chatbot', 'assistent', 'wie funktionierst', 'bist du', 'was bist'],
            tools: ['tool', 'datapeak', 'silas', 'dashboard', 'seo tool', 'entwickelt']
        },

        getResponse(userMessage) {
            const msg = userMessage.toLowerCase().trim();
            
            for (const [category, keywords] of Object.entries(this.keywords)) {
                for (const keyword of keywords) {
                    if (msg.includes(keyword)) {
                        return this.getRandomFromCategory(category);
                    }
                }
            }
            
            return this.getRandomFromCategory('default');
        },

        getRandomFromCategory(category) {
            const responses = this.responses[category] || this.responses.default;
            return responses[Math.floor(Math.random() * responses.length)];
        },

        getRateLimitResponse() {
            return this.getRandomFromCategory('rateLimit');
        },

        getErrorResponse() {
            return this.getRandomFromCategory('error');
        }
    };

    // ===================================================================
    // DOM-ELEMENTE - Mit Null-Safety
    // ===================================================================
    const getDOM = () => ({
        aiForm: document.getElementById('ai-form'),
        aiQuestionInput: document.getElementById('ai-question'),
        aiStatus: document.getElementById('ai-status'),
        modalOverlay: document.getElementById('ai-response-modal'),
        closeModalButtons: document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom'),
        chatHistoryContainer: document.getElementById('ai-chat-history'),
        headerChatButton: document.getElementById('evita-chat-button'),
        
        get chatFormDynamic() {
            return document.getElementById('ai-chat-form');
        },
        get chatInputDynamic() {
            return document.getElementById('ai-chat-input');
        }
    });

    let DOM = getDOM();
    
    // ===================================================================
    // KEYBOARD RESIZE HANDLER FÜR MOBILE
    // ===================================================================
    const handleKeyboardResize = () => {
        if (window.innerWidth > 768) return;
        
        const modalContent = document.querySelector('#ai-response-modal .modal-content');
        const chatHistory = document.getElementById('ai-chat-history');
        
        if (modalContent && chatHistory) {
            if (window.visualViewport) {
                const viewportHeight = window.visualViewport.height;
                modalContent.style.height = `${viewportHeight}px`;
                
                setTimeout(() => {
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                }, 100);
            } else {
                modalContent.style.height = `${window.innerHeight}px`;
            }
        }
    };

    // ===================================================================
    // API HANDLER MIT FALLBACK-LOGIK
    // ===================================================================
    const ApiHandler = {
        async safeFetch(url, options = {}) {
            console.log(`📤 API-Anfrage an: ${url}`);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: { 'Content-Type': 'application/json', ...options.headers }
                });

                console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
                
                if (response.status === 429) {
                    console.warn("⚠️ Rate Limit erreicht!");
                    state.apiFailureCount++;
                    state.lastApiError = 'rateLimit';
                    throw new Error('RATE_LIMIT');
                }
                
                if (!response.ok) {
                    throw new Error(`SERVER_ERROR: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                const responseData = contentType?.includes('application/json')
                    ? await response.json()
                    : await response.text();
                
                if (responseData?.rateLimited || 
                    responseData?.error?.includes?.('429') ||
                    responseData?.error?.includes?.('quota')) {
                    state.apiFailureCount++;
                    state.lastApiError = 'rateLimit';
                    throw new Error('RATE_LIMIT');
                }
                
                state.apiFailureCount = 0;
                state.lastApiError = null;
                
                return responseData;

            } catch (error) {
                console.error(`❌ API-Fehler bei ${url}:`, error);
                state.apiFailureCount++;
                
                if (error.message === 'RATE_LIMIT' || 
                    error.message?.includes('429') || 
                    error.message?.includes('quota') ||
                    error.message?.includes('Too Many Requests')) {
                    state.lastApiError = 'rateLimit';
                } else {
                    state.lastApiError = 'serverError';
                }
                
                throw error;
            }
        },

        async sendToEvita(userInput) {
            console.log("💬 Sende Nachricht an Evita:", userInput);
            
            if (state.apiFailureCount >= 3) {
                console.log("🔄 Zu viele API-Fehler, nutze Fallback");
                return {
                    answer: FallbackResponses.getResponse(userInput),
                    isFallback: true
                };
            }
            
            const bookingTriggers = [
                'termin', 'buchung', 'buchen', 'rückruf', 'anrufen', 
                'sprechen', 'kontakt', 'meeting', 'appointment', 'erreichen', 'treffen', 'call', 'telefonat', 'beratung', 'projekt besprechen'
            ];
            
            const confirmationKeywords = [
                'ja', 'gerne', 'okay', 'ok', 'bitte', 'genau', 'richtig', 
                'korrekt', 'stimmt', 'passt', 'mach das', 'hilf mir', 'super', 'perfekt', 'natürlich', 'klar', 'unbedingt'
            ];
            
            const hasBookingIntent = bookingTriggers.some(trigger => 
                userInput.toLowerCase().includes(trigger)
            );
            
            const hasConfirmation = confirmationKeywords.some(keyword => 
                userInput.toLowerCase().includes(keyword)
            );
            
            // Suche letzte KI-Nachricht (flexibel für assistant oder model)
            const lastAiMessage = state.chatHistory
                .filter(msg => msg.role === 'assistant' || msg.role === 'model')
                .pop();
            
            const wasBookingQuestion = lastAiMessage && 
                (lastAiMessage.content.includes('[BOOKING_CONFIRM_REQUEST]') || 
                 lastAiMessage.content.toLowerCase().includes('rückruf-termin schauen'));

            // KORREKTUR: checkBookingIntent muss true sein, wenn es eine Bestätigung ist!
            const checkIntent = hasBookingIntent || (wasBookingQuestion && hasConfirmation);

            const requestData = {
                history: state.chatHistory,
                message: userInput,
                checkBookingIntent: checkIntent,
                isConfirmation: wasBookingQuestion && hasConfirmation
            };
            
            try {
                return await this.safeFetch('/api/ask-gemini', {
                    method: 'POST',
                    body: JSON.stringify(requestData)
                });
            } catch (error) {
                console.log("🔄 API fehlgeschlagen, nutze Fallback-Antwort");
                
                if (state.lastApiError === 'rateLimit') {
                    return {
                        answer: FallbackResponses.getRateLimitResponse(),
                        isFallback: true,
                        rateLimited: true
                    };
                }
                
                return {
                    answer: FallbackResponses.getResponse(userInput),
                    isFallback: true
                };
            }
        },

        getAvailableSlots() {
            return this.safeFetch('/api/suggest-appointments');
        },
        
        bookAppointment(bookingData) {
            return this.safeFetch('/api/book-appointment-phone', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });
        }
    };

    // ===================================================================
    // CHAT UI
    // ===================================================================
    const ChatUI = {
        addMessage(message, sender, displayImmediately = false) {
            console.log(`📝 addMessage aufgerufen - Sender: ${sender}, Message: ${message.substring(0, 50)}...`);
            
            const chatHistoryContainer = document.getElementById('ai-chat-history');
            
            if (!chatHistoryContainer) {
                console.warn("⚠️ Chat-History Container nicht gefunden");
                return null;
            }

            let cleanMessage = message;
            if (sender === 'ai') {
                cleanMessage = message
                    .replace(/\[BOOKING_CONFIRM_REQUEST\]/g, '')
                    .replace(/\[buchung_starten\]/g, '')
                    .replace(/\[booking_starten\]/g, '')
                    .trim();
            }

            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${sender}`;
            
            if (displayImmediately) {
                msgDiv.textContent = cleanMessage;
            } else {
                msgDiv.textContent = sender === 'user' ? cleanMessage : '';
            }
            
            chatHistoryContainer.appendChild(msgDiv);
            this.scrollToBottom();

            state.chatHistory.push({ 
                role: sender === 'user' ? 'user' : 'assistant', 
                content: message
            });
            
            if (state.chatHistory.length > 20) {
                state.chatHistory = state.chatHistory.slice(-20);
            }

            return msgDiv;
        },

        showTypingIndicator() {
            this.removeTypingIndicator();
            const chatHistoryContainer = document.getElementById('ai-chat-history');
            if (!chatHistoryContainer) return;
            
            const indicator = document.createElement('div');
            state.typingIndicatorId = 'typing-' + Date.now();
            indicator.id = state.typingIndicatorId;
            indicator.className = 'chat-message ai';
            
            indicator.innerHTML = `
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            
            chatHistoryContainer.appendChild(indicator);
            this.scrollToBottom();
        },

        removeTypingIndicator() {
            if (state.typingIndicatorId) {
                const indicator = document.getElementById(state.typingIndicatorId);
                if (indicator) indicator.remove();
                state.typingIndicatorId = null;
            }
        },

        scrollToBottom() {
            const chatHistoryContainer = document.getElementById('ai-chat-history');
            if (chatHistoryContainer) {
                chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
            }
        },
        
        resetChat() {
            const chatHistoryContainer = document.getElementById('ai-chat-history');
            if (chatHistoryContainer) {
                chatHistoryContainer.innerHTML = '';
            }
            state.chatHistory = [];
            state.apiFailureCount = 0;
            state.lastApiError = null;
        }
    };

    // ===================================================================
    // MODAL CONTROLLER
    // ===================================================================
    const ModalController = {
        isProcessing: false, // Flag um ungewolltes Schließen zu verhindern
        
        openChatModal() {
            const modalOverlay = document.getElementById('ai-response-modal');
            if (!modalOverlay) {
                console.error("❌ Modal nicht gefunden!");
                return;
            }
            
            modalOverlay.style.display = 'flex';
            document.body.classList.add('no-scroll');
            
            handleKeyboardResize();
            
            if (!isKeyboardListenerActive) {
                window.addEventListener('resize', handleKeyboardResize);
                isKeyboardListenerActive = true;
            }
            
            setTimeout(() => {
                modalOverlay.classList.add('visible');
                
                const chatInput = document.getElementById('ai-chat-input');
                if (chatInput) chatInput.focus();
                
                setTimeout(() => {
                    ChatUI.scrollToBottom();
                }, 400);
            }, 10);
        },
        
        closeChatModal(force = false) {
            // Verhindere versehentliches Schließen während der Verarbeitung
            if (this.isProcessing && !force) {
                console.log("⚠️ Modal-Schließen blockiert - Verarbeitung läuft");
                return;
            }
            
            const modalOverlay = document.getElementById('ai-response-modal');
            if (!modalOverlay) return;
            
            modalOverlay.classList.remove('visible');
            
            if (isKeyboardListenerActive) {
                window.removeEventListener('resize', handleKeyboardResize);
                isKeyboardListenerActive = false;
            }
            
            const modalContent = document.querySelector('#ai-response-modal .modal-content');
            if (modalContent) {
                modalContent.style.height = '';
            }
            
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }, 300);
        }
    };

    // ===================================================================
    // BOOKING MODAL
    // ===================================================================
    const BookingModal = {
        async launch() {
            console.log("📞 Booking-Modal wird geöffnet");
            
            try {
                ModalController.closeChatModal(true); // force=true für beabsichtigtes Schließen
                await new Promise(resolve => setTimeout(resolve, 300));

                this.remove();
                
                const modalHTML = this.createHTML();
                document.body.insertAdjacentHTML('beforeend', modalHTML);

                const modal = document.getElementById('booking-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    document.body.classList.add('no-scroll');
                    
                    this.setupEventListeners();
                    await this.loadSlots();
                }
            } catch (error) {
                console.error("❌ Fehler beim Öffnen des Booking-Modals:", error);
                alert("Das Buchungssystem konnte nicht geladen werden. Bitte kontaktiere Michael direkt: michael@designare.at");
            }
        },

        remove() {
            const modal = document.getElementById('booking-modal');
            if (modal) modal.remove();
            
            document.body.classList.remove('no-scroll');
            state.selectedCallbackData = null;
        },

        createHTML() {
            return `
                <div id="booking-modal" class="booking-modal">
                    <div class="booking-modal-content">
                        <button onclick="closeCallbackModal()" class="booking-modal-close-btn">&times;</button>
                        <div class="booking-modal-header">
                            <h2 class="booking-modal-title">Rückruf vereinbaren</h2>
                            <p class="booking-modal-subtitle">Michael ruft dich zum gewünschten Zeitpunkt an.</p>
                        </div>
                        <div class="booking-modal-body">
                            <div id="step-slot-selection" class="booking-step active">
                                <h3 class="booking-step-title">Verfügbare Termine</h3>
                                <div id="callback-loading">
                                    Lade verfügbare Termine...
                                </div>
                                <div id="callback-slots-container" style="display: none;"></div>
                                <div id="no-slots-message" style="display: none;">
                                    Aktuell sind keine Termine verfügbar.<br>
                                    <a href="mailto:michael@designare.at">michael@designare.at</a>
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
                                        <label for="callback-phone">Telefonnummer *</label>
                                        <input type="tel" id="callback-phone" required placeholder="z.B. 0664 123 45 67">
                                    </div>
                                    <div class="booking-form-group">
                                        <label for="callback-topic">Anliegen (optional)</label>
                                        <textarea id="callback-topic" rows="3" placeholder="Worum geht es?"></textarea>
                                    </div>
                                    <div class="booking-form-actions">
                                        <button type="button" id="back-to-slots" class="booking-btn back-btn">← Zurück</button>
                                        <button type="submit" id="submit-callback" class="booking-btn submit-btn">Rückruf buchen</button>
                                    </div>
                                </form>
                            </div>

                            <div id="step-confirmation" class="booking-step">
                                <div class="confirmation-content">
                                    <h3 class="confirmation-title">Termin gebucht!</h3>
                                    <div id="confirmation-details"></div>
                                    <button onclick="closeCallbackModal()" class="booking-btn confirm-close-btn">Perfekt!</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

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

        async loadSlots() {
            const loadingDiv = document.getElementById('callback-loading');
            const slotsContainer = document.getElementById('callback-slots-container');
            const noSlotsMessage = document.getElementById('no-slots-message');

            try {
                const data = await ApiHandler.getAvailableSlots();
                
                if (loadingDiv) loadingDiv.style.display = 'none';

                if (data.success && data.suggestions?.length > 0) {
                    slotsContainer.innerHTML = '';
                    slotsContainer.style.display = 'block';
                    
                    data.suggestions.forEach(suggestion => {
                        const button = document.createElement('button');
                        button.className = 'callback-slot-button';
                        button.innerHTML = `
                            <div style="flex-grow: 1;">
                                <div style="font-weight: 500;">${suggestion.formattedString.split(' um ')[1]}</div>
                                <div style="font-size: 0.9rem; opacity: 0.7;">${suggestion.formattedString.split(' um ')[0]}</div>
                            </div>
                            <div style="font-size: 1.5rem;">→</div>
                        `;
                        button.onclick = () => this.selectSlot(suggestion);
                        slotsContainer.appendChild(button);
                    });
                } else {
                    if (noSlotsMessage) noSlotsMessage.style.display = 'block';
                }
            } catch (error) {
                console.error("❌ Fehler beim Laden der Termine:", error);
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (noSlotsMessage) {
                    noSlotsMessage.innerHTML = 'Termine konnten nicht geladen werden.<br><a href="mailto:michael@designare.at" style="color: var(--accent-color);">michael@designare.at</a>';
                    noSlotsMessage.style.display = 'block';
                }
            }
        },

        selectSlot(suggestion) {
            state.selectedCallbackData = suggestion;
            
            const displayElement = document.getElementById('selected-slot-display');
            if (displayElement) {
                displayElement.innerHTML = `<strong>${suggestion.formattedString}</strong>`;
            }
            
            this.showStep('step-contact-details');
        },

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
                        // Basis-Infos
                        let html = `
                            <p><strong>Termin:</strong> ${data.appointmentDetails?.formattedDate || state.selectedCallbackData.formattedString}</p>
                            <p><strong>Uhrzeit:</strong> ${data.appointmentDetails?.formattedTime || ''}</p>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Telefon:</strong> ${phone}</p>
                            ${topic ? `<p><strong>Anliegen:</strong> ${topic}</p>` : ''}
                        `;
                        
                        // QR-Code + Download Button
                        html += `<div class="calendar-save-section">`;
                        
                        // QR-Code (hauptsächlich für Desktop)
                        if (data.qrCode) {
                            html += `
                                <div class="qr-code-wrapper">
                                    <img src="${data.qrCode}" alt="Termin QR-Code" class="qr-code-image" />
                                    <p class="qr-code-hint">QR-Code scannen</p>
                                </div>
                            `;
                        }
                        
                        // Download Button (für alle, besonders Mobile)
                        if (data.icsContent) {
                            const icsBlob = new Blob([data.icsContent], { type: 'text/calendar;charset=utf-8' });
                            const icsUrl = URL.createObjectURL(icsBlob);
                            html += `
                                <a href="${icsUrl}" download="rueckruf-designare.ics" class="ics-download-btn">
                                    📅 Im Kalender speichern
                                </a>
                            `;
                        }
                        
                        html += `</div>`;
                        
                        confirmationDetails.innerHTML = html;
                    }
                    this.showStep('step-confirmation');
                } else {
                    throw new Error(data.message || 'Buchung fehlgeschlagen');
                }
            } catch (error) {
                console.error("❌ Booking-Fehler:", error);
                alert(`Buchung fehlgeschlagen: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Rückruf buchen';
            }
        },

        showStep(stepId) {
            document.querySelectorAll('.booking-step').forEach(step => step.classList.remove('active'));
            const targetStep = document.getElementById(stepId);
            if (targetStep) targetStep.classList.add('active');
        }
    };

    // ===================================================================
    // KERNLOGIK: Conversation Flow
    // ===================================================================
    async function handleUserMessage(userInput) {
        console.log("💬 Verarbeite User-Nachricht:", userInput);

        // Verhindere versehentliches Modal-Schließen während der Verarbeitung
        ModalController.isProcessing = true;

        const chatInput = document.getElementById('ai-chat-input');
        const chatForm = document.getElementById('ai-chat-form');
        const submitButton = chatForm?.querySelector('button[type="submit"]');

        if (chatInput) chatInput.disabled = true;
        if (submitButton) submitButton.disabled = true;

        // Kontext VOR der Antwort prüfen (War die letzte Nachricht eine Buchungs-Frage?)
        const lastAiBefore = state.chatHistory
            .filter(msg => msg.role === 'assistant' || msg.role === 'model')
            .pop();
        const wasBookingQuestionBefore = lastAiBefore && (
            lastAiBefore.content.includes('[BOOKING_CONFIRM_REQUEST]') ||
            lastAiBefore.content.toLowerCase().includes('rückruf-termin schauen')
        );

        ChatUI.addMessage(userInput, 'user');
        ChatUI.showTypingIndicator();

        try {
            const data = await ApiHandler.sendToEvita(userInput);
            ChatUI.removeTypingIndicator();

            if (chatInput) chatInput.disabled = false;
            if (submitButton) submitButton.disabled = false;
            if (chatInput) chatInput.focus();

            let answer = "Entschuldigung, ich konnte keine Antwort finden.";
            let isFallback = false;
            
            if (typeof data === 'string') {
                answer = data;
            } else if (data?.answer) {
                answer = data.answer;
                isFallback = data.isFallback || false;
            } else if (data?.message) {
                answer = data.message;
            }

            const textToAnimate = answer
                .replace(/\[BOOKING_CONFIRM_REQUEST\]/g, '')
                .replace(/\[buchung_starten\]/g, '')
                .replace(/\[booking_starten\]/g, '')
                .trim();

            const aiMsgElement = ChatUI.addMessage(answer, 'ai');
            if (aiMsgElement) {
                await typeWriterEffect(aiMsgElement, textToAnimate, 25);
            }

            // Verarbeitung abgeschlossen
            ModalController.isProcessing = false;

            // Trigger Booking Modal (falls Bestätigung erfolgt ist)
            const shouldLaunch = wasBookingQuestionBefore && (
                answer.includes('[buchung_starten]') ||
                answer.includes('[booking_starten]')
            );

            if (shouldLaunch) {
                setTimeout(() => {
                    BookingModal.launch();
                }, 800);
            }

        } catch (error) {
            console.error("❌ Fehler bei User-Message:", error);
            ChatUI.removeTypingIndicator();
            
            const fallbackAnswer = FallbackResponses.getResponse(userInput);
            const aiMsgElement = ChatUI.addMessage(fallbackAnswer, 'ai');
            if (aiMsgElement) {
                await typeWriterEffect(aiMsgElement, fallbackAnswer, 25);
            }
            
            if (chatInput) chatInput.disabled = false;
            if (submitButton) submitButton.disabled = false;
            
            // Auch bei Fehler die Verarbeitung als abgeschlossen markieren
            ModalController.isProcessing = false;
        }
    }

    // ===================================================================
    // TYPEWRITER EFFECT MIT MARKDOWN
    // ===================================================================
    async function typeWriterEffect(element, text, speed = 20) {
        if (!element) return;
        
        let currentContent = "";
        const words = text.split(" ");
        
        for (let i = 0; i < words.length; i++) {
            currentContent += words[i] + " ";
            element.innerHTML = formatMarkdown(currentContent);
            
            const container = document.getElementById('ai-chat-history');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
            
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }

    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .replace(/\n/g, '<br>');
    }

    // ===================================================================
    // EVENT LISTENERS SETUP
    // ===================================================================
    function initializeEventListeners() {
        console.log("🔧 Initialisiere Event-Listener");
        
        DOM = getDOM();

        const aiQuestionInput = document.getElementById('ai-question');
        if (aiQuestionInput && !aiQuestionInput.hasAttribute('data-modal-listener-added')) {
            aiQuestionInput.setAttribute('data-modal-listener-added', 'true');
            
            aiQuestionInput.addEventListener('click', (e) => {
                e.preventDefault();
                openEvitaChatWithWelcome();
            });
            
            aiQuestionInput.addEventListener('focus', (e) => {
                e.preventDefault();
                aiQuestionInput.blur();
                openEvitaChatWithWelcome();
            });
            
            aiQuestionInput.addEventListener('touchstart', (e) => {
                e.preventDefault();
                openEvitaChatWithWelcome();
            }, { passive: false });
        }

        if (DOM.aiForm && !DOM.aiForm.hasAttribute('data-listener-added')) {
            DOM.aiForm.setAttribute('data-listener-added', 'true');
            DOM.aiForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const userInput = DOM.aiQuestionInput?.value?.trim();
                
                ChatUI.resetChat();
                ModalController.openChatModal();
                
                if (userInput) {
                    setTimeout(() => {
                        handleUserMessage(userInput);
                    }, 150);
                    if (DOM.aiQuestionInput) DOM.aiQuestionInput.value = '';
                } else {
                    setTimeout(() => {
                        addWelcomeMessageToChat();
                    }, 300);
                }
            });
        }

        const setupChatFormListener = () => {
            const chatForm = document.getElementById('ai-chat-form');
            if (chatForm && !chatForm.hasAttribute('data-listener-added')) {
                chatForm.setAttribute('data-listener-added', 'true');
                chatForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Verhindert Event-Bubbling zum Modal-Overlay
                    const chatInput = document.getElementById('ai-chat-input');
                    const userInput = chatInput?.value?.trim();
                    if (userInput) {
                        await handleUserMessage(userInput);
                        if (chatInput) {
                            chatInput.value = '';
                            chatInput.focus();
                        }
                    }
                });
            }
        };

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    setupChatFormListener();
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        setupChatFormListener();

        const headerChatButton = document.getElementById('evita-chat-button');
        if (headerChatButton && !headerChatButton.hasAttribute('data-listener-added')) {
            headerChatButton.setAttribute('data-listener-added', 'true');
            headerChatButton.addEventListener('click', (e) => {
                e.preventDefault();
                openEvitaChatWithWelcome();
            });
        }

        const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');
        closeButtons.forEach(button => {
            if (button && !button.hasAttribute('data-listener-added')) {
                button.setAttribute('data-listener-added', 'true');
                button.addEventListener('click', () => ModalController.closeChatModal(true)); // force=true für explizites Schließen
            }
        });

        const modalOverlay = document.getElementById('ai-response-modal');
        if (modalOverlay && !modalOverlay.hasAttribute('data-listener-added')) {
            modalOverlay.setAttribute('data-listener-added', 'true');
            modalOverlay.addEventListener('click', (e) => {
                // Nur schließen wenn GENAU auf den Overlay-Hintergrund geklickt wird
                // und nicht auf irgendein Kind-Element (Form, Input, etc.)
                if (e.target === modalOverlay && e.target.classList.contains('visible')) {
                    ModalController.closeChatModal();
                }
            });
        }

        state.initialized = true;
    }

    const welcomeMessages = [
        "Hallo! Ich bin Evita, Michaels KI-Assistentin. Womit kann ich dir heute helfen?",
        "Hey! Schön, dass du da bist. Ich bin Evita – Michaels KI-Assistentin. Womit kann ich dir heute helfen?",
        "Servus! Evita hier, Michaels digitale Komplizin. Was möchtest du wissen?",
        "Hi! Ich bin Evita. Michael ist gerade beschäftigt, aber ich kann dir sicher weiterhelfen. Was liegt an?",
        "Willkommen! Ich bin Evita, Michaels digitale Komplizin. Stell mir deine Fragen!",
        "Hey, schön dich zu sehen! Ich bin Evita. Egal, ob WordPress, KI oder Kuchenrezepte – ich bin für dich da!",
        "Hi! Evita hier. Ich freue mich dich kennenzulernen – frag einfach drauf los!",
        "Grüß dich! Ich bin Evita, die digitale Version an Michaels Seite. Die vierbeinige schläft gerade. Was kann ich für dich tun?",
        "Grüß dich! Ich bin Evita, Michaels digitale Unterstützung. Der Hund schnarcht, Michael codet – und ich bin für dich da. Was liegt an?",
        "Servus! Evita hier. Ich bin die KI-Assistenz , Michael schreibt den Code und der Hund ist für die gute Laune zuständig. Wobei kann ich dir heute helfen?"
    ];
    
    function openEvitaChatWithWelcome() {
        ChatUI.resetChat();
        ModalController.openChatModal();
        setTimeout(() => {
            addWelcomeMessageToChat();
        }, 300);
    }
    
    async function addWelcomeMessageToChat() {
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory && chatHistory.children.length === 0) {
            const randomGreeting = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            const msgElement = ChatUI.addMessage(randomGreeting, 'ai', false);
            if (msgElement) {
                await typeWriterEffect(msgElement, randomGreeting, 20);
            }
        }
    }

    // ===================================================================
    // GLOBALE FUNKTIONEN
    // ===================================================================
    window.closeCallbackModal = () => BookingModal.remove();
    window.launchBookingFromChat = () => BookingModal.launch();
    window.openEvitaChat = () => openEvitaChatWithWelcome();

    // ===================================================================
    // INITIALISIERUNG
    // ===================================================================
    setTimeout(() => {
        initializeEventListeners();
        console.log("✅ AI-Form-Modul initialisiert!");
    }, 50);
};
