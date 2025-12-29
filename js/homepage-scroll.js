/* ============================================================
   HOMEPAGE-SCROLL.JS
   Steuert das Scroll-Verhalten auf der Startseite
   Fallback für Browser ohne :has() Support
   ============================================================ */

(function() {
    'use strict';
    
    const flipContainer = document.querySelector('.flip-container');
    const body = document.body;
    const hero = document.getElementById('hero');
    
    // Nur auf der Startseite mit Flip-Container ausführen
    if (!flipContainer || !hero) return;
    
    /**
     * Setzt den Scroll-Status basierend auf dem Flip-Zustand
     */
    function updateScrollState() {
        const isFlipped = flipContainer.classList.contains('flipped');
        
        if (isFlipped) {
            // Flip Card ist offen - Scrollen erlauben
            body.classList.remove('homepage-no-scroll');
            body.classList.add('homepage-scroll-enabled');
        } else {
            // Flip Card ist geschlossen - Kein Scrollen
            body.classList.add('homepage-no-scroll');
            body.classList.remove('homepage-scroll-enabled');
            
            // Scroll Position zurücksetzen
            window.scrollTo(0, 0);
        }
    }
    
    // Initial setzen
    updateScrollState();
    
    // MutationObserver um Klassenänderungen zu beobachten
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                updateScrollState();
            }
        });
    });
    
    observer.observe(flipContainer, {
        attributes: true,
        attributeFilter: ['class']
    });
    
    // Auch bei Custom Events (falls dein flip.js welche sendet)
    document.addEventListener('flipcard:flipped', updateScrollState);
    document.addEventListener('flipcard:unflipped', updateScrollState);
    
})();
