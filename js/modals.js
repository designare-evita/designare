// js/modals.js - FINALE, VOLLSTÄNDIG REPARIERTE VERSION

// ===================================================================
// EINHEITLICHE MODAL-HELFER
// ===================================================================
const openModal = (modal) => {
    if (modal) {
        modal.classList.add('visible');
        document.body.classList.add('no-scroll');
    }
};

const closeModal = (modal) => {
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    }
};

// ===================================================================
// SETUP-FUNKTION FÜR PAGINIERUNG (About-Me & Legal)
// ===================================================================
const setupPagination = (modal) => {
    const pages = modal.querySelectorAll('.modal-page');
    const nextBtn = modal.querySelector('.next-page');
    const prevBtn = modal.querySelector('.prev-page');
    let currentPage = 0;

    if (pages.length <= 1) { // Paginierung nur bei mehr als einer Seite anzeigen
        const paginationControls = modal.querySelector('.legal-modal-pagination-buttons');
        if(paginationControls) paginationControls.style.display = 'none';
        return;
    };

    const updateVisibility = () => {
        pages.forEach((page, index) => {
            page.style.display = index === currentPage ? 'block' : 'none';
        });
        if (prevBtn) prevBtn.disabled = currentPage === 0;
        if (nextBtn) nextBtn.disabled = currentPage === pages.length - 1;
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < pages.length - 1) {
                currentPage++;
                updateVisibility();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                updateVisibility();
            }
        });
    }
    
    // Initial-Zustand setzen
    updateVisibility();
};


// ===================================================================
// HAUPT-INITIALISIERUNG - ZENTRALER EVENT-LISTENER
// ===================================================================
export function initModals() {
    console.log('Initialisiere Modals...');

    const legalModal = document.getElementById('legal-modal');
    const legalModalTitle = document.getElementById('legal-modal-title');
    const legalPage1 = document.getElementById('legal-content-page-1');
    const legalPage2 = document.getElementById('legal-content-page-2');

    // Ein einziger, zentraler Klick-Handler für das gesamte Dokument
    document.body.addEventListener('click', (event) => {
        const target = event.target;

        // --- MODAL ÖFFNEN ---
        const openTrigger = target.closest('[data-modal-target]');
        if (openTrigger) {
            event.preventDefault();
            const modalId = openTrigger.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                // Spezifische Logik für das "Legal" Modal
                if (modalId === 'legal-modal') {
                    const type = openTrigger.getAttribute('data-legal-type');
                    if (legalModalTitle && legalPage1 && legalPage2) {
                        if (type === 'impressum') {
                            legalModalTitle.textContent = 'Impressum';
                            legalPage1.style.display = 'block';
                            legalPage2.style.display = 'none';
                        } else if (type === 'datenschutz') {
                            legalModalTitle.textContent = 'Datenschutzerklärung';
                            legalPage1.style.display = 'none';
                            legalPage2.style.display = 'block';
                        }
                    }
                }
                
                // Paginierung für "About Me" Modal initialisieren, wenn es geöffnet wird
                if (modalId === 'about-me-modal') {
                   setupPagination(modal);
                }

                openModal(modal);
            }
        }

        // --- MODAL SCHLIESSEN ---
        const closeTrigger = target.closest('.close-modal-trigger');
        if (closeTrigger) {
            const modalToClose = target.closest('.modal-overlay');
            if (modalToClose) {
                closeModal(modalToClose);
            }
        }
        // Schließen bei Klick auf den Hintergrund
        if (target.classList.contains('modal-overlay')) {
            closeModal(target);
        }
    });

    // Paginierung für das Legal-Modal einmalig initialisieren
    if (legalModal) {
        setupPagination(legalModal);
    }
    
    // Cookie-Modal Logik
    const cookieLightbox = document.getElementById('cookie-info-lightbox');
    if (cookieLightbox && !localStorage.getItem('cookiesAcknowledged')) {
        setTimeout(() => openModal(cookieLightbox), 2000);
    }
    const acknowledgeButton = document.getElementById('acknowledge-cookie-lightbox');
    if (acknowledgeButton) {
        acknowledgeButton.addEventListener('click', () => {
            localStorage.setItem('cookiesAcknowledged', 'true');
        });
    }

    console.log('Modals erfolgreich initialisiert.');
}
