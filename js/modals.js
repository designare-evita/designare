// js/modals.js - VOLLSTÄNDIG REPARIERTE VERSION

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
            contentArea.textContent = content;
        }
        openModal(modal);
    }
}

// ===================================================================
// COOKIE MODAL SETUP
// ===================================================================
function setupCookieModal() {
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    console.log('🍪 Richte Cookie Modal ein...');

    // Zeige Cookie Lightbox automatisch nach 2 Sekunden, falls noch nicht gesehen
    if (cookieInfoLightbox && !localStorage.getItem('hasSeenCookieInfoLightbox')) {
        setTimeout(() => openModal(cookieInfoLightbox), 2000);
    }

    // Button zum Bestätigen der Cookies
    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', () => {
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
            closeModal(cookieInfoLightbox);
        });
    }

    // Datenschutz-Link aus der Cookie-Lightbox
    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) closeModal(cookieInfoLightbox);
            loadLegalContentWithPagination('datenschutz.html');
        });
    }

    // Cookie Info Button im Header
    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (cookieInfoLightbox) openModal(cookieInfoLightbox);
        });
    }
}

// ===================================================================
// KONTAKT MODAL SETUP
// ===================================================================
function setupContactModal() {
    const contactModal = document.getElementById('contact-modal');
    const contactButton = document.getElementById('contact-button');
    const closeModalBtn = document.getElementById('close-modal');
    const contactForm = document.getElementById('contact-form-inner');
    const contactSuccessMessage = document.getElementById('contact-success-message');
    const closeSuccessBtn = document.getElementById('close-success-message');

    console.log('📧 Richte Kontakt Modal ein...');

    // Kontakt Button im Header
    if (contactButton) {
        contactButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📧 Kontakt Button geklickt');
            if (contactModal) {
                // Stelle sicher, dass das Formular sichtbar und die Erfolgsmeldung versteckt ist
                contactForm.style.display = 'block';
                contactSuccessMessage.style.display = 'none';
                openModal(contactModal);
            }
        });
    }

    // Schließen-Button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeModal(contactModal);
        });
    }

    // Erfolgsmeldung schließen
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(contactModal);
        });
    }

    // Formular-Submit-Handler
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📧 Kontaktformular abgesendet');

            const formData = new FormData(contactForm);
            const submitButton = contactForm.querySelector('button[type="submit"]');
            
            // Button deaktivieren während des Sendens
            submitButton.disabled = true;
            submitButton.textContent = 'Wird gesendet...';

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Erfolgreich gesendet - zeige Erfolgsmeldung
                    contactForm.style.display = 'none';
                    contactSuccessMessage.style.display = 'block';
                    contactForm.reset();
                } else {
                    throw new Error(result.message || 'Unbekannter Fehler');
                }
            } catch (error) {
                console.error('Fehler beim Senden der Nachricht:', error);
                alert('Fehler beim Senden der Nachricht. Bitte versuche es später erneut.');
            } finally {
                // Button wieder aktivieren
                submitButton.disabled = false;
                submitButton.textContent = 'Ab die Post!';
            }
        });
    }
}

// ===================================================================
// ABOUT ME MODAL SETUP
// ===================================================================
function setupAboutModal() {
    const aboutButton = document.getElementById('about-me-button');
    const legalModal = document.getElementById('legal-modal');
    const aboutContent = document.getElementById('about-me-content');

    console.log('👤 Richte About Me Modal ein...');

    if (aboutButton) {
        aboutButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('👤 About Me Button geklickt');
            
            if (legalModal && aboutContent) {
                const contentArea = document.getElementById('legal-modal-content-area');
                if (contentArea) {
                    contentArea.innerHTML = aboutContent.innerHTML;
                    openModal(legalModal);
                }
            }
        });
    }
}

