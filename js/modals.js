// js/modals.js

// Lade den Inhalt einer externen HTML-Datei in ein Ziel-Element.
async function fetchAndInjectHTML(url, targetElementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fehler beim Laden von: ${url}`);
        const text = await response.text();
        const target = document.getElementById(targetElementId);
        if (target) {
            // Wir extrahieren nur den Body-Inhalt der externen Seite
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const content = doc.querySelector('.legal-container');
            if(content) {
                target.innerHTML = ''; // Leeren vor dem Einfügen
                target.appendChild(content);
            }
        }
    } catch (error) {
        console.error('Fehler beim Injizieren von HTML:', error);
    }
}


// Initialisiert die Logik für die rechtlichen Modals (Impressum, Datenschutz)
export function initLegalLinks() {
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    document.querySelectorAll('.legal-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = link.getAttribute('href');
            if (url && legalContentArea) {
                await fetchAndInjectHTML(url, 'legal-modal-content-area');
                if (legalModal) legalModal.style.display = 'flex';
            }
        });
    });

    if (closeLegalModalBtn) {
        closeLegalModalBtn.onclick = () => {
            if (legalModal) legalModal.style.display = 'none';
        };
    }
}


// Initialisiert die "Über Mich" und Kontakt-Modals
export function initModals() {
    const aboutMeBtn = document.getElementById('about-me-btn');
    const aboutMeModal = document.getElementById('legal-modal'); // Wir nutzen das gleiche Modal
    const aboutMeContentSource = document.getElementById('about-me-content');
    const legalContentArea = document.getElementById('legal-modal-content-area');

    if (aboutMeBtn) {
        aboutMeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (aboutMeContentSource && legalContentArea && aboutMeModal) {
                legalContentArea.innerHTML = aboutMeContentSource.innerHTML;
                aboutMeModal.style.display = 'flex';
            }
        });
    }

    const contactBtn = document.getElementById('contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.getElementById('close-modal');

    if(contactBtn) {
        contactBtn.onclick = (e) => {
            e.preventDefault();
            if(contactModal) contactModal.style.display = 'flex';
        }
    }

    if(closeModalBtn) {
        closeModalBtn.onclick = () => {
            if(contactModal) contactModal.style.display = 'none';
        }
    }
    
    // Generelles Schließen bei Klick auf den Hintergrund
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Initialisiert das Kontaktformular
export function initContactForm() {
    const form = document.getElementById('contact-form-inner');
    const successMessage = document.getElementById('contact-success-message');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Hier würde die Logik zum Senden des Formulars stehen
            form.style.display = 'none';
            if (successMessage) successMessage.style.display = 'block';
        });
    }
    
    const closeSuccessBtn = document.getElementById('close-success-message');
    if(closeSuccessBtn) {
        closeSuccessBtn.onclick = (e) => {
            e.preventDefault();
            const contactModal = document.getElementById('contact-modal');
            if(contactModal) contactModal.style.display = 'none';
            // Formular für nächste Nutzung zurücksetzen
            form.style.display = 'block';
            if (successMessage) successMessage.style.display = 'none';
            form.reset();
        }
    }
}

// Initialisiert den Cookie-Banner
export function initCookieBanner() {
    const cookieBanner = document.getElementById('cookie-info-lightbox');
    const ackBtn = document.getElementById('acknowledge-cookie-lightbox');

    if (cookieBanner && !localStorage.getItem('cookieAcknowledged')) {
        cookieBanner.style.display = 'flex';
    }

    if (ackBtn) {
        ackBtn.onclick = () => {
            localStorage.setItem('cookieAcknowledged', 'true');
            if (cookieBanner) cookieBanner.style.display = 'none';
        };
    }
}
