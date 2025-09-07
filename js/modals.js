// js/modals.js - KORRIGIERTE VERSION mit einheitlichem Modal-System

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
// AI-SPEZIFISCHE FUNKTIONEN
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
            // Lade Datenschutz-Inhalt und öffne Legal-Modal
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
            // Formular anzeigen, Erfolgsmeldung verstecken
            if (contactForm) contactForm.style.display = 'block';
            if (successMessage) successMessage.style.display = 'none';
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

    // Formular-Submit (vereinfacht - hier würdest du deine Formlogik einfügen)
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Hier würde normalerweise das Formular verarbeitet
            // Für Demo zeigen wir einfach die Erfolgsmeldung
            contactForm.style.display = 'none';
            successMessage.style.display = 'block';
        });
    }
}

function setupAboutModal() {
    const aboutButton = document.getElementById('about-me-button');
    const legalModal = document.getElementById('legal-modal');
    const aboutContent = document.getElementById('about-me-content');
    const legalContentArea = document.getElementById('legal-modal-content-area');

    if (aboutButton) {
        aboutButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // About-Me Inhalt in das Legal-Modal laden
            if (aboutContent && legalContentArea) {
                legalContentArea.innerHTML = aboutContent.innerHTML;
                openModal(legalModal);
            }
        });
    }
}

function setupLegalModals() {
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const legalModal = document.getElementById('legal-modal');
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
        closeLegalModalBtn.addEventListener('click', () => closeModal(legalModal));
    }
}

function loadLegalContent(page) {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    
    if (!legalContentArea) return;

    // Lade den Inhalt der entsprechenden Seite
    fetch(page)
        .then(response => response.text())
        .then(html => {
            // Extrahiere nur den Inhalt zwischen den main-Tags oder den body-Inhalt
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const legalContainer = doc.querySelector('.legal-container');
            
            if (legalContainer) {
                legalContentArea.innerHTML = legalContainer.innerHTML;
            } else {
                legalContentArea.innerHTML = '<p>Inhalt konnte nicht geladen werden.</p>';
            }
            
            openModal(legalModal);
        })
        .catch(error => {
            console.error('Fehler beim Laden des Inhalts:', error);
            legalContentArea.innerHTML = '<p>Fehler beim Laden des Inhalts.</p>';
            openModal(legalModal);
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

    // Chat-Form Submit
    const aiChatForm = document.getElementById('ai-chat-form');
    if (aiChatForm) {
        aiChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Hier würde die Chat-Logik stehen
        });
    }
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
