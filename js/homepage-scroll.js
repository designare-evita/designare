/* ============================================================
   HOMEPAGE-SCROLL.JS
   Steuert das Scroll-Verhalten auf der Startseite
   MIT FIX: Scroll erlaubt wenn ai-question Input fokussiert ist (Mobile)
   ============================================================ */

(function() {
    'use strict';
    
    // DOM Elemente
    const flipContainer = document.querySelector('.flip-container');
    const body = document.body;
    const hero = document.getElementById('hero');
    const viewThird = document.getElementById('view-third');
    
    // State für Input-Focus
    let isAiInputFocused = false;
    
    // Nur auf der Startseite mit Flip-Container ausführen
    if (!flipContainer || !hero) {
        console.log('[Scroll] Keine Flip-Container gefunden, Script beendet');
        return;
    }
    
    /**
     * Prüft ob es sich um ein mobiles Gerät handelt
     */
    function isMobile() {
        return window.innerWidth <= 768 || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
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
        
        console.log('[Scroll] Update:', { flipped, evitaVisible, isAiInputFocused, isMobile: isMobile() });
        
        // ✅ NEU: Wenn ai-question fokussiert ist UND mobile → Scrollen erlauben
        if (isAiInputFocused && isMobile()) {
            body.classList.remove('homepage-no-scroll');
            body.classList.add('homepage-scroll-enabled');
            body.classList.add('ai-input-focused');
            console.log('[Scroll] → Scroll ENABLED (AI Input fokussiert auf Mobile)');
            return;
        }
        
        // Entferne ai-input-focused Klasse wenn nicht mehr fokussiert
        body.classList.remove('ai-input-focused');
        
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
    
    /**
     * Setup Event Listener für ai-question Input
     */
    function setupAiInputListeners() {
        const aiQuestion = document.getElementById('ai-question');
        
        if (!aiQuestion) {
            // Falls Element noch nicht existiert, später erneut versuchen
            setTimeout(setupAiInputListeners, 500);
            return;
        }
        
        console.log('[Scroll] AI-Question Input gefunden, setze Focus-Listener');
        
        // Focus Event - Scroll aktivieren
        aiQuestion.addEventListener('focus', () => {
            console.log('[Scroll] ai-question FOKUSSIERT');
            isAiInputFocused = true;
            
            if (isMobile()) {
                // Scroll aktivieren
                body.classList.remove('homepage-no-scroll');
                body.classList.add('homepage-scroll-enabled');
                body.classList.add('ai-input-focused');
                
                // Kurz warten bis Tastatur offen ist, dann Input in View scrollen
                setTimeout(() => {
                    // Sanftes Scrollen zum Input
                    aiQuestion.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
                
                // Nochmal nach Tastatur-Animation
                setTimeout(() => {
                    aiQuestion.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 500);
            }
        });
        
        // Blur Event - Zurück zum normalen Scroll-Verhalten
        aiQuestion.addEventListener('blur', () => {
            console.log('[Scroll] ai-question BLUR');
            isAiInputFocused = false;
            
            // Kurze Verzögerung, damit andere Interaktionen nicht gestört werden
            setTimeout(() => {
                if (!isAiInputFocused) { // Double-check
                    updateScrollState();
                }
            }, 200);
        });
        
        // Touch Events für bessere Mobile-Unterstützung
        aiQuestion.addEventListener('touchstart', () => {
            if (isMobile()) {
                isAiInputFocused = true;
                body.classList.remove('homepage-no-scroll');
                body.classList.add('homepage-scroll-enabled');
            }
        }, { passive: true });
    }
    
    /**
     * Visual Viewport API für bessere Keyboard-Erkennung
     */
    function setupVisualViewportListener() {
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                if (isAiInputFocused && isMobile()) {
                    const aiQuestion = document.getElementById('ai-question');
                    if (aiQuestion && document.activeElement === aiQuestion) {
                        // Viewport hat sich geändert (Tastatur geöffnet/geschlossen)
                        setTimeout(() => {
                            aiQuestion.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                            });
                        }, 100);
                    }
                }
            });
        }
    }
    
    // Initial setzen (mit kleinem Delay für DOM-Ready)
    setTimeout(updateScrollState, 100);
    
    // AI Input Listener initialisieren
    setupAiInputListeners();
    
    // Visual Viewport Listener
    setupVisualViewportListener();
    
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
    window.setAiInputFocused = function(focused) {
        isAiInputFocused = focused;
        updateScrollState();
    };
    
    console.log('[Scroll] Homepage-Scroll.js initialisiert (mit AI-Input Fix)');
    
})();
