// js/ai-form.js

import { startPlaceholderAnimation, stopPlaceholderAnimation } from './typewriter.js';

const openLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
};

const closeLightbox = (lightboxElement) => {
    if (lightboxElement) {
        lightboxElement.classList.remove('visible');
        document.body.style.overflow = '';
    }
};

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
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Schickt die Frage als "prompt", ohne eine "source" anzugeben
                body: JSON.stringify({ prompt: question })
            });

            if (!response.ok) {
                throw new Error('Netzwerk-Antwort war nicht OK.');
            }

            const data = await response.json();
            
            aiStatus.innerText = "";
            if (aiResponseContentArea) {
                aiResponseContentArea.innerText = data.answer;
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
