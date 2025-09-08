// js/ai-form.js - FINALE KORRIGIERTE VERSION

export const initAiForm = () => {
    console.log("🚀 Initialisiere AI-Form mit finaler Buchungslogik");

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
    // GLOBALER BOOKING-STATE
    // ===================================================================
    let currentBookingState = {
        suggestions: [],
        selectedSlot: null,
        selectedSlotFormatted: '',
        bookingData: null,
        step: 'initial'
    };

    window.currentBookingState = currentBookingState; // Für Debugging

    // ===================================================================
    // MODAL- & CHAT-HILFSFUNKTIONEN
    // ===================================================================
    const showModal = () => {
        if (modalOverlay) modalOverlay.classList.add('visible');
        document.body.classList.add('no-scroll');
    };

    const hideModal = () => {
        if (modalOverlay) modalOverlay.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    };

    const addMessageToHistory = (message, sender, isHtml = false) => {
        if (!responseArea) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        if (isHtml) {
            messageDiv.innerHTML = message;
        } else {
            messageDiv.textContent = message;
        }
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
    };

    const initializeChat = (initialMessage, isHtml = false) => {
        if (responseArea) responseArea.innerHTML = '';
        addMessageToHistory(initialMessage, 'ai', isHtml);
    };

    // ===================================================================
    // BOOKING-PROZESS FUNKTIONEN
    // ===================================================================

    const createInteractiveTerminMessage = (message, suggestions) => {
        let enhancedHtml = `
            <div class="booking-message">
                <div class="booking-text">Hier sind die nächsten 3 verfügbaren Rückruf-Termine:</div>
                <div class="booking-buttons" style="margin-top: 15px;">`;
        
        suggestions.forEach((suggestion) => {
            enhancedHtml += `
                <button class="termin-button" 
                        data-slot="${suggestion.slot}"
                        data-formatted="${suggestion.formattedString || ''}">
                    Termin ${suggestion.slot}: ${suggestion.formattedString}
                </button>`;
        });

        enhancedHtml += `</div></div>`;
        return enhancedHtml;
    };

    const handleBookingDataCollection = () => {
        console.log("📝 Sammle Kontaktdaten mit ROBUSTEM FORMULAR");
        currentBookingState.step = 'contact_data';

        const selectedTerminText = currentBookingState.selectedSlotFormatted || `Nummer ${currentBookingState.selectedSlot}`;
        addMessageToHistory(`Termin (${selectedTerminText}) ausgewählt`, 'ai', false);

        const formHtml = `
            <div class="chat-message ai">
                <form id="contact-details-form" style="margin-top: 10px;">
                    <p>Bitte Deinen Namen und Telefonnummer für den Rückruf:</p>
                    <input type="text" id="contact-name" name="name" placeholder="Dein Name" required style="display: block; width: 95%; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #ccc;">
                    <input type="tel" id="contact-phone" name="phone" placeholder="Deine Telefonnummer" required style="display: block; width: 95%; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #ccc;">
                    <button type="submit" id="submit-contact-details" style="padding: 10px 15px; border-radius: 5px; border: none; background-color: #28a745; color: white; cursor: pointer;">
                        Bestätigen & Buchen
                    </button>
                </form>
            </div>`;

        responseArea.insertAdjacentHTML('beforeend', formHtml);
        responseArea.scrollTop = responseArea.scrollHeight;

        const contactForm = document.getElementById('contact-details-form');
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactDataSubmit);
        }
    };

    const executeBooking = async () => {
        console.log('🔍 executeBooking gestartet');
        if (!currentBookingState.bookingData?.name || !currentBookingState.bookingData?.phone) {
            throw new Error('Unvollständige Buchungsdaten.');
        }

        const selectedSuggestion = currentBookingState.suggestions.find(s => s.slot === currentBookingState.selectedSlot);
        const appointmentSlot = selectedSuggestion ? selectedSuggestion.formattedString : generateFallbackSlot();

        const bookingPayload = {
            slot: appointmentSlot,
            name: `${currentBookingState.bookingData.name} (Tel: ${currentBookingState.bookingData.phone})`,
            email: `rueckruf@designare.at`
        };

        console.log('📅 Finale Buchungsdaten an API:', bookingPayload);

        const response = await fetch('/api/create-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        const responseText = await response.text();
        if (!response.ok) {
            throw new Error(`API Fehler: ${responseText}`);
        }

        const result = JSON.parse(responseText);
        if (result.success) {
            showBookingSuccess(result, appointmentSlot);
            resetBookingState();
        } else {
            throw new Error(result.message || 'Unbekannter API-Fehler');
        }
    };

    const showBookingSuccess = (result, appointmentSlot) => {
        const successMessage = `
            <div style="background: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>🎉 Perfekt! Dein Termin ist gebucht!</h3>
                <p>
                    <strong>Name:</strong> ${currentBookingState.bookingData.name}<br>
                    <strong>Telefon:</strong> ${currentBookingState.bookingData.phone}<br>
                    <strong>Termin:</strong> ${appointmentSlot}
                </p>
                <p style="font-size: 0.9rem;">Michael ruft dich zum vereinbarten Zeitpunkt an.</p>
            </div>`;
        addMessageToHistory(successMessage, 'ai', true);
    };

    const showBookingError = (errorMessage) => {
        const errorHtml = `
            <div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px;">
                <strong>❌ Fehler bei der Terminbuchung</strong><br><br>${errorMessage}
            </div>`;
        addMessageToHistory(errorHtml, 'ai', true);
    };

    const resetBookingState = () => {
        currentBookingState = { suggestions: [], selectedSlot: null, selectedSlotFormatted: '', bookingData: null, step: 'initial' };
        window.currentBookingState = currentBookingState;
        console.log('🔄 Booking-State zurückgesetzt');
    };

    const generateFallbackSlot = () => {
        // Fallback-Logik (unverändert)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        while (tomorrow.getDay() % 6 === 0) { tomorrow.setDate(tomorrow.getDate() + 1); }
        tomorrow.setHours(9, 0, 0, 0);
        return `${tomorrow.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} um 09:00`;
    };

    // ===================================================================
    // API-KOMMUNIKATION
    // ===================================================================
    const sendToEvita = async (userInput, isFromChat = false) => {
        console.log(`🌐 Sende an Evita:`, userInput);
        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput }),
            });
            if (!response.ok) throw new Error(`HTTP-Fehler: ${response.status}`);
            const data = await response.json();
            console.log(`📨 Evita Response:`, data);

            if (data.action === 'smart_booking') {
                const enhancedMessage = createInteractiveTerminMessage(data.answer, data.suggestions);
                initializeChat(enhancedMessage, true);
                if (!isFromChat) showModal();
                currentBookingState.suggestions = data.suggestions || [];
                currentBookingState.step = 'slot_selection';
            } else if (data.action === 'collect_booking_data') {
                handleBookingDataCollection();
            } else {
                addMessageToHistory(data.answer || "Ich konnte keine Antwort finden.", 'ai');
            }
        } catch (error) {
            console.error(`❌ Evita-Fehler:`, error);
            const errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.";
            if (isFromChat) {
                addMessageToHistory(errorMessage, 'ai');
            } else {
                initializeChat(errorMessage);
                showModal();
            }
        }
    };

    // ===================================================================
    // EVENT-HANDLER
    // ===================================================================
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const question = aiQuestion.value.trim();
        if (!question) return;
        aiStatus.style.display = 'block';
        aiForm.querySelector('button').disabled = true;
        try {
            await sendToEvita(question, false);
        } finally {
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
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

    const handleTerminButtonClick = (event) => {
        if (!event.target.classList.contains('termin-button')) return;
        currentBookingState.selectedSlot = parseInt(event.target.dataset.slot);
        currentBookingState.selectedSlotFormatted = event.target.dataset.formatted;
        document.querySelectorAll('.termin-button').forEach(btn => btn.disabled = true);
        event.target.style.backgroundColor = '#28a745';
        addMessageToHistory(`Termin ${currentBookingState.selectedSlot}`, 'user');
        setTimeout(() => sendToEvita(`Termin ${currentBookingState.selectedSlot}`, true), 300);
    };
    
    const handleContactDataSubmit = async (event) => {
        event.preventDefault();
        console.log("✅ Kontaktdaten aus Formular erhalten");
        const nameInput = document.getElementById('contact-name');
        const phoneInput = document.getElementById('contact-phone');
        document.getElementById('submit-contact-details').disabled = true;
        
        currentBookingState.bookingData = { name: nameInput.value, phone: phoneInput.value };
        addMessageToHistory("Alles klar, ich trage den Termin für dich ein...", 'ai');

        try {
            await executeBooking();
        } catch (error) {
            console.error('❌ Buchungsfehler nach Formular-Submit:', error);
            showBookingError(`Buchung fehlgeschlagen: ${error.message}`);
        }
    };

    // ===================================================================
    // EVENT-LISTENER SETUP
    // ===================================================================
    aiForm.addEventListener('submit', handleFormSubmit);
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') handleChatSubmit(e);
    });
    document.addEventListener('click', handleTerminButtonClick);
    closeButtons.forEach(button => button.addEventListener('click', () => {
        hideModal();
        resetBookingState();
    }));

    console.log("✅ AI-Form vollständig initialisiert");
};
