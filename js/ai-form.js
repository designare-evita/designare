// js/ai-form.js (UMGEBAUT MIT INIT-FUNKTION)

import { initBookingModal, showStep } from './booking.js';

// Die Funktion wird exportiert, damit main.js sie aufrufen kann.
export const initAiForm = () => {
    // Alle Variablen werden erst hier deklariert, wenn die Funktion läuft.
    const aiForm = document.getElementById('ai-form');
    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-response-content-area');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    // Sicherheitsprüfung: Bricht ab, wenn das Formular nicht im DOM ist.
    if (!aiForm) {
        console.warn("AI-Formular nicht gefunden. Initialisierung übersprungen.");
        return;
    }
    console.log("AI-Formular gefunden, initialisiere Event-Listener.");


    const launchBookingModal = async () => {
        // ... (der Inhalt dieser Funktion bleibt unverändert)
        console.log("Starte Buchungs-Workflow...");
        const modalContainer = document.getElementById('modal-container');
        if (!document.getElementById('booking-modal')) {
            try {
                const response = await fetch('/booking-modal.html');
                if (!response.ok) throw new Error('booking-modal.html konnte nicht geladen werden.');
                const html = await response.text();
                modalContainer.insertAdjacentHTML('beforeend', html);
                console.log("Booking-Modal-HTML erfolgreich ins DOM eingefügt.");
                initBookingModal();
            } catch (error) {
                console.error("Fehler beim Laden des Booking-Modals:", error);
                responseArea.innerHTML = "<p>Entschuldigung, beim Öffnen des Buchungsfensters ist ein Fehler aufgetreten.</p>";
                modalOverlay.style.display = 'flex';
                return;
            }
        }
        modalOverlay.style.display = 'none';
        const bookingModal = document.getElementById('booking-modal');
        bookingModal.style.display = 'flex';
        showStep('step-day-selection');
    };

    const handleFormSubmit = async (event) => {
        // ... (der Inhalt dieser Funktion bleibt unverändert)
        event.preventDefault();
        const question = aiQuestion.value.trim();
        if (!question) return;

        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';
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

            responseArea.innerHTML = '';
            modalOverlay.style.display = 'flex';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                accumulatedContent += decoder.decode(value, { stream: true });
                let processedContent = accumulatedContent.replace(/\\n/g, '<br>');

                if (processedContent.includes('[BUCHUNG STARTEN]')) {
                    processedContent = processedContent.replace('[BUCHUNG STARTEN]', '');
                    responseArea.innerHTML = processedContent;
                    launchBookingModal();
                    return;
                }

                responseArea.innerHTML = processedContent;
            }

        } catch (error) {
            console.error('Fehler bei der Anfrage an Evita:', error);
            aiStatus.textContent = 'Ein Fehler ist aufgetreten.';
            responseArea.innerHTML = `<p>Entschuldigung, ich habe gerade technische Schwierigkeiten. Bitte versuche es später noch einmal.</p>`;
            modalOverlay.style.display = 'flex';
        } finally {
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
            aiQuestion.disabled = false;
            aiForm.querySelector('button').disabled = false;
        }
    };
    
    // Die Event Listener werden erst hier, innerhalb der Funktion, hinzugefügt.
    aiForm.addEventListener('submit', handleFormSubmit);

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    });
};
