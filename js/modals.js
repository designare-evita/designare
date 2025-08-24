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

    // Zeige Cookie-Lightbox nur wenn noch nicht gesehen
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

// Kontakt-Modal-Logik
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
            if (e.target === contactModal) {
                closeLightbox(contactModal);
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const object = {};
            formData.forEach((value, key) => {
                object[key] = value;
            });
            
            if (!object['_subject']) {
                object['_subject'] = 'Neue Kontaktanfrage von designare.at';
            }
            object['_honey'] = '';
            
            const submitButton = e.submitter || contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerText;
            submitButton.innerText = "Sende...";
            submitButton.disabled = true;
            
            try {
                const response = await fetch('https://formsubmit.co/ajax/michael@designare.at', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(object)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    contactForm.style.display = 'none';
                    contactSuccessMessage.style.display = 'block';
                    contactForm.reset();
                } else {
                    alert('Fehler: ' + (data.message || 'Unbekannter Fehler'));
                }
            } catch (error) {
                console.error('Fehler beim Senden:', error);
                alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.');
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
            // Reset für nächste Verwendung
            setTimeout(() => {
                if (contactForm && contactSuccessMessage) {
                    contactForm.style.display = 'flex';
                    contactSuccessMessage.style.display = 'none';
                }
            }, 300);
        });
    }
}

// Paginierungs- und Lade-Logik für Legal Modals
function paginateAndShowModal(htmlContentString, pageName = '') {
    const legalModal = document.getElementById('legal-modal');
    const legalModalContentArea = document.getElementById('legal-modal-content-area');
    
    if (!legalModal || !legalModalContentArea) {
        console.error('Legal Modal oder Content Area nicht gefunden');
        return;
    }
    
    // Parse HTML String
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContentString, 'text/html');
    
    // Suche nach .legal-container - falls nicht vorhanden, nimm body content
    let legalContainer = doc.querySelector('.legal-container');
    
    // Falls kein .legal-container vorhanden, nimm alle Kinder des body
    if (!legalContainer) {
        legalContainer = doc.body;
    }

    if (legalContainer && legalContainer.children.length > 0) {
        legalModalContentArea.innerHTML = '';
        const children = Array.from(legalContainer.children);
        let allParts = [];
        let currentPage = 0;

        // Bestimme die Anzahl der benötigten Teile basierend auf der Inhaltslänge
        const needsPagination = children.length > 10; // Nur paginieren wenn mehr als 10 Elemente

        if (!needsPagination) {
            // Kein Paging nötig - zeige alles auf einer Seite
            allParts.push(children);
        } else if (pageName === 'datenschutz') {
            // Spezielle Behandlung für Datenschutz-Seite
            const findElementById = (id) => children.find(child => child.id === id);
            const getIndexOfElement = (element) => children.indexOf(element);
            const splitElements = [
                'datenschutz-part-2-start', 
                'datenschutz-part-3-start', 
                'datenschutz-part-4-start', 
                'datenschutz-part-5-start', 
                'datenschutz-part-6-start'
            ]
            .map(id => findElementById(id))
            .filter(el => el);
                
            if (splitElements.length > 0) {
                const indices = splitElements.map(getIndexOfElement).sort((a, b) => a - b);
                let lastIndex = 0;
                indices.forEach(index => {
                    if (index > lastIndex) {
                        allParts.push(children.slice(lastIndex, index));
                        lastIndex = index;
                    }
                });
                if (lastIndex < children.length) {
                    allParts.push(children.slice(lastIndex));
                }
            } else {
                // Fallback: Teile in 2 Hälften
                const splitIndex = Math.ceil(children.length / 2);
                allParts.push(children.slice(0, splitIndex));
                allParts.push(children.slice(splitIndex));
            }
        } else {
            // Standard-Behandlung für andere Seiten (About, Impressum)
            // Suche nach einem guten Teilungspunkt (vorzugsweise bei einem H2 oder H3)
            const midPoint = Math.floor(children.length / 2);
            let splitIndex = -1;
            
            // Suche nach einem H2 oder H3 in der Nähe der Mitte
            for (let i = midPoint - 2; i <= midPoint + 2 && i < children.length; i++) {
                if (i >= 0 && (children[i].tagName === 'H2' || children[i].tagName === 'H3')) {
                    splitIndex = i;
                    break;
                }
            }
            
            // Falls kein Header gefunden, teile einfach in der Mitte
            if (splitIndex === -1) {
                splitIndex = midPoint;
            }
            
            if (splitIndex > 0 && splitIndex < children.length) {
                allParts.push(children.slice(0, splitIndex));
                allParts.push(children.slice(splitIndex));
            } else {
                // Fallback: zeige alles auf einer Seite
                allParts.push(children);
            }
        }

        // Erstelle DIVs für jeden Teil
        const partDivs = allParts.map(part => {
            const div = document.createElement('div');
            div.className = 'legal-modal-part';
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
            const backButton = legalModalContentArea.querySelector('#legal-back-button');
            const continueButton = legalModalContentArea.querySelector('#legal-continue-button');
            
            if (backButton) {
                backButton.style.display = (currentPage > 0) ? 'inline-block' : 'none';
                backButton.disabled = (currentPage === 0);
            }
            
            if (continueButton) {
                continueButton.style.display = (currentPage < allParts.length - 1) ? 'inline-block' : 'none';
                continueButton.disabled = (currentPage >= allParts.length - 1);
            }
        };

        // Füge alle Parts zum Modal hinzu
        partDivs.forEach(div => legalModalContentArea.appendChild(div));

        // Füge Pagination-Buttons hinzu wenn mehr als 1 Teil
        if (allParts.length > 1) {
            const paginationButtonsDiv = document.createElement('div');
            paginationButtonsDiv.className = 'legal-modal-pagination-buttons';
            
            const backButton = document.createElement('button');
            backButton.id = 'legal-back-button';
            backButton.textContent = 'Zurück';
            backButton.addEventListener('click', () => {
                if (currentPage > 0) {
                    currentPage--;
                    renderCurrentPart();
                }
            });
            
            const continueButton = document.createElement('button');
            continueButton.id = 'legal-continue-button';
            continueButton.textContent = 'Weiter';
            continueButton.addEventListener('click', () => {
                if (currentPage < allParts.length - 1) {
                    currentPage++;
                    renderCurrentPart();
                }
            });
            
            paginationButtonsDiv.appendChild(backButton);
            paginationButtonsDiv.appendChild(continueButton);
            legalModalContentArea.appendChild(paginationButtonsDiv);
        }

        renderCurrentPart();
        openLightbox(legalModal);
        
        console.log(`Modal geöffnet für ${pageName || 'Inhalt'} mit ${allParts.length} Teil(en)`);
    } else {
        console.error('Kein Inhalt zum Anzeigen gefunden');
    }
}

