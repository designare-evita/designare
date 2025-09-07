// js/modals.js - MIT PAGINATION FÜR DATENSCHUTZ/IMPRESSUM/ÜBER MICH

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
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    // Impressum Link
    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContentWithPagination('impressum.html');
        });
    }

    // Datenschutz Link
    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalContentWithPagination('datenschutz.html');
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
            // Extrahiere den Inhalt
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Suche nach dem legal-container
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
        // Datenschutz: Teilung bei jedem H3
        pages = splitContentByH3(content);
    } else {
        // Impressum: 50% Teilung
        pages = splitContentByHalf(content);
    }
    
    // Pagination-State initialisieren
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
            // Neue Seite beginnen bei H3
            pages.push(`<div class="legal-container">${currentPageContent.map(el => el.outerHTML).join('')}</div>`);
            currentPageContent = [element];
        } else {
            currentPageContent.push(element);
        }
    });
    
    // Letzte Seite hinzufügen
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
    
    // Seiteninhalt anzeigen
    legalContentArea.innerHTML = state.pages[pageIndex];
    
    // Pagination-Buttons hinzufügen (wenn mehr als 1 Seite)
    if (state.totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'legal-modal-pagination-buttons';
        
        // Zurück-Button
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Zurück';
        prevButton.disabled = pageIndex === 0;
        prevButton.addEventListener('click', () => {
            if (pageIndex > 0) {
                showModalPage(pageIndex - 1);
                window.modalPaginationState.currentPage = pageIndex - 1;
            }
        });
        
        // Weiter-Button
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

function splitAboutContentManually(content) {
    // Seite 1: Bis einschließlich "Der Mann hinter den Pixeln" Abschnitt
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
    
    // Seite 2: Der Rest des Inhalts
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
