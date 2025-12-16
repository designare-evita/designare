// js/main.js

// === 1. IMPORTE ===
// Stellen Sie sicher, dass diese Pfade in Ihrer Ordnerstruktur korrekt sind
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// === 2. GLOBALE STATES ===
let globalAiFormInstance = null;

// === 3. CONTENT LOADING HELPER ===
const loadContent = async (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        // Nicht kritisch, wenn z.B. side-menu-placeholder auf manchen Seiten fehlt
        return Promise.resolve(); 
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error ${response.status} bei ${url}`);
        const data = await response.text();
        placeholder.innerHTML = data;
    } catch (error) {
        console.warn(`⚠️ Konnte ${url} nicht in #${elementId} laden:`, error);
    }
};

// Spezifisch für Feedback (fehlertolerant)
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

// === 4. HEADER LOGIK (SCROLL EFFECT & SIDE MENU) ===

const initHeaderScrollEffect = () => {
    const header = document.querySelector('.main-header');
    if (!header) return;

    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    // Initial check und Listener
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
};

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

        // Schließen Funktion
        const closeMenu = () => {
            sideMenu.classList.remove('visible');
            
            // Checken ob wir im Flip-Modus sind
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

        // Klick außerhalb und Escape
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

// === 5. EVITA CHAT LOGIK ===

const setupEvitaChatButton = () => {
    // Header Button
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (evitaChatButton) {
        evitaChatButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await launchEvitaChat();
        });
    }
};

// Global aufrufbar machen
window.launchEvitaChatFromAnywhere = async () => {
    await launchEvitaChat();
};

const launchEvitaChat = async () => {
    // 1. Sicherstellen, dass Formular initialisiert ist
    await ensureAiFormAvailable();
    
    // 2. Modal öffnen
    const aiResponseModal = document.getElementById('ai-response-modal');
    if (aiResponseModal) {
        const chatHistory = document.getElementById('ai-chat-history');
        // Reset Chat History bei Neuöffnung (optional)
        if (chatHistory && chatHistory.children.length === 0) {
             addWelcomeMessage("Hallo! Ich bin Evita, Michaels KI-Assistentin. Wie kann ich dir heute helfen?");
        }
        
        aiResponseModal.classList.add('visible');
        document.body.classList.add('no-scroll');
        
        // Fokus auf Input
        setTimeout(() => {
            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput) chatInput.focus();
        }, 300);
    }
};

const ensureAiFormAvailable = async () => {
    if (globalAiFormInstance || document.getElementById('ai-chat-form')) return;
    try {
        await initAiForm();
        globalAiFormInstance = true;
    } catch (error) {
        console.warn("Konnte AI-Form nicht vorladen:", error);
    }
};

const addWelcomeMessage = (message) => {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai';
    messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    chatHistory.appendChild(messageDiv);
};

// === 6. HERO FLIP LOGIK (3-SEITEN SYSTEM) ===
// Diese Logik greift nur, wenn die Elemente tatsächlich da sind (Startseite)

const initHeroFlip = () => {
    const heroFlipWrapper = document.getElementById('hero-flip-wrapper');
    if (!heroFlipWrapper) return; // Abbruch auf Blogseiten etc.

    // Elemente
    const btnToBack = document.getElementById('flip-info-btn');
    const btnBackToStart = document.getElementById('flip-back-btn');
    const btnToThird = document.getElementById('flip-to-third-btn');
    const btnThirdToBack = document.getElementById('flip-third-back-btn');
    const btnThirdToStart = document.getElementById('flip-third-to-start-btn');
    
    const viewMain = document.getElementById('view-main');
    const viewThird = document.getElementById('view-third');

    // 1. Start -> Rückseite (Michael)
    if (btnToBack) {
        btnToBack.addEventListener('click', (e) => {
            e.preventDefault();
            heroFlipWrapper.classList.add('flipped');
            document.body.classList.remove('no-scroll'); // Scrollen auf Rückseite erlaubt
        });
    }

    // 2. Rückseite -> Start
    if (btnBackToStart) {
        btnBackToStart.addEventListener('click', (e) => {
            e.preventDefault();
            // Reset Views
            if(viewMain) viewMain.style.display = 'block';
            if(viewThird) viewThird.style.display = 'none';
            
            heroFlipWrapper.classList.remove('flipped');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Kurze Verzögerung bis Animation fertig ist, dann Scroll lock (optional für Hero Feeling)
            // document.body.classList.add('no-scroll'); 
        });
    }

    // 3. Rückseite -> Seite 3 (Evita)
    if (btnToThird) {
        btnToThird.addEventListener('click', (e) => {
            e.preventDefault();
            // View Switch
            if (viewMain) viewMain.style.display = 'none';
            if (viewThird) viewThird.style.display = 'flex';
            
            // Flip zurückdrehen (aber Inhalt ist jetzt Evita)
            heroFlipWrapper.classList.remove('flipped');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 4. Seite 3 -> Rückseite
    if (btnThirdToBack) {
        btnThirdToBack.addEventListener('click', (e) => {
            e.preventDefault();
            heroFlipWrapper.classList.add('flipped');
            // View Switch passiert erst wenn flipped ist, oder wir lassen es so
            // Hier muss man aufpassen: Wenn wir flippen, sieht man die Rückseite (Michael)
            // Das passt so.
        });
    }

    // 5. Seite 3 -> Aktion (Chat oder Start)
    if (btnThirdToStart) {
        btnThirdToStart.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btnThirdToStart.dataset.action === 'open-evita-chat') {
                await launchEvitaChat();
            } else {
                // Fallback: Zurück zur Startseite
                if(viewMain) viewMain.style.display = 'block';
                if(viewThird) viewThird.style.display = 'none';
                heroFlipWrapper.classList.remove('flipped');
            }
        });
    }
};

// === 7. INITIALISIERUNG ===

const initializeDynamicScripts = () => {
    initModals();
    initHeaderScrollEffect(); // NEU: Scroll Effekt aktivieren
    setupSideMenu();
    setupEvitaChatButton();
    initHeroFlip(); // NEU: Flip Logik sicher aufrufen
};

const initializeStaticScripts = () => {
    initEffects();
    initTypewriters();
};

const initializeForms = async () => {
    try { await initAiForm(); } catch (e) { console.warn(e); }
    try { initSilasForm(); } catch (e) { console.warn(e); }
};

// MAIN EVENT LISTENER
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Statische Skripte sofort
    initializeStaticScripts();

    // 2. Dark Mode Check
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // 3. Asynchrones Laden der HTML-Teile
    try {
        await Promise.all([
            loadContent('header.html', 'header-placeholder'),
            loadContent('modals.html', 'modal-container'),
            loadContent('footer.html', 'footer-placeholder'),
            loadContent('side-menu.html', 'side-menu-placeholder'),
            loadFeedback() // Parallel, aber Fehler werden ignoriert
        ]);

        console.log("✅ Core-Layout geladen.");
        
        // 4. Events binden, nachdem HTML da ist
        initializeDynamicScripts();
        
        // 5. Forms laden (mit leichter Verzögerung für Performance)
        setTimeout(initializeForms, 200);

        // 6. Seite sichtbar machen
        document.body.classList.add('page-loaded');

    } catch (error) {
        console.error("❌ Kritischer Fehler beim Laden:", error);
        // Notfall-Anzeige
        document.body.classList.add('page-loaded');
    }
});

// Scroll Observer für Performance-Tipps (Blog etc.)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.performance-tip').forEach(el => observer.observe(el));
