export function initAIForm() {
    const aiForm = document.getElementById('ai-form');
    if (!aiForm) return;

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const questionInput = document.getElementById('ai-question');
        const statusElement = document.getElementById('ai-status');
        const question = questionInput.value.trim();

        if (!question) return;

        statusElement.textContent = 'Evita denkt nach...';

        try {
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question }),
            });

            if (!response.ok) {
                throw new Error(`API-Fehler: ${response.status}`);
            }

            const data = await response.json();
            statusElement.textContent = data.answer || 'Ich habe momentan keine Antwort darauf.';

        } catch (error) {
            console.error('Fehler bei der Kommunikation mit der KI:', error);
            statusElement.textContent = 'Ups, da ist ein Kabel locker. Bitte später erneut versuchen.';
        }

        questionInput.value = ''; // Clear input after submission
    });
}
