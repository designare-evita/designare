// js/main.js

// === 1. IMPORTE ===
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';
import { initMenuInteractions } from './menu-logic.js';

// === 2. GLOBALE STATES ===
let globalAiFormInstance = null;

// === 3. CONTENT LOADING HELPER ===
const loadContent = async (url, elementId) => {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
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
            document.body.classList.remove('no-scroll');
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

// === 5. EVITA CHAT LOGIK ===
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
    await ensureAiFormAvailable();
    
    const aiResponseModal = document.getElementById('ai-response-modal');
    if (aiResponseModal) {
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory && chatHistory.children.length === 0) {
             addWelcomeMessage("Hallo! Ich bin Evita, Michaels KI-Assistentin. Wie kann ich dir heute helfen?");
        }
        
        aiResponseModal.classList.add('visible');
        document.body.classList.add('no-scroll');
        
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

// === 6. HERO VIEW SWITCHING LOGIK (Neu: Alle Views im Front-Face) ===
const initHeroViews = () => {
    // Views
    const viewMain = document.getElementById('view-main');
    const viewMichael = document.getElementById('view-michael');
    const viewEvita = document.getElementById('view-evita');
    
    // Buttons
    const btnToMichael = document.getElementById('flip-info-btn'); // "Neugierig geworden?" -> Michael
    const btnMichaelHome = document.getElementById('flip-michael-home-btn');
    const btnMichaelToEvita = document.getElementById('flip-michael-to-evita-btn');
    const btnEvitaToMichael = document.getElementById('flip-evita-to-michael-btn');
    const btnEvitaChat = document.getElementById('flip-evita-chat-btn');

    // Helper: View wechseln
    const showView = (viewToShow) => {
        if (viewMain) viewMain.style.display = 'none';
        if (viewMichael) viewMichael.style.display = 'none';
        if (viewEvita) viewEvita.style.display = 'none';
        
        if (viewToShow) viewToShow.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Event Listeners
    
    // "Neugierig geworden?" -> zeigt Michael
    if (btnToMichael) {
        btnToMichael.addEventListener('click', (e) => {
            e.preventDefault();
            showView(viewMichael);
        });
    }

    // Michael -> Home
    if (btnMichaelHome) {
        btnMichaelHome.addEventListener('click', (e) => {
            e.preventDefault();
            showView(viewMain);
        });
    }

    // Michael -> Evita
    if (btnMichaelToEvita) {
        btnMichaelToEvita.addEventListener('click', (e) => {
            e.preventDefault();
            showView(viewEvita);
        });
    }

    // Evita -> Michael
    if (btnEvitaToMichael) {
        btnEvitaToMichael.addEventListener('click', (e) => {
            e.preventDefault();
            showView(viewMichael);
        });
    }

    // Evita -> Chat öffnen
    if (btnEvitaChat) {
        btnEvitaChat.addEventListener('click', async (e) => {
            e.preventDefault();
            await launchEvitaChat();
        });
    }
};

// === 7. INITIALISIERUNG ===

const initializeDynamicScripts = () => {
    initModals();
    initHeaderScrollEffect(); 
    setupSideMenu();
    setupEvitaChatButton();
    initHeroViews(); // Geändert von initHeroFlip
    initTheme(); 
    initMenuInteractions();
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
    
    // Vorab-Check für den Theme-Status
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    initializeStaticScripts();

    try {
        // Sequentielles Laden, um sicherzustellen, dass DOM-Elemente vorhanden sind
        await loadContent('header.html', 'header-placeholder');
        await loadContent('modals.html', 'modal-container');
        await loadContent('footer.html', 'footer-placeholder');
        await loadContent('side-menu.html', 'side-menu-placeholder');
        await loadFeedback();

        console.log("✅ Layout geladen.");
        
        // Kleine Verzögerung, um sicherzugehen, dass die innerHTML-Inhalte verarbeitet wurden
        setTimeout(() => {
            initializeDynamicScripts();
            initializeForms();
        }, 100);

        document.body.classList.add('page-loaded');

    } catch (error) {
        console.error("❌ Fehler beim Laden der Komponenten:", error);
        document.body.classList.add('page-loaded');
    }
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.performance-tip').forEach(el => observer.observe(el));
