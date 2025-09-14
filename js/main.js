// js/main.js (FINALE VERSION mit vollständiger Evita Chat Button Integration)

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

// === 4. EVITA CHAT BUTTON INTEGRATION ===
const setupEvitaChatButton = () => {
    console.log("🤖 Richte Evita Chat Button ein...");
    
    const evitaChatButton = document.getElementById('evita-chat-button');
    if (!evitaChatButton) {
        console.warn("⚠️ Evita Chat Button nicht gefunden");
        return;
    }

    // Event Listener für den Evita Chat Button
    evitaChatButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("🤖 Evita Chat Button geklickt");
        
        try {
            await launchEvitaChat();
        } catch (error) {
            console.error("❌ Fehler beim Öffnen des Evita Chats:", error);
            alert("Entschuldigung, der Chat konnte nicht geöffnet werden. Bitte versuche es später noch einmal.");
        }
    });

    console.log("✅ Evita Chat Button erfolgreich eingerichtet");
};

// === 5. EVITA CHAT LAUNCH FUNKTION ===
const launchEvitaChat = async () => {
    console.log("🚀 Starte Evita Chat...");
    
    // Stelle sicher, dass AI-Form Funktionalität verfügbar ist
    await ensureAiFormAvailable();
    
    // Chat Modal öffnen
    const aiResponseModal = document.getElementById('ai-response-modal');
    if (aiResponseModal) {
        // Chat History leeren für neuen Chat
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory) {
            chatHistory.innerHTML = '';
        }
        
        // Begrüßungsnachricht hinzufügen
        const welcomeMessage = "Hallo! Ich bin Evita, Michaels KI-Assistentin. Wie kann ich dir heute helfen?";
        addWelcomeMessage(welcomeMessage);
        
        // Modal öffnen
        aiResponseModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');
        
        // Fokus auf Chat Input setzen
        setTimeout(() => {
            const chatInput = document.getElementById('ai-chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }, 300);
        
        console.log("✅ Evita Chat erfolgreich geöffnet");
    } else {
        throw new Error("Chat Modal nicht gefunden");
    }
};

// === 6. HILFSFUNKTIONEN FÜR CHAT ===
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
    console.log("🔍 Überprüfe AI-Form Verfügbarkeit...");
    
    // Prüfe ob AI-Form bereits initialisiert ist
    if (globalAiFormInstance || document.getElementById('ai-chat-form')) {
        console.log("✅ AI-Form bereits verfügbar");
        return;
    }
    
    // Initialisiere AI-Form falls noch nicht geschehen
    try {
        await initAiForm();
        globalAiFormInstance = true;
        console.log("✅ AI-Form nachträglich initialisiert");
    } catch (error) {
        console.error("❌ Fehler bei der AI-Form Initialisierung:", error);
        throw error;
    }
};

// === 7. ERWEITERTE INITIALISIERUNGS-FUNKTIONEN ===
const initializeDynamicScripts = () => {
    console.log("🔧 Initialisiere dynamische Scripts...");
    initModals();
    
    // Warte kurz und richte dann den Evita Button ein
    setTimeout(() => {
        setupEvitaChatButton();
    }, 200);
};

const initializeStaticScripts = () => {
    console.log("🔧 Initialisiere statische Scripts...");
    initEffects();
    initTypewriters();
};

// === 8. STUFENWEISE FORM-INITIALISIERUNG ===
const initializeFormsWithDelay = async () => {
    console.log("📝 Beginne stufenweise Form-Initialisierung...");
    
    // Schritt 1: AI-Form zuerst initialisieren
    try {
        console.log("📝 Initialisiere AI-Form...");
        await initAiForm();
        globalAiFormInstance = true;
        console.log("✅ AI-Form erfolgreich initialisiert");
    } catch (error) {
        console.error("❌ Fehler bei AI-Form Initialisierung:", error);
    }
    
    // Schritt 2: Kurze Pause für DOM-Stabilisierung
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Schritt 3: Silas-Form initialisieren (falls vorhanden)
    try {
        console.log("📝 Initialisiere Silas-Form...");
        initSilasForm();
        console.log("✅ Silas-Form erfolgreich initialisiert");
    } catch (error) {
        console.error("❌ Fehler bei Silas-Form Initialisierung:", error);
    }
    
    // Schritt 4: Zusätzliche Chat-Unterstützung einrichten
    setupChatIntegration();
    
    console.log("✅ Alle Formulare erfolgreich initialisiert");
};
// === 9. CHAT-INTEGRATION SETUP ===
const setupChatIntegration = () => {
    console.log("💬 Richte erweiterte Chat-Integration ein...");
    
    // Globale Hilfsfunktion für Booking-Launch
    window.launchBookingFromAnywhere = async () => {
        console.log("🚀 Globaler Booking-Launch aufgerufen");
        
        if (typeof window.debugBookingLaunch === 'function') {
            await window.debugBookingLaunch();
        } else {
            console.warn("⚠️ Debug-Booking-Launch nicht verfügbar. Das alte Booking-Modal ist deaktiviert.");
        }
    };
    
    // Globale Evita Chat Funktion
    window.launchEvitaChatFromAnywhere = launchEvitaChat;
    
    // Event-Listener für Chat-spezifische Booking-Requests
    document.addEventListener('booking-request', (event) => {
        console.log("📅 Booking-Request Event empfangen:", event.detail);
        window.launchBookingFromAnywhere();
    });
    
    /*
    // AUSKOMMENTIERT: Dieser Observer ist redundant, da modals.js dies bereits lokal behandelt.
    // Überwache Chat-Nachrichten auf Booking-Keywords
    const observeChatMessages = () => {
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('chat-message')) {
                            const text = node.textContent.toLowerCase();
                            if (text.includes('buchung') || text.includes('termin') || text.includes('kalender')) {
                                console.log("🎯 Booking-relevante Nachricht erkannt -> Starte Booking-Modal");
                                window.launchBookingFromAnywhere();
                            }
                        }
                    });
                });
            });
            
            observer.observe(chatHistory, { childList: true });
            console.log("👁️ Chat-Message-Observer aktiviert");
        }
    };
    
    // Observer starten
    observeChatMessages();
    
    // Retry-Mechanismus für Chat-Observer
    setTimeout(observeChatMessages, 1000);
    setTimeout(observeChatMessages, 3000);
    */
    
    console.log("✅ Chat-Integration erfolgreich eingerichtet");
};


// === 10. FEHLERBEHANDLUNG UND RETRY-MECHANISMUS ===
const withRetry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await fn();
            return;
        } catch (error) {
            console.warn(`⚠️ Versuch ${i + 1} fehlgeschlagen:`, error);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
};

