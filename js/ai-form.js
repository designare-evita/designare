// js/ai-form.js

// Wir importieren die Funktion zum Öffnen der Lightbox aus modals.js,
// anstatt sie hier neu zu definieren.
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
    messageDiv.innerHTML = text; // innerHTML, damit z.B. <strong> etc. funktioniert
    aiChatHistory.appendChild(messageDiv);

    // Automatisch zum Ende des Chats scrollen
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

    // Zeige die Frage des Benutzers sofort im Chat an
    appendMessage(question, 'user');
    
    // Visuelles Feedback für den Benutzer
    if(aiStatus) aiStatus.textContent = 'Evita denkt nach...';
    if(aiChatInput) aiChatInput.disabled = true;

    try {
        const response = await fetch('/api/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: question })
        });

        if (!response.ok) {
            throw new Error(`Netzwerkfehler: ${response.status}`);
        }

        const data = await response.json();
        // Füge Evitas Antwort dem Chat hinzu. Wir nutzen "response" statt "answer".
        appendMessage(data.response, 'ai');

    } catch (error) {
        console.error('Fehler bei der Anfrage an die KI:', error);
        appendMessage('Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es später noch einmal.', 'ai');
    } finally {
        // Aufräumen und Eingabefelder wieder bereit machen
        if(aiStatus) aiStatus.textContent = '';
        if(aiChatInput) {
            aiChatInput.disabled = false;
            aiChatInput.focus(); // Setzt den Cursor direkt ins Feld für die nächste Frage
        }
        
        // Öffne das Modal, falls es noch nicht sichtbar ist (wichtig für die erste Frage)
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
    
    // Handler für das Hauptformular auf der Startseite
    if (mainAiForm && mainAiQuestionInput) {
        mainAiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const question = mainAiQuestionInput.value.trim();
            if (!question) return;

            const aiChatHistory = document.getElementById('ai-chat-history');
            if (aiChatHistory) aiChatHistory.innerHTML = ''; // Leert den alten Chat-Verlauf
            
            handleAiQuestion(question);
            mainAiQuestionInput.value = ''; // Leert das Haupt-Eingabefeld
        });
    }

    // Handler für das Chat-Formular im Modal
    if (aiChatForm && aiChatInput) {
        aiChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const question = aiChatInput.value.trim();
            if (!question) return;
            
            handleAiQuestion(question);
            aiChatInput.value = ''; // Leert das Chat-Eingabefeld
        });
    }
}
