// js/ai-form.js

import { startPlaceholderAnimation, stopPlaceholderAnimation } from './typewriter.js';

export function initAiForm() {
    // Finde das Formular. Wenn nicht vorhanden, tue nichts.
    const aiForm = document.getElementById('ai-form');
    if (!aiForm) return;

    // Hole alle benötigten Elemente aus dem DOM
    const aiQuestionInput = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const submitButton = aiForm.querySelector('button[type="submit"]');

    // Elemente für das AI-Antwort-Modal
    const modal = document.getElementById('ai-response-modal');
    const responseContent = document.getElementById('ai-response-content');
    const startChatButton = document.getElementById('start-chat-button');
    const closeModalButton = document.getElementById('close-modal-button');
    const initialResponseContainer = document.getElementById('initial-ai-response');
    const chatContainer = document.getElementById('ai-chat-container');
    const chatHistory = document.getElementById('chat-history');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    
    // Sicherstellen, dass alle Modal-Elemente vorhanden sind
    if (!modal || !responseContent || !startChatButton || !closeModalButton || !initialResponseContainer || !chatContainer || !chatHistory || !chatForm || !chatInput) {
        console.error("Ein oder mehrere Modal-Elemente für den KI-Chat wurden nicht gefunden. Bitte HTML prüfen.");
        return;
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
            // API-Anfrage senden
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Netzwerk-Antwort war nicht OK.');
            }

            const data = await response.json();
            const aiAnswer = data.answer; // Die Antwort von der API

            // ---- NEUE LOGIK ZUM ANZEIGEN DES MODALS ----
            
            // 1. Antwort in das Modal füllen
            responseContent.innerHTML = aiAnswer;

            // 2. Modal im initialen Zustand anzeigen
            modal.style.display = 'block';
            initialResponseContainer.style.display = 'block';
            chatContainer.style.display = 'none';
            closeModalButton.style.display = 'none';

            // 3. Event-Listener für "Frag Evita"-Button (Chat starten)
            startChatButton.onclick = function() {
                initialResponseContainer.style.display = 'none';
                chatContainer.style.display = 'block';
                closeModalButton.style.display = 'block';
                // Füge die erste AI-Antwort zum Chatverlauf hinzu
                chatHistory.innerHTML = `<div class="ai-message">${aiAnswer}</div>`;
                chatInput.focus();
            };

        } catch (error) {
            console.error("Fehler bei der KI-Anfrage:", error);
            aiStatus.innerText = `Fehler: ${error.message}`;
        } finally {
            // UI nach der Antwort zurücksetzen
            aiQuestionInput.value = '';
            aiQuestionInput.disabled = false;
            submitButton.disabled = false;
            aiStatus.classList.remove('thinking');
            // Status-Text nur leeren, wenn kein Fehler aufgetreten ist
            if (!aiStatus.innerText.startsWith('Fehler')) {
                aiStatus.innerText = '';
            }
            startPlaceholderAnimation();
        }
    });

    // Event Listener für das Senden im Chat
    chatForm.onsubmit = async function(event) {
        event.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Zeige die Nachricht des Nutzers im Chat an
        chatHistory.innerHTML += `<div class="user-message">${userMessage}</div>`;
        const currentMessageElement = chatHistory.lastElementChild; // Das Element der Benutzernachricht
        chatInput.value = '';
        chatHistory.scrollTop = chatHistory.scrollHeight; // Nach unten scrollen

        // Platzhalter für die KI-Antwort hinzufügen
        const thinkingElement = document.createElement('div');
        thinkingElement.className = 'ai-message thinking';
        thinkingElement.innerText = '...';
        chatHistory.appendChild(thinkingElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            // API erneut aufrufen für die Folgefrage
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Sende den bisherigen Kontext und die neue Frage
                body: JSON.stringify({ question: userMessage, context: chatHistory.innerText })
            });

            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler bei der Chat-Antwort.');
            }

            const data = await response.json();
            
            // Zeige die AI-Antwort im Chat an, indem der Platzhalter ersetzt wird
            thinkingElement.innerText = data.answer;
            thinkingElement.classList.remove('thinking');

        } catch (error) {
            thinkingElement.innerText = `Entschuldigung, ein Fehler ist aufgetreten: ${error.message}`;
            thinkingElement.classList.add('error-message');
            console.error('Error fetching AI chat response:', error);
        } finally {
            chatHistory.scrollTop = chatHistory.scrollHeight;
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
