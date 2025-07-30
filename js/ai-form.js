// js/ai-form.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente abrufen
    const aiForm = document.getElementById('ai-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.querySelector('.chat-container');
    const loader = document.querySelector('.loader');

    // "Memory" der KI: Speichert den Gesprächsverlauf
    let history = [];
    const MAX_HISTORY_LENGTH = 10; // Max. 10 Interaktionen (Frage + Antwort)

    // Event-Listener für das Absenden des Formulars
    aiForm.addEventListener('submit', handleFormSubmit);

    /**
     * Verarbeitet das Absenden des Formulars.
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        displayMessage(userMessage, 'user');
        setLoading(true);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, prompt: userMessage }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server-Fehler: ${response.status}`);
            }

            const data = await response.json();
            const aiMessage = data.text;

            // KRITISCH: Verlauf SOFORT aktualisieren, bevor der Typewriter-Effekt startet
            // So wird sichergestellt, dass bei schnellen aufeinanderfolgenden Nachrichten
            // der Konversationsverlauf korrekt und vollständig ist
            updateHistory(userMessage, aiMessage);

            // Typewriter-Effekt für die KI-Antwort starten
            await displayMessage(aiMessage, 'ai');

        } catch (error) {
            console.error('Fehler beim Abrufen der KI-Antwort:', error);
            displayMessage(`Entschuldigung, ein Fehler ist aufgetreten: ${error.message}`, 'ai-error');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Zeigt eine Nachricht im Chat an. Implementiert einen Typewriter-Effekt für die KI.
     * Gibt ein Promise zurück, das erfüllt ist, wenn der Typewriter fertig ist.
     * @param {string} message - Die anzuzeigende Nachricht.
     * @param {string} sender - 'user', 'ai', oder 'ai-error'.
     * @returns {Promise<void>}
     */
    function displayMessage(message, sender) {
        return new Promise(resolve => {
            const messageWrapper = document.createElement('div');
            messageWrapper.classList.add('chat-message', `${sender}-message`);

            const p = document.createElement('p');
            messageWrapper.appendChild(p);
            chatContainer.appendChild(messageWrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Wenn der Absender der User ist oder ein Fehler auftritt, sofort anzeigen
            if (sender !== 'ai') {
                p.textContent = message;
                resolve();
                return;
            }

            // --- TYPEWRITER EFFEKT LOGIK ---
            let i = 0;
            const speed = 30; // Geschwindigkeit in Millisekunden

            function typeWriter() {
                if (i < message.length) {
                    p.textContent += message.charAt(i);
                    i++;
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    setTimeout(typeWriter, speed);
                } else {
                    resolve(); // Promise auflösen, wenn fertig
                }
            }
            typeWriter();
        });
    }
    
    /**
     * Aktualisiert den Gesprächsverlauf und kürzt ihn bei Bedarf.
     */
    function updateHistory(userMessage, aiMessage) {
        history.push({ role: 'user', parts: [{ text: userMessage }] });
        history.push({ role: 'model', parts: [{ text: aiMessage }] });

        while (history.length > MAX_HISTORY_LENGTH * 2) {
            history.shift();
            history.shift();
        }
    }

    /**
     * Steuert den Ladezustand der Benutzeroberfläche.
     */
    function setLoading(isLoading) {
        const submitButton = aiForm.querySelector('button');
        loader.style.display = isLoading ? 'block' : 'none';
        messageInput.disabled = isLoading;
        submitButton.disabled = isLoading;

        if (!isLoading) {
            messageInput.value = '';
            messageInput.focus();
        }
    }
});
