// js/modals.js

const body = document.body;

// Allgemeine Lightbox-Funktionen
const openLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.add('visible');
        body.style.overflow = 'hidden';
    }
};

const closeLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.remove('visible');
        body.style.overflow = '';
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
    if (cookieInfoButton) cookieInfoButton.addEventListener('click', () => {
        localStorage.removeItem('hasSeenCookieInfoLightbox');
        openLightbox(cookieInfoLightbox);
    });
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
    // ... (Restlicher Code für das Kontakt-Modal bleibt unverändert)
}

// Funktion, die HTML-Inhalt entgegennimmt und die Paginierung anwendet.
function paginateAndShowModal(htmlContentString, pageName = '') {
    const legalModal = document.getElementById('legal-modal');
    const legalModalContentArea = document.getElementById('legal-modal-content-area');
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContentString, 'text/html');
    const legalContainer = doc.querySelector('.legal-container');

    if (legalContainer) {
        legalModalContentArea.innerHTML = '';
        const children = Array.from(legalContainer.children);
        let allParts = [];
        let currentPage = 0;

        // Paginierungslogik
        if (pageName === 'datenschutz') {
            // ... (Ihre Paginierungslogik für Datenschutz)
        } else {
            // 50%-Regel für "Über Mich" und Impressum
            const splitIndex = Math.ceil(children.length / 2);
            allParts.push(children.slice(0, splitIndex));
            allParts.push(children.slice(splitIndex));
        }

        // ... (Restlicher Code zum Rendern der Paginierung)

        openLightbox(legalModal);
    }
}

// Funktion zum Laden von externen Seiten
async function loadLegalPageInModal(pageName) {
    const url = `${pageName}.html`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Seite nicht gefunden');
        const htmlContent = await response.text();
        paginateAndShowModal(htmlContent, pageName);
    } catch (error) {
        console.error(`Fehler beim Laden von ${pageName}.html:`, error);
    }
}

function setupLegalModals() {
    const aboutMeButton = document.getElementById('about-me-button');
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    // KORRIGIERTE LOGIK
    if (aboutMeButton) {
        aboutMeButton.addEventListener('click', (e) => {
            e.preventDefault();
            const aboutContentSource = document.getElementById('about-me-content');
            if (aboutContentSource) {
                // Liest den Inhalt von der Seite und wendet Paginierung an
                paginateAndShowModal(aboutContentSource.innerHTML);
            }
        });
    }

    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('impressum'); // Lädt externe Datei
        });
    }

    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('datenschutz'); // Lädt externe Datei
        });
    }
    
    // ... (Restlicher Code für die Schliessen-Buttons)
}

export function initModals() {
    setupCookieModal();
    setupContactModal();
    setupLegalModals();
}
