// js/ai-form.js

import { openLightbox } from './modals.js';

/**
 * Fügt eine neue Nachricht zum Chat-Verlauf hinzu.
 * @param {string} text - Der Text der Nachricht.
 * @param {string} sender - 'user' oder 'ai'.
 */
function appendMessage(text, sender) {
    const aiChatHistory = document.getElementById('ai-chat-history');
    if (!aiChatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender);
    // Wir prüfen, ob der Text 'undefined' ist und geben eine bessere Meldung aus.
    messageDiv.innerHTML = text === undefined ? "<em>(Leere Antwort erhalten)</em>" : text;
    aiChatHistory.appendChild(messageDiv);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
}

/**
 * Verarbeitet die Anfrage des Benutzers an die KI.
 * @param {string} question - Die Frage des Benutzers.
 */
async function handleAiQuestion(question) {
    const aiResponseModal = document.getElementById('ai-response-modal');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiStatus = document.getElementById('ai-status');

    appendMessage(question, 'user');
    
    if(aiStatus) aiStatus.textContent = 'Evita denkt nach...';
    if(aiChatInput) aiChatInput.disabled = true;

    try {
        const response = await fetch('/api/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: question })
        });

        if (!response.ok) {
            throw new Error(`Netzwerkfehler: Server antwortete mit Status ${response.status}`);
        }

        const data = await response.json();
        
        // =============================================================
        // FINALE PRÜFUNG: Wir checken, ob die Antwort korrekt formatiert ist.
        // =============================================================
        console.log('Antwort vom Server erhalten:', data); // Dieser Log bleibt zur Sicherheit.

        if (data && data.response) {
            // Alles gut, wir haben eine Antwort.
            appendMessage(data.response, 'ai');
        } else {
            // Das Datenpaket hat nicht das, was wir erwarten.
            appendMessage('Fehler: Die Antwort vom Server hatte ein unerwartetes Format.', 'ai');
            console.error('Unerwartetes Server-Antwortformat. Erhaltenes Objekt:', data);
        }

    } catch (error) {
        console.error('Fehler bei der Anfrage an die KI:', error);
        appendMessage(`Entschuldigung, ein technischer Fehler ist aufgetreten: "${error.message}"`, 'ai');
    } finally {
        if(aiStatus) aiStatus.textContent = '';
        if(aiChatInput) {
            aiChatInput.disabled = false;
            aiChatInput.focus();
        }
        
        if (aiResponseModal && !aiResponseModal.classList.contains('visible')) {
            openLightbox(aiResponseModal);
        }
    }
}

/**
 * Initialisiert die Formulare für die KI-Interaktion.
 */
export function initAiForm() {
    const mainAiForm = document.getElementById('ai-form');
    const mainAiQuestionInput = document.getElementById('ai-question');
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');
    
    if (mainAiForm && mainAiQuestionInput) {
        mainAiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const question = mainAiQuestionInput.value.trim();
            if (!question) return;

            const aiChatHistory = document.getElementById('ai-chat-history');
            if (aiChatHistory) aiChatHistory.innerHTML = '';
            
            handleAiQuestion(question);
            mainAiQuestionInput.value = '';
        });
    }

    if (aiChatForm && aiChatInput) {
        aiChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const question = aiChatInput.value.trim();
            if (!question) return;
            
            handleAiQuestion(question);
            aiChatInput.value = '';
        });
    }
}
