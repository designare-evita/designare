// js/ai-form.js (VERBESSERTE VERSION mit funktionierendem Booking)

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
            // Verstecke zunächst das AI-Modal
            hideModal();
            
            // Prüfe, ob booking-modal.html bereits geladen ist
            let bookingModal = document.getElementById('booking-modal');
            
            if (!bookingModal) {
                console.log("📄 Lade booking-modal.html...");
                
                const modalContainer = document.getElementById('modal-container');
                if (!modalContainer) {
                    throw new Error('Modal-Container nicht gefunden');
                }
                
                const response = await fetch('/booking-modal.html');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Booking-Modal konnte nicht geladen werden`);
                }
                
                const html = await response.text();
                modalContainer.insertAdjacentHTML('beforeend', html);
                
                // Suche das Modal erneut
                bookingModal = document.getElementById('booking-modal');
                if (!bookingModal) {
                    throw new Error('Booking-Modal nach dem Laden nicht gefunden');
                }
                
                console.log("✅ Booking-Modal HTML geladen");
                
                // Initialisiere das Booking-System
                initBookingModal();
            }
            
            // Zeige das Booking-Modal
            bookingModal.style.display = 'flex';
            console.log("✅ Booking-Modal angezeigt");
            
            // Starte mit dem ersten Schritt
            showStep('step-day-selection');
            
        } catch (error) {
            console.error("❌ Fehler beim Laden des Booking-Modals:", error);
            
            // Zeige Fehler im AI-Chat und bringe das AI-Modal zurück
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

    // VERBESSERTE API-Kommunikation mit besserer Booking-Erkennung
    const handleFormSubmit = async (event) => {
        event.preventDefault();

        const question = aiQuestion.value.trim();
        if (!question) return;

        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';
        aiQuestion.disabled = true;
        aiForm.querySelector('button').disabled = true;

        try {
            console.log("🌐 Sende Anfrage an Evita:", question);
            
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: question }),
            });

            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }

            const data = await response.json();
            console.log("📨 Evita Response:", data);

            // Prüfe auf Booking-Aktion
            if (data.action === 'start_booking') {
                console.log("📅 Booking-Aktion erkannt");
                initializeChat(data.message);
                showModal();
                
                // Warte 2 Sekunden und starte Booking
                setTimeout(() => {
                    launchBookingModal();
                }, 2000);
                return;
            }

            // Normale Antwort
            if (data.answer) {
                initializeChat(data.answer);
                showModal();
            } else {
                initializeChat("Entschuldigung, ich konnte keine Antwort generieren.");
                showModal();
            }

        } catch (error) {
            console.error('❌ Fehler bei Evita-Anfrage:', error);
            aiStatus.textContent = 'Ein Fehler ist aufgetreten.';
            initializeChat("Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.");
            showModal();
        } 
        finally {
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
            aiQuestion.disabled = false;
            aiForm.querySelector('button').disabled = false;
        }
    };

    // VERBESSERTE Chat-Funktion
    const handleChatSubmit = async (event) => {
        event.preventDefault();

        const chatInput = document.getElementById('ai-chat-input');
        if (!chatInput) return;

        const userInput = chatInput.value.trim();
        if (!userInput) return;

        console.log("💬 Chat-Eingabe:", userInput);

        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput })
            });

            const data = await response.json();
            console.log("📨 Chat Response:", data);
            
            // Prüfe auf Booking-Aktion
            if (data.action === 'start_booking') {
                console.log("📅 Booking aus Chat erkannt");
                addMessageToHistory(data.message, 'ai');
                
                setTimeout(() => {
                    launchBookingModal();
                }, 2000);
                return;
            }

            // Normale Chat-Antwort
            if (data.answer) {
                addMessageToHistory(data.answer, 'ai');
            } else if (data.message) {
                addMessageToHistory(data.message, 'ai');
            } else {
                addMessageToHistory('Entschuldigung, ich konnte keine Antwort generieren.', 'ai');
            }

        } catch (error) {
            console.error('❌ Fehler bei Chat-Anfrage:', error);
            addMessageToHistory('Entschuldigung, da ist ein technischer Fehler aufgetreten.', 'ai');
        }
    };

    // Event Listener registrieren
    aiForm.addEventListener('submit', handleFormSubmit);
    console.log("✅ AI-Form Submit-Listener registriert");

    // Chat-Form Event Listener (mit Delegation für dynamisch geladene Elemente)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            console.log("📝 Chat-Form Submit erkannt");
            handleChatSubmit(e);
        }
    });
    console.log("✅ Chat-Submit-Listener registriert");

    // Close-Button Event Listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log("❎ AI-Modal schließen");
            hideModal();
        });
    });
    console.log("✅ Close-Button-Listener registriert");

    console.log("✅ Evita AI-Form vollständig initialisiert");
};
