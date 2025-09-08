// js/ai-form.js (FINALE VERSION mit einfachem Booking-Interface)

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

    // ===================================================================
    // EINFACHES BOOKING-INTERFACE (ersetzt das komplexe Modal)
    // ===================================================================
    const launchBookingModal = async () => {
        console.log("📅 EINFACHES Booking-Interface gestartet");
        
        try {
            // Schritt 1: Verstecke Chat-Modal
            hideModal();
            
            // Schritt 2: Erstelle einfaches Booking-Interface
            const simpleBookingHtml = `
                <div id="simple-booking-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.85);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                ">
                    <div style="
                        background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
                        color: #e0e0e0;
                        padding: 40px;
                        border-radius: 15px;
                        max-width: 600px;
                        width: 90%;
                        text-align: center;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                        border: 1px solid #444;
                        position: relative;
                        animation: modalSlideIn 0.3s ease-out;
                    ">
                        <button onclick="closeSimpleBooking()" style="
                            position: absolute;
                            top: 15px;
                            right: 20px;
                            background: rgba(255,255,255,0.1);
                            border: none;
                            color: #fff;
                            border-radius: 50%;
                            width: 35px;
                            height: 35px;
                            cursor: pointer;
                            font-size: 1.5rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background-color 0.3s ease;
                        " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">×</button>
                        
                        <div style="margin-bottom: 30px;">
                            <div style="
                                width: 80px;
                                height: 80px;
                                background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
                                border-radius: 50%;
                                margin: 0 auto 20px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 2.5rem;
                            ">📅</div>
                            <h2 style="color: #ffc107; margin: 0 0 15px 0; font-size: 2rem;">Termin mit Michael buchen</h2>
                            <p style="margin: 0; color: #ccc; font-size: 1.1rem;">
                                Lass uns einen passenden Termin für dein Projekt finden!
                            </p>
                        </div>
                        
                        <div style="
                            background: rgba(255,193,7,0.1);
                            border: 1px solid #ffc107;
                            border-radius: 10px;
                            padding: 25px;
                            margin-bottom: 30px;
                            text-align: left;
                        ">
                            <h3 style="color: #ffc107; margin-top: 0; margin-bottom: 15px; font-size: 1.3rem;">
                                📧 Direkter Kontakt
                            </h3>
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #fff;">E-Mail:</strong><br>
                                <a href="mailto:michael@designare.at?subject=Terminanfrage über Evita&body=Hallo Michael,%0D%0A%0D%0AIch würde gerne einen Termin vereinbaren.%0D%0A%0D%0AMein Thema/Projekt:%0D%0A%0D%0AMeine Verfügbarkeit:%0D%0A%0D%0AVielen Dank!" 
                                   style="
                                    color: #ffc107; 
                                    font-size: 1.2rem; 
                                    text-decoration: none;
                                    font-weight: bold;
                                ">michael@designare.at</a>
                            </div>
                            <div style="font-size: 0.95rem; color: #aaa;">
                                <strong>Tipp:</strong> Beschreibe kurz dein Projekt und deine Verfügbarkeit - 
                                Michael antwortet meist innerhalb von 24 Stunden mit konkreten Terminvorschlägen.
                            </div>
                        </div>
                        
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                            margin-bottom: 25px;
                        ">
                            <button onclick="openContactModal()" style="
                                background: #ffc107;
                                color: #1a1a1a;
                                border: none;
                                padding: 15px 20px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 1rem;
                                transition: all 0.3s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(255,193,7,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                📝 Kontakt-Formular
                            </button>
                            
                            <a href="mailto:michael@designare.at?subject=Terminanfrage über Evita&body=Hallo Michael,%0D%0A%0D%0AIch würde gerne einen Termin vereinbaren.%0D%0A%0D%0AMein Thema/Projekt:%0D%0A%0D%0AMeine Verfügbarkeit:%0D%0A- Montag:%0D%0A- Dienstag:%0D%0A- Mittwoch:%0D%0A- Donnerstag:%0D%0A- Freitag:%0D%0A%0D%0ABevorzugte Uhrzeit:%0D%0A%0D%0AVielen Dank!" 
                               style="
                                background: #28a745;
                                color: white;
                                text-decoration: none;
                                padding: 15px 20px;
                                border-radius: 8px;
                                font-weight: bold;
                                font-size: 1rem;
                                transition: all 0.3s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(40,167,69,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                📬 E-Mail schreiben
                            </a>
                        </div>
                        
                        <div style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 8px;
                            padding: 20px;
                            margin-bottom: 20px;
                        ">
                            <h4 style="color: #ffc107; margin-top: 0; margin-bottom: 12px;">⏰ Michael's Verfügbarkeit</h4>
                            <div style="font-size: 0.95rem; color: #ccc; line-height: 1.6;">
                                <strong>Reguläre Zeiten:</strong> Montag - Freitag, 9:00 - 17:00 Uhr<br>
                                <strong>Termine nach Vereinbarung:</strong> Auch abends und am Wochenende möglich<br>
                                <strong>Antwortzeit:</strong> Meist innerhalb von 24 Stunden
                            </div>
                        </div>
                        
                        <button onclick="closeSimpleBooking()" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.95rem;
                            transition: background-color 0.3s ease;
                        " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                            Später kontaktieren
                        </button>
                    </div>
                </div>
                
                <style>
                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: scale(0.9) translateY(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                    
                    @media (max-width: 768px) {
                        #simple-booking-overlay > div {
                            grid-template-columns: 1fr !important;
                            padding: 25px !important;
                            margin: 20px !important;
                        }
                        
                        #simple-booking-overlay > div > div:nth-of-type(4) {
                            grid-template-columns: 1fr !important;
                        }
                    }
                </style>
            `;
            
            // Füge das Interface hinzu
            document.body.insertAdjacentHTML('beforeend', simpleBookingHtml);
            
            // Globale Funktionen für die Buttons
            window.closeSimpleBooking = () => {
                const overlay = document.getElementById('simple-booking-overlay');
                if (overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        overlay.remove();
                    }, 300);
                }
                document.body.style.overflow = '';
                document.body.classList.remove('no-scroll');
                console.log("✅ Einfaches Booking-Interface geschlossen");
            };
            
            window.openContactModal = () => {
                window.closeSimpleBooking();
                // Kurze Verzögerung, dann Kontakt-Modal öffnen
                setTimeout(() => {
                    const contactButton = document.getElementById('contact-button');
                    if (contactButton) {
                        contactButton.click();
                        console.log("📧 Kontakt-Modal geöffnet");
                    } else {
                        console.warn("⚠️ Kontakt-Button nicht gefunden");
                        // Fallback: Direkte E-Mail
                        window.location.href = 'mailto:michael@designare.at?subject=Terminanfrage über Evita';
                    }
                }, 100);
            };
            
            // Event-Listener für das Overlay
            const overlay = document.getElementById('simple-booking-overlay');
            if (overlay) {
                // Schließen bei Klick außerhalb des Modals
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        window.closeSimpleBooking();
                    }
                });
                
                // ESC-Taste zum Schließen
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        window.closeSimpleBooking();
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            }
            
            // Verhindere Body-Scrolling
            document.body.style.overflow = 'hidden';
            document.body.classList.add('no-scroll');
            
            console.log("✅ Einfaches Booking-Interface erfolgreich angezeigt");
            
        } catch (error) {
            console.error("❌ Fehler beim einfachen Booking:", error);
            
            // Fallback: Direkte E-Mail mit vorausgefülltem Inhalt
            const emailSubject = encodeURIComponent("Terminanfrage über Evita");
            const emailBody = encodeURIComponent(`Hallo Michael,

ich würde gerne einen Termin vereinbaren.

Mein Thema/Projekt:


Meine Verfügbarkeit:
- Montag: 
- Dienstag: 
- Mittwoch: 
- Donnerstag: 
- Freitag: 

Bevorzugte Uhrzeit:


Vielen Dank!`);
            const emailUrl = `mailto:michael@designare.at?subject=${emailSubject}&body=${emailBody}`;
            
            if (confirm("Das Buchungssystem ist momentan nicht verfügbar. Möchtest du stattdessen direkt eine E-Mail an Michael schreiben?")) {
                window.location.href = emailUrl;
            } else {
                // Zeige das Chat-Modal wieder an
                showModal();
                addMessageToHistory("Entschuldigung, das Buchungssystem ist momentan nicht verfügbar. Du kannst Michael gerne direkt per E-Mail kontaktieren: michael@designare.at", 'ai');
            }
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
                
                console.log("⏰ Starte einfaches Booking in 2 Sekunden...");
                setTimeout(async () => {
                    console.log("🚀 Timeout erreicht, starte einfaches Booking...");
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

    // Chat Submit Handler
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
        console.log("🔍 Chat-Input Wert:", `"${userInput}"`);

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

    // Chat-Form Event Listener
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ai-chat-form') {
            console.log("🎯 Chat-Form Submit erkannt");
            
            if (chatFormHandled) {
                console.log("⚠️ Chat bereits behandelt, überspringe");
                return;
            }
            
            chatFormHandled = true;
            setTimeout(() => { chatFormHandled = false; }, 100);
            
            handleChatSubmit(e);
        }
    });
    console.log("✅ Chat-Submit-Listener registriert");

    // Close-Button Event Listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideModal();
        });
    });
    console.log("✅ Close-Button-Listener registriert");

    // Debug-Funktion
    window.testSimpleBooking = launchBookingModal;

    console.log("✅ Evita AI-Form mit einfachem Booking vollständig initialisiert");
    console.log("🔧 Test-Funktion verfügbar: window.testSimpleBooking()");
};
