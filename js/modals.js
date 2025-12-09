// js/main.js (FIX: Side-Menu wiederhergestellt + Evita Chat & Suche)

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

// === 4. SETUP: SIDE MENU (DAS HAT GEFEHLT) ===
const setupSideMenu = () => {
    const menuButton = document.getElementById('menu-toggle-button');
    const sideMenu = document.getElementById('side-menu-panel');
    const closeMenuButton = document.getElementById('close-menu-button');

    if (menuButton && sideMenu) {
        console.log("🍔 Side-Menu wird eingerichtet...");
        
        // Öffnen
        menuButton.addEventListener('click', (e) => {
            e.preventDefault();
            sideMenu.classList.add('visible');
            document.body.classList.add('no-scroll');
        });

        // Schließen (X-Button)
        if (closeMenuButton) {
            closeMenuButton.addEventListener('click', () => {
                sideMenu.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            });
        }

        // Schließen (Klick außerhalb)
        document.addEventListener('click', (e) => {
            // Wenn Menü offen ist UND Klick NICHT im Menü UND NICHT auf dem Button war
            if (sideMenu.classList.contains('visible') && 
                !sideMenu.contains(e.target) && 
                !menuButton.contains(e.target)) {
                sideMenu.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            }
        });
    } else {
        console.warn("⚠️ Side-Menu Elemente nicht gefunden (Button oder Panel fehlt)");
    }
};

// === 5. EVITA CHAT BUTTON INTEGRATION ===
const setupEvitaChatButton = () => {
    console.log("🤖 Richte Evita Chat Button ein...");
    
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (!evitaChatButton) return;

    // Event Listener für den Evita Chat Button
    evitaChatButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("🤖 Evita Chat Button geklickt");
        
        try {
            await launchEvitaChat();
        } catch (error) {
            console.error("❌ Fehler beim Öffnen des Evita Chats:", error);
            alert("Entschuldigung, der Chat konnte nicht geöffnet werden.");
        }
    });
};

// === 6. EVITA CHAT LAUNCH FUNKTION ===
const launchEvitaChat = async () => {
    console.log("🚀 Starte Evita Chat...");
    
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
    console.log("🔧 Initialisiere dynamische Scripts...");
    initModals(); // Startet auch die Suche!
    
    // Wichtig: Side Menu einrichten
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
    // Hier können wir nochmals prüfen, ob Buttons da sind
    const menuBtn = document.getElementById('menu-toggle-button');
    if (menuBtn) {
        console.log("✅ Menü-Button gefunden");
        // Sicherheits-Check: Falls setupSideMenu noch nicht lief
        if (!menuBtn.hasAttribute('data-initialized')) {
            setupSideMenu();
            menuBtn.setAttribute('data-initialized', 'true');
        }
    }
};

// === 9. HAUPTEINSTIEGSPUNKT ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM geladen. Start...");
    
    initializeStaticScripts();
    trackVisitor();

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    try {
        const headerPromise = loadContent('/header.html', 'header-placeholder');
        const modalsPromise = loadContent('/modals.html', 'modal-container');
        const footerPromise = loadContent('/footer.html', 'footer-placeholder');

        await Promise.all([headerPromise, modalsPromise, footerPromise]); 
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

// Scroll Animation Observer
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
