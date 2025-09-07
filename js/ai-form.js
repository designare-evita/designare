// js/ai-form.js (REPARIERTE VERSION mit funktionierendem Chat-Booking)

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

    // VERBESSERTE Booking-Modal-Funktion
    const launchBookingModal = async () => {
        console.log("📅 launchBookingModal gestartet");
        
        try {
            hideModal();
            
            const modalContainer = document.getElementById('modal-container');
            if (!modalContainer) {
                throw new Error('Modal-Container nicht gefunden');
            }
            
            let bookingModal = document.getElementById('booking-modal');
            
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
                initBookingModal();
            }
            
            bookingModal.style.display = 'flex';
            bookingModal.style.opacity = '1';
            bookingModal.style.visibility = 'visible';
            bookingModal.style.pointerEvents = 'auto';
            console.log("✅ Booking-Modal angezeigt");
            
            showStep('step-day-selection');
            
        } catch (error) {
            console.error("❌ Fehler beim Laden des Booking-Modals:", error);
            addMessageToHistory(`Entschuldigung, beim Öffnen des Buchungsfensters ist ein Fehler aufgetreten: ${error.message}`, 'ai');
            showModal();
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

    // GEMEINSAME API-Funktion für beide Formulare
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

            // PRÜFE AUF BOOKING-AKTION (funktioniert für beide Formulare)
            if (data.action === 'start_booking') {
                console.log("🎯 BOOKING-AKTION ERKANNT!");
                
                if (isFromChat) {
                    // Vom Chat: Füge Nachricht hinzu und starte Booking
                    addMessageToHistory(data.message, 'ai');
                } else {
                    // Vom Hauptformular: Initialisiere Chat und zeige Modal
                    initializeChat(data.message);
                    showModal();
                }
                
                console.log("⏰ Starte Booking in 2 Sekunden...");
                setTimeout(() => {
                    console.log("🚀 Timeout erreicht, starte Booking...");
                    launchBookingModal();
                }, 2000);
                
                return true; // Booking wurde gestartet
            }

            // NORMALE ANTWORT
            if (data.answer) {
                if (isFromChat) {
                    addMessageToHistory(data.answer, 'ai');
                } else {
                    initializeChat(data.answer);
                    showModal();
                }
                return false; // Normale Antwort
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

    // HAUPTFORMULAR Submit Handler
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

    // CHAT Submit Handler (REPARIERT)
    const handleChatSubmit = async (event) => {
        event.preventDefault();
        console.log("💬 Chat-Submit Handler aufgerufen");

        const chatInput = document.getElementById('ai-chat-input');
        if (!chatInput) {
            console.warn("⚠️ Chat-Input nicht gefunden");
            return;
        }

        const userInput = chatInput.value.trim();
        if (!userInput) {
            console.warn("⚠️ Leere Chat-Eingabe");
            return;
        }

        console.log("💬 Chat-Eingabe:", userInput);

        // Füge User-Nachricht sofort hinzu
        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        // Sende an Evita mit Chat-Flag
        await sendToEvita(userInput, true);
    };

    // Event Listener registrieren
    aiForm.addEventListener('submit', handleFormSubmit);
    console.log("✅ AI-Form Submit-Listener registriert");

    // WICHTIG: Chat-Form Event Listener mit verbesserter Erkennung
    document.addEventListener('submit', (e) => {
        console.log("📝 Submit-Event erkannt für:", e.target.id);
        
        if (e.target.id === 'ai-chat-form') {
            console.log("🎯 Chat-Form Submit bestätigt!");
            handleChatSubmit(e);
        }
    });

    // ZUSÄTZLICH: Direct Event Listener für bessere Kompatibilität
    setTimeout(() => {
        const chatForm = document.getElementById('ai-chat-form');
        if (chatForm) {
            console.log("🔧 Direkte Chat-Form gefunden, füge Event-Listener hinzu");
            chatForm.addEventListener('submit', (e) => {
                console.log("🎯 Direkter Chat-Form Submit!");
                handleChatSubmit(e);
            });
        }
    }, 1000);

    console.log("✅ Chat-Submit-Listener registriert");

    // Close-Button Event Listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log("❎ AI-Modal Close-Button geklickt");
            hideModal();
        });
    });
    console.log("✅ Close-Button-Listener registriert");

    console.log("✅ Evita AI-Form vollständig initialisiert");
};
