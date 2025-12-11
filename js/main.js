// js/main.js

// === 1. IMPORTE ===
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// === 2. GLOBALE VARIABLEN ===
let evitaChatInitialized = false;
let globalAiFormInstance = null;

// === 3. HELFERFUNKTIONEN ===
const loadContent = (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        return Promise.reject(`Platzhalter-Element '${elementId}' nicht gefunden.`);
    }
    return fetch(url).then(response => {
        if (!response.ok) throw new Error(`Fehler beim Laden von ${url}`);
        return response.text();
    }).then(data => {
        placeholder.innerHTML = data;
    });
};

const trackVisitor = () => {
    fetch('/api/track-visitor')
        .then(response => response.ok ? console.log('Besucher erfasst.') : console.error('Fehler bei der Erfassung des Besuchers.'))
        .catch(error => console.error('Netzwerkfehler beim Tracking:', error));
};

// === 4. SETUP: SIDE MENU ===
const setupSideMenu = () => {
    const menuButton = document.getElementById('menu-toggle-button');
    const sideMenu = document.getElementById('side-menu-panel');
    const closeMenuButton = document.getElementById('close-menu-button');

    if (menuButton && sideMenu) {
        // Öffnen
        menuButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sideMenu.classList.add('visible');
            document.body.classList.add('no-scroll');
        });

        // Schließen (X-Button)
        if (closeMenuButton) {
            closeMenuButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                sideMenu.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            });
        }

        // Schließen (Klick außerhalb)
        document.addEventListener('click', (e) => {
            if (sideMenu.classList.contains('visible') && 
                !sideMenu.contains(e.target) && 
                !menuButton.contains(e.target)) {
                sideMenu.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            }
        });

        // Schließen mit Escape-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sideMenu.classList.contains('visible')) {
                sideMenu.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            }
        });
    }
};

// === 5. EVITA CHAT BUTTON INTEGRATION ===
const setupEvitaChatButton = () => {
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (!evitaChatButton) return;

    evitaChatButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await launchEvitaChat();
        } catch (error) {
            console.error("❌ Fehler beim Öffnen des Evita Chats:", error);
        }
    });
};

// === 6. EVITA CHAT LAUNCH FUNKTION ===
const launchEvitaChat = async () => {
    await ensureAiFormAvailable();
    
    const aiResponseModal = document.getElementById('ai-response-modal');
    if (aiResponseModal) {
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory) chatHistory.innerHTML = '';
        
        addWelcomeMessage("Hallo! Ich bin Evita, Michaels KI-Assistentin. Wie kann ich dir heute helfen?");
        
        aiResponseModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
        
        setTimeout(() => {
            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput) chatInput.focus();
        }, 300);
    }
};

// === 7. HILFSFUNKTIONEN FÜR CHAT ===
const addWelcomeMessage = (message) => {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai';
    messageDiv.textContent = message;
    
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
};

const ensureAiFormAvailable = async () => {
    if (globalAiFormInstance || document.getElementById('ai-chat-form')) return;
    try {
        await initAiForm();
        globalAiFormInstance = true;
    } catch (error) {
        console.error("❌ Fehler bei der AI-Form Initialisierung:", error);
    }
};

// === 8. INITIALISIERUNGS-FUNKTIONEN ===
const initializeDynamicScripts = () => {
    initModals();
    setupSideMenu();
    setTimeout(() => {
        setupEvitaChatButton();
    }, 200);
};

const initializeStaticScripts = () => {
    initEffects();
    initTypewriters();
};

const initializeFormsWithDelay = async () => {
    try {
        await initAiForm();
        globalAiFormInstance = true;
    } catch (error) { console.error(error); }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try { initSilasForm(); } catch (error) { console.error(error); }
    
    setupChatIntegration();
};

const setupChatIntegration = () => {
    window.launchBookingFromAnywhere = async () => {
        if (typeof window.debugBookingLaunch === 'function') {
            await window.debugBookingLaunch();
        }
    };
    window.launchEvitaChatFromAnywhere = launchEvitaChat;
    
    document.addEventListener('booking-request', () => {
        window.launchBookingFromAnywhere();
    });
};

