// js/ai-form.js - KOMPLETT NEUE VERSION mit garantierter Modal-Sichtbarkeit

export const initAiForm = () => {
    console.log("🚀 Initialisiere komplett neue AI-Form mit Modal-Fix");

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

    // ===================================================================
    // HILFSFUNKTIONEN FÜR CHAT-MODAL
    // ===================================================================

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
        
        console.log(`📝 Nachricht hinzugefügt (${sender}):`, message.substring(0, 50) + "...");
    };

    const initializeChat = (initialMessage) => {
        if (!responseArea) {
            console.warn("⚠️ Response Area nicht gefunden für Chat-Initialisierung");
            return;
        }
        
        // Leere den Chat
        responseArea.innerHTML = '';
        
        // Chat-Input hinzufügen (falls noch nicht vorhanden)
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
        
        // Erste Nachricht hinzufügen
        addMessageToHistory(initialMessage, 'ai');
    };

    // ===================================================================
    // BOOKING-MODAL LAUNCHER - KOMPLETT NEU MIT FORCIERTER SICHTBARKEIT
    // ===================================================================

    const launchBookingModal = async () => {
        console.log("🚀 launchBookingModal() - NEUE VERSION gestartet");
        
        try {
            // 1. Schließe alle anderen Modals
            hideChatModal();
            console.log("🔒 Chat-Modal geschlossen");
            
            // 2. Kurze Pause für saubere Transition
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 3. Entferne eventuell existierendes Booking-Modal
            const existingModal = document.getElementById('booking-modal');
            if (existingModal) {
                existingModal.remove();
                console.log("🗑️ Altes Booking-Modal entfernt");
            }
            
            // 4. Lade Booking-Modal HTML
            console.log("📥 Lade booking-modal.html...");
            const response = await fetch('/booking-modal.html');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            console.log("📄 HTML geladen, Größe:", html.length, "Zeichen");
            
            // 5. Füge HTML zum DOM hinzu
            const modalContainer = document.getElementById('modal-container') || document.body;
            modalContainer.insertAdjacentHTML('beforeend', html);
            console.log("✅ HTML in DOM eingefügt");
            
            // 6. Finde das Modal-Element
            const bookingModal = document.getElementById('booking-modal');
            if (!bookingModal) {
                throw new Error("Booking-Modal Element nicht gefunden nach HTML-Insert");
            }
            
            console.log("🎯 Modal-Element gefunden");
            
            // 7. FORCIERE MODAL-SICHTBARKEIT MIT WICHTIGEN CSS-REGELN
            console.log("🎭 Forciere Modal-Sichtbarkeit...");
            
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
                pointer-events: auto !important;
                overflow-y: auto !important;
                box-sizing: border-box !important;
            `;
            
            // 8. Stelle sicher, dass der Modal-Content sichtbar ist
            const modalContent = bookingModal.querySelector('.modal-content, .booking-content, .container');
            if (modalContent) {
                modalContent.style.cssText = `
                    background: white !important;
                    border-radius: 10px !important;
                    padding: 20px !important;
                    max-width: 600px !important;
                    width: 90% !important;
                    max-height: 90% !important;
                    overflow-y: auto !important;
                    position: relative !important;
                    z-index: 1000000 !important;
                `;
                console.log("✅ Modal-Content Styles gesetzt");
            }
            
            // 9. Body-Scroll verhindern
            document.body.style.overflow = 'hidden';
            document.body.classList.add('no-scroll');
            
            // 10. Setup Event-Listener für Booking-Funktionalität
            setupBookingEventListeners();
            
            // 11. Aktiviere ersten Schritt
            const allSteps = document.querySelectorAll('.booking-step');
            allSteps.forEach(step => step.classList.remove('active'));
            
            const firstStep = document.getElementById('step-day-selection');
            if (firstStep) {
                firstStep.classList.add('active');
                console.log("✅ Erster Booking-Schritt aktiviert");
            }
            
            // 12. Finale Überprüfung der Sichtbarkeit
            const rect = bookingModal.getBoundingClientRect();
            console.log("📊 FINALE MODAL-ÜBERPRÜFUNG:", {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
                isVisible: rect.width > 0 && rect.height > 0,
                zIndex: bookingModal.style.zIndex,
                display: bookingModal.style.display,
                opacity: bookingModal.style.opacity
            });
            
            if (rect.width > 0 && rect.height > 0) {
                console.log("🎉 BOOKING-MODAL IST ERFOLGREICH SICHTBAR!");
                return true;
            } else {
                throw new Error("Modal wurde geladen aber ist nicht sichtbar");
            }
            
        } catch (error) {
            console.error("❌ Booking-Modal Launch fehlgeschlagen:", error);
            
            // Fallback: Erstelle Minimal-Modal
            createFallbackModal();
            return false;
        }
    };

    // ===================================================================
    // FALLBACK: MINIMAL-MODAL ALS NOTLÖSUNG
    // ===================================================================

    const createFallbackModal = () => {
        console.log("🆘 Erstelle Fallback-Modal...");
        
        // Entferne alle anderen Modals
        document.querySelectorAll('#booking-modal, .fallback-modal').forEach(el => el.remove());
        
        const fallbackModal = document.createElement('div');
        fallbackModal.className = 'fallback-modal';
        fallbackModal.id = 'booking-modal'; // Gleiche ID für Konsistenz
        fallbackModal.style.cssText = `
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
        
        fallbackModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 10px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 3rem; margin-bottom: 20px;">📅</div>
                <h2 style="color: #1a1a1a; margin-bottom: 20px; font-size: 1.5rem;">Termin buchen</h2>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                    Das Booking-System konnte nicht vollständig geladen werden.<br>
                    Bitte kontaktiere Michael direkt für einen Termin.
                </p>
                
                <div style="margin-bottom: 25px;">
                    <a href="mailto:michael@designare.at?subject=Terminanfrage&body=Hallo Michael,%0D%0A%0D%0AIch möchte gerne einen Rückruf-Termin vereinbaren.%0D%0A%0D%0AMeine Telefonnummer:%0D%0AMein Anliegen:%0D%0A%0D%0AVielen Dank!" 
                       style="
                           display: inline-block;
                           background: #ffc107;
                           color: #1a1a1a;
                           text-decoration: none;
                           padding: 12px 24px;
                           border-radius: 5px;
                           font-weight: bold;
                           margin-right: 10px;
                       ">
                        📧 E-Mail senden
                    </a>
                </div>
                
                <button onclick="closeFallbackModal()" 
                        style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">
                    Schließen
                </button>
            </div>
        `;
        
        document.body.appendChild(fallbackModal);
        document.body.style.overflow = 'hidden';
        
        // Globale Schließen-Funktion
        window.closeFallbackModal = () => {
            fallbackModal.remove();
            document.body.style.overflow = '';
            document.body.classList.remove('no-scroll');
        };
        
        console.log("✅ Fallback-Modal erstellt und angezeigt");
        return fallbackModal;
    };

    // ===================================================================
    // BOOKING EVENT-LISTENER SETUP
    // ===================================================================

    const setupBookingEventListeners = () => {
        console.log("🔧 Richte Booking Event-Listener ein...");
        
        // Tag-Buttons
        document.querySelectorAll('.day-button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                button.addEventListener('click', handleDaySelection);
                button.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Zurück-Buttons
        document.querySelectorAll('.back-button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                button.addEventListener('click', handleBackButton);
                button.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Schließen-Button
        const closeButton = document.getElementById('close-booking-modal');
        if (closeButton && !closeButton.hasAttribute('data-listener-added')) {
            closeButton.addEventListener('click', closeBookingModal);
            closeButton.setAttribute('data-listener-added', 'true');
        }
        
        // Buchungsformular
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm && !bookingForm.hasAttribute('data-listener-added')) {
            bookingForm.addEventListener('submit', handleBookingSubmit);
            bookingForm.setAttribute('data-listener-added', 'true');
        }
        
        console.log("✅ Booking Event-Listener eingerichtet");
    };

    // ===================================================================
    // BOOKING EVENT-HANDLER
    // ===================================================================

    const handleDaySelection = async (event) => {
        const day = event.target.dataset.day;
        console.log("📅 Tag ausgewählt:", day);
        
        showLoadingForSlots();
        
        try {
            const response = await fetch(`/api/get-availability?day=${day}`);
            const data = await response.json();
            
            if (data.success && data.slots) {
                displaySlots(data.slots, day, data.date);
                showBookingStep('step-time-selection');
            } else {
                alert('Keine Termine verfügbar für ' + day);
            }
            
        } catch (error) {
            console.error('Fehler beim Laden der Slots:', error);
            alert('Fehler beim Laden der verfügbaren Termine');
        } finally {
            hideLoadingForSlots();
        }
    };

    const handleBackButton = (event) => {
        const targetStep = event.target.dataset.target;
        console.log("⬅️ Zurück zu:", targetStep);
        showBookingStep(targetStep);
    };

    const closeBookingModal = () => {
        console.log("❎ Schließe Booking-Modal");
        const bookingModal = document.getElementById('booking-modal');
        if (bookingModal) {
            bookingModal.remove();
        }
        
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    };

    const handleBookingSubmit = async (event) => {
        event.preventDefault();
        
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const slotInput = document.getElementById('selected-slot-input');
        
        if (!nameInput || !emailInput || !slotInput) {
            alert('Formular-Elemente nicht gefunden');
            return;
        }
        
        if (!nameInput.value || !emailInput.value || !slotInput.value) {
            alert('Bitte fülle alle Felder aus');
            return;
        }
        
        const submitButton = document.getElementById('submit-booking-button');
        const loader = document.getElementById('booking-loader');
        
        if (submitButton) submitButton.disabled = true;
        if (loader) loader.style.display = 'block';
        
        try {
            const response = await fetch('/api/create-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: slotInput.value,
                    name: nameInput.value,
                    email: emailInput.value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showBookingStep('step-confirmation');
                const confirmationMessage = document.getElementById('confirmation-message');
                if (confirmationMessage) {
                    confirmationMessage.textContent = data.message;
                }
            } else {
                alert('Fehler bei der Buchung: ' + data.message);
            }
            
        } catch (error) {
            console.error('Buchungsfehler:', error);
            alert('Fehler bei der Buchung. Bitte versuche es erneut.');
        } finally {
            if (submitButton) submitButton.disabled = false;
            if (loader) loader.style.display = 'none';
        }
    };

    // ===================================================================
    // BOOKING HILFSFUNKTIONEN
    // ===================================================================

    const showBookingStep = (stepId) => {
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.add('active');
        }
    };

    const displaySlots = (slots, day, date) => {
        const slotsContainer = document.getElementById('slots-container');
        const selectedDayDisplay = document.getElementById('selected-day-display');
        const selectedDateDisplay = document.getElementById('selected-date-display');
        
        if (selectedDayDisplay) selectedDayDisplay.textContent = day;
        if (selectedDateDisplay) selectedDateDisplay.textContent = date;
        
        if (slotsContainer) {
            slotsContainer.innerHTML = '';
            
            if (slots.length > 0) {
                slots.forEach(slot => {
                    const button = document.createElement('button');
                    button.className = 'slot-button';
                    button.textContent = slot.time;
                    button.addEventListener('click', () => selectSlot(slot.fullString));
                    slotsContainer.appendChild(button);
                });
            } else {
                slotsContainer.innerHTML = '<p>Keine Termine verfügbar</p>';
            }
        }
    };

    const selectSlot = (fullSlot) => {
        console.log("🕐 Slot ausgewählt:", fullSlot);
        
        const selectedSlotDisplay = document.getElementById('selected-slot-display');
        const selectedSlotInput = document.getElementById('selected-slot-input');
        
        if (selectedSlotDisplay) selectedSlotDisplay.textContent = fullSlot;
        if (selectedSlotInput) selectedSlotInput.value = fullSlot;
        
        showBookingStep('step-details');
    };

    const showLoadingForSlots = () => {
        const loader = document.getElementById('slots-loader');
        if (loader) loader.style.display = 'block';
    };

    const hideLoadingForSlots = () => {
        const loader = document.getElementById('slots-loader');
        if (loader) loader.style.display = 'none';
    };

    // ===================================================================
    // API-KOMMUNIKATION MIT EVITA
    // ===================================================================

    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende an Evita: "${userInput}"`);
        
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
            console.log(`📨 Evita Response:`, data);

            if (data.action === 'launch_booking_modal') {
                console.log("🎯 Booking-Anfrage erkannt → Starte Modal");
                
                const message = data.answer || "Einen Moment, ich öffne den Kalender für dich...";
                
                if (!isFromChat) {
                    // Erste Anfrage von Index-Seite
                    initializeChat(message);
                    showChatModal();
                    
                    // Nach kurzer Verzögerung: Booking-Modal öffnen
                    setTimeout(() => {
                        console.log("⏰ Starte Booking-Modal nach Chat-Antwort");
                        launchBookingModal();
                    }, 1500);
                } else {
                    // Anfrage aus dem Chat heraus
                    addMessageToHistory(message, 'ai');
                    
                    // Sofort Booking-Modal öffnen
                    setTimeout(() => {
                        console.log("⏰ Starte Booking-Modal aus Chat");
                        launchBookingModal();
                    }, 500);
                }
                
            } else {
                // Normale Chat-Antworten
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
            const errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.";
            
            if (isFromChat) {
                addMessageToHistory(errorMessage, 'ai');
            } else {
                initializeChat(errorMessage);
                showChatModal();
            }
        }
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
    });

    // Chat-Modal schließen
    closeButtons.forEach(button => {
        button.addEventListener('click', hideChatModal);
    });

    // ===================================================================
    // GLOBALE FUNKTIONEN FÜR EXTERNE NUTZUNG
    // ===================================================================

    // Für externe Nutzung (z.B. Header-Button)
    window.launchBookingFromAnywhere = launchBookingModal;
    
    // Debug-Funktionen
    window.debugBookingLaunch = launchBookingModal;
    window.debugCreateFallback = createFallbackModal;
    
    // Force-Show Funktion für Notfälle
    window.forceShowExistingModal = () => {
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.8) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 999999 !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
            console.log("✅ Modal forciert sichtbar gemacht");
            return true;
        }
        console.log("❌ Kein Modal gefunden");
        return false;
    };
    
    console.log("✅ AI-Form komplett neu initialisiert");
    console.log("🔧 Verfügbare Debug-Funktionen:");
    console.log("  - window.launchBookingFromAnywhere()");
    console.log("  - window.debugBookingLaunch()");
    console.log("  - window.debugCreateFallback()");
    console.log("  - window.forceShowExistingModal()");
};
