// js/modals.js

export function showAIResponse(content, isHTML = false) {
  const modal = document.getElementById('ai-response-modal');
  const contentArea = document.getElementById('ai-response-content-area');
  
  if (modal && contentArea) {
    if (isHTML) {
      // Setzt HTML-Inhalt direkt (für die Termin-Buttons)
      contentArea.innerHTML = content;
    } else {
      // Setzt normalen Text und verhindert, dass HTML-Tags ausgeführt werden
      contentArea.textContent = content;
    }
    
    modal.classList.add('active'); // Öffnet das Modal
    document.body.classList.add('no-scroll'); // Verhindert das Scrollen der Seite
  }
}

// ===================================================================
// 1. ALLGEMEINE HELFERFUNKTIONEN (EXPORTIERT)
// ===================================================================
// Diese Funktionen werden von anderen Skripten (wie ai-form.js) benötigt,
// daher werden sie mit "export" für den Import verfügbar gemacht.

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
// 2. SETUP-FUNKTIONEN FÜR JEDES EINZELNE MODAL
// ===================================================================
// Jede Funktion ist für die Logik eines bestimmten Modals zuständig.

/**
 * Initialisiert das Cookie-Hinweis-Modal.
 */
function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    if (!localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openLightbox(cookieInfoLightbox), 1000);
    }
    
    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', () => {
            localStorage.removeItem('hasSeenCookieInfoLightbox');
            openLightbox(cookieInfoLightbox);
        });
    }
    
    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', () => {
            closeLightbox(cookieInfoLightbox);
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
        });
    }
    
    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeLightbox(cookieInfoLightbox);
            loadLegalPageInModal('datenschutz');
        });
    }
    
    if (cookieInfoLightbox) {
        cookieInfoLightbox.addEventListener('click', (e) => {
            if (e.target === cookieInfoLightbox) {
                closeLightbox(cookieInfoLightbox);
            }
        });
    }
}

/**
 * Initialisiert das Kontaktformular-Modal.
 */
function setupContactModal() {
    const contactButton = document.getElementById('contact-button');
    const contactModal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form-inner');
    const contactSuccessMessage = document.getElementById('contact-success-message');
    const closeSuccessMessageBtn = document.getElementById('close-success-message');
    const closeModalButton = document.getElementById('close-modal');

    if (contactButton) {
        contactButton.addEventListener('click', () => openLightbox(contactModal));
    }
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => closeLightbox(contactModal));
    }
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) closeLightbox(contactModal);
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const object = {};
            formData.forEach((value, key) => { object[key] = value; });
            object['_subject'] = object['_subject'] || 'Neue Kontaktanfrage von designare.at';
            
            const submitButton = e.submitter;
            const originalButtonText = submitButton.innerText;
            submitButton.innerText = "Sende...";
            submitButton.disabled = true;
            
            try {
                const response = await fetch('https://formsubmit.co/ajax/michael@designare.at', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(object)
                });
                const data = await response.json();
                if (data.success) {
                    contactForm.style.display = 'none';
                    contactSuccessMessage.style.display = 'block';
                    contactForm.reset();
                } else {
                    alert('Fehler: ' + (data.message || 'Unbekannter Fehler.'));
                }
            } catch (error) {
                alert('Ein unerwarteter Fehler ist aufgetreten.');
            } finally {
                submitButton.innerText = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    if (closeSuccessMessageBtn) {
        closeSuccessMessageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeLightbox(contactModal);
            // Formular für den nächsten Besuch zurücksetzen
            setTimeout(() => {
                contactForm.style.display = 'block';
                contactSuccessMessage.style.display = 'none';
            }, 500);
        });
    }
}

/**
 * Initialisiert das AI-Chat-Modal (Schließen-Funktionalität).
 */
function setupAiModal() {
    const aiModal = document.getElementById('ai-response-modal');
    const closeButton = document.getElementById('close-ai-response-modal-top');

    if (closeButton) {
        closeButton.addEventListener('click', () => closeLightbox(aiModal));
    }

    if (aiModal) {
        aiModal.addEventListener('click', (e) => {
            if (e.target === aiModal) {
                closeLightbox(aiModal);
            }
        });
    }
}

/**
 * Initialisiert die Modals für rechtliche Inhalte (Impressum, Datenschutz, Über Mich).
 */
