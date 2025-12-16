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
        // Wir geben ein rejected Promise zurück, damit der Aufrufer weiß, dass das Element fehlt
        // Das ist okay, solange wir den Fehler später fangen oder tolerieren
        return Promise.reject(`Platzhalter-Element '${elementId}' nicht gefunden.`);
    }
    return fetch(url).then(response => {
        if (!response.ok) throw new Error(`Fehler beim Laden von ${url}`);
        return response.text();
    }).then(data => {
        placeholder.innerHTML = data;
    });
};

// NEU: Feedback-Bereich laden (Fehlertolerant)
const loadFeedback = () => {
    const placeholder = document.getElementById('feedback-placeholder');
    if (placeholder) {
        // Wir gehen davon aus, dass die Datei im Root liegt, wie header.html
        return fetch('blog-feedback.html')
            .then(response => {
                if (!response.ok) throw new Error('Feedback-Template konnte nicht geladen werden');
                return response.text();
            })
            .then(data => {
                placeholder.innerHTML = data;
            })
            .catch(err => {
                console.warn('Hinweis: Feedback-Sektion wurde nicht geladen (ggf. Datei nicht gefunden).', err);
            });
    }
    return Promise.resolve(); // Nichts tun, wenn kein Placeholder da ist
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
                
                // Prüfen ob wir im Flip-Modus sind (dort soll Scrollen erlaubt bleiben)
                const heroFlipped = document.querySelector('.hero-flip-wrapper.flipped'); 
                // Anmerkung: In deinem Code war es '.flip-container.flipped', ich habe es an deine Flip-Logik angepasst, 
                // falls du die Klasse 'hero-flip-wrapper' nutzt. Wenn nicht, greift der Fallback.
                
                if (!heroFlipped) {
                    document.body.classList.remove('no-scroll');
                } else {
                    // Auch im Flip-Modus wollen wir scrollen, wenn das Menü zugeht
                    document.body.classList.remove('no-scroll'); 
                }
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

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    try {
        const headerPromise = loadContent('header.html', 'header-placeholder');
        const modalsPromise = loadContent('modals.html', 'modal-container');
        const footerPromise = loadContent('footer.html', 'footer-placeholder');
        
        // NEU: Feedback Bereich laden (parallel)
        loadFeedback();

        const sideMenuPromise = loadContent('side-menu.html', 'side-menu-placeholder').catch(err => {
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
        document.body.classList.add('page-loaded'); // Trotzdem anzeigen
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
    const btnToBack = document.getElementById('flip-info-btn');      // Start -> Rückseite ("Neugierig geworden")
    const btnBackToStart = document.getElementById('flip-back-btn'); // Rückseite -> Start (Home)
    const btnToThird = document.getElementById('flip-to-third-btn'); // Rückseite -> Seite 3 (Evita)
    const btnThirdToBack = document.getElementById('flip-third-back-btn'); // Seite 3 -> Rückseite (Michael)
    const btnThirdToStart = document.getElementById('flip-third-to-start-btn'); // Seite 3 -> Chat mit Evita

    // Views (Inhalte der Vorderseite)
    const viewMain = document.getElementById('view-main');
    const viewThird = document.getElementById('view-third');

    if (heroFlipWrapper) {
        
        // 1. Von Startseite zu Rückseite (Michael)
        if (btnToBack) {
            btnToBack.addEventListener('click', (e) => {
                e.preventDefault();
                heroFlipWrapper.classList.add('flipped');
                // Scrollen erlauben, da Rückseite länger sein kann
                document.body.classList.remove('no-scroll');
            });
        }

        // 2. Von Rückseite zurück zur Startseite (Home)
        if (btnBackToStart) {
            btnBackToStart.addEventListener('click', (e) => {
                e.preventDefault();
                if (viewMain && viewThird) {
                    viewMain.style.display = 'block';
                    viewThird.style.display = 'none';
                }
                heroFlipWrapper.classList.remove('flipped');
                // Optional: Scrollen wieder sperren für den "Hero-Look" auf der Startseite
                document.body.classList.add('no-scroll'); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 3. Von Rückseite zu Seite 3 (Evita)
        if (btnToThird) {
            btnToThird.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (viewMain && viewThird) {
                    viewMain.style.display = 'none';
                    viewThird.style.display = 'flex';
                }

                heroFlipWrapper.classList.remove('flipped');
                // Hier bleiben wir im "Content-Modus", also kein no-scroll hinzufügen
                // Aber wir sollten nach oben scrollen, damit der User den Anfang sieht
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 4. Von Seite 3 zurück zur Rückseite (Michael)
        if (btnThirdToBack) {
            btnThirdToBack.addEventListener('click', (e) => {
                e.preventDefault();
                heroFlipWrapper.classList.add('flipped');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 5. Von Seite 3 -> Chat mit Evita öffnen
        if (btnThirdToStart) {
            btnThirdToStart.addEventListener('click', async (e) => {
                e.preventDefault();
                
                if (btnThirdToStart.dataset.action === 'open-evita-chat') {
                    try {
                        await window.launchEvitaChatFromAnywhere();
                    } catch (error) {
                        console.error("Fehler beim Öffnen des Evita Chats:", error);
                        const evitaHeaderBtn = document.getElementById('evita-chat-button');
                        if (evitaHeaderBtn) evitaHeaderBtn.click();
                    }
                } else {
                    // Fallback zu Start
                    if (viewMain && viewThird) {
                        viewMain.style.display = 'block';
                        viewThird.style.display = 'none';
                    }
                    heroFlipWrapper.classList.remove('flipped');
                    document.body.classList.add('no-scroll');
                }
            });
        }
    }
});
