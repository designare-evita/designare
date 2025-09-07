// js/ai-form.js (VERBESSERTE VERSION mit direkter Modal-Steuerung)

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
    const responseArea = document.getElementById('ai-chat-history');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    console.log("🔧 Modal-Overlay gefunden?", !!modalOverlay);
    console.log("🔧 Response-Area gefunden?", !!responseArea);

    // NEUE FUNKTION: Modal direkt anzeigen (mehrere Methoden)
    const showModal = () => {
        if (!modalOverlay) return;
        
        console.log("🎯 Zeige Modal mit mehreren Methoden");
        
        // Methode 1: CSS-Klasse
        modalOverlay.classList.add('visible');
        
        // Methode 2: Direkter Style
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        modalOverlay.style.pointerEvents = 'auto';
        
        // Methode 3: Data-Attribut für Debugging
        modalOverlay.setAttribute('data-debug', 'true');
        
        // Body-Scroll deaktivieren
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
        
        console.log("✅ Modal sollte jetzt sichtbar sein");
        console.log("Modal classList:", modalOverlay.classList.toString());
        console.log("Modal style.display:", modalOverlay.style.display);
    };

    // NEUE FUNKTION: Modal verstecken
    const hideModal = () => {
        if (!modalOverlay) return;
        
        console.log("❎ Verstecke Modal");
        
        modalOverlay.classList.remove('visible');
        modalOverlay.style.display = 'none';
        modalOverlay.style.opacity = '0';
        modalOverlay.style.visibility = 'hidden';
        modalOverlay.style.pointerEvents = 'none';
        modalOverlay.removeAttribute('data-debug');
        
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

    // VERBESSERTE FUNKTION: Nachrichten zur Chat-History hinzufügen
    const addMessageToHistory = (message, sender) => {
        if (!responseArea) {
            console.warn("⚠️ responseArea nicht gefunden für Message:", message);
            return;
        }

        console.log(`💬 Füge ${sender}-Nachricht hinzu:`, message.substring(0, 50) + "...");

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        // HTML-Inhalt oder Text, je nach Nachrichtentyp
        if (message.includes('<') && message.includes('>')) {
            messageDiv.innerHTML = message;
        } else {
            messageDiv.textContent = message;
        }
        
        responseArea.appendChild(messageDiv);
        
        // Scroll zum Ende
        responseArea.scrollTop = responseArea.scrollHeight;
        
        console.log("✅ Nachricht hinzugefügt, responseArea children:", responseArea.children.length);
    };

    // VERBESSERTE FUNKTION: Chat-History leeren und erste Nachricht hinzufügen
    const initializeChat = (initialMessage) => {
        if (!responseArea) {
            console.warn("⚠️ responseArea nicht gefunden für initializeChat");
            return;
        }
        
        console.log("🆕 Initialisiere Chat mit Nachricht:", initialMessage.substring(0, 50) + "...");
        
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

        console.log("❓ Frage:", question);

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

            // Prüfe auf die richtige Aktion
            if (data.action === 'start_booking') {
                console.log("📅 Buchung erkannt");
                initializeChat(data.message);
                showModal();
                
                // Warte kurz und starte dann die Buchung
                setTimeout(() => {
                    launchBookingModal();
                }, 2000);
                return;
            }

            // Normale Antwort verarbeiten
            if (data.answer) {
                console.log("💬 Normale Antwort erhalten");
                initializeChat(data.answer);
            } else {
                console.warn("⚠️ Keine Antwort in API Response");
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
            console.log("🔄 Formular zurückgesetzt");
        }
    };

    // VERBESSERTE FUNKTION: Chat-Formular-Handler
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

        console.log("💬 User Chat Input:", userInput);

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
            console.log("📨 Chat API Response:", data);
            
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

    // Chat-Form Event Listener hinzufügen (mit Delegation)
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
            console.log("❎ Close-Button geklickt");
            hideModal();
        });
    });
    console.log("✅ Close-Buttons registriert");

    // DEBUGGING: Teste Modal-Funktionalität
    console.log("🔧 Debug: Teste Modal nach 3 Sekunden...");
    setTimeout(() => {
        console.log("🔧 Debug: Teste Modal-Anzeige");
        initializeChat("Debug: Dies ist eine Test-Nachricht um zu prüfen, ob das Modal funktioniert.");
        showModal();
        
        setTimeout(() => {
            console.log("🔧 Debug: Verstecke Modal wieder");
            hideModal();
        }, 3000);
    }, 3000);
};
