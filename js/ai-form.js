// js/ai-form.js - KORRIGIERTE VERSION ohne Modal-Konflikte
import { showAIResponse, showLoadingState, hideLoadingState } from './modals.js';

const aiForm = document.getElementById('ai-form');
const aiQuestionInput = document.getElementById('ai-question');

// Hauptformular auf der Startseite
if (aiForm && aiQuestionInput) {
    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = aiQuestionInput.value.trim();
        if (!userInput) return;

        showLoadingState();
        aiQuestionInput.value = '';

        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput, source: 'evita' })
            });
            
            const data = await response.json();

            if (data.action === 'start_booking') {
                // Buchungsprozess
                showAIResponse(data.message, false);
                const availabilityRes = await fetch('/api/get-availability');
                const availabilityData = await availabilityRes.json();
                
                let html = `<p>Hier sind die nächsten freien Termine. Bitte wählen Sie einen passenden aus:</p><div class="booking-options">`;
                availabilityData.slots.forEach(slot => {
                    html += `<button class="slot-button" onclick="window.selectSlot('${slot}')">${slot}</button>`;
                });
                html += `</div>`;
                showAIResponse(html, true);
            } else {
                // Normale Antwort
                showAIResponse(data.answer || data.message, false);
            }

        } catch (error) {
            console.error('Fehler bei AI-Anfrage:', error);
            showAIResponse('Oh, da ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.', false);
        } finally {
            hideLoadingState();
        }
    });
}

// Globale Funktion für Terminauswahl
window.selectSlot = function(slot) {
    if (aiQuestionInput) {
        aiQuestionInput.value = slot;
        aiQuestionInput.focus();
    }
    const modal = document.getElementById('ai-response-modal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        document.body.style.overflow = '';
    }
}
