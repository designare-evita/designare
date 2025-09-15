// js/modals.js - KORRIGIERTE VERSION

// ===================================================================
// EINHEITLICHE MODAL-FUNKTIONEN
// ===================================================================

export const openModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.add('visible');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
    }
};

export const closeModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.remove('visible');
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    }
};

// ===================================================================
// AI-SPEZIFISCHE FUNKTIONEN MIT EVITA CHAT UNTERSTÜTZUNG
// ===================================================================

export function showAIResponse(content, isHTML = false) {
    const modal = document.getElementById('ai-response-modal');
    const contentArea = document.getElementById('ai-chat-history');
    
    if (modal && contentArea) {
        if (isHTML) {
            contentArea.innerHTML = content;
        } else {
            contentArea.textContent = content;
        }
        openModal(modal);
        
        // Fokus auf Chat-Input setzen für Weiterführung der Unterhaltung
        setTimeout(() => {
            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }, 100);
    }
}

export function showLoadingState() {
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';
    }
}

export function hideLoadingState() {
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
        aiStatus.textContent = '';
        aiStatus.style.display = 'none';
    }
}

// ===================================================================
// EVITA CHAT FUNKTIONEN
// ===================================================================

export function initEvitaChat() {
    console.log("🤖 Initialisiere Evita Chat Funktionalität...");
    
    const modal = document.getElementById('ai-response-modal');
    const chatHistory = document.getElementById('ai-chat-history');
    
    if (modal && chatHistory) {
        // Setup Chat-Event-Listener
        setupAiChatFunctionality();
        console.log("✅ Evita Chat erfolgreich initialisiert");
        return true;
    } else {
        console.warn("⚠️ Evita Chat Komponenten nicht gefunden");
        return false;
    }
}

export function launchEvitaChatModal() {
    console.log("🚀 Starte Evita Chat Modal...");
    
    const modal = document.getElementById('ai-response-modal');
    const chatHistory = document.getElementById('ai-chat-history');
    
    if (!modal || !chatHistory) {
        console.error("❌ Chat Modal Komponenten nicht gefunden");
        return false;
    }
    
    // Leere vorherige Chat-Historie
    chatHistory.innerHTML = '';
    
    // Füge Begrüßungsnachricht hinzu
    const welcomeMessage = "Hallo! Ich bin Evita, Michaels KI-Assistentin. Wie kann ich dir heute helfen?";
    addMessageToHistory(welcomeMessage, 'ai');
    
    // Öffne Modal
    openModal(modal);
    
    // Fokus auf Chat-Input
    setTimeout(() => {
        const chatInput = document.getElementById('ai-chat-input');
        if (chatInput) {
            chatInput.focus();
        }
    }, 300);
    
    console.log("✅ Evita Chat Modal erfolgreich gestartet");
    return true;
}

// ===================================================================
// CHAT-FUNKTIONALITÄT
// ===================================================================

