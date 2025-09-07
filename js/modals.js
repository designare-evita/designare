// js/modals.js - VOLLSTÄNDIG KORRIGIERTE VERSION

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
// AI-SPEZIFISCHE FUNKTIONEN MIT CHAT-UNTERSTÜTZUNG
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
// CHAT-FUNKTIONALITÄT FÜR AI-MODAL
// ===================================================================

function setupAiChatFunctionality() {
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatHistory = document.getElementById('ai-chat-history');

    if (aiChatForm && aiChatInput) {
        aiChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userInput = aiChatInput.value.trim();
            if (!userInput) return;

            // User-Nachricht zur History hinzufügen
            addMessageToHistory(userInput, 'user');
            aiChatInput.value = '';

            try {
                // API-Anfrage an Evita
                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userInput, source: 'evita' })
                });

                const data = await response.json();
                
                // AI-Antwort zur History hinzufügen
                if (data.answer) {
                    addMessageToHistory(data.answer, 'ai');
                } else if (data.message) {
                    addMessageToHistory(data.message, 'ai');
                }

            } catch (error) {
                console.error('Fehler bei AI-Chat:', error);
                addMessageToHistory('Entschuldigung, da ist ein technischer Fehler aufgetreten.', 'ai');
            }
        });
    }
}

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

// ===================================================================
// MODAL SETUP FUNKTIONEN
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
            loadLegalContent('datenschutz.html');
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
            loadAboutContent();
        });
    }
}

function loadAboutContent() {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    const aboutContent = document.getElementById('about-me-content');
    
    if (aboutContent && legalContentArea) {
        // About-Content direkt kopieren (es ist bereits im DOM verfügbar)
        legalContentArea.innerHTML = aboutContent.innerHTML;
        openModal(legalModal);
    }
}

function setupLegalModals() {
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    // Impressum Link
    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContent('impressum.html');
        });
    }

    // Datenschutz Link
    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContent('datenschutz.html');
        });
    }

    // Legal Modal schließen
    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => {
            const legalModal = document.getElementById('legal-modal');
            closeModal(legalModal);
        });
    }
}

function loadLegalContent(page) {
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
            // Extrahiere den Inhalt
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Suche nach dem legal-container
            let legalContainer = doc.querySelector('.legal-container');
            
            // Fallback: Suche nach main-content
            if (!legalContainer) {
                legalContainer = doc.querySelector('main');
            }
            
            // Fallback: Nimm den body-Inhalt
            if (!legalContainer) {
                legalContainer = doc.querySelector('body');
            }
            
            if (legalContainer) {
                legalContentArea.innerHTML = legalContainer.innerHTML;
            } else {
                legalContentArea.innerHTML = '<div class="legal-container"><h1>Fehler</h1><p>Der Inhalt konnte nicht geladen werden.</p></div>';
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden des Inhalts:', error);
            legalContentArea.innerHTML = `<div class="legal-container"><h1>Fehler</h1><p>Inhalt konnte nicht geladen werden: ${error.message}</p></div>`;
        });
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

    // Setup Chat-Funktionalität
    setupAiChatFunctionality();
}

function setupModalBackgroundClose() {
    // Schließe Modals beim Klick auf den Hintergrund
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });

    // Schließe Modals mit ESC-Taste
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay.visible');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
}

// ===================================================================
// HAUPT-INITIALISIERUNG
// ===================================================================

export function initModals() {
    console.log('Initialisiere Modals...');
    
    setupCookieModal();
    setupContactModal();
    setupAboutModal();
    setupLegalModals();
    setupAiModal();
    setupModalBackgroundClose();
    
    console.log('Modals erfolgreich initialisiert');
}
