// js/main.js - KORRIGIERTE VERSION (Home-Button Bug Fix v2)

// === 1. IMPORTE ===
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';
import { initMenuInteractions } from './menu-logic.js';
import { setupSearchModal } from './search.js';

// === 2. GLOBALE STATES ===
let globalAiFormInstance = null;
let contentLoaded = false;

// === 3. CONTENT LOADING HELPER ===
const loadContent = async (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        console.warn(`⚠️ Placeholder #${elementId} nicht gefunden`);
        return false; 
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error ${response.status} bei ${url}`);
        const data = await response.text();
        placeholder.innerHTML = data;
        return true;
    } catch (error) {
        console.warn(`⚠️ Konnte ${url} nicht in #${elementId} laden:`, error);
        return false;
    }
};

const loadFeedback = async () => {
    const placeholder = document.getElementById('feedback-placeholder');
    if (!placeholder) return;
    
    try {
        const response = await fetch('blog-feedback.html');
        if (response.ok) {
            placeholder.innerHTML = await response.text();
        }
    } catch (e) {
        console.log("Info: Feedback-Sektion nicht geladen (optional).");
    }
};

// === 4. SMART HEADER & FOOTER LOGIK ===
const initHeaderScrollEffect = () => {
    const header = document.querySelector('.main-header');
    if (!header) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const footer = document.querySelector('footer'); 
        
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
            header.classList.remove('hide-up'); 
        }

        const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50;

        if (currentScrollY > 100 && !isAtBottom) {
            if (currentScrollY > lastScrollY) {
                header.classList.add('hide-up');
                if (footer) footer.classList.add('hide-down');
            } else {
                header.classList.remove('hide-up');
                if (footer) footer.classList.remove('hide-down');
            }
        } else if (isAtBottom) {
            if (footer) footer.classList.remove('hide-down');
        } else {
            if (footer) footer.classList.remove('hide-down');
        }

        lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
};

const setupSideMenu = () => {
    const menuButton = document.getElementById('menu-toggle-button');
    const sideMenu = document.getElementById('side-menu-panel');
    const closeMenuButton = document.getElementById('close-menu-button');

    if (menuButton && sideMenu) {
        menuButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sideMenu.classList.add('visible');
            document.body.classList.add('no-scroll');
        });

        const closeMenu = () => {
            sideMenu.classList.remove('visible');
            const heroFlipped = document.querySelector('.hero-flip-wrapper.flipped'); 
            if (!heroFlipped) {
                document.body.classList.remove('no-scroll');
            }
        };

        if (closeMenuButton) {
            closeMenuButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
            });
        }

        document.addEventListener('click', (e) => {
            if (sideMenu.classList.contains('visible') && 
                !sideMenu.contains(e.target) && 
                !menuButton.contains(e.target)) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sideMenu.classList.contains('visible')) {
                closeMenu();
            }
        });
    }
};

// === 5. EVITA CHAT LOGIK - KORRIGIERT ===
const setupEvitaChatButton = () => {
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (evitaChatButton) {
        evitaChatButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await launchEvitaChat();
        });
    }
};

window.launchEvitaChatFromAnywhere = async () => {
    await launchEvitaChat();
};

const launchEvitaChat = async () => {
    console.log("🚀 launchEvitaChat aufgerufen");
    
    await ensureAiFormAvailable();
    
    // Warte bis DOM-Elemente sicher verfügbar sind
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const aiResponseModal = document.getElementById('ai-response-modal');
    
    if (!aiResponseModal) {
        console.error("❌ AI Response Modal nicht gefunden!");
        return;
    }
    
    // Modal öffnen
    aiResponseModal.style.display = 'flex';
    aiResponseModal.classList.add('visible');
    document.body.classList.add('no-scroll');
    
    // Warte kurz, dann Begrüßung hinzufügen - NUR wenn Chat leer ist
    setTimeout(() => {
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory && chatHistory.children.length === 0) {
            addWelcomeMessage("Hallo! Ich bin Evita, Michaels KI-Assistentin. Wie kann ich dir heute helfen?");
            console.log("✅ Begrüßung von launchEvitaChat hinzugefügt");
        }
        
        // Focus auf Input
        setTimeout(() => {
            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput) chatInput.focus();
        }, 100);
    }, 300);
};

