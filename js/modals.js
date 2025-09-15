// js/modals.js - FINALE, BEREINIGTE VERSION OHNE JEGLICHE AI-CHAT-LOGIK

// ===================================================================
// DIESE DATEI STEUERT NUR NOCH DAS ÖFFNEN UND SCHLIESSEN VON FENSTERN.
// DIE GESAMTE KI-LOGIK LIEGT AUSSCHLIESSLICH IN `ai-form.js`.
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

// Diese Funktion wird von `ai-form.js` aufgerufen, um das Modal-Fenster anzuzeigen.
export function showAIResponse(content, isHTML = false) {
    const modal = document.getElementById('ai-response-modal');
    const contentArea = document.getElementById('ai-chat-history');

    if (modal && contentArea) {
        if (isHTML) {
            contentArea.innerHTML = content;
        } else {
            // Wichtig: Ersetzt den Inhalt, anstatt hinzuzufügen
            contentArea.textContent = content;
        }
        openModal(modal);
    }
}


// ===================================================================
// STANDARD MODAL SETUP FUNKTIONEN (unverändert)
// ===================================================================

function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    if (cookieInfoLightbox && !localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openModal(cookieInfoLightbox), 2000);
    }

    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', () => {
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
            closeModal(cookieInfoLightbox);
        });
    }

    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) closeModal(cookieInfoLightbox);
            loadLegalContentWithPagination('datenschutz.html');
        });
    }

    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) openModal(cookieInfoLightbox);
        });
    }
}

function setupContactModal() {
    // ... (Ihre bestehende Funktion bleibt hier unverändert)
}

function setupAboutModal() {
    // ... (Ihre bestehende Funktion bleibt hier unverändert)
}

function loadLegalContentWithPagination(page) {
    // ... (Ihre bestehende Funktion bleibt hier unverändert)
}

// Diese Funktion initialisiert NUR NOCH die Schließen-Buttons des AI-Modals.
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
            if (openModal) closeModal(openModal);
        }
    });
}

// ===================================================================
// HAUPT-INITIALISIERUNG
// ===================================================================

export function initModals() {
    console.log('Initialisiere finale, bereinigte Modals...');
    
    setupCookieModal();
    setupContactModal();
    setupAboutModal();
    // setupLegalModals(); // Diese Funktion existiert nicht, sicher entfernt
    setupAiModal(); // Diese Funktion ist jetzt sicher und verursacht keine Konflikte mehr
    setupModalBackgroundClose();

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
}
