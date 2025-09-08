// js/ai-form.js (REPARIERTE VERSION - Booking aus Chat funktioniert)

import { initBookingModal, showStep } from './booking.js';

export const initAiForm = () => {
    console.log("🚀 initAiForm gestartet");

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

    // REPARIERTE Booking-Modal-Funktion
    const launchBookingModal = async () => {
        console.log("📅 launchBookingModal gestartet");
        
        try {
            // Verstecke das Chat-Modal zuerst
            hideModal();
            
            const modalContainer = document.getElementById('modal-container');
            if (!modalContainer) {
                throw new Error('Modal-Container nicht gefunden');
            }
            
            let bookingModal = document.getElementById('booking-modal');
            
            // KRITISCHE VERBESSERUNG: Prüfe ob das Modal bereits existiert
            if (!bookingModal) {
                console.log("📄 Lade booking-modal.html...");
                
                const response = await fetch('/booking-modal.html');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Booking-Modal konnte nicht geladen werden`);
                }
                
                const html = await response.text();
                modalContainer.insertAdjacentHTML('beforeend', html);
                
                bookingModal = document.getElementById('booking-modal');
                if (!bookingModal) {
                    throw new Error('Booking-Modal nach dem Laden nicht gefunden');
                }
                
                console.log("✅ Booking-Modal HTML geladen");
                
                // WICHTIG: Initialisiere das Booking-Modal erst NACH dem HTML-Laden
                await new Promise(resolve => setTimeout(resolve, 100)); // Kurze Wartezeit für DOM-Update
                initBookingModal();
            } else {
                console.log("✅ Booking-Modal bereits vorhanden");
            }
            
            // VERBESSERUNG: Sichere Anzeige des Modals
            bookingModal.style.display = 'flex';
            
            // Warte kurz und setze dann alle Sichtbarkeits-Eigenschaften
            setTimeout(() => {
                bookingModal.style.opacity = '1';
                bookingModal.style.visibility = 'visible';
                bookingModal.style.pointerEvents = 'auto';
                
                // Verhindere Body-Scrolling
                document.body.style.overflow = 'hidden';
                document.body.classList.add('no-scroll');
                
                console.log("✅ Booking-Modal vollständig angezeigt");
                
                // Zeige den ersten Schritt
                showStep('step-day-selection');
                
                // ZUSÄTZLICHE SICHERHEIT: Prüfe ob die Tages-Buttons funktionieren
                const dayButtons = document.querySelectorAll('.day-button');
                console.log("🔧 Gefundene Tag-Buttons:", dayButtons.length);
                
                if (dayButtons.length === 0) {
                    console.warn("⚠️ Keine Tag-Buttons gefunden! Re-initialisiere...");
                    // Warte etwas länger und versuche erneut
                    setTimeout(() => {
                        initBookingModal();
                        showStep('step-day-selection');
                    }, 200);
                }
                
            }, 50);
            
        } catch (error) {
            console.error("❌ Fehler beim Laden des Booking-Modals:", error);
            addMessageToHistory(`Entschuldigung, beim Öffnen des Buchungsfensters ist ein Fehler aufgetreten: ${error.message}`, 'ai');
            showModal(); // Zeige das Chat-Modal wieder an
        }
    };

    const addMessageToHistory = (message, sender) => {
        if (!responseArea) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        if (message.includes('<') && message.includes('>')) {
            messageDiv.innerHTML = message;
        } else {
            messageDiv.textContent = message;
        }
        
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
    };

    const initializeChat = (initialMessage) => {
        if (!responseArea) return;
        
        responseArea.innerHTML = '';
        addMessageToHistory(initialMessage, 'ai');
    };

    // API-Kommunikation
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

            // Prüfe auf Booking-Aktion
            if (data.action === 'start_booking') {
                console.log("🎯 BOOKING-AKTION ERKANNT!");
                
                if (isFromChat) {
                    addMessageToHistory(data.message, 'ai');
                } else {
                    initializeChat(data.message);
                    showModal();
                }
                
                console.log("⏰ Starte Booking in 2 Sekunden...");
                setTimeout(async () => {
                    console.log("🚀 Timeout erreicht, starte Booking...");
                    await launchBookingModal();
                }, 2000);
                
                return true;
            }

            // Normale Antwort
            if (data.answer) {
                if (isFromChat) {
                    addMessageToHistory(data.answer, 'ai');
                } else {
                    initializeChat(data.answer);
                    showModal();
                }
                return false;
            } else {
                const fallbackMessage = "Entschuldigung, ich konnte keine Antwort generieren.";
                if (isFromChat) {
                    addMessageToHistory(fallbackMessage, 'ai');
                } else {
                    initializeChat(fallbackMessage);
                    showModal();
                }
                return false;
            }

        } catch (error) {
            console.error(`❌ Fehler bei ${isFromChat ? 'Chat-' : ''}Anfrage:`, error);
            const errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.";
            
            if (isFromChat) {
                addMessageToHistory(errorMessage, 'ai');
            } else {
                initializeChat(errorMessage);
                showModal();
            }
            return false;
        }
    };

    // Hauptformular Submit Handler
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

    // REPARIERTER Chat Submit Handler
    const handleChatSubmit = async (event) => {
        event.preventDefault();
        console.log("💬 Chat-Submit Handler aufgerufen");

        event.stopImmediatePropagation();

        const chatInput = document.getElementById('ai-chat-input');
        if (!chatInput) {
            console.warn("⚠️ Chat-Input nicht gefunden");
            return;
        }

        const userInput = chatInput.value.trim();
        console.log("🔍 Chat-Input Wert direkt gelesen:", `"${userInput}"`);

        if (!userInput) {
            console.warn("⚠️ Leere Chat-Eingabe");
            return;
        }

        console.log("💬 Chat-Eingabe verarbeitet:", userInput);

        // Füge User-Nachricht sofort hinzu
        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        // Sende an Evita
        await sendToEvita(userInput, true);
    };

    // Event Listener Setup
    let chatFormHandled = false;

    // Event Listener für Hauptformular
    aiForm.addEventListener('submit', handleFormSubmit);
    console.log("✅ AI-Form Submit-Listener registriert");

    // Chat-Form Event Listener mit verbesserter Event-Delegation
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            console.log("🎯 Chat-Form Submit erkannt - Event-Delegation");
            
            if (chatFormHandled) {
                console.log("⚠️ Chat bereits behandelt, überspringe");
                return;
            }
            
            chatFormHandled = true;
            setTimeout(() => { chatFormHandled = false; }, 100);
            
            handleChatSubmit(e);
        }
    });
    console.log("✅ Chat-Submit-Listener (Event-Delegation) registriert");

    // ZUSÄTZLICHER EVENT LISTENER: Direkte Behandlung für Chat-Eingabe
    document.addEventListener('keydown', (e) => {
        if (e.target.id === 'ai-chat-input' && e.key === 'Enter') {
            e.preventDefault();
            const chatForm = document.getElementById('ai-chat-form');
            if (chatForm) {
                console.log("⌨️ Enter-Taste im Chat erkannt - triggere Submit");
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Close-Button Event Listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideModal();
        });
    });
    console.log("✅ Close-Button-Listener registriert");

    // ZUSÄTZLICHE DEBUGGING-FUNKTION
    window.debugBookingLaunch = () => {
        console.log("🔧 DEBUG: Manueller Booking-Launch");
        launchBookingModal();
    };

    console.log("✅ Evita AI-Form vollständig initialisiert");
    console.log("🔧 Debug-Funktion verfügbar: window.debugBookingLaunch()");
};
