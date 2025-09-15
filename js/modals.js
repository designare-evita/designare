// js/modals.js - KORRIGIERTE VERSION mit funktionierender About-Me Pagination

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
// ABOUT ME MODAL SETUP - KORRIGIERT
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
                    
                    // *** HIER IST DIE KORREKTUR ***
                    // Starte About-Me spezifische Pagination
                    setTimeout(() => {
                        setupAboutMePagination(contentArea);
                    }, 100);
                }
            }
        });
    }
}

// ===================================================================
// SPEZIELLE ABOUT-ME PAGINATION FUNKTION - NEU HINZUGEFÜGT
// ===================================================================
function setupAboutMePagination(contentArea) {
    console.log('👤 Richte About-Me Pagination ein...');
    
    const config = {
        totalPages: 2,
        pages: [
            { title: "Seite 1: Der Mann hinter den Pixeln", sections: [0, 0] },
            { title: "Seite 2: Mehr als Code und Pixel", sections: [1, 2] }
        ]
    };
    
    // Pagination State
    const paginationState = {
        currentPage: 0,
        pages: config.pages
    };
    
    function createPaginationHTML(pageIndex) {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === config.totalPages - 1;
        
        return `
            <div class="legal-modal-pagination-buttons">
                <button id="about-prev-btn" ${isFirstPage ? 'disabled' : ''}>
                    ← ${isFirstPage ? 'Erste Seite' : 'Vorherige Seite'}
                </button>
                <span style="color: var(--text-color); font-weight: 500; padding: 10px; text-align: center; font-size: 0.9rem;">
                    ${paginationState.pages[pageIndex].title}<br>
                    <small style="opacity: 0.7;">(${pageIndex + 1}/${config.totalPages})</small>
                </span>
                <button id="about-next-btn" ${isLastPage ? 'disabled' : ''}>
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
        const prevBtn = document.getElementById('about-prev-btn');
        const nextBtn = document.getElementById('about-next-btn');
        
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
                if (paginationState.currentPage < config.totalPages - 1) {
                    paginationState.currentPage++;
                    showPage(paginationState.currentPage);
                }
            });
        }
    }
    
    function showPage(pageIndex) {
        console.log('👤 Zeige About-Me Seite:', pageIndex);
        
        // Verstecke alle Abschnitte - aber arbeite mit ALL Elementen innerhalb des .legal-container
        const legalContainer = contentArea.querySelector('.legal-container');
        if (!legalContainer) {
            console.error('👤 Legal Container nicht gefunden!');
            return;
        }
        
        const allElements = Array.from(legalContainer.children);
        console.log('👤 Gefundene Elemente im Container:', allElements.length);
        
        allElements.forEach(element => {
            element.style.display = 'none';
        });
        
        // Zeige immer den Haupttitel
        const title = legalContainer.querySelector('h1');
        if (title) title.style.display = 'block';
        
        if (pageIndex === 0) {
            // Seite 1: Bis zum H2 mit "Doch Michael ist mehr als nur Code und Pixel"
            console.log('👤 Zeige Seite 1 - bis zum H2 Breakpoint');
            
            let foundBreakpoint = false;
            
            for (let i = 0; i < allElements.length; i++) {
                const element = allElements[i];
                
                // SPEZIFISCHERE Breakpoint-Erkennung: Nur H2 mit exakter Klasse oder Text
                const isBreakpoint = (
                    element.tagName === 'H2' && 
                    (element.classList.contains('about-section-header') || 
                     element.textContent.includes('Doch Michael ist mehr als nur Code und Pixel'))
                );
                
                if (isBreakpoint) {
                    console.log('👤 H2-Breakpoint gefunden bei:', element.textContent.substring(0, 50));
                    foundBreakpoint = true;
                    break;
                }
                
                element.style.display = 'block';
                console.log('👤 Zeige Element Seite 1:', element.tagName, element.textContent.substring(0, 30));
            }
            
            if (!foundBreakpoint) {
                console.warn('👤 H2-Breakpoint nicht gefunden! Verwende Element-basierte Aufteilung');
                // Fallback: Zeige etwa die ersten 60% der Elemente
                const splitIndex = Math.floor(allElements.length * 0.6);
                for (let i = 0; i < splitIndex; i++) {
                    if (allElements[i]) {
                        allElements[i].style.display = 'block';
                        console.log('👤 Fallback Seite 1:', allElements[i].tagName);
                    }
                }
            }
            
        } else if (pageIndex === 1) {
            // Seite 2: Ab dem H2 Breakpoint
            console.log('👤 Zeige Seite 2 - ab dem H2 Breakpoint');
            
            let foundBreakpoint = false;
            let breakpointIndex = -1;
            
            // Finde den Breakpoint-Index
            for (let i = 0; i < allElements.length; i++) {
                const element = allElements[i];
                
                const isBreakpoint = (
                    element.tagName === 'H2' && 
                    (element.classList.contains('about-section-header') || 
                     element.textContent.includes('Doch Michael ist mehr als nur Code und Pixel'))
                );
                
                if (isBreakpoint) {
                    foundBreakpoint = true;
                    breakpointIndex = i;
                    console.log('👤 H2-Breakpoint gefunden bei Index:', i);
                    break;
                }
            }
            
            if (foundBreakpoint) {
                // Zeige alle Elemente ab dem Breakpoint
                for (let i = breakpointIndex; i < allElements.length; i++) {
                    allElements[i].style.display = 'block';
                    console.log('👤 Zeige Element Seite 2:', allElements[i].tagName, allElements[i].textContent.substring(0, 30));
                }
            } else {
                console.warn('👤 H2-Breakpoint nicht gefunden! Verwende Element-basierte Aufteilung');
                // Fallback: Zeige die letzten 40% der Elemente
                const splitIndex = Math.floor(allElements.length * 0.6);
                for (let i = splitIndex; i < allElements.length; i++) {
                    if (allElements[i]) {
                        allElements[i].style.display = 'block';
                        console.log('👤 Fallback Seite 2:', allElements[i].tagName);
                    }
                }
            }
        }
        
        updatePagination();
        
        // Scroll zum Anfang des Modal-Inhalts
        contentArea.scrollTop = 0;
    }
    
    // Initialisiere erste Seite
    setTimeout(() => showPage(0), 100);
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
    // Konfiguration für alle Seiten
    const pageConfigs = {
        'datenschutz.html': {
            totalPages: 3,
            pages: [
                { title: "Seite 1: Grundlagen & Rechte", sections: [0, 1] },
                { title: "Seite 2: Datenverarbeitung", sections: [2, 3] }, 
                { title: "Seite 3: Cookies & KI", sections: [4, 6] }
            ]
        },
        'impressum.html': {
            totalPages: 2,
            pages: [
                { title: "Seite 1: Kontakt & Grundlagen", sections: [0, 1] },
                { title: "Seite 2: Haftung & Urheberrecht", sections: [2, 3] }
            ]
        },
        'disclaimer.html': {
            totalPages: 2,
            pages: [
                { title: "Seite 1: Abgrenzung & Urheberrecht", sections: [0, 1] },
                { title: "Seite 2: Haftungsausschluss", sections: [2, 3] }
            ]
        }
    };
    
    // Prüfe ob Pagination für diese Seite konfiguriert ist
    let config = pageConfigs[currentPage];
    
    if (!config) return;
    
    const totalPages = config.totalPages;
    
    // Pagination State
    const paginationState = {
        currentPage: 0,
        pages: config.pages
    };
    
    function createPaginationHTML(pageIndex) {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;
        
        return `
            <div class="legal-modal-pagination-buttons">
                <button id="legal-prev-btn" ${isFirstPage ? 'disabled' : ''}>
                    ← ${isFirstPage ? 'Erste Seite' : 'Vorherige Seite'}
                </button>
                <span style="color: var(--text-color); font-weight: 500; padding: 10px; text-align: center; font-size: 0.9rem;">
                    ${paginationState.pages[pageIndex].title}<br>
                    <small style="opacity: 0.7;">(${pageIndex + 1}/${totalPages})</small>
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
        console.log('📄 Zeige Legal Seite:', pageIndex, 'für', currentPage);
        
        // Verstecke alle Abschnitte
        const allSections = contentArea.querySelectorAll('h1, h2, h3, h4, p, ul, ol, li, div');
        console.log('📄 Gefundene Abschnitte insgesamt:', allSections.length);
        
        allSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Zeige immer den Haupttitel
        const title = contentArea.querySelector('h1');
        if (title) {
            title.style.display = 'block';
            console.log('📄 Haupttitel gefunden und angezeigt:', title.textContent);
        }
        
        // Für Datenschutz: Zeige auch "Stand: ..." Info
        if (currentPage === 'datenschutz.html') {
            const standInfo = contentArea.querySelector('p'); // "Stand: 21. Juli 2025"
            if (standInfo && standInfo.textContent.includes('Stand:')) {
                standInfo.style.display = 'block';
                console.log('📄 Stand-Info angezeigt für Datenschutz');
            }
        }
        
        // Zeige spezifische Abschnitte basierend auf der Konfiguration
        const pageConfig = paginationState.pages[pageIndex];
        console.log('📄 Page Config für Seite', pageIndex, ':', pageConfig);
        
        const allH2s = contentArea.querySelectorAll('h2');
        const allH3s = contentArea.querySelectorAll('h3');
        const allH4s = contentArea.querySelectorAll('h4');
        
        console.log('📄 Gefunden - H2:', allH2s.length, 'H3:', allH3s.length, 'H4:', allH4s.length);
        
        // Für Disclaimer: H2 als Hauptabschnitte verwenden
        let mainSections;
        if (currentPage === 'disclaimer.html' && allH2s.length > 0) {
            mainSections = allH2s;
            console.log('📄 Verwende H2s als Hauptabschnitte für Disclaimer');
        } else {
            // Standard: H3s als Hauptabschnitte, H4s als Unterabschnitte
            mainSections = allH3s.length > 0 ? allH3s : allH4s;
            console.log('📄 Verwende H3s/H4s als Hauptabschnitte');
        }
        
        console.log('📄 Hauptabschnitte für Pagination:', mainSections.length);
        mainSections.forEach((section, index) => {
            console.log(`📄 Abschnitt ${index}:`, section.textContent.substring(0, 50));
        });
        
        if (pageConfig.sections) {
            showSectionsRange(mainSections, pageConfig.sections[0], pageConfig.sections[1]);
        }
        
        updatePagination();
        
        // Scroll zum Anfang des Modal-Inhalts
        contentArea.scrollTop = 0;
    }
    
    function showSectionsRange(sectionElements, startIndex, endIndex) {
        for (let i = startIndex; i <= endIndex && i < sectionElements.length; i++) {
            const section = sectionElements[i];
            section.style.display = 'block';
            
            // Zeige alle Elemente bis zum nächsten Hauptabschnitt
            let nextElement = section.nextElementSibling;
            while (nextElement && !isMainSection(nextElement)) {
                nextElement.style.display = 'block';
                nextElement = nextElement.nextElementSibling;
            }
        }
    }
    
    function isMainSection(element) {
        return element.tagName === 'H3' || element.tagName === 'H4';
    }
    
    // Initialisiere erste Seite
    setTimeout(() => showPage(0), 100);
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
