// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Alle benötigten Elemente aus dem HTML abrufen
    const infoButton = document.querySelector('.info-button');
    const lightboxOverlay = document.querySelector('.lightbox-overlay');
    const closeButton = document.querySelector('.close-button');

    // 1. Lightbox ÖFFNEN, wenn auf das "i" geklickt wird
    infoButton.addEventListener('click', () => {
        lightboxOverlay.style.display = 'flex';
    });

    /**
     * Eine wiederverwendbare Funktion zum Schließen der Lightbox.
     */
    function closeLightbox() {
        lightboxOverlay.style.display = 'none';
    }

    // 2. Lightbox SCHLIESSEN, wenn auf das "X" geklickt wird
    closeButton.addEventListener('click', closeLightbox);

    // 3. Lightbox SCHLIESSEN, wenn auf den dunklen Hintergrund geklickt wird
    lightboxOverlay.addEventListener('click', (e) => {
        // Nur schließen, wenn direkt auf den Overlay-Hintergrund geklickt wird
        // und nicht auf die weiße Box darin.
        if (e.target === lightboxOverlay) {
            closeLightbox();
        }
    });

    // 4. Lightbox SCHLIESSEN, wenn die "Escape"-Taste gedrückt wird
    document.addEventListener('keydown', (e) => {
        // Prüfen, ob die Lightbox sichtbar ist und die Escape-Taste gedrückt wurde
        if (e.key === 'Escape' && lightboxOverlay.style.display === 'flex') {
            closeLightbox();
        }
    });
});