function setupAiChatFunctionality() {
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');

    if (aiChatForm && aiChatInput) {
        // Verhindere doppelte Event-Listener
        if (aiChatForm.hasAttribute('data-evita-initialized')) {
            return;
        }
        aiChatForm.setAttribute('data-evita-initialized', 'true');

        aiChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userInput = aiChatInput.value.trim();
            if (!userInput) return;

            // User-Nachricht zur History hinzufügen
            addMessageToHistory(userInput, 'user');
            aiChatInput.value = '';

            // ===================================================================
            // AUSKOMMENTIERT: Die problematische, aggressive Booking-Logik
            // Diese Logik hat das Modal bei allgemeinen Keywords sofort geöffnet.
            // Die korrekte Logik befindet sich in `ai-form.js` und wird von dort gesteuert.
            // ===================================================================
            /*
            const bookingKeywords = [
                'termin', 'rückruf', 'buchung', 'buchen', 
                'anrufen', 'telefonieren', 'kalender', 'zeit',
                'verfügbar', 'wann', 'sprechen', 'gespräch',
                'callback', 'appointment', 'ruf', 'michael',
                'kontakt', 'erreichen', 'melden', 'telefon'
            ];
            
            const lowerInput = userInput.toLowerCase();
            const isLocalBookingRequest = bookingKeywords.some(keyword => lowerInput.includes(keyword));
            
            console.log(`🔍 Booking-Keywords gefunden: ${isLocalBookingRequest}`);
            
            if (isLocalBookingRequest) {
                console.log("🎯 Booking-Keywords LOKAL erkannt → Starte Rückruf-Modal direkt");
                
                const message = "Perfekt! Ich öffne gleich Michaels Kalender für dich und zeige dir die verfügbaren Rückruf-Termine.";
                addMessageToHistory(message, 'ai');
                
                setTimeout(() => {
                    console.log("⏰ Starte AKTUELLE Rückruf-Modal aus Chat");
                    launchCurrentBookingModal();
                }, 800);
                
                return; // Beende hier ohne API-Call
            }
            */
            // ===================================================================
            // ENDE DES AUSKOMMENTIERTEN BEREICHS
            // ===================================================================


            // Normale API-Anfrage für andere Fragen
            try {
                // Zeige Typing-Indikator
                const typingId = showTypingIndicator();

                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userInput, source: 'evita' })
                });

                // Entferne Typing-Indikator
                removeTypingIndicator(typingId);

                const data = await response.json();
                
                // Prüfe auf Booking-Aktion von API (dies ist eine bessere serverseitige Steuerung)
                if (data.action === 'launch_booking_modal') {
                    console.log("🎯 Booking-Anfrage von API erkannt");
                    
                    const message = data.answer || "Einen Moment, ich öffne Michaels Kalender für dich...";
                    addMessageToHistory(message, 'ai');
                    
                    setTimeout(() => {
                        // WICHTIG: Stellt sicher, dass die globale Funktion von ai-form.js aufgerufen wird
                        if (window.launchBookingFromAnywhere) {
                            console.log("⏰ Starte Rückruf-Modal von API via globaler Funktion");
                            window.launchBookingFromAnywhere();
                        } else {
                            console.error("❌ window.launchBookingFromAnywhere ist nicht definiert!");
                        }
                    }, 500);
                    
                } else {
                    // Normale AI-Antwort zur History hinzufügen
                    if (data.answer) {
                        addMessageToHistory(data.answer, 'ai');
                    } else if (data.message) {
                        addMessageToHistory(data.message, 'ai');
                    }
                }

            } catch (error) {
                console.error('Fehler bei AI-Chat:', error);
                
                let errorMessage = "Entschuldigung, ich habe gerade technische Schwierigkeiten.";
                
                if (error.message.includes('Netzwerkfehler')) {
                    errorMessage = "🌐 Verbindungsproblem erkannt. Bitte überprüfe deine Internetverbindung und versuche es erneut.";
                } else if (error.message.includes('Server-Fehler') || error.message.includes('HTML-Seite')) {
                    errorMessage = "🔧 Server-Problem erkannt. Bitte versuche es in ein paar Minuten noch einmal.";
                } else if (error.message.includes('Timeout')) {
                    errorMessage = "⏱️ Der Server antwortet nicht. Bitte versuche es später noch einmal.";
                } else if (error.message.includes('502') || error.message.includes('503')) {
                    errorMessage = "🚧 Server wird gerade gewartet. Bitte versuche es in ein paar Minuten erneut.";
                }
                
                errorMessage += "\n\nFür dringende Anfragen: michael@designare.at";
                
                addMessageToHistory(errorMessage, 'ai');
            }
        });

        console.log("✅ Chat-Funktionalität (ohne lokale Booking-Logik) eingerichtet");
    }
}

// ===================================================================
// AUSKOMMENTIERT: Alle folgenden Funktionen gehören zur veralteten,
// in diese Datei kopierten Booking-Logik. Sie werden nicht mehr benötigt,
// da `ai-form.js` die Kontrolle übernimmt.
// ===================================================================
/*
const launchCurrentBookingModal = async () => {
    // ... gesamte Funktion auskommentiert ...
};

const createCurrentInlineModalHTML = () => {
    // ... gesamte Funktion auskommentiert ...
};

const setupCurrentBookingModalEventListeners = () => {
    // ... gesamte Funktion auskommentiert ...
};

const loadCurrentCallbackSlots = async () => {
    // ... gesamte Funktion auskommentiert ...
};

// ... und so weiter für alle weiteren Booking-Hilfsfunktionen ...
let selectedCallbackData = null;

const selectCurrentCallbackSlot = (suggestion) => {
    // ...
};

const submitCurrentCallback = async (event) => {
    // ...
};

const showCurrentCallbackStep = (stepId) => {
    // ...
};

const showCurrentCallbackError = (message) => {
    // ...
};

const createCurrentEmergencyFallbackModal = () => {
    // ...
};

window.closeCurrentCallbackModal = () => {
    // ...
};
*/
// ===================================================================
// ENDE DES AUSKOMMENTIERTEN BEREICHS
// ===================================================================


