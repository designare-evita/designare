// js/ai-form.js

import { startPlaceholderAnimation, stopPlaceholderAnimation } from './typewriter.js';

/**
 * Öffnet eine Lightbox/Modal.
 * @param {HTMLElement} lightboxElement - Das DOM-Element der Lightbox.
 */
const openLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Scrollen des Hintergrunds verhindern
    }
};

/**
 * Schließt eine Lightbox/Modal.
 * @param {HTMLElement} lightboxElement - Das DOM-Element der Lightbox.
 */
const closeLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.remove('visible');
        document.body.style.overflow = ''; // Scrollen wieder erlauben
    }
};

/**
 * Initialisiert das KI-Formular und die zugehörige Antwort-Lightbox.
 */
export function initAiForm() {
    // Finde das Formular auf der aktuellen Seite. Wenn nicht vorhanden, tue nichts.
    const aiForm = document.getElementById('ai-form');
    if (!aiForm) return;

    // Hole alle benötigten Elemente aus dem DOM
    const aiQuestionInput = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const submitButton = aiForm.querySelector('button');
    
    // Elemente für die neue AI-Antwort-Lightbox
    const aiResponseModal = document.getElementById('ai-response-modal');
    const aiResponseContentArea = document.getElementById('ai-response-content-area');
    const closeAiResponseModalBtn = document.getElementById('close-ai-response-modal');

    // Event-Listener zum Schließen der Lightbox (Button, Klick daneben)
    if (closeAiResponseModalBtn) {
        closeAiResponseModalBtn.addEventListener('click', () => closeLightbox(aiResponseModal));
    }
    if (aiResponseModal) {
        aiResponseModal.addEventListener('click', (e) => {
            if (e.target === aiResponseModal) {
                closeLightbox(aiResponseModal);
            }
        });
    }

    // Hauptfunktion bei Formular-Absendung
    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = aiQuestionInput.value.trim();
        if (!question) return;

        // UI für den Ladezustand vorbereiten
        stopPlaceholderAnimation();
        aiStatus.innerText = "Einen Moment, Evita gleicht gerade ihre Bits und Bytes ab...";
        aiStatus.classList.add('thinking');
        aiQuestionInput.disabled = true;
        submitButton.disabled = true;

        try {
            // API-Anfrage an den Server senden
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question })
            });

            if (!response.ok) { 
                throw new Error('Netzwerk-Antwort war nicht OK.'); 
            }

            const data = await response.json();
            
            // ANTWORT IN DIE LIGHTBOX FÜLLEN UND ANZEIGEN
            aiStatus.innerText = ""; // Status-Text leeren
            if(aiResponseContentArea) {
                aiResponseContentArea.innerText = data.answer;
            }
            openLightbox(aiResponseModal);

        } catch (error) {
            console.error("Fehler bei der KI-Anfrage:", error);
            aiStatus.innerText = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        } finally {
            // UI nach der Antwort zurücksetzen
            aiQuestionInput.value = '';
            aiQuestionInput.disabled = false;
            submitButton.disabled = false;
            aiQuestionInput.placeholder = "Haben Sie eine weitere Frage?";
            aiStatus.classList.remove('thinking');
            
            setTimeout(() => {
                if(document.activeElement !== aiQuestionInput) {
                    startPlaceholderAnimation();
                }
            }, 100);
        }
    });
}