// Lade Legal-Seiten asynchron
async function loadLegalPageInModal(pageName) {
    const url = `${pageName}.html`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const htmlContent = await response.text();
        paginateAndShowModal(htmlContent, pageName);
    } catch (error) {
        console.error(`Fehler beim Laden von ${pageName}.html:`, error);
        alert(`Die Seite ${pageName} konnte nicht geladen werden.`);
    }
}

// Setup für Legal Modals (About Me, Impressum, Datenschutz)
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
            if (aboutContentSource) {
                // Hole den inneren HTML-Inhalt direkt
                const innerContent = aboutContentSource.innerHTML;
                // Übergebe den kompletten HTML-String
                paginateAndShowModal(innerContent, 'about');
            } else {
                console.error('About Me Content nicht gefunden');
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
            if (e.target === legalModal) {
                closeLightbox(legalModal);
            }
        });
    }
}

// ESC-Taste zum Schließen aller Modals
function setupEscapeKey() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.visible').forEach(modal => {
                closeLightbox(modal);
            });
        }
    });
}

// Hauptinitialisierungsfunktion - ES6 Export
export function initModals() {
    console.log('Initialisiere Modals...');
    
    try {
        setupCookieModal();
        setupContactModal();
        setupLegalModals();
        setupEscapeKey();
        
        console.log('✅ Modals erfolgreich initialisiert!');
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren der Modals:', error);
    }
}
