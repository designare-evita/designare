// FINALE LÖSUNG: Chat-Booking-Integration
// Diese Datei sollte als separates Script in Ihre index.html eingefügt werden

(function() {
    'use strict';
    
    console.log("🔧 Finale Chat-Booking-Integration wird geladen...");
    
    // === GLOBALE BOOKING-LAUNCH-FUNKTION ===
    window.forceLaunchBooking = async function() {
        console.log("🚀 FORCE-LAUNCH-BOOKING gestartet");
        
        try {
            // Schritt 1: Verstecke alle anderen Modals
            const allModals = document.querySelectorAll('.modal-overlay');
            allModals.forEach(modal => {
                modal.style.display = 'none';
                modal.classList.remove('visible');
            });
            
            // Schritt 2: Lade Booking-Modal HTML falls nicht vorhanden
            let bookingModal = document.getElementById('booking-modal');
            
            if (!bookingModal) {
                console.log("📄 Lade booking-modal.html...");
                
                const response = await fetch('/booking-modal.html');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const html = await response.text();
                const modalContainer = document.getElementById('modal-container') || document.body;
                modalContainer.insertAdjacentHTML('beforeend', html);
                
                bookingModal = document.getElementById('booking-modal');
                console.log("✅ Booking-Modal HTML eingefügt");
            }
            
            // Schritt 3: Event-Listener manuell hinzufügen
            setupBookingEventListeners();
            
            // Schritt 4: Modal anzeigen
            if (bookingModal) {
                bookingModal.style.display = 'flex';
                bookingModal.style.opacity = '1';
                bookingModal.style.visibility = 'visible';
                bookingModal.style.pointerEvents = 'auto';
                
                document.body.style.overflow = 'hidden';
                document.body.classList.add('no-scroll');
                
                // Aktiviere ersten Schritt
                document.querySelectorAll('.booking-step').forEach(step => {
                    step.classList.remove('active');
                });
                
                const firstStep = document.getElementById('step-day-selection');
                if (firstStep) {
                    firstStep.classList.add('active');
                }
                
                console.log("✅ Booking-Modal erfolgreich angezeigt");
                return true;
            }
            
        } catch (error) {
            console.error("❌ Force-Launch-Booking fehlgeschlagen:", error);
            alert("Entschuldigung, das Buchungssystem konnte nicht geladen werden. Bitte versuche es später noch einmal oder kontaktiere Michael direkt.");
            return false;
        }
    };
    
    // === BOOKING EVENT LISTENERS SETUP ===
    function setupBookingEventListeners() {
        console.log("🔧 Richte Booking Event-Listener ein...");
        
        // Tag-Buttons
        document.querySelectorAll('.day-button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                button.addEventListener('click', handleDaySelection);
                button.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Zurück-Buttons
        document.querySelectorAll('.back-button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                button.addEventListener('click', handleBackButton);
                button.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Schließen-Buttons
        const closeButton = document.getElementById('close-booking-modal');
        if (closeButton && !closeButton.hasAttribute('data-listener-added')) {
            closeButton.addEventListener('click', closeBookingModal);
            closeButton.setAttribute('data-listener-added', 'true');
        }
        
        // Buchungsformular
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm && !bookingForm.hasAttribute('data-listener-added')) {
            bookingForm.addEventListener('submit', handleBookingSubmit);
            bookingForm.setAttribute('data-listener-added', 'true');
        }
        
        console.log("✅ Booking Event-Listener eingerichtet");
    }
    
    // === EVENT HANDLER FUNKTIONEN ===
    async function handleDaySelection(event) {
        const day = event.target.dataset.day;
        console.log("📅 Tag ausgewählt:", day);
        
        showLoadingForSlots();
        
        try {
            const response = await fetch(`/api/get-availability?day=${day}`);
            const data = await response.json();
            
            if (data.success && data.slots) {
                displaySlots(data.slots, day, data.date);
                showStep('step-time-selection');
            } else {
                alert('Keine Termine verfügbar für ' + day);
            }
            
        } catch (error) {
            console.error('Fehler beim Laden der Slots:', error);
            alert('Fehler beim Laden der verfügbaren Termine');
        } finally {
            hideLoadingForSlots();
        }
    }
    
    function handleBackButton(event) {
        const targetStep = event.target.dataset.target;
        console.log("⬅️ Zurück zu:", targetStep);
        showStep(targetStep);
    }
    
    function closeBookingModal() {
        console.log("❎ Schließe Booking-Modal");
        const bookingModal = document.getElementById('booking-modal');
        if (bookingModal) {
            bookingModal.style.display = 'none';
        }
        
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');
    }
    
    async function handleBookingSubmit(event) {
        event.preventDefault();
        
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const slotInput = document.getElementById('selected-slot-input');
        
        if (!nameInput.value || !emailInput.value || !slotInput.value) {
            alert('Bitte fülle alle Felder aus');
            return;
        }
        
        const submitButton = document.getElementById('submit-booking-button');
        const loader = document.getElementById('booking-loader');
        
        if (submitButton) submitButton.disabled = true;
        if (loader) loader.style.display = 'block';
        
        try {
            const response = await fetch('/api/create-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: slotInput.value,
                    name: nameInput.value,
                    email: emailInput.value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showStep('step-confirmation');
                const confirmationMessage = document.getElementById('confirmation-message');
                if (confirmationMessage) {
                    confirmationMessage.textContent = data.message;
                }
            } else {
                alert('Fehler bei der Buchung: ' + data.message);
            }
            
        } catch (error) {
            console.error('Buchungsfehler:', error);
            alert('Fehler bei der Buchung. Bitte versuche es erneut.');
        } finally {
            if (submitButton) submitButton.disabled = false;
            if (loader) loader.style.display = 'none';
        }
    }
    
    // === HILFSFUNKTIONEN ===
    function showStep(stepId) {
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.add('active');
        }
    }
    
    function displaySlots(slots, day, date) {
        const slotsContainer = document.getElementById('slots-container');
        const selectedDayDisplay = document.getElementById('selected-day-display');
        const selectedDateDisplay = document.getElementById('selected-date-display');
        
        if (selectedDayDisplay) selectedDayDisplay.textContent = day;
        if (selectedDateDisplay) selectedDateDisplay.textContent = date;
        
        if (slotsContainer) {
            slotsContainer.innerHTML = '';
            
            if (slots.length > 0) {
                slots.forEach(slot => {
                    const button = document.createElement('button');
                    button.className = 'slot-button';
                    button.textContent = slot.time;
                    button.addEventListener('click', () => selectSlot(slot.fullString));
                    slotsContainer.appendChild(button);
                });
            } else {
                slotsContainer.innerHTML = '<p>Keine Termine verfügbar</p>';
            }
        }
    }
    
    function selectSlot(fullSlot) {
        console.log("🕐 Slot ausgewählt:", fullSlot);
        
        const selectedSlotDisplay = document.getElementById('selected-slot-display');
        const selectedSlotInput = document.getElementById('selected-slot-input');
        
        if (selectedSlotDisplay) selectedSlotDisplay.textContent = fullSlot;
        if (selectedSlotInput) selectedSlotInput.value = fullSlot;
        
        showStep('step-details');
    }
    
    function showLoadingForSlots() {
        const loader = document.getElementById('slots-loader');
        if (loader) loader.style.display = 'block';
    }
    
    function hideLoadingForSlots() {
        const loader = document.getElementById('slots-loader');
        if (loader) loader.style.display = 'none';
    }
    
    // === CHAT-INTEGRATION ===
    function interceptChatBookingRequests() {
        console.log("💬 Überwache Chat für Booking-Anfragen...");
        
        // Überwache Chat-History für Booking-Trigger
        const chatHistory = document.getElementById('ai-chat-history');
        if (chatHistory) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            node.classList.contains('chat-message') && 
                            node.classList.contains('ai')) {
                            
                            const text = node.textContent.toLowerCase();
                            
                            // Suche nach Booking-Triggern in AI-Antworten
                            if (text.includes('termine') && text.includes('verfügbar') ||
                                text.includes('buchung') && text.includes('kalender') ||
                                text.includes('michael') && text.includes('termin')) {
                                
                                console.log("🎯 Booking-Trigger in Chat erkannt!");
                                
                                // Füge Booking-Button zur Nachricht hinzu
                                const bookingButton = document.createElement('button');
                                bookingButton.textContent = '📅 Jetzt Termin buchen';
                                bookingButton.style.cssText = `
                                    background: #ffc107; 
                                    color: #1a1a1a; 
                                    border: none; 
                                    padding: 10px 15px; 
                                    border-radius: 5px; 
                                    cursor: pointer; 
                                    margin-top: 10px; 
                                    display: block;
                                `;
                                
                                bookingButton.addEventListener('click', function() {
                                    console.log("📅 Chat-Booking-Button geklickt");
                                    window.forceLaunchBooking();
                                });
                                
                                node.appendChild(bookingButton);
                            }
                        }
                    });
                });
            });
            
            observer.observe(chatHistory, { childList: true, subtree: true });
            console.log("👁️ Chat-Observer für Booking aktiviert");
        }
    }
    
    // === INITIALISIERUNG ===
    function initializeChatBooking() {
        console.log("🚀 Initialisiere Chat-Booking-Integration...");
        
        // Starte Chat-Überwachung
        interceptChatBookingRequests();
        
        // Retry-Mechanismus für Chat-Überwachung
        setTimeout(interceptChatBookingRequests, 1000);
        setTimeout(interceptChatBookingRequests, 3000);
        
        // Test-Button für Debugging
        if (window.location.search.includes('debug=true')) {
            const testButton = document.createElement('button');
            testButton.textContent = '🔧 Test Booking';
            testButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: #28a745; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;';
            testButton.addEventListener('click', window.forceLaunchBooking);
            document.body.appendChild(testButton);
        }
        
        console.log("✅ Chat-Booking-Integration bereit");
    }
    
    // Starte Initialisierung
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatBooking);
    } else {
        initializeChatBooking();
    }
    
    // Zusätzliche Initialisierung nach Modal-Laden
    setTimeout(initializeChatBooking, 1000);
    setTimeout(initializeChatBooking, 3000);
    
})();
