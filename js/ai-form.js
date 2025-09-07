// js/ai-form.js (FINALE VERSION ohne Debug-Code)

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

    const launchBookingModal = async () => {
        console.log("📅 launchBookingModal gestartet");
        const modalContainer = document.getElementById('modal-container');
        if (!document.getElementById('booking-modal')) {
            try {
                const response = await fetch('/booking-modal.html');
                if (!response.ok) throw new Error('booking-modal.html konnte nicht geladen werden.');
                const html = await response.text();
                modalContainer.insertAdjacentHTML('beforeend', html);
                initBookingModal();
            } catch (error) {
                console.error("❌ Fehler beim Laden des Booking-Modals:", error);
                addMessageToHistory("Entschuldigung, beim Öffnen des Buchungsfensters ist ein Fehler aufgetreten.", 'ai');
                showModal();
                return;
            }
        }
        hideModal();
        const bookingModal = document.getElementById('booking-modal');
        if (bookingModal) {
            bookingModal.style.display = 'flex';
            showStep('step-day-selection');
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

    const handleFormSubmit = async (event) => {
        event.preventDefault();

        const question = aiQuestion.value.trim();
        if (!question) return;

        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';
        aiQuestion.disabled = true;
        aiForm.querySelector('button').disabled = true;

        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: question }),
            });

            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }

            const data = await response.json();

            if (data.action === 'start_booking') {
                initializeChat(data.message);
                showModal();
                
                setTimeout(() => {
                    launchBookingModal();
                }, 2000);
                return;
            }

            if (data.answer) {
                initializeChat(data.answer);
            } else {
                initializeChat("Entschuldigung, ich konnte keine Antwort generieren.");
            }
            
            showModal();

        } catch (error) {
            console.error('❌ Fehler bei der Anfrage an Evita:', error);
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

    const handleChatSubmit = async (event) => {
        event.preventDefault();

        const chatForm = document.getElementById('ai-chat-form');
        const chatInput = document.getElementById('ai-chat-input');
        
        if (!chatInput || !chatForm) return;

        const userInput = chatInput.value.trim();
        if (!userInput) return;

        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput })
            });

            const data = await response.json();
            
            if (data.action === 'start_booking') {
                addMessageToHistory(data.message, 'ai');
                setTimeout(() => {
                    launchBookingModal();
                }, 2000);
                return;
            }

            if (data.answer) {
                addMessageToHistory(data.answer, 'ai');
            } else if (data.message) {
                addMessageToHistory(data.message, 'ai');
            } else {
                addMessageToHistory('Entschuldigung, ich konnte keine Antwort generieren.', 'ai');
            }

        } catch (error) {
            console.error('❌ Fehler bei AI-Chat:', error);
            addMessageToHistory('Entschuldigung, da ist ein technischer Fehler aufgetreten.', 'ai');
        }
    };

    // Event Listener registrieren
    aiForm.addEventListener('submit', handleFormSubmit);

    // Chat-Form Event Listener (mit Delegation für dynamisch geladene Elemente)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            handleChatSubmit(e);
        }
    });

    // Close-Button Event Listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideModal();
        });
    });

    console.log("✅ Evita AI-Form vollständig initialisiert");
};