// ===================================================================
// LEGAL CONTENT LOADER (Impressum, Datenschutz, Disclaimer)
// ===================================================================
function loadLegalContentWithPagination(page) {
    console.log('📄 Lade Legal Content:', page);
    
    const legalModal = document.getElementById('legal-modal');
    const contentArea = document.getElementById('legal-modal-content-area');

    if (!legalModal || !contentArea) {
        console.error('Legal Modal oder Content Area nicht gefunden');
        return;
    }

    // Zeige Loading-Anzeige
    contentArea.innerHTML = '<div style="text-align: center; padding: 40px;"><p>Lade Inhalt...</p></div>';
    openModal(legalModal);

    // Lade den Inhalt
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            // Extrahiere nur den Inhalt aus dem body-Tag
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainContent = doc.querySelector('main .legal-container') || 
                               doc.querySelector('.legal-container') || 
                               doc.querySelector('main') ||
                               doc.querySelector('body');

            if (mainContent) {
                contentArea.innerHTML = mainContent.innerHTML;
                
                // Füge Paginierungs-Buttons hinzu falls nötig
                addPaginationButtons(contentArea, page);
            } else {
                throw new Error('Inhalt konnte nicht extrahiert werden');
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden von', page, ':', error);
            contentArea.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>Fehler beim Laden</h3>
                    <p>Der Inhalt konnte nicht geladen werden.</p>
                    <button onclick="window.location.href='${page}'" class="cta-button">Seite direkt öffnen</button>
                </div>
            `;
        });
}

function addPaginationButtons(contentArea, currentPage) {
    // Nur für Datenschutz Pagination hinzufügen
    if (currentPage === 'datenschutz.html') {
        let currentPageIndex = 0;
        const totalPages = 3; // Datenschutz hat 3 Seiten
        
        // Pagination State
        const paginationState = {
            currentPage: 0,
            pages: [
                { start: 0, title: "Seite 1: Grundlagen & Rechte" },
                { start: 2, title: "Seite 2: Datenverarbeitung" }, 
                { start: 4, title: "Seite 3: Cookies & Kontakt" }
            ]
        };
        
        function createPaginationHTML(pageIndex) {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === totalPages - 1;
            
            return `
                <div class="legal-modal-pagination-buttons">
                    <button id="legal-prev-btn" ${isFirstPage ? 'disabled' : ''}>
                        ← ${isFirstPage ? 'Erste Seite' : 'Vorherige Seite'}
                    </button>
                    <span style="color: var(--text-color); font-weight: 500; padding: 10px;">
                        ${paginationState.pages[pageIndex].title} (${pageIndex + 1}/${totalPages})
                    </span>
                    <button id="legal-next-btn" ${isLastPage ? 'disabled' : ''}>
                        ${isLastPage ? 'Letzte Seite' : 'Nächste Seite'} →
                    </button>
                </div>
            `;
        }
        
        function updatePagination() {
            const existingPagination = contentArea.querySelector('.legal-modal-pagination-buttons');
            if (existingPagination) {
                existingPagination.remove();
            }
            
            contentArea.insertAdjacentHTML('beforeend', createPaginationHTML(paginationState.currentPage));
            
            // Event-Listener für neue Buttons
            const prevBtn = document.getElementById('legal-prev-btn');
            const nextBtn = document.getElementById('legal-next-btn');
            
            if (prevBtn && !prevBtn.disabled) {
                prevBtn.addEventListener('click', () => {
                    if (paginationState.currentPage > 0) {
                        paginationState.currentPage--;
                        showPage(paginationState.currentPage);
                    }
                });
            }
            
            if (nextBtn && !nextBtn.disabled) {
                nextBtn.addEventListener('click', () => {
                    if (paginationState.currentPage < totalPages - 1) {
                        paginationState.currentPage++;
                        showPage(paginationState.currentPage);
                    }
                });
            }
        }
        
        function showPage(pageIndex) {
            // Verstecke alle Abschnitte
            const allSections = contentArea.querySelectorAll('h3, p, ul');
            allSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Zeige immer Titel und Stand
            const title = contentArea.querySelector('h1');
            const standInfo = contentArea.querySelector('p'); // "Stand: 21. Juli 2025"
            if (title) title.style.display = 'block';
            if (standInfo) standInfo.style.display = 'block';
            
            // Zeige spezifische Abschnitte basierend auf der Seite
            const pageConfig = paginationState.pages[pageIndex];
            const allH3s = contentArea.querySelectorAll('h3');
            
            if (pageIndex === 0) {
                // Seite 1: Grundlagen (Abschnitte 1-2)
                showSectionsRange(allH3s, 0, 1);
            } else if (pageIndex === 1) {
                // Seite 2: Datenverarbeitung (Abschnitte 3-4)  
                showSectionsRange(allH3s, 2, 3);
            } else if (pageIndex === 2) {
                // Seite 3: Cookies & Rest (Abschnitte 5-7)
                showSectionsRange(allH3s, 4, 6);
            }
            
            updatePagination();
            
            // Scroll zum Anfang des Modal-Inhalts
            contentArea.scrollTop = 0;
        }
        
        function showSectionsRange(h3Elements, startIndex, endIndex) {
            for (let i = startIndex; i <= endIndex && i < h3Elements.length; i++) {
                const h3 = h3Elements[i];
                h3.style.display = 'block';
                
                // Zeige alle Elemente bis zum nächsten h3
                let nextElement = h3.nextElementSibling;
                while (nextElement && nextElement.tagName !== 'H3') {
                    nextElement.style.display = 'block';
                    nextElement = nextElement.nextElementSibling;
                }
            }
        }
        
        // Initialisiere erste Seite
        setTimeout(() => showPage(0), 100);
    }
}

// ===================================================================
// AI MODAL SETUP (nur Close-Buttons)
// ===================================================================
function setupAiModal() {
    const aiResponseModal = document.getElementById('ai-response-modal');
    const closeButtons = [
        document.getElementById('close-ai-response-modal-top'),
        document.getElementById('close-ai-response-modal-bottom')
    ];
    
    console.log('🤖 Richte AI Modal Close-Buttons ein...');
    
    closeButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                console.log('🤖 AI Modal schließen');
                closeModal(aiResponseModal);
            });
        }
    });
}

// ===================================================================
// ALLGEMEINE MODAL BACKGROUND & ESC CLOSE
// ===================================================================
function setupModalBackgroundClose() {
    console.log('🔧 Richte Modal Background Close ein...');
    
    // Klick auf Hintergrund schließt Modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });

    // ESC-Taste schließt Modal
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
// LEGAL MODAL CLOSE BUTTON
// ===================================================================
function setupLegalModalCloseButton() {
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');

    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => {
            console.log('📄 Legal Modal schließen');
            closeModal(legalModal);
        });
    }
}

// ===================================================================
// HAUPT-INITIALISIERUNG
// ===================================================================
export function initModals() {
    console.log('🚀 Initialisiere alle Modals...');
    
    // Warte kurz bis DOM vollständig geladen ist
    setTimeout(() => {
        setupCookieModal();
        setupContactModal();
        setupAboutModal();
        setupAiModal();
        setupLegalModalCloseButton();
        setupModalBackgroundClose();

        // Event Delegation für alle Legal-Links
        document.body.addEventListener('click', (e) => {
            // Impressum Links
            if (e.target.matches('#impressum-link') || e.target.matches('a[href="impressum.html"]')) {
                e.preventDefault();
                console.log('📄 Impressum Link geklickt');
                loadLegalContentWithPagination('impressum.html');
            }
            
            // Datenschutz Links
            if (e.target.matches('#datenschutz-link') || e.target.matches('a[href="datenschutz.html"]')) {
                e.preventDefault();
                console.log('📄 Datenschutz Link geklickt');
                loadLegalContentWithPagination('datenschutz.html');
            }
            
            // Disclaimer Links
            if (e.target.matches('#disclaimer-link') || e.target.matches('a[href="disclaimer.html"]')) {
                e.preventDefault();
                console.log('📄 Disclaimer Link geklickt');
                loadLegalContentWithPagination('disclaimer.html');
            }
        });

        console.log('✅ Alle Modals erfolgreich initialisiert');
    }, 100);
}
