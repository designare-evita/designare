/* ============================================================
   HOMEPAGE-SCROLL.JS
   Steuert das Scroll-Verhalten auf der Startseite
   ============================================================ */

(function() {
    'use strict';
    
    // DOM Elemente
    const flipContainer = document.querySelector('.flip-container');
    const body = document.body;
    const hero = document.getElementById('hero');
    const viewThird = document.getElementById('view-third');
    
    // Nur auf der Startseite mit Flip-Container ausführen
    if (!flipContainer || !hero) {
        console.log('[Scroll] Keine Flip-Container gefunden, Script beendet');
        return;
    }
    
    /**
     * Prüft ob view-third (Evita) sichtbar ist
     */
    function isViewThirdVisible() {
        if (!viewThird) return false;
        
        const style = window.getComputedStyle(viewThird);
        const inlineDisplay = viewThird.style.display;
        
        // Prüfe sowohl inline-style als auch computed style
        return inlineDisplay === 'flex' || 
               inlineDisplay === 'block' || 
               style.display === 'flex' || 
               style.display === 'block';
    }
    
    /**
     * Prüft ob Flip Card geflippt ist
     */
    function isFlipped() {
        return flipContainer.classList.contains('flipped');
    }
    
    /**
     * Setzt den Scroll-Status basierend auf dem Flip-Zustand und Evita
     */
    function updateScrollState() {
        const flipped = isFlipped();
        const evitaVisible = isViewThirdVisible();
        
        console.log('[Scroll] Update:', { flipped, evitaVisible });
        
        if (flipped || evitaVisible) {
            // Flip Card oder Evita ist offen - Scrollen erlauben
            body.classList.remove('homepage-no-scroll');
            body.classList.add('homepage-scroll-enabled');
            console.log('[Scroll] → Scroll ENABLED');
        } else {
            // Beide geschlossen - Kein Scrollen
            body.classList.add('homepage-no-scroll');
            body.classList.remove('homepage-scroll-enabled');
            // Scroll Position zurücksetzen
            window.scrollTo(0, 0);
            console.log('[Scroll] → Scroll DISABLED');
        }
    }
    
    // Initial setzen (mit kleinem Delay für DOM-Ready)
    setTimeout(updateScrollState, 100);
    
    // MutationObserver für Flip Container (class changes)
    const flipObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                console.log('[Scroll] Flip class changed');
                updateScrollState();
            }
        });
    });
    
    flipObserver.observe(flipContainer, {
        attributes: true,
        attributeFilter: ['class']
    });
    
    // MutationObserver für view-third (Evita) - style UND class
    if (viewThird) {
        const viewThirdObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
                    console.log('[Scroll] Evita style/class changed');
                    // Kleiner Delay um sicherzustellen dass Display gesetzt ist
                    setTimeout(updateScrollState, 50);
                }
            });
        });
        
        viewThirdObserver.observe(viewThird, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    // Event Listeners für Custom Events (falls dein flip.js diese dispatcht)
    document.addEventListener('flipcard:flipped', updateScrollState);
    document.addEventListener('flipcard:unflipped', updateScrollState);
    document.addEventListener('evita:shown', updateScrollState);
    document.addEventListener('evita:hidden', updateScrollState);
    
    // Auch auf Click-Events der Evita-Buttons hören
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-view], #show-evita-btn, #hide-evita-btn, .flip-btn-style');
        if (target) {
            // Verzögert prüfen nach Click
            setTimeout(updateScrollState, 100);
            setTimeout(updateScrollState, 300);
        }
    });
    
    // Export für manuelles Triggern
    window.updateHomepageScroll = updateScrollState;
    
    console.log('[Scroll] Homepage-Scroll.js initialisiert');
    
})();
