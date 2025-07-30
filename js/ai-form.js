document.addEventListener('DOMContentLoaded', () => {
    // Elemente aus dem DOM abrufen
    const aiForm = document.getElementById('ai-form');
    const messageInput = document.getElementById('message-input');
    const chatContainer = document.querySelector('.chat-container');
    const loader = document.querySelector('.loader');

    // "Memory" der KI: Speichert den bisherigen Gesprächsverlauf
    let history = [];

    // Obergrenze für den Verlauf, um das Token-Limit nicht zu überschreiten
    const MAX_HISTORY_LENGTH = 10; // Speichert die letzten 10 Interaktionen

    // Event-Listener für das Absenden des Formulars
    aiForm.addEventListener('submit', handleFormSubmit);

    /**
     * Verarbeitet das Absenden des Formulars, sendet die Daten an die KI
     * und zeigt die Antworten im Chat-Fenster an.
     * @param {Event} e - Das Submit-Event des Formulars.
     */
    async function handleFormSubmit(e) {
        e.preventDefault(); // Verhindert das Neuladen der Seite

        const userMessage = messageInput.value.trim();
        if (!userMessage) return; // Nichts tun, wenn die Eingabe leer ist

        // Nachricht des Benutzers im Chat anzeigen
        displayMessage(userMessage, 'user');

        // Zustand während des Ladens setzen
        setLoading(true);

        try {
            // ANFRAGE AN DIE SICHERE SERVERLESS FUNCTION
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Sende den bisherigen Verlauf und die neue Nachricht
                body: JSON.stringify({
                    history: history,
                    prompt: userMessage
                }),
            });

            if (!response.ok) {
                // Fängt HTTP-Fehler wie 500 oder 405 ab
                throw new Error(`Server-Fehler: ${response.statusText}`);
            }

            const data = await response.json();
            const aiMessage = data.text;

            // Antwort der KI im Chat anzeigen
            displayMessage(aiMessage, 'ai');

            // Gesprächsverlauf aktualisieren
            updateHistory(userMessage, aiMessage);

        } catch (error) {
            console.error('Fehler beim Abrufen der KI-Antwort:', error);
            displayMessage('Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.', 'ai-error');
        } finally {
            // Ladezustand in jedem Fall beenden
            setLoading(false);
        }
    }

    /**
     * Zeigt eine Nachricht im Chat-Fenster an.
     * @param {string} message - Die anzuzeigende Nachricht.
     * @param {string} sender - Der Absender ('user', 'ai', oder 'ai-error').
     */
    function displayMessage(message, sender) {
        // Erstellt die Nachricht als HTML-String
        const messageHTML = `
            <div class="chat-message ${sender}-message">
                <p>${message}</p>
            </div>
        `;
        // Fügt die Nachricht am Ende des Chat-Containers ein
        chatContainer.insertAdjacentHTML('beforeend', messageHTML);

        // Automatisch nach unten scrollen, um die neueste Nachricht zu sehen
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Aktualisiert den Gesprächsverlauf und kürzt ihn bei Bedarf.
     * @param {string} userMessage - Die Nachricht des Benutzers.
     * @param {string} aiMessage - Die Antwort der KI.
     */
    function updateHistory(userMessage, aiMessage) {
        history.push({ role: 'user', parts: [{ text: userMessage }] });
        history.push({ role: 'model', parts: [{ text: aiMessage }] });

        // Verlauf kürzen, falls er die maximale Länge überschreitet
        while (history.length > MAX_HISTORY_LENGTH * 2) { // *2, da jede Interaktion aus 2 Teilen besteht
            history.shift(); // Entfernt das älteste Element (Frage)
            history.shift(); // Entfernt das zweitälteste Element (Antwort)
        }
    }

    /**
     * Steuert den Ladezustand der Benutzeroberfläche.
     * @param {boolean} isLoading - True, wenn geladen wird, sonst false.
     */
    function setLoading(isLoading) {
        const submitButton = aiForm.querySelector('button');

        if (isLoading) {
            loader.style.display = 'block'; // Ladeanzeige einblenden
            messageInput.disabled = true;  // Eingabefeld deaktivieren
            submitButton.disabled = true;  // Button deaktivieren
        } else {
            loader.style.display = 'none';   // Ladeanzeige ausblenden
            messageInput.disabled = false; // Eingabefeld aktivieren
            submitButton.disabled = false; // Button aktivieren
            messageInput.value = '';       // Eingabefeld leeren
            messageInput.focus();          // Fokus zurück auf das Eingabefeld
        }
    }
});
