// js/modals.js

// Allgemeine Lightbox-Funktionen
const openLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
};

const closeLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.remove('visible');
        document.body.style.overflow = '';
    }
};

// Cookie-Lightbox-Logik
function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    if (!localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openLightbox(cookieInfoLightbox), 1000);
    }

    if (cookieInfoButton) cookieInfoButton.addEventListener('click', () => openLightbox(cookieInfoLightbox));
    if (acknowledgeCookieLightboxBtn) acknowledgeCookieLightboxBtn.addEventListener('click', () => {
        closeLightbox(cookieInfoLightbox);
        localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
    });
    if (privacyPolicyLinkButton) privacyPolicyLinkButton.addEventListener('click', (e) => {
        e.preventDefault();
        closeLightbox(cookieInfoLightbox);
        loadLegalPageInModal('datenschutz'); 
    });
    if (cookieInfoLightbox) cookieInfoLightbox.addEventListener('click', (e) => {
        if (e.target === cookieInfoLightbox) closeLightbox(cookieInfoLightbox);
    });
}

// Kontakt-Modal-Logik
function setupContactModal() {
    const contactButton = document.getElementById('contact-button');
    const contactModal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form-inner');
    const contactSuccessMessage = document.getElementById('contact-success-message');
    const closeSuccessMessageBtn = document.getElementById('close-success-message');
    const closeModalButton = document.getElementById('close-modal');

    if (contactButton) contactButton.addEventListener('click', () => openLightbox(contactModal));
    if (closeModalButton) closeModalButton.addEventListener('click', () => closeLightbox(contactModal));
    if (contactModal) contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeLightbox(contactModal); });

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (Ihre komplette Formular-Sende-Logik hier einfügen) ...
        });
    }

    if (closeSuccessMessageBtn) closeSuccessMessageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeLightbox(contactModal);
    });
}

// Legal-Seiten-Navigation Logik
async function loadLegalPageInModal(pageName) {
    const legalModal = document.getElementById('legal-modal');
    const legalModalContentArea = document.getElementById('legal-modal-content-area');
    const url = `${pageName}.html`;
    try {
        const response = await fetch(url);
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const legalContainer = doc.querySelector('.legal-container');
        if (legalContainer) {
            legalModalContentArea.innerHTML = legalContainer.innerHTML; // Paginierung hier für Einfachheit entfernt
            openLightbox(legalModal);
        }
    } catch (error) { console.error(`Fehler beim Laden der Seite ${url}:`, error); }
}

function setupLegalModals() {
    const aboutMeButton = document.getElementById('about-me-button');
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    if (aboutMeButton) aboutMeButton.addEventListener('click', (e) => { e.preventDefault(); loadLegalPageInModal('about'); });
    if (impressumLink) impressumLink.addEventListener('click', (e) => { e.preventDefault(); loadLegalPageInModal('impressum'); });
    if (datenschutzLink) datenschutzLink.addEventListener('click', (e) => { e.preventDefault(); loadLegalPageInModal('datenschutz'); });
    
    if (closeLegalModalBtn) closeLegalModalBtn.addEventListener('click', () => closeLightbox(legalModal));
    if (legalModal) legalModal.addEventListener('click', (e) => { if (e.target === legalModal) closeLightbox(legalModal); });
}

// Exportiert eine Haupt-Initialisierungsfunktion für alle Modals
export function initModals() {
    setupCookieModal();
    setupContactModal();
    setupLegalModals();
}