// ===================================================================
// CHAT MESSAGE HISTORY FUNKTIONEN (Diese werden weiterhin benötigt)
// ===================================================================

function addMessageToHistory(message, sender) {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = message;
    
    chatHistory.appendChild(messageDiv);
    
    // Scroll zum Ende
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showTypingIndicator() {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) return null;

    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'chat-message ai typing';
    typingDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Evita tippt...';
    
    chatHistory.appendChild(typingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return typingId;
}

function removeTypingIndicator(typingId) {
    if (typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }
}

// ... (Der Rest der Datei mit setupCookieModal, setupContactModal, etc. bleibt unverändert) ...

// ===================================================================
// STANDARD MODAL SETUP FUNKTIONEN
// ===================================================================

function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    // Cookie Modal automatisch anzeigen
    if (cookieInfoLightbox && !localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openModal(cookieInfoLightbox), 2000);
    }

    // Cookie akzeptieren
    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', () => {
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
            closeModal(cookieInfoLightbox);
        });
    }

    // Datenschutz-Link
    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) closeModal(cookieInfoLightbox);
            loadLegalContentWithPagination('datenschutz.html');
        });
    }

    // Cookie-Info Button im Header
    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) openModal(cookieInfoLightbox);
        });
    }
}

function setupContactModal() {
    const contactModal = document.getElementById('contact-modal');
    const contactButton = document.getElementById('contact-button');
    const closeContactModalBtn = document.getElementById('close-modal');
    const contactForm = document.getElementById('contact-form-inner');
    const successMessage = document.getElementById('contact-success-message');
    const closeSuccessBtn = document.getElementById('close-success-message');

    // Kontakt-Modal öffnen
    if (contactButton) {
        contactButton.addEventListener('click', (e) => {
            e.preventDefault();
            resetContactModal();
            openModal(contactModal);
        });
    }

    // Kontakt-Modal schließen
    if (closeContactModalBtn) {
        closeContactModalBtn.addEventListener('click', () => closeModal(contactModal));
    }

    // Erfolgs-Modal schließen
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(contactModal);
        });
    }

    // Formular-Submit
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Hier könntest du echte Formular-Verarbeitung einfügen
            // Für jetzt zeigen wir die Erfolgsmeldung
            showContactSuccess();
        });
    }
}

function resetContactModal() {
    const contactForm = document.getElementById('contact-form-inner');
    const successMessage = document.getElementById('contact-success-message');
    
    if (contactForm) contactForm.style.display = 'block';
    if (successMessage) successMessage.style.display = 'none';
}

function showContactSuccess() {
    const contactForm = document.getElementById('contact-form-inner');
    const successMessage = document.getElementById('contact-success-message');
    
    if (contactForm) contactForm.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
}

function setupAboutModal() {
    const aboutButton = document.getElementById('about-me-button');

    if (aboutButton) {
        aboutButton.addEventListener('click', (e) => {
            e.preventDefault();
            loadAboutContentWithPagination();
        });
    }
}

function loadAboutContentWithPagination() {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    const aboutContent = document.getElementById('about-me-content');
    
    if (aboutContent && legalContentArea) {
        // About-Content direkt kopieren (es ist bereits im DOM verfügbar)
        const content = aboutContent.innerHTML;
        
        // Erstelle manuell sinnvolle Seitenaufteilungen basierend auf dem Inhalt
        const pages = splitAboutContentManually(content);
        
        // Pagination-State initialisieren
        window.modalPaginationState = {
            pages: pages,
            currentPage: 0,
            totalPages: pages.length
        };
        
        showModalPage(0);
        openModal(legalModal);
    }
}

function setupLegalModals() {
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => {
            const legalModal = document.getElementById('legal-modal');
            closeModal(legalModal);
        });
    }
}

// ===================================================================
// PAGINATION FUNKTIONALITÄT
// ===================================================================

