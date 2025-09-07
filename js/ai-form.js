// js/ai-form.js (ANGEPASST FÜR NEUES BOOKING-MODAL)

import { initBookingModal, showStep } from './booking.js';

const aiForm = document.getElementById('ai-form');
const aiQuestion = document.getElementById('ai-question');
const aiStatus = document.getElementById('ai-status');
const modalOverlay = document.getElementById('ai-response-modal');
const responseArea = document.getElementById('ai-response-content-area');
const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

// Funktion, die das neue Buchungs-Modal lädt und öffnet
const launchBookingModal = async () => {
    console.log("Starte Buchungs-Workflow...");
    const modalContainer = document.getElementById('modal-container');
    
    // Prüfen, ob das Modal-HTML schon geladen ist
    if (!document.getElementById('booking-modal')) {
        try {
            const response = await fetch('/booking-modal.html');
            if (!response.ok) throw new Error('booking-modal.html konnte nicht geladen werden.');
            const html = await response.text();
            modalContainer.insertAdjacentHTML('beforeend', html);
            console.log("Booking-Modal-HTML erfolgreich ins DOM eingefügt.");
            // WICHTIG: Event-Listener für das neue Modal initialisieren
            initBookingModal();
        } catch (error) {
            console.error("Fehler beim Laden des Booking-Modals:", error);
            responseArea.innerHTML = "<p>Entschuldigung, beim Öffnen des Buchungsfensters ist ein Fehler aufgetreten.</p>";
            modalOverlay.style.display = 'flex';
            return; // Abbrechen, wenn das Modal nicht geladen werden kann
        }
    }

    // Stelle sicher, dass das normale AI-Antwort-Modal geschlossen ist
    modalOverlay.style.display = 'none';

    // Zeige das Buchungs-Modal an und setze es auf den ersten Schritt zurück
    const bookingModal = document.getElementById('booking-modal');
    bookingModal.style.display = 'flex';
    showStep('step-day-selection');
};

const handleFormSubmit = async (event) => {
    event.preventDefault();
    const question = aiQuestion.value.trim();
    if (!question) return;

    aiStatus.textContent = 'Evita denkt nach...';
    aiStatus.style.display = 'block';
    
    // Deaktiviere das Formular während der Anfrage
    aiQuestion.disabled = true;
    aiForm.querySelector('button').disabled = true;

    try {
        const response = await fetch('/api/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: question }),
        });

        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        responseArea.innerHTML = ''; // Leere den Inhaltsbereich für die neue Antwort
        modalOverlay.style.display = 'flex';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            accumulatedContent += decoder.decode(value, { stream: true });
            let processedContent = accumulatedContent.replace(/\\n/g, '<br>');

            // ** HIER IST DIE MAGIE **
            // Prüfen, ob der Buchungs-Trigger im Stream enthalten ist
            if (processedContent.includes('[BUCHUNG STARTEN]')) {
                // Trigger aus dem sichtbaren Text entfernen
                processedContent = processedContent.replace('[BUCHUNG STARTEN]', '');
                responseArea.innerHTML = processedContent; // Zeige den Text bis zum Trigger an
                
                // Beende das Streamen und starte den Buchungsprozess
                launchBookingModal();
                return; // Wichtig: Bricht die while-Schleife ab
            }

            responseArea.innerHTML = processedContent;
        }

    } catch (error) {
        console.error('Fehler bei der Anfrage an Evita:', error);
        aiStatus.textContent = 'Ein Fehler ist aufgetreten.';
        responseArea.innerHTML = `<p>Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.</p>`;
        modalOverlay.style.display = 'flex';
    } finally {
        // Formular wieder aktivieren und Status zurücksetzen
        aiQuestion.value = '';
        aiStatus.style.display = 'none';
        aiQuestion.disabled = false;
        aiForm.querySelector('button').disabled = false;
    }
};

aiForm.addEventListener('submit', handleFormSubmit);

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });
});
