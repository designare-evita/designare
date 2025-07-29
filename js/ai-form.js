// js/ai-form.js
import { startPlaceholderAnimation, stopPlaceholderAnimation } from './typewriter.js';

// NEU: Maximale Anzahl an Konversationen (Frage + Antwort), die gespeichert werden
const MAX_HISTORY_LENGTH = 10;

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
    const aiForm = document.getElementById('ai-form');
    if (!aiForm) return;

    const aiQuestionInput = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const submitButton = aiForm.querySelector('button');
    const aiResponseModal = document.getElementById('ai-response-modal');
    const aiResponseContentArea = document.getElementById('ai-response-content-area');
    const closeAiResponseModalBtnTop = document.getElementById('close-ai-response-modal-top');
    const closeAiResponseModalBtnBottom = document.getElementById('close-ai-response-modal-bottom');

    if (closeAiResponseModalBtnTop) {
        closeAiResponseModalBtnTop.addEventListener('click', () => closeLightbox(aiResponseModal));
    }
    if (closeAiResponseModalBtnBottom) {
        closeAiResponseModalBtnBottom.addEventListener('click', () => closeLightbox(aiResponseModal));
    }
    if (aiResponseModal) {
        aiResponseModal.addEventListener('click', (e) => {
            if (e.target === aiResponseModal) {
                closeLightbox(aiResponseModal);
            }
        });
    }

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = aiQuestionInput.value.trim();
        if (!question) return;

        stopPlaceholderAnimation();
        aiStatus.innerText = "Einen Moment, Evita gleicht gerade ihre Bits und Bytes ab...";
        aiStatus.classList.add('thinking');
        aiQuestionInput.disabled = true;
        submitButton.disabled = true;

        try {
            // NEU: Verlauf aus dem localStorage laden
            const history = JSON.parse(localStorage.getItem('chatHistory')) || [];

            // NEU: API-Anfrage sendet jetzt Frage UND Verlauf
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question, history: history })
            });

            if (!response.ok) {
                throw new Error('Netzwerk-Antwort war nicht OK.');
            }

            const data = await response.json();
            const answer = data.answer;

            // NEU: Neuen Austausch zum Verlauf hinzufügen
            history.push({ question: question, answer: answer });

            // NEU: Verlauf kürzen, falls er zu lang ist
            while (history.length > MAX_HISTORY_LENGTH) {
                history.shift(); // Entfernt das älteste Element
            }

            // NEU: Aktualisierten Verlauf im localStorage speichern
            localStorage.setItem('chatHistory', JSON.stringify(history));

            // Antwort in die Lightbox füllen und anzeigen
            aiStatus.innerText = "";
            if (aiResponseContentArea) {
                aiResponseContentArea.innerText = answer;
            }
            openLightbox(aiResponseModal);

        } catch (error) {
            console.error("Fehler bei der KI-Anfrage:", error);
            aiStatus.innerText = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        } finally {
            aiQuestionInput.value = '';
            aiQuestionInput.disabled = false;
            submitButton.disabled = false;
            aiQuestionInput.placeholder = "Haben Sie eine weitere Frage?";
            aiStatus.classList.remove('thinking');

            setTimeout(() => {
                if (document.activeElement !== aiQuestionInput) {
                    startPlaceholderAnimation();
                }
            }, 100);
        }
    });
}
