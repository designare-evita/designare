// js/main.js

// Importiere alle deine externen Module
import { initEffects } from './effects.js';
import { initTypewriters } from './typewriter.js';
import { initModals } from './modals.js';
import { initAiForm } from './ai-form.js';
import { initSilasForm } from './silas-form.js';

/**
 * Diese Funktion initialisiert alle Skripte, die von den Elementen
 * im geladenen Header abhängen (z.B. Menü-Button, Modal-Buttons).
 */
function initializeHeaderScripts() {
    console.log('🔧 Initialisiere Header-abhängige Skripte...');
    
    // --- Code für das Slide-in Menü ---
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const sideMenuPanel = document.getElementById('side-menu-panel');
    const closeMenuButton = document.getElementById('close-menu-button');

    if (menuToggleButton && sideMenuPanel && closeMenuButton) {
        // Menü öffnen
        menuToggleButton.addEventListener('click', () => {
            sideMenuPanel.classList.add('is-active');
            console.log('📱 Side Menu geöffnet');
        });

        // Menü mit dem "X" schließen
        closeMenuButton.addEventListener('click', () => {
            sideMenuPanel.classList.remove('is-active');
            console.log('❌ Side Menu geschlossen');
        });

        // Menü schließen, wenn ein Link geklickt wird
        sideMenuPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                sideMenuPanel.classList.remove('is-active');
                console.log('🔗 Side Menu geschlossen durch Link-Click');
            });
        });
        
        console.log('✅ Side Menu initialisiert');
    } else {
        console.warn('⚠️ Side Menu Elemente nicht gefunden:', {
            menuToggleButton: !!menuToggleButton,
            sideMenuPanel: !!sideMenuPanel,
            closeMenuButton: !!closeMenuButton
        });
    }

    // --- Setzt den aktiven Menüpunkt ---
    setActiveMenuItem();
    
    // --- WICHTIG: Header-abhängige Module HIER initialisieren ---
    initModals(); // ✅ Jetzt läuft das NACH dem Header-Load!
    
    // --- Header-Button Funktionalität hinzufügen ---
    initHeaderButtons();

    console.log('✅ Header-spezifische Skripte erfolgreich initialisiert');
}

/**
 * Initialisiert die Header-Button Funktionalität
 * (About Me, Contact, Cookie Info)
 */
function initHeaderButtons() {
    console.log('🔘 Initialisiere Header-Buttons...');
    
    const aboutButton = document.getElementById('about-me-button');
    const contactButton = document.getElementById('contact-button');
    const cookieButton = document.getElementById('cookie-info-button');
    
    // About Me Button
    if (aboutButton) {
        aboutButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👤 About Me Button geklickt');
            
            // About Me Modal öffnen
            const aboutModal = document.getElementById('about-me-modal') || createAboutModal();
            if (aboutModal) {
                openModal(aboutModal);
            }
        });
        console.log('✅ About Me Button initialisiert');
    } else {
        console.warn('⚠️ About Me Button nicht gefunden');
    }
    
    // Contact Button
    if (contactButton) {
        contactButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('✉️ Contact Button geklickt');
            
            // Contact Modal öffnen
            const contactModal = document.getElementById('contact-modal');
            if (contactModal) {
                openModal(contactModal);
            }
        });
        console.log('✅ Contact Button initialisiert');
    } else {
        console.warn('⚠️ Contact Button nicht gefunden');
    }
    
    // Cookie Info Button
    if (cookieButton) {
        cookieButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🍪 Cookie Info Button geklickt');
            
            // Cookie Modal öffnen
            const cookieModal = document.getElementById('cookie-info-lightbox');
            if (cookieModal) {
                openModal(cookieModal);
            }
        });
        console.log('✅ Cookie Info Button initialisiert');
    } else {
        console.warn('⚠️ Cookie Info Button nicht gefunden');
    }
}

/**
 * Erstellt das About Me Modal falls es nicht existiert
 */
function createAboutModal() {
    console.log('🏗️ Erstelle About Me Modal...');
    
    const aboutContent = document.getElementById('about-me-content');
    if (!aboutContent) {
        console.warn('⚠️ About Me Content nicht gefunden');
        return null;
    }
    
    const modal = document.createElement('div');
    modal.id = 'about-me-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-button">&times;</button>
            ${aboutContent.innerHTML}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close Button Event Listener hinzufügen
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => closeModal(modal));
    }
    
    // Overlay Click zum Schließen
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    console.log('✅ About Me Modal erstellt');
    return modal;
}

