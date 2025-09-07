// js/ai-form.js (DEBUG-VERSION mit ausführlichen Logs)

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

    console.log("🔧 Elements gefunden:", {
        aiForm: !!aiForm,
        aiQuestion: !!aiQuestion,
        modalOverlay: !!modalOverlay,
        responseArea: !!responseArea
    });

    // Modal-Steuerung
    const showModal = () => {
        if (!modalOverlay) return;
        
        console.log("🎯 Zeige AI-Modal");
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
        
        console.log("❎ Verstecke AI-Modal");
        modalOverlay.classList.remove('visible');
        modalOverlay.style.display = 'none';
        modalOverlay.style.opacity = '0';
        modalOverlay.style.visibility = 'hidden';
        modalOverlay.style.pointerEvents = 'none';
        
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    };

    // VERBESSERTE Booking-Modal-Funktion mit detailliertem Logging
    const launchBookingModal = async () => {
        console.log("📅 launchBookingModal gestartet");
        
        try {
            // Verstecke zunächst das AI-Modal
            console.log("🔒 Verstecke AI-Modal");
            hideModal();
            
            // Prüfe Modal-Container
            const modalContainer = document.getElementById('modal-container');
            console.log("📦 Modal-Container gefunden?", !!modalContainer);
            
            if (!modalContainer) {
                throw new Error('Modal-Container nicht gefunden - prüfe ob modals.html geladen ist');
            }
            
            // Prüfe, ob booking-modal.html bereits geladen ist
            let bookingModal = document.getElementById('booking-modal');
            console.log("📋 Booking-Modal bereits vorhanden?", !!bookingModal);
            
            if (!bookingModal) {
                console.log("📄 Lade booking-modal.html...");
                
                const response = await fetch('/booking-modal.html');
                console.log("📡 Fetch Response Status:", response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Booking-Modal konnte nicht geladen werden`);
                }
                
                const html = await response.text();
                console.log("📄 HTML geladen, Länge:", html.length);
                console.log("📄 HTML Anfang:", html.substring(0, 100));
                
                modalContainer.insertAdjacentHTML('beforeend', html);
                console.log("✅ HTML eingefügt");
                
                // Suche das Modal erneut
                bookingModal = document.getElementById('booking-modal');
                console.log("📋 Booking-Modal nach Laden gefunden?", !!bookingModal);
                
                if (!bookingModal) {
                    console.error("❌ Booking-Modal nach dem Laden nicht gefunden!");
                    console.log("🔍 Alle IDs im Modal-Container:", Array.from(modalContainer.querySelectorAll('[id]')).map(el => el.id));
                    throw new Error('Booking-Modal nach dem Laden nicht gefunden');
                }
                
                console.log("✅ Booking-Modal HTML geladen");
                
                // Initialisiere das Booking-System
                console.log("🔧 Initialisiere Booking-System...");
                initBookingModal();
                console.log("✅ Booking-System initialisiert");
            } else {
                console.log("♻️ Booking-Modal bereits vorhanden, verwende existierendes");
            }
            
            // Zeige das Booking-Modal
            console.log("👀 Zeige Booking-Modal...");
            bookingModal.style.display = 'flex';
            bookingModal.style.opacity = '1';
            bookingModal.style.visibility = 'visible';
            bookingModal.style.pointerEvents = 'auto';
            console.log("✅ Booking-Modal angezeigt");
            
            // Starte mit dem ersten Schritt
            console.log("🎯 Starte ersten Buchungsschritt...");
            showStep('step-day-selection');
            console.log("✅ Erster Schritt aktiviert");
            
        } catch (error) {
            console.error("❌ Fehler beim Laden des Booking-Modals:", error);
            console.error("Stack:", error.stack);
            
            // Zeige Fehler im AI-Chat und bringe das AI-Modal zurück
            addMessageToHistory(`Entschuldigung, beim Öffnen des Buchungsfensters ist ein Fehler aufgetreten: ${error.message}`, 'ai');
            showModal();
        }
    };

    const addMessageToHistory = (message, sender) => {
        if (!responseArea) {
            console.warn("⚠️ responseArea nicht verfügbar für Message:", message);
            return;
        }

        console.log(`💬 Füge ${sender}-Nachricht hinzu:`, message.substring(0, 50) + "...");

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        if (message.includes('<') && message.includes('>')) {
            messageDiv.innerHTML = message;
        } else {
            messageDiv.textContent = message;
        }
        
        responseArea.appendChild(messageDiv);
        responseArea.scrollTop = responseArea.scrollHeight;
        
        console.log("✅ Nachricht hinzugefügt, aktuelle Anzahl:", responseArea.children.length);
    };

    const initializeChat = (initialMessage) => {
        if (!responseArea) {
            console.warn("⚠️ responseArea nicht verfügbar für initializeChat");
            return;
        }
        
        console.log("🆕 Initialisiere Chat mit:", initialMessage.substring(0, 50) + "...");
        responseArea.innerHTML = '';
        addMessageToHistory(initialMessage, 'ai');
    };

    // VERBESSERTE API-Kommunikation mit detailliertem Logging
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        console.log("📨 handleFormSubmit ausgelöst");

        const question = aiQuestion.value.trim();
        if (!question) {
            console.warn("⚠️ Leere Eingabe");
            return;
        }

        console.log("❓ Frage:", question);

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

            console.log("📡 Response Status:", response.status);

            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }

            const data = await response.json();
            console.log("📨 Evita Response:", data);

            // DETAILLIERTE Prüfung auf Booking-Aktion
            console.log("🔍 Prüfe auf Booking-Aktion...");
            console.log("🔍 data.action:", data.action);
            console.log("🔍 data.action === 'start_booking':", data.action === 'start_booking');

            if (data.action === 'start_booking') {
                console.log("🎯 BOOKING-AKTION ERKANNT!");
                console.log("📝 Booking-Nachricht:", data.message);
                
                initializeChat(data.message);
                showModal();
                
                console.log("⏰ Starte Booking in 2 Sekunden...");
                setTimeout(() => {
                    console.log("🚀 Timeout erreicht, starte Booking...");
                    launchBookingModal();
                }, 2000);
                return;
            } else {
                console.log("ℹ️ Keine Booking-Aktion erkannt, normale Antwort");
            }

            // Normale Antwort
            if (data.answer) {
                console.log("💬 Verarbeite normale Antwort");
                initializeChat(data.answer);
                showModal();
            } else {
                console.warn("⚠️ Keine Antwort in Response");
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
            console.log("🔄 Formular zurückgesetzt");
        }
    };

    // VERBESSERTE Chat-Funktion mit detailliertem Logging
    const handleChatSubmit = async (event) => {
        event.preventDefault();
        console.log("💬 handleChatSubmit ausgelöst");

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

        addMessageToHistory(userInput, 'user');
        chatInput.value = '';

        try {
            console.log("🌐 Sende Chat-Anfrage an Evita");
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput })
            });

            const data = await response.json();
            console.log("📨 Chat Response:", data);
            
            // DETAILLIERTE Prüfung auf Booking-Aktion im Chat
            console.log("🔍 Chat: Prüfe auf Booking-Aktion...");
            console.log("🔍 Chat: data.action:", data.action);
            
            if (data.action === 'start_booking') {
                console.log("🎯 CHAT: BOOKING-AKTION ERKANNT!");
                addMessageToHistory(data.message, 'ai');
                
                console.log("⏰ Chat: Starte Booking in 2 Sekunden...");
                setTimeout(() => {
                    console.log("🚀 Chat: Timeout erreicht, starte Booking...");
                    launchBookingModal();
                }, 2000);
                return;
            }

            // Normale Chat-Antwort
            if (data.answer) {
                console.log("💬 Chat: Normale Antwort");
                addMessageToHistory(data.answer, 'ai');
            } else if (data.message) {
                console.log("💬 Chat: Message-Feld");
                addMessageToHistory(data.message, 'ai');
            } else {
                console.warn("⚠️ Chat: Keine Antwort");
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

    // Chat-Form Event Listener
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
            console.log("❎ AI-Modal Close-Button geklickt");
            hideModal();
        });
    });
    console.log("✅ Close-Button-Listener registriert");

    console.log("✅ Evita AI-Form vollständig initialisiert");
};
