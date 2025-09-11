// js/main.js (FINALE REPARIERTE VERSION)

// === 1. IMPORTE ===
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

// === 2. HELFERFUNKTIONEN ===
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

// === 3. ERWEITERTE INITIALISIERUNGS-FUNKTIONEN ===
const initializeDynamicScripts = () => {
    console.log("🔧 Initialisiere dynamische Scripts...");
    initModals();
};

const initializeStaticScripts = () => {
    console.log("🔧 Initialisiere statische Scripts...");
    initEffects();
    initTypewriters();
};

// === 4. NEUE FUNKTION: STUFENWEISE FORM-INITIALISIERUNG ===
const initializeFormsWithDelay = async () => {
    console.log("📝 Beginne stufenweise Form-Initialisierung...");
    
    // Schritt 1: AI-Form zuerst initialisieren
    try {
        console.log("📝 Initialisiere AI-Form...");
        await initAiForm();
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

// === 5. NEUE FUNKTION: CHAT-INTEGRATION SETUP ===
const setupChatIntegration = () => {
    console.log("💬 Richte erweiterte Chat-Integration ein...");
    
    // Globale Hilfsfunktion für Booking-Launch
    window.launchBookingFromAnywhere = async () => {
        console.log("🚀 Globaler Booking-Launch aufgerufen");
        
        if (typeof window.debugBookingLaunch === 'function') {
            await window.debugBookingLaunch();
        } else {
            console.warn("⚠️ Debug-Booking-Launch nicht verfügbar, versuche direkten Launch...");
            
            // Fallback: Versuche direktes Modal-Laden
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) {
                try {
                    const response = await fetch('/booking-modal.html');
                    const html = await response.text();
                    
                    // Prüfe ob bereits vorhanden
                    if (!document.getElementById('booking-modal')) {
                        modalContainer.insertAdjacentHTML('beforeend', html);
                    }
                    
                    // Dynamischer Import der Booking-Funktionen
                    const { initBookingModal, showStep } = await import('./booking.js');
                    
                    setTimeout(() => {
                        initBookingModal();
                        
                        const bookingModal = document.getElementById('booking-modal');
                        if (bookingModal) {
                            bookingModal.style.display = 'flex';
                            bookingModal.style.opacity = '1';
                            bookingModal.style.visibility = 'visible';
                            bookingModal.style.pointerEvents = 'auto';
                            
                            document.body.style.overflow = 'hidden';
                            document.body.classList.add('no-scroll');
                            
                            showStep('step-day-selection');
                            console.log("✅ Fallback Booking-Modal erfolgreich gestartet");
                        }
                    }, 100);
                    
                } catch (error) {
                    console.error("❌ Fallback Booking-Launch fehlgeschlagen:", error);
                    alert("Entschuldigung, das Buchungssystem konnte nicht geladen werden. Bitte kontaktiere Michael direkt.");
                }
            }
        }
    };
    
    // Event-Listener für Chat-spezifische Booking-Requests
    document.addEventListener('booking-request', (event) => {
        console.log("📅 Booking-Request Event empfangen:", event.detail);
        window.launchBookingFromAnywhere();
    });
    
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
    // Ruft die globale Funktion auf, die in ai-form.js definiert wurde
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
    
    console.log("✅ Chat-Integration erfolgreich eingerichtet");
};

// === 6. FEHLERBEHANDLUNG UND RETRY-MECHANISMUS ===
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

// === 7. HAUPTEINSTIEGSPUNKT ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM geladen. Start der erweiterten Anwendung.");
    
    // Sofort verfügbare Initialisierungen
    initializeStaticScripts();
    trackVisitor();
    
    try {
        // Lade externe Inhalte
        const headerPromise = loadContent('/header.html', 'header-placeholder');
        const modalsPromise = loadContent('/modals.html', 'modal-container');
        
        await Promise.all([headerPromise, modalsPromise]);
        console.log("✅ Header und Modals erfolgreich geladen.");
        
        // Initialisiere Modals
        initializeDynamicScripts();
        
        // Warte etwas für DOM-Stabilisierung
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialisiere Formulare mit Retry-Mechanismus
        await withRetry(initializeFormsWithDelay, 2, 500);
        
        console.log("🎉 Anwendung vollständig initialisiert!");
        
    } catch (error) {
        console.error("❌ Kritischer Fehler beim Laden der Seitenstruktur:", error);
        
        // Fallback: Versuche zumindest die grundlegenden Funktionen zu laden
        try {
            console.log("🔧 Starte Fallback-Initialisierung...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            await initializeFormsWithDelay();
        } catch (fallbackError) {
            console.error("❌ Auch Fallback-Initialisierung fehlgeschlagen:", fallbackError);
        }
    }
});

// === 8. ZUSÄTZLICHE DEBUGGING-HILFEN ===
if (window.location.search.includes('debug=true') || window.location.hostname.includes('localhost')) {
    window.debugInfo = {
        launchBooking: () => window.launchBookingFromAnywhere(),
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
        }
    };
    
    console.log("🔧 Debug-Modus aktiviert. Verfügbare Funktionen:");
    console.log("   - window.debugInfo.launchBooking()");
    console.log("   - window.debugInfo.checkChatInput()");
    console.log("   - window.debugInfo.testBookingModal()");
}
