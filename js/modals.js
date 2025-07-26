// js/modals.js

// KORREKTUR: `body` wird erst innerhalb der Funktionen deklariert, wenn es gebraucht wird.
// const body = document.body; // Diese Zeile wird entfernt, um Fehler beim Laden zu vermeiden.

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
    // ... (Dieser Teil ist korrekt und bleibt unverändert)
}

// Kontakt-Modal-Logik
function setupContactModal() {
    // ... (Dieser Teil ist korrekt und bleibt unverändert)
}

// Paginierungs- und Lade-Logik
async function loadLegalPageInModal(pageName) {
    // ... (Dieser Teil ist korrekt und bleibt unverändert)
}

function paginateAndShowModal(htmlContentString, pageName = '') {
    // ... (Dieser Teil ist korrekt und bleibt unverändert)
}

function setupLegalModals() {
    // ... (Dieser Teil ist korrekt und bleibt unverändert)
}


// KORREKTUR: Das 'export'-Schlüsselwort wird hier hinzugefügt.
export function initModals() {
    setupCookieModal();
    setupContactModal();
    setupLegalModals();
}
