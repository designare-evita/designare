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
            
            const originalButtonText = e.submitter.innerText;
            e.submitter.innerText = "Sende...";
            e.submitter.disabled = true;
            
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
                    alert('Fehler: ' + data.message);
                }
            } catch (error) {
                alert('Ein unerwarteter Fehler ist aufgetreten.');
            } finally {
                e.submitter.innerText = originalButtonText;
                e.submitter.disabled = false;
            }
        });
    }

    if (closeSuccessMessageBtn) {
        closeSuccessMessageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeLightbox(contactModal);
        });
    }
}

// Paginierungs- und Lade-Logik
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

        if (pageName === 'datenschutz') {
            const findElementById = (id) => children.find(child => child.id === id);
            const getIndexOfElement = (element) => children.indexOf(element);
            const splitElements = ['datenschutz-part-2-start', 'datenschutz-part-3-start', 'datenschutz-part-4-start', 'datenschutz-part-5-start', 'datenschutz-part-6-start']
                .map(id => findElementById(id))
                .filter(el => el);
                
            if (splitElements.length > 0) {
                const indices = splitElements.map(getIndexOfElement).sort((a, b) => a - b);
                let lastIndex = 0;
                indices.forEach(index => {
                    allParts.push(children.slice(lastIndex, index));
                    lastIndex = index;
                });
                allParts.push(children.slice(lastIndex));
            } else {
                const splitIndex = Math.ceil(children.length / 2);
                allParts.push(children.slice(0, splitIndex));
                allParts.push(children.slice(splitIndex));
            }
        } else {
            const targetSplitCount = Math.ceil(children.length * 0.5);
            let h3SplitIndex = -1;
            
            for (let i = 0; i < children.length; i++) {
                if (children[i].tagName === 'H3' && i >= targetSplitCount * 0.8 && i <= targetSplitCount * 1.2) {
                    h3SplitIndex = i;
                    break;
                }
            }
            
            if (h3SplitIndex !== -1) {
                allParts.push(children.slice(0, h3SplitIndex));
                allParts.push(children.slice(h3SplitIndex));
            } else {
                const splitIndex = Math.ceil(children.length / 2);
                allParts.push(children.slice(0, splitIndex));
                allParts.push(children.slice(splitIndex));
            }
        }

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
            
            if (backButton) {
                backButton.style.display = (currentPage > 0) ? 'inline-block' : 'none';
            }
            
            if (continueButton) {
                continueButton.style.display = (currentPage < allParts.length - 1) ? 'inline-block' : 'none';
            }
        };

        partDivs.forEach(div => legalModalContentArea.appendChild(div));

        if (allParts.length > 1) {
            const paginationButtonsDiv = document.createElement('div');
            paginationButtonsDiv.className = 'legal-modal-pagination-buttons';
            
            const backButton = document.createElement('button');
            backButton.id = 'legal-back-button';
            backButton.textContent = 'Zurück';
            backButton.addEventListener('click', () => {
                currentPage--;
                renderCurrentPart();
            });
            
            const continueButton = document.createElement('button');
            continueButton.id = 'legal-continue-button';
            continueButton.textContent = 'Weiter';
            continueButton.addEventListener('click', () => {
                currentPage++;
                renderCurrentPart();
            });
            
            paginationButtonsDiv.appendChild(backButton);
            paginationButtonsDiv.appendChild(continueButton);
            legalModalContentArea.appendChild(paginationButtonsDiv);
        }

        renderCurrentPart();
        openLightbox(legalModal);
    }
}

async function loadLegalPageInModal(pageName) {
    const url = `${pageName}.html`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Seite nicht gefunden');
        }
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

    if (aboutMeButton) {
        aboutMeButton.addEventListener('click', (e) => {
            e.preventDefault();
            const aboutContentSource = document.getElementById('about-me-content');
            if (aboutContentSource) {
                paginateAndShowModal(aboutContentSource.innerHTML, 'about');
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

// Hauptinitialisierungsfunktion
function initModals() {
    setupCookieModal();
    setupContactModal();
    setupLegalModals();
}

// Mache die Funktion global verfügbar
window.initModals = initModals;