// === 11. HEADER CONTENT ERWEITERTE BEHANDLUNG ===
const enhanceHeaderAfterLoad = () => {
    console.log("🔧 Erweitere Header nach dem Laden...");
    
    // Stelle sicher, dass alle Header-Buttons funktionsfähig sind
    const headerButtons = [
        'about-me-button',
        'evita-chat-button', 
        'contact-button',
        'cookie-info-button',
        'menu-toggle-button'
    ];
    
    headerButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            console.log(`✅ ${buttonId} gefunden und bereit`);
            
            // Spezielle Behandlung für Evita Chat Button
            if (buttonId === 'evita-chat-button' && !button.hasAttribute('data-evita-ready')) {
                button.setAttribute('data-evita-ready', 'true');
                setupEvitaChatButton();
            }
        } else {
            console.warn(`⚠️ ${buttonId} nicht gefunden`);
        }
    });
};

// === 12. HAUPTEINSTIEGSPUNKT ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM geladen. Start der erweiterten Anwendung mit Evita Chat Support.");
    
    // Sofort verfügbare Initialisierungen
    initializeStaticScripts();
    trackVisitor();
    
    try {
        // Lade externe Inhalte
        const headerPromise = loadContent('/header.html', 'header-placeholder');
        const modalsPromise = loadContent('/modals.html', 'modal-container');
        
        await Promise.all([headerPromise, modalsPromise]);
        console.log("✅ Header und Modals erfolgreich geladen.");
        
        // Erweitere Header nach dem Laden
        setTimeout(() => {
            enhanceHeaderAfterLoad();
        }, 100);
        
        // Initialisiere Modals
        initializeDynamicScripts();
        
        // Warte etwas für DOM-Stabilisierung
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Initialisiere Formulare mit Retry-Mechanismus
        await withRetry(initializeFormsWithDelay, 2, 500);
        
        console.log("🎉 Anwendung mit Evita Chat Support vollständig initialisiert!");
        
    } catch (error) {
        console.error("❌ Kritischer Fehler beim Laden der Seitenstruktur:", error);
        
        // Fallback: Versuche zumindest die grundlegenden Funktionen zu laden
        try {
            console.log("🔧 Starte Fallback-Initialisierung...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            await initializeFormsWithDelay();
            
            // Versuche trotzdem den Evita Button einzurichten
            setTimeout(() => {
                setupEvitaChatButton();
            }, 500);
        } catch (fallbackError) {
            console.error("❌ Auch Fallback-Initialisierung fehlgeschlagen:", fallbackError);
        }
    }
});

// === 13. ZUSÄTZLICHE DEBUGGING-HILFEN ===
if (window.location.search.includes('debug=true') || window.location.hostname.includes('localhost')) {
    window.debugInfo = {
        launchBooking: () => window.launchBookingFromAnywhere(),
        launchEvitaChat: () => window.launchEvitaChatFromAnywhere(),
        checkChatInput: () => {
            const chatInput = document.getElementById('ai-chat-input');
            console.log("Chat Input Element:", chatInput);
            console.log("Chat Form Element:", document.getElementById('ai-chat-form'));
        },
        testBookingModal: () => {
            const modal = document.getElementById('booking-modal');
            console.log("Booking Modal:", modal);
            if (modal) {
                console.log("Modal Style:", modal.style);
                console.log("Modal Classes:", modal.classList);
            }
        },
        checkEvitaButton: () => {
            const button = document.getElementById('evita-chat-button');
            console.log("Evita Chat Button:", button);
            console.log("Button Ready:", button?.hasAttribute('data-evita-ready'));
        }
    };
    
    console.log("🔧 Debug-Modus aktiviert. Verfügbare Funktionen:");
    console.log("   - window.debugInfo.launchBooking()");
    console.log("   - window.debugInfo.launchEvitaChat()");
    console.log("   - window.debugInfo.checkChatInput()");
    console.log("   - window.debugInfo.testBookingModal()");
    console.log("   - window.debugInfo.checkEvitaButton()");
}
