// js/ai-form.js (KORRIGIERTE VERSION - Chat-Funktionalität repariert)

import { initBookingModal, showStep } from './booking.js';

export const initAiForm = () => {
    console.log("🚀 initAiForm gestartet");

    const aiForm = document.getElementById('ai-form');
    if (!aiForm) {
        console.warn("⚠️ initAiForm: #ai-form nicht gefunden!");
        return;
    }
    console.log("✅ aiForm gefunden:", aiForm);

    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-chat-history'); // KORREKTUR: Verwende chat-history statt content-area
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    console.log("🔧 Modal-Overlay gefunden?", !!modalOverlay);
    console.log("🔧 Response-Area gefunden?", !!responseArea);

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
                modalOverlay.style.display = 'flex';
                return;
            }
        }
        modalOverlay.style.display = 'none';
        const bookingModal = document.getElementById('booking-modal');
        bookingModal.style.display = 'flex';
        showStep('step-day-selection');
    };

    // NEUE FUNKTION: Nachrichten zur Chat-History hinzufügen
    const addMessageToHistory = (message, sender) => {
        if (!responseArea) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = message;
        
        responseArea.appendChild(messageDiv);
        
        // Scroll zum Ende
        responseArea.scrollTop = responseArea.scrollHeight;
    };

    // NEUE FUNKTION: Chat-History leeren und erste Nachricht hinzufügen
    const initializeChat = (initialMessage) => {
        if (!responseArea) return;
        
        responseArea.innerHTML = ''; // Leere die History
        addMessageToHistory(initialMessage, 'ai');
    };

    const handleFormSubmit = async (event) => {
        console.log("📨 handleFormSubmit ausgelöst");
        event.preventDefault();

        const question = aiQuestion.value.trim();
        if (!question) {
            console.warn("⚠️ Keine Frage eingegeben.");
            return;
        }

        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';
        aiQuestion.disabled = true;
        aiForm.querySelector('button').disabled = true;

        try {
            console.log("🌐 Anfrage an /api/ask-gemini:", question);
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: question }),
            });

            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }

            const data = await response.json();
            console.log("📨 API Response:", data);

            // KORREKTUR: Prüfe auf die richtige Aktion
            if (data.action === 'start_booking') {
                // Zeige die Buchungs-Nachricht im Chat
                initializeChat(data.message);
                modalOverlay.style.display = 'flex';
                
                // Warte kurz und starte dann die Buchung
                setTimeout(() => {
                    launchBookingModal();
                }, 2000);
                return;
            }

            // KORREKTUR: Normale Antwort verarbeiten
            if (data.answer) {
                initializeChat(data.answer);
            } else {
                initializeChat("Entschuldigung, ich konnte keine Antwort generieren.");
            }
            
            modalOverlay.style.display = 'flex';
            console.log("💡 Modal sichtbar gemacht (display:flex)");

        } catch (error) {
            console.error('❌ Fehler bei der Anfrage an Evita:', error);
            aiStatus.textContent = 'Ein Fehler ist aufgetreten.';
            initializeChat("Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.");
            modalOverlay.style.display = 'flex';
        } 
        finally {
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
            aiQuestion.disabled = false;
            aiForm.querySelector('button').disabled = false;
            console.log("🔄 Formular zurückgesetzt");
        }
    };

    // NEUE FUNKTION: Chat-Formular-Handler
    const handleChatSubmit = async (event) => {
        console.log("💬 handleChatSubmit ausgelöst");
        event.preventDefault();

        const chatForm = document.getElementById('ai-chat-form');
        const chatInput = document.getElementById('ai-chat-input');
        
        if (!chatInput || !chatForm) {
            console.warn("⚠️ Chat-Elemente nicht gefunden");
            return;
        }

        const userInput = chatInput.value.trim();
        if (!userInput) return;

        // User-Nachricht zur History hinzufügen
        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput })
            });

            const data = await response.json();
            
            // Prüfe wieder auf Buchungs-Aktion
            if (data.action === 'start_booking') {
                addMessageToHistory(data.message, 'ai');
                setTimeout(() => {
                    launchBookingModal();
                }, 2000);
                return;
            }

            // AI-Antwort zur History hinzufügen
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
    console.log("✅ Submit-Listener registriert");

    // KORREKTUR: Chat-Form Event Listener hinzufügen (mit Delegation)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            handleChatSubmit(e);
        }
    });
    console.log("✅ Chat-Submit-Listener registriert");

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            console.log("❎ Modal geschlossen");
        });
    });
    console.log("✅ Close-Buttons registriert");
};
