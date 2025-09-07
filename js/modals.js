// js/modals.js (REPARATUR-VERSION BASIEREND AUF IHREM ORIGINAL)

// ===================================================================
// 1. IHR ORIGINALCODE: HELFERFUNKTIONEN
// DIESER TEIL WIRD 1:1 AUS IHRER FUNKTIONIERENDEN DATEI ÜBERNOMMEN
// ===================================================================
export const openLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
};

export const closeLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.remove('visible');
        document.body.style.overflow = '';
    }
};

// ===================================================================
// 2. MINIMALE ERWEITERUNG FÜR EVITA
// Diese 3 Funktionen werden sauber hinzugefügt, ohne etwas zu verändern.
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
    openLightbox(modal);
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
// 3. IHR ORIGINALCODE: SETUP-FUNKTIONEN
// DIESER TEIL WIRD 1:1 AUS IHRER FUNKTIONIERENDEN DATEI ÜBERNOMMEN
// ===================================================================

function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    if (cookieInfoLightbox && !localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openLightbox(cookieInfoLightbox), 2000);
    }
    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', () => {
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
            closeLightbox(cookieInfoLightbox);
        });
    }
    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) closeLightbox(cookieInfoLightbox);
            const datenschutzModal = document.getElementById('datenschutz-modal');
            if (datenschutzModal) openLightbox(datenschutzModal);
        });
    }
    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) openLightbox(cookieInfoLightbox);
        });
    }
}

function setupContactModal() {
    const contactModal = document.getElementById('contact-modal');
    const openContactModalBtn = document.getElementById('open-contact-modal');
    const closeContactModalBtn = document.getElementById('close-modal');

    if (openContactModalBtn) {
        openContactModalBtn.addEventListener('click', () => openLightbox(contactModal));
    }
    if (closeContactModalBtn) {
        closeContactModalBtn.addEventListener('click', () => closeLightbox(contactModal));
    }
}

function setupLegalModals() {
    ['impressum-link', 'datenschutz-link'].forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = linkId.replace('-link', '-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    openLightbox(modal);
                }
            });
        }
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
            btn.addEventListener('click', () => closeLightbox(aiResponseModal));
        }
    });
    const aiChatForm = document.getElementById('ai-chat-form');
    if (aiChatForm) {
        aiChatForm.addEventListener('submit', (e) => e.preventDefault());
    }
}

// ===================================================================
// 4. IHR ORIGINALCODE: HAUPT-INITIALISIERUNG
// ===================================================================

export function initModals() {
    setupCookieModal();
    setupContactModal();
    setupLegalModals();
    setupAiModal();
}
