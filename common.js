/*
 * common.js
 * Geteilte JavaScript-Funktionen für das gesamte Projekt
*/

document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;

    // --- Allgemeine Lightbox Funktionen ---
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

    // --- Cookie Info Lightbox Logik ---
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    const hasSeenCookieInfoLightbox = localStorage.getItem('hasSeenCookieInfoLightbox');

    if (!hasSeenCookieInfoLightbox) {
        setTimeout(() => openLightbox(cookieInfoLightbox), 1000);
    } else {
        body.style.overflow = '';
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
            if (e.target === cookieInfoLightbox) closeLightbox(cookieInfoLightbox);
        });
    }

    // --- THEME-LOGIK ---
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        // Partikelfarben-Update-Funktion wird nur auf der Hauptseite aufgerufen,
        // da pJSDom auf anderen Seiten nicht existiert.
        if (typeof updateParticleColors === 'function') {
            updateParticleColors();
        }
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // --- KONTAKT-MODAL ---
    const contactButton = document.getElementById('contact-button');
    const contactModal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form-inner');
    const contactSuccessMessage = document.getElementById('contact-success-message');
    const closeSuccessMessageBtn = document.getElementById('close-success-message');
    const closeModalButton = document.getElementById('close-modal');

    if (contactButton && contactModal) {
        contactButton.addEventListener('click', () => {
            openLightbox(contactModal);
            if (contactForm) contactForm.style.display = 'flex';
            if (contactSuccessMessage) contactSuccessMessage.style.display = 'none';
        });

        if (closeModalButton) closeModalButton.addEventListener('click', () => closeLightbox(contactModal));
        
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) closeLightbox(contactModal);
        });

        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(contactForm);
                const object = {};
                formData.forEach((value, key) => { object[key] = value; });
                if (!object['_subject']) object['_subject'] = 'Neue Kontaktanfrage von designare.at';
                object['_honey'] = '';
                
                const originalButtonText = e.submitter.innerText;
                e.submitter.innerText = "Sende...";
                e.submitter.disabled = true;

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
                        throw new Error(data.message);
                    }
                } catch (error) {
                    console.error("Sende-Fehler:", error);
                    // Hier könnte man eine Fehlermeldung im Modal anzeigen statt eines alerts.
                    alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
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
                if (contactForm) contactForm.style.display = 'flex';
                if (contactSuccessMessage) contactSuccessMessage.style.display = 'none';
            });
        }
    }

    // --- Legal-Seiten Lightbox Navigation ---
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');
    const legalModalContentArea = document.getElementById('legal-modal-content-area');

    async function loadLegalPageInModal(pageName) {
        // Diese Funktion bleibt unverändert, da sie bereits gut strukturiert ist
        // und für alle Seiten benötigt wird.
        const url = `${pageName}.html`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const htmlContent = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const legalContainer = doc.querySelector('.legal-container');
            if (legalContainer) {
                legalModalContentArea.innerHTML = '';
                legalContainer.childNodes.forEach(node => {
                    if (!node.classList || !node.classList.contains('back-link')) {
                        legalModalContentArea.appendChild(node.cloneNode(true));
                    }
                });
                openLightbox(legalModal);
            } else {
                console.error(`Could not find .legal-container in ${pageName}.html`);
            }
        } catch (error) {
            console.error(`Fehler beim Laden der Seite ${url}:`, error);
        }
    }

    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('../impressum'); // Pfad anpassen für Unterordner
        });
    }
    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('../datenschutz'); // Pfad anpassen für Unterordner
        });
    }
    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => {
            closeLightbox(legalModal);
            legalModalContentArea.innerHTML = '';
        });
    }
    if (legalModal) {
        legalModal.addEventListener('click', (e) => {
            if (e.target === legalModal) {
                closeLightbox(legalModal);
                legalModalContentArea.innerHTML = '';
            }
        });
    }
});
