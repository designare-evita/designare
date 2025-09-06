// js/ai-form.js

// Globale Referenzen auf die Modal-Elemente
const aiResponseModal = document.getElementById('ai-response-modal');
const aiChatHistory = document.getElementById('ai-chat-history');
const aiChatForm = document.getElementById('ai-chat-form');
const aiChatInput = document.getElementById('ai-chat-input');
const aiStatus = document.getElementById('ai-status');

// Funktion zum Öffnen des Modals (wird von modals.js benötigt)
import { openLightbox } from './modals.js';

/**
 * Fügt eine neue Nachricht zum Chat-Verlauf hinzu.
 * @param {string} text - Der Text der Nachricht.
 * @param {string} sender - 'user' oder 'ai'.
 */
function appendMessage(text, sender) {
    if (!aiChatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender);
    messageDiv.innerHTML = text; // innerHTML, um Markdown-Formatierung zu erlauben
    aiChatHistory.appendChild(messageDiv);

    // Automatisch nach unten scrollen
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
}

/**
 * Verarbeitet die Einreichung einer Frage (sowohl die erste als auch Folgefragen).
 * @param {string} question - Die Frage des Benutzers.
 */
async function handleAiQuestion(question) {
    // Zeige die Frage des Benutzers im Chat an
    appendMessage(question, 'user');
    
    // Status-Anzeige (z.B. "Evita denkt nach...")
    aiStatus.textContent = 'Evita denkt nach...';
    if (aiChatInput) aiChatInput.disabled = true;

    try {
        const response = await fetch('/api/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: question })
        });

        if (!response.ok) {
            throw new Error(`Netzwerkfehler: ${response.statusText}`);
        }

        const data = await response.json();
        // Füge Evitas Antwort dem Chat hinzu
        appendMessage(data.response, 'ai');

    } catch (error) {
        console.error('Fehler bei der Anfrage an die KI:', error);
        appendMessage('Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es später noch einmal.', 'ai');
    } finally {
        // Status zurücksetzen und Eingabefeld wieder aktivieren
        aiStatus.textContent = '';
        if (aiChatInput) aiChatInput.disabled = false;
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

    // Handler für das Hauptformular auf der Startseite
    if (mainAiForm) {
        mainAiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const question = mainAiQuestionInput.value;
            if (!question) return;

            // Chat-Verlauf für neue Konversation leeren
            if(aiChatHistory) aiChatHistory.innerHTML = ''; 
            
            handleAiQuestion(question);
            mainAiQuestionInput.value = ''; // Eingabefeld auf der Startseite leeren
        });
    }

    // Handler für das Chat-Formular im Modal
    if (aiChatForm) {
        aiChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const question = aiChatInput.value;
            if (!question) return;
            
            handleAiQuestion(question);
            aiChatInput.value = ''; // Chat-Eingabefeld leeren
        });
    }
}