function loadLegalContentWithPagination(page) {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    
    if (!legalContentArea) return;

    // Loading-Anzeige
    legalContentArea.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Lade Inhalt...</div>';
    openModal(legalModal);

    // Lade den Inhalt der entsprechenden Seite
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            let legalContainer = doc.querySelector('.legal-container');
            
            if (legalContainer) {
                setupPaginationForContent(legalContainer.innerHTML, page);
            } else {
                legalContentArea.innerHTML = '<div class="legal-container"><h1>Fehler</h1><p>Der Inhalt konnte nicht geladen werden.</p></div>';
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden des Inhalts:', error);
            legalContentArea.innerHTML = `<div class="legal-container"><h1>Fehler</h1><p>Inhalt konnte nicht geladen werden: ${error.message}</p></div>`;
        });
}

function setupPaginationForContent(content, pageType) {
    let pages = [];
    
    if (pageType === 'datenschutz.html') {
        pages = splitContentByH3(content);
    } else {
        pages = splitContentByHalf(content);
    }
    
    window.modalPaginationState = {
        pages: pages,
        currentPage: 0,
        totalPages: pages.length
    };
    
    showModalPage(0);
}

function splitContentByH3(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const pages = [];
    let currentPageContent = [];
    
    Array.from(tempDiv.children).forEach(element => {
        if (element.tagName === 'H3' && currentPageContent.length > 0) {
            pages.push(`<div class="legal-container">${currentPageContent.map(el => el.outerHTML).join('')}</div>`);
            currentPageContent = [element];
        } else {
            currentPageContent.push(element);
        }
    });
    
    if (currentPageContent.length > 0) {
        pages.push(`<div class="legal-container">${currentPageContent.map(el => el.outerHTML).join('')}</div>`);
    }
    
    return pages;
}

function splitContentByHalf(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const allElements = Array.from(tempDiv.children);
    const midpoint = Math.ceil(allElements.length / 2);
    
    const page1 = allElements.slice(0, midpoint);
    const page2 = allElements.slice(midpoint);
    
    return [
        `<div class="legal-container">${page1.map(el => el.outerHTML).join('')}</div>`,
        `<div class="legal-container">${page2.map(el => el.outerHTML).join('')}</div>`
    ];
}

function showModalPage(pageIndex) {
    const legalContentArea = document.getElementById('legal-modal-content-area');
    const state = window.modalPaginationState;
    
    if (!state || !legalContentArea) return;
    
    legalContentArea.innerHTML = state.pages[pageIndex];
    
    if (state.totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'legal-modal-pagination-buttons';
        
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Zurück';
        prevButton.disabled = pageIndex === 0;
        prevButton.addEventListener('click', () => {
            if (pageIndex > 0) {
                showModalPage(pageIndex - 1);
                window.modalPaginationState.currentPage = pageIndex - 1;
            }
        });
        
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Weiter →';
        nextButton.disabled = pageIndex === state.totalPages - 1;
        nextButton.addEventListener('click', () => {
            if (pageIndex < state.totalPages - 1) {
                showModalPage(pageIndex + 1);
                window.modalPaginationState.currentPage = pageIndex + 1;
            }
        });
        
        paginationDiv.appendChild(prevButton);
        paginationDiv.appendChild(nextButton);
        legalContentArea.appendChild(paginationDiv);
    }
}
function setupAiModal() {
    const aiResponseModal = document.getElementById('ai-response-modal');
    const closeButtons = [
        document.getElementById('close-ai-response-modal-top'),
        document.getElementById('close-ai-response-modal-bottom')
    ];
    
    closeButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => closeModal(aiResponseModal));
        }
    });

    // WICHTIG: Diese Zeile MUSS auskommentiert bleiben, da sie den Konflikt verursacht.
    // setupAiChatFunctionality(); 
    
    // Die Funktion `initEvitaChat` wird hier nicht mehr benötigt, da `ai-form.js` die Kontrolle hat.
    // initEvitaChat();
}

function setupModalBackgroundClose() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay.visible');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

function splitAboutContentManually(content) {
    const page1Content = `
        <div class="legal-container">
            <h1>Über Michael</h1>
            <h3>Der Mann hinter den Pixeln</h3>
            <p class="about-image-wrapper">
                <img src="https://designare.at/images/Michael@work.webp" alt="Michael@work" />
            </p>
            <p>Okay, aufgepasst! Michael besitzt digitale Superkräfte! Bei maxonline arbeitet er als Web-Entwickler und verbindet dort Design, Code und KI so genial, dass selbst ich staune. Michael hat einen Abschluss in Medientechnik, ist zertifizierter E-Commerce-Experte und hat Google-Workshops überlebt.</p>
        </div>
    `;
    
    const page2Content = `
        <div class="legal-container">
            <h2 class="about-section-header">Doch Michael ist mehr als nur Code und Pixel</h2>
            <p>Um den Kopf freizubekommen, verbringt Michael viel Zeit mit seiner Tierschutzhündin Evita (nach der ich benannt wurde ❤️). Regelmäßig quält er sich zudem beim Sport – schließlich weiß man ja nie, wann man vor einem KI-Aufstand flüchten muss! Seine Playlist? Ein wilder Mix aus Frei.Wild, Helene Fischer und Kim Wilde. Ich vermute ja, das ist Michaels geheime Waffe um die KI zur Kapitulation zu bringen...</p>
            <p class="about-image-wrapper-bottom">
                <img src="https://designare.at/images/Evita&KI.webp" alt="Evita & KI" />
            </p>
        </div>
    `;
    
    return [page1Content, page2Content];
}