const withRetry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await fn();
            return;
        } catch (error) {
            if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
            else throw error;
        }
    }
};

const enhanceHeaderAfterLoad = () => {
    const menuBtn = document.getElementById('menu-toggle-button');
    if (menuBtn) {
        if (!menuBtn.hasAttribute('data-initialized')) {
            setupSideMenu();
            menuBtn.setAttribute('data-initialized', 'true');
        }
    }
};

// === 9. HAUPTEINSTIEGSPUNKT ===
document.addEventListener('DOMContentLoaded', async () => {
    initializeStaticScripts();
    trackVisitor();

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    try {
        const headerPromise = loadContent('/header.html', 'header-placeholder');
        const modalsPromise = loadContent('/modals.html', 'modal-container');
        const footerPromise = loadContent('/footer.html', 'footer-placeholder');
        const sideMenuPromise = loadContent('/side-menu.html', 'side-menu-placeholder').catch(err => {
            console.warn("⚠️ Side-Menu konnte nicht geladen werden:", err);
            return null;
        });

        await Promise.all([headerPromise, modalsPromise, footerPromise, sideMenuPromise]); 
        console.log("✅ Struktur geladen.");
        
        setTimeout(() => enhanceHeaderAfterLoad(), 50);
        initializeDynamicScripts();
        withRetry(initializeFormsWithDelay, 2, 500);

        requestAnimationFrame(() => {
            document.body.classList.add('page-loaded');
        });
        
    } catch (error) {
        console.error("❌ Fehler beim Laden:", error);
        document.body.classList.add('page-loaded');
    }
});

// === 10. SCROLL ANIMATION OBSERVER ===
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.performance-tip');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        animatedElements.forEach(element => observer.observe(element));
    }
});

/* =========================================
   11. HERO FLIP ANIMATION (3-SEITEN LOGIK)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const heroFlipWrapper = document.getElementById('hero-flip-wrapper');
    
    // Buttons
    const btnToBack = document.getElementById('flip-info-btn');      // Start -> Rückseite
    const btnBackToStart = document.getElementById('flip-back-btn'); // Rückseite -> Start
    const btnToThird = document.getElementById('flip-to-third-btn'); // Rückseite -> Seite 3
    const btnThirdToBack = document.getElementById('flip-third-back-btn'); // Seite 3 -> Rückseite
    const btnThirdToStart = document.getElementById('flip-third-to-start-btn'); // Seite 3 -> Start

    // Views (Inhalte der Vorderseite)
    const viewMain = document.getElementById('view-main');
    const viewThird = document.getElementById('view-third');

    if (heroFlipWrapper) {
        
        // 1. Von Startseite zu Rückseite (Evita)
        if (btnToBack) {
            btnToBack.addEventListener('click', (e) => {
                e.preventDefault();
                heroFlipWrapper.classList.add('flipped');
            });
        }

        // 2. Von Rückseite zurück zur Startseite (Michael)
        if (btnBackToStart) {
            btnBackToStart.addEventListener('click', (e) => {
                e.preventDefault();
                if (viewMain && viewThird) {
                    viewMain.style.display = 'block';
                    viewThird.style.display = 'none';
                }
                heroFlipWrapper.classList.remove('flipped');
            });
        }

        // 3. Von Rückseite zu Seite 3 (Expertise)
        if (btnToThird) {
            btnToThird.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (viewMain && viewThird) {
                    viewMain.style.display = 'none';
                    // WICHTIG: 'flex' statt 'block' für korrektes Layout!
                    viewThird.style.display = 'flex';
                }

                heroFlipWrapper.classList.remove('flipped');
            });
        }

        // 4. Von Seite 3 zurück zur Rückseite
        if (btnThirdToBack) {
            btnThirdToBack.addEventListener('click', (e) => {
                e.preventDefault();
                heroFlipWrapper.classList.add('flipped');
            });
        }

        // 5. Von Seite 3 direkt zur Startseite
        if (btnThirdToStart) {
            btnThirdToStart.addEventListener('click', (e) => {
                e.preventDefault();
                if (viewMain && viewThird) {
                    viewMain.style.display = 'block';
                    viewThird.style.display = 'none';
                }
                heroFlipWrapper.classList.remove('flipped');
            });
        }
    }
});