function setupLegalModals() {
    const aboutMeButton = document.getElementById('about-me-button');
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    if (aboutMeButton) {
        aboutMeButton.addEventListener('click', (e) => {
            e.preventDefault();
            const aboutContentSource = document.getElementById('about-me-content');
            const legalModalTarget = document.getElementById('legal-modal');
            const legalModalContentAreaTarget = document.getElementById('legal-modal-content-area');
            if (aboutContentSource && legalModalTarget && legalModalContentAreaTarget) {
                paginateAndShowModal(aboutContentSource.innerHTML, 'about', legalModalTarget, legalModalContentAreaTarget);
            }
        });
    }

    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('impressum');
        });
    }
    
    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('datenschutz');
        });
    }
    
    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => closeLightbox(legalModal));
    }
    
    if (legalModal) {
        legalModal.addEventListener('click', (e) => {
            if (e.target === legalModal) closeLightbox(legalModal);
        });
    }
}


// ===================================================================
// 3. LOGIK FÜR DYNAMISCH GELADENE INHALTE
// ===================================================================

/**
 * Lädt den Inhalt einer Seite (z.B. impressum.html) und startet die Anzeige im Modal.
 */
async function loadLegalPageInModal(pageName) {
    try {
        const response = await fetch(`${pageName}.html`);
        if (!response.ok) throw new Error('Seite nicht gefunden');
        const htmlContent = await response.text();
        
        const legalModal = document.getElementById('legal-modal');
        const legalModalContentArea = document.getElementById('legal-modal-content-area');

        if (!legalModal || !legalModalContentArea) {
            return console.error('Das Legal-Modal oder sein Inhaltsbereich wurde nicht gefunden.');
        }
        paginateAndShowModal(htmlContent, pageName, legalModal, legalModalContentArea);
    } catch (error) {
        console.error(`Fehler beim Laden von ${pageName}.html:`, error);
    }
}

/**
 * Teilt den geladenen HTML-Inhalt auf mehrere Seiten auf und zeigt ihn an.
 */
function paginateAndShowModal(htmlContentString, pageName, legalModal, legalModalContentArea) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContentString, 'text/html');
    const legalContainer = doc.querySelector('.legal-container');

    if (legalContainer) {
        legalModalContentArea.innerHTML = '';
        const children = Array.from(legalContainer.children);
        let allParts = [];
        let currentPage = 0;

        // Paginierungslogik hier... (Dein bestehender, funktionierender Code)
        const splitIndex = Math.ceil(children.length / 2);
        allParts.push(children.slice(0, splitIndex));
        allParts.push(children.slice(splitIndex));

        const partDivs = allParts.map(part => {
            const div = document.createElement('div');
            part.forEach(child => div.appendChild(child.cloneNode(true)));
            return div;
        });

        const renderCurrentPart = () => {
            partDivs.forEach((div, index) => {
                div.style.display = (index === currentPage) ? 'block' : 'none';
            });
            legalModalContentArea.scrollTop = 0;
            updatePaginationButtons();
        };

        const updatePaginationButtons = () => {
            let backButton = legalModalContentArea.querySelector('#legal-back-button');
            let continueButton = legalModalContentArea.querySelector('#legal-continue-button');
            if (backButton) backButton.style.display = (currentPage > 0) ? 'inline-block' : 'none';
            if (continueButton) continueButton.style.display = (currentPage < allParts.length - 1) ? 'inline-block' : 'none';
        };

        partDivs.forEach(div => legalModalContentArea.appendChild(div));

        if (allParts.length > 1) {
            const paginationDiv = document.createElement('div');
            paginationDiv.className = 'legal-modal-pagination-buttons';
            const backButton = document.createElement('button');
            backButton.id = 'legal-back-button';
            backButton.textContent = 'Zurück';
            backButton.onclick = () => { currentPage--; renderCurrentPart(); };
            const continueButton = document.createElement('button');
            continueButton.id = 'legal-continue-button';
            continueButton.textContent = 'Weiter';
            continueButton.onclick = () => { currentPage++; renderCurrentPart(); };
            paginationDiv.appendChild(backButton);
            paginationDiv.appendChild(continueButton);
            legalModalContentArea.appendChild(paginationDiv);
        }

        renderCurrentPart();
        openLightbox(legalModal);
    }
}


// ===================================================================
// 4. HAUPT-INITIALISIERUNG
// ===================================================================

/**
 * Die Hauptfunktion, die von main.js importiert wird.
 * Sie startet alle Setup-Funktionen für die Modals.
 */
export function initModals() {
    setupCookieModal();
    setupContactModal();
    setupLegalModals();
    setupAiModal();
}