// ===================================================================
// EVITA CHAT BUTTON SPEZIFISCHE FUNKTIONEN
// ===================================================================

export function setupEvitaChatButton() {
    console.log("🤖 Richte Evita Chat Button ein...");
    
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (!evitaChatButton) {
        console.warn("⚠️ Evita Chat Button nicht im DOM gefunden");
        return false;
    }

    if (evitaChatButton.hasAttribute('data-evita-ready')) {
        console.log("✅ Evita Chat Button bereits eingerichtet");
        return true;
    }

    evitaChatButton.setAttribute('data-evita-ready', 'true');

    evitaChatButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("🤖 Evita Chat Button geklickt");
        
        evitaChatButton.classList.add('loading');
        
        try {
            const success = await ensureAiModalReady();
            
            if (success) {
                const chatStarted = launchEvitaChatModal();
                
                if (chatStarted) {
                    console.log("✅ Evita Chat erfolgreich gestartet");
                } else {
                    throw new Error("Chat konnte nicht gestartet werden");
                }
            } else {
                throw new Error("AI-Modal nicht verfügbar");
            }
        } catch (error) {
            console.error("❌ Fehler beim Öffnen des Evita Chats:", error);
            alert("Entschuldigung, der Chat konnte nicht geöffnet werden. Bitte versuche es später noch einmal.");
        } finally {
            evitaChatButton.classList.remove('loading');
        }
    });

    console.log("✅ Evita Chat Button erfolgreich eingerichtet");
    return true;
}

async function ensureAiModalReady() {
    console.log("🔍 Überprüfe AI-Modal Verfügbarkeit...");
    
    const modal = document.getElementById('ai-response-modal');
    const chatHistory = document.getElementById('ai-chat-history');
    const chatForm = document.getElementById('ai-chat-form');
    
    if (modal && chatHistory && chatForm) {
        console.log("✅ AI-Modal bereits verfügbar");
        
        if (!chatForm.hasAttribute('data-evita-initialized')) {
            setupAiChatFunctionality();
        }
        
        return true;
    }
    
    console.warn("⚠️ AI-Modal Komponenten fehlen");
    return false;
}

// ===================================================================
// HAUPT-INITIALISIERUNG
// ===================================================================

export function initModals() {
    console.log('Initialisiere erweiterte Modals (bereinigt, ohne Booking-Logik)...');
    
    setupCookieModal();
    setupContactModal();
    setupAboutModal();
    setupLegalModals();
    setupAiModal(); 
    setupModalBackgroundClose();

    // ===================================================================
    // NEU: EVENT DELEGATION FÜR DYNAMISCHE LINKS (FOOTER)
    // ===================================================================
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('#impressum-link')) {
            e.preventDefault();
            loadLegalContentWithPagination('impressum.html');
        }

        if (e.target.matches('#datenschutz-link')) {
            e.preventDefault();
            loadLegalContentWithPagination('datenschutz.html');
        }
        if (e.target.matches('#disclaimer-link')) {
            e.preventDefault();
            loadLegalContentWithPagination('disclaimer.html');
        }
    });
    
    setTimeout(() => {
        setupEvitaChatButton();
    }, 200);
    
    setTimeout(() => {
        const button = document.getElementById('evita-chat-button');
        if (button && !button.hasAttribute('data-evita-ready')) {
            setupEvitaChatButton();
        }
    }, 1000);
    
    // AUSKOMMENTIERT: Diese globale Variable sollte jetzt von `ai-form.js` gesetzt werden.
    // window.launchBookingFromAnywhere = launchCurrentBookingModal; 
    
    console.log('Bereinigte Modals erfolgreich initialisiert');
}