/**
 * Modal öffnen
 */
function openModal(modal) {
    if (modal) {
        modal.classList.add('is-visible');
        document.body.classList.add('lightbox-open');
        console.log('📖 Modal geöffnet:', modal.id);
    }
}

/**
 * Modal schließen
 */
function closeModal(modal) {
    if (modal) {
        modal.classList.remove('is-visible');
        document.body.classList.remove('lightbox-open');
        console.log('📕 Modal geschlossen:', modal.id);
    }
}

/**
 * Setzt den aktiven Menüpunkt basierend auf der aktuellen URL
 */
function setActiveMenuItem() {
    const currentPageUrl = window.location.pathname.endsWith('/') 
        ? '/index.html' 
        : window.location.pathname;
        
    const menuLinks = document.querySelectorAll('.side-menu-content li a');
    let activeFound = false;
    
    menuLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPageUrl) {
            link.parentElement.classList.add('active');
            activeFound = true;
            console.log('🎯 Aktiver Menüpunkt gesetzt:', link.textContent.trim());
        }
    });
    
    if (!activeFound) {
        console.log('ℹ️ Kein passender Menüpunkt für aktuelle Seite gefunden');
    }
}

/**
 * Haupt-Initialisierungsfunktion, die nach dem Laden des DOMs ausgeführt wird.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM geladen - Starte Initialisierung...');
    
    const headerPlaceholder = document.getElementById('header-placeholder');

    // Prüfen, ob der Platzhalter für den Header existiert
    if (headerPlaceholder) {
        console.log('🔄 Lade Header asynchron...');
        
        // Lade den Header aus der externen Datei
        fetch('/header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                // Füge den Header-HTML-Code in den Platzhalter ein
                headerPlaceholder.innerHTML = data;
                console.log('✅ Header erfolgreich geladen');
                
                // Führe alle Skripte aus, die auf den Header warten
                initializeHeaderScripts();
            })
            .catch(error => {
                console.error('❌ Fehler beim Laden des Headers:', error);
                headerPlaceholder.innerHTML = `
                    <div style='color:red; text-align:center; padding:20px; background:rgba(255,0,0,0.1); border:1px solid red; margin:10px; border-radius:5px;'>
                        <strong>⚠️ Fehler:</strong> Der Header konnte nicht geladen werden.<br>
                        <small>Details: ${error.message}</small>
                    </div>
                `;
            });
    } else {
        console.log('ℹ️ Kein Header-Placeholder gefunden - Header vermutlich bereits im HTML');
        // Falls der Header bereits im HTML steht, initialisiere trotzdem die Header-Skripte
        initializeHeaderScripts();
    }

    // --- Initialisiere alle Module, die NICHT vom Header abhängen ---
    console.log('🔧 Initialisiere Header-unabhängige Module...');
    
    try {
        initEffects();
        console.log('✅ Effects initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Effects:', error);
    }
    
    try {
        initTypewriters();
        console.log('✅ Typewriters initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Typewriters:', error);
    }
    
    try {
        initAiForm();
        console.log('✅ AI Form initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei AI Form:', error);
    }
    
    try {
        initSilasForm();
        console.log('✅ Silas Form initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Silas Form:', error);
    }

    // ESC-Key Listener für alle Modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const visibleModals = document.querySelectorAll('.modal-overlay.is-visible');
            visibleModals.forEach(modal => {
                closeModal(modal);
            });
            if (visibleModals.length > 0) {
                console.log('⌨️ Modals mit ESC geschlossen');
            }
        }
    });

    // Starte hier die Besucher-Erfassung
    trackVisitor();

    console.log('🎉 Alle allgemeinen Module erfolgreich initialisiert');
});

/**
 * Funktion, um den Besucher zu protokollieren.
 * Ruft die serverseitige Funktion auf.
 */
function trackVisitor() {
    fetch('/api/track-visitor')
        .then(response => {
            if (response.ok) {
                console.log('📊 Besucher erfasst');
            } else {
                console.warn('⚠️ Fehler bei der Erfassung des Besuchers:', response.status);
            }
        })
        .catch(error => {
            console.warn('⚠️ Netzwerkfehler bei Besucher-Tracking:', error);
            // Nicht als Fehler behandeln, da das Tracking optional ist
        });
}