const ensureAiFormAvailable = async () => {
    if (globalAiFormInstance || document.getElementById('ai-chat-form')) {
        return;
    }
    
    // Warte auf Content wenn noch nicht geladen
    if (!contentLoaded) {
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (contentLoaded || document.getElementById('ai-chat-form')) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
            // Timeout nach 3 Sekunden
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 3000);
        });
    }
    
    try {
        await initAiForm();
        globalAiFormInstance = true;
    } catch (error) {
        console.warn("Konnte AI-Form nicht vorladen:", error);
    }
};

const addWelcomeMessage = (message) => {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) {
        console.warn("⚠️ Chat-History Container nicht gefunden");
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai';
    messageDiv.textContent = message;
    chatHistory.appendChild(messageDiv);
    
    console.log("✅ Begrüßungsnachricht hinzugefügt");
};

// === 6. HERO FLIP LOGIK - KOMPLETT NEU ===
const initHeroFlip = () => {
    const heroFlipWrapper = document.getElementById('hero-flip-wrapper');
    if (!heroFlipWrapper) return;

    const btnToBack = document.getElementById('flip-info-btn');
    const btnBackToStart = document.getElementById('flip-back-btn');
    const btnToThird = document.getElementById('flip-to-third-btn');
    const btnThirdToBack = document.getElementById('flip-third-back-btn');
    const btnThirdToStart = document.getElementById('flip-third-to-start-btn');
    
    const viewMain = document.getElementById('view-main');
    const viewThird = document.getElementById('view-third');

    // Hash-Check Funktion mit Scroll-Freigabe
    const checkHashAndFlip = () => {
        const hash = window.location.hash;
        
        if (hash === '#michael') {
            // Michael anzeigen (Back-Face)
            if(viewMain) viewMain.style.display = 'block';
            if(viewThird) viewThird.style.display = 'none';
            heroFlipWrapper.classList.add('flipped');
            
            document.body.classList.remove('no-scroll');
            
            setTimeout(() => {
                const target = document.getElementById('michael');
                if (target) {
                    const headerOffset = document.querySelector('.main-header')?.offsetHeight || 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 40;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 300);
        } 
        else if (hash === '#evita') {
            // Evita anzeigen (Front-Face, view-third)
            if (viewMain) viewMain.style.display = 'none';
            if (viewThird) viewThird.style.display = 'flex';
            heroFlipWrapper.classList.remove('flipped');
            
            document.body.classList.remove('no-scroll');
            
            setTimeout(() => {
                const target = document.getElementById('evita');
                if (target) {
                    const headerOffset = document.querySelector('.main-header')?.offsetHeight || 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 40;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 300);
        }
    };

    // Check beim Initialisieren
    checkHashAndFlip();

    // Reagiere auf Hash-Änderungen
    window.addEventListener('hashchange', checkHashAndFlip);

    // === EVENT LISTENERS ===

    // Button: "Neugierig geworden?" → Flip zu Michael (Back-Face)
    if (btnToBack) {
        btnToBack.addEventListener('click', (e) => {
            e.preventDefault();
            heroFlipWrapper.classList.add('flipped');
            document.body.classList.remove('no-scroll');
        });
    }

    // ✅ FIX: Button "Home" → Zurück zur Startseite (Front-Face, view-main)
    if (btnBackToStart) {
        btnBackToStart.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Hash aus URL entfernen
            history.pushState("", document.title, window.location.pathname + window.location.search);
            
            // ✅ WICHTIG: Views VOR dem Flip setzen!
            if(viewMain) viewMain.style.display = 'block';
            if(viewThird) viewThird.style.display = 'none';
            
            // Karte zurückdrehen
            heroFlipWrapper.classList.remove('flipped');
            
            // Nach oben scrollen
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // ✅ FIX: Button "Evita" → Flip zurück zur Front-Face und Evita-View anzeigen
    if (btnToThird) {
        btnToThird.addEventListener('click', (e) => {
            e.preventDefault();
            
            // ✅ WICHTIG: Views VOR dem Flip setzen!
            if (viewMain) viewMain.style.display = 'none';
            if (viewThird) viewThird.style.display = 'flex';
            
            // Karte zurückdrehen (zur Front-Face)
            heroFlipWrapper.classList.remove('flipped');
            
            // Nach oben scrollen
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Nach Flip-Animation zum Evita-Header scrollen
            setTimeout(() => {
                const target = document.getElementById('evita');
                if (target) {
                    const headerOffset = document.querySelector('.main-header')?.offsetHeight || 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 40;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 850); // Warte auf Flip-Animation (0.8s) + Buffer
        });
    }

    // Button: Evita → Michael (von Evita-View zur Back-Face)
    if (btnThirdToBack) {
        btnThirdToBack.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Views setzen für nach dem Flip
            if(viewMain) viewMain.style.display = 'block';
            if(viewThird) viewThird.style.display = 'none';
            
            // Flippen zur Back-Face
            heroFlipWrapper.classList.add('flipped');
            
            // Hash setzen
            window.location.hash = '#michael';
            
            setTimeout(() => {
                const target = document.getElementById('michael');
                if (target) {
                    const headerOffset = document.querySelector('.main-header')?.offsetHeight || 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 40;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 300);
        });
    }

    // Button: "Her mit deinen Fragen" → Chat öffnen ODER zurück zur Startseite
    if (btnThirdToStart) {
        btnThirdToStart.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btnThirdToStart.dataset.action === 'open-evita-chat') {
                await launchEvitaChat();
            } else {
                if(viewMain) viewMain.style.display = 'block';
                if(viewThird) viewThird.style.display = 'none';
                heroFlipWrapper.classList.remove('flipped');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
};

// === 7. INITIALISIERUNG ===

const initializeDynamicScripts = () => {
    console.log("🔧 Initialisiere dynamische Scripte...");
    initModals();
    initHeaderScrollEffect(); 
    setupSideMenu();
    setupEvitaChatButton();
    initHeroFlip();
    initTheme(); 
    initMenuInteractions();
    console.log("✅ Dynamische Scripte initialisiert");
};

const initializeStaticScripts = () => {
    initEffects();
    initTypewriters();
};

const initializeForms = async () => {
    try { 
        await initAiForm(); 
        globalAiFormInstance = true;
    } catch (e) { 
        console.warn("AI-Form Init Fehler:", e); 
    }
    try { 
        initSilasForm(); 
    } catch (e) { 
        console.warn("Silas-Form Init Fehler:", e); 
    }
};

// === UNLOCK SCROLL FALLBACK ===
const unlockScrollFallback = () => {
    // Entferne no-scroll wenn Seite geladen ist
    if (document.body.classList.contains('no-scroll')) {
        const modal = document.querySelector('.modal-overlay.visible');
        const sideMenu = document.getElementById('side-menu-panel');
        const sideMenuVisible = sideMenu?.classList.contains('visible');
        
        // Nur entfernen wenn kein Modal/Menu offen ist
        if (!modal && !sideMenuVisible) {
            document.body.classList.remove('no-scroll');
            console.log("🔓 no-scroll Klasse entfernt (Fallback)");
        }
    }
};

// MAIN EVENT LISTENER
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 DOMContentLoaded - Starte Initialisierung...");
    
    // Theme vorab setzen
    if (localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme')) {
        document.body.classList.add('dark-mode');
    }

    // Statische Scripts initialisieren (Partikel, Typewriter)
    initializeStaticScripts();

    try {
        // Sequentielles Laden der Layout-Komponenten
        console.log("📦 Lade Layout-Komponenten...");
        
        const results = await Promise.all([
            loadContent('header.html', 'header-placeholder'),
            loadContent('modals.html', 'modal-container'),
            loadContent('footer.html', 'footer-placeholder'),
            loadContent('side-menu.html', 'side-menu-placeholder')
        ]);
        
        await loadFeedback();
        
        contentLoaded = true;
        console.log("✅ Layout geladen:", results);
        
        // Warte auf nächsten Frame + zusätzliche Zeit für DOM-Updates
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Scripte initialisieren
                initializeDynamicScripts();
                initializeForms();
                
                // KRITISCH: no-scroll entfernen und Seite sichtbar machen
                document.body.classList.remove('no-scroll');
                document.body.classList.add('page-loaded');
                
                console.log("✅ Seite vollständig initialisiert");
                
            }, 200);
        });

    } catch (error) {
        console.error("❌ Fehler beim Laden der Komponenten:", error);
        
        // Fallback: Seite trotzdem bedienbar machen
        contentLoaded = true;
        document.body.classList.remove('no-scroll');
        document.body.classList.add('page-loaded');
    }
    
    // Zusätzlicher Fallback-Timer
    setTimeout(unlockScrollFallback, 2000);
});

// Globaler Fallback: Falls nach 5 Sekunden noch nicht geladen
setTimeout(() => {
    if (!document.body.classList.contains('page-loaded')) {
        console.warn("⚠️ Fallback: Seite nach 5s nicht geladen, erzwinge Anzeige");
        document.body.classList.remove('no-scroll');
        document.body.classList.add('page-loaded');
    }
}, 5000);

// Intersection Observer für Performance-Tipps
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.performance-tip').forEach(el => observer.observe(el));
