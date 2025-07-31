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
    
    // Elemente für die AI-Antwort-Lightbox
    const aiResponseModal = document.getElementById('ai-response-modal');
    const aiResponseContentArea = document.getElementById('ai-response-content-area');
    
    // KORRIGIERT: Wir holen uns jetzt BEIDE Schließen-Buttons mit den korrekten IDs
    const closeAiResponseModalBtnTop = document.getElementById('close-ai-response-modal-top');
    const closeAiResponseModalBtnBottom = document.getElementById('close-ai-response-modal-bottom');


    // KORRIGIERT: Event-Listener für BEIDE Buttons und den Hintergrund-Klick hinzufügen
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
// Bestehenden Code zur Anzeige der AI-Antwort anpassen
function displayAIResponse(response) {
    const modal = document.getElementById('ai-response-modal');
    const responseContent = document.getElementById('ai-response-content');
    const startChatButton = document.getElementById('start-chat-button');
    const closeModalButton = document.getElementById('close-modal-button');
    const initialResponseContainer = document.getElementById('initial-ai-response');
    const chatContainer = document.getElementById('ai-chat-container');
    const chatHistory = document.getElementById('chat-history');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    // Ursprüngliche Antwort anzeigen
    responseContent.innerHTML = response;
    modal.style.display = 'block';
    initialResponseContainer.style.display = 'block';
    chatContainer.style.display = 'none';
    closeModalButton.style.display = 'none';


    // Event Listener für "Frag Evita"-Button
    startChatButton.onclick = function() {
        // Verstecke die ursprüngliche Antwort und zeige den Chat-Container
        initialResponseContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        closeModalButton.style.display = 'block';

        // Füge die erste AI-Antwort zum Chatverlauf hinzu
        chatHistory.innerHTML = `<div class="ai-message">${response}</div>`;
    };

    // Event Listener für das Senden im Chat
    chatForm.onsubmit = async function(event) {
        event.preventDefault();
        const userMessage = chatInput.value;
        if (!userMessage.trim()) return;

        // Zeige die Nachricht des Nutzers im Chat an
        chatHistory.innerHTML += `<div class="user-message">${userMessage}</div>`;
        chatInput.value = '';

        // Hier rufst du deine API erneut auf, um eine Antwort zu bekommen
        // Annahme: Du hast eine Funktion `askGemini` die eine Frage entgegennimmt
        try {
            const aiResponse = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMessage })
            }).then(res => res.json());

            // Zeige die AI-Antwort im Chat an
            chatHistory.innerHTML += `<div class="ai-message">${aiResponse.text}</div>`;
        } catch (error) {
            chatHistory.innerHTML += `<div class="error-message">Entschuldigung, es ist ein Fehler aufgetreten.</div>`;
            console.error('Error fetching AI response:', error);
        }
    };


    // Schließen des Modals
    closeModalButton.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}
