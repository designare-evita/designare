// js/ai-form.js

// Importiert die Funktionen zur Steuerung des Typewriters
import { startPlaceholderAnimation, stopPlaceholderAnimation } from './typewriter.js';

export function initAiForm() {
    const aiForm = document.getElementById('ai-form');
    if (!aiForm) return;

    const aiQuestionInput = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const submitButton = aiForm.querySelector('button');

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = aiQuestionInput.value.trim();
        if (!question) return;

        // Typewriter-Animation stoppen
        stopPlaceholderAnimation();
        
        aiStatus.innerText = "Einen Moment, Evita gleicht gerade ihre Bits und Bytes ab...";
        aiStatus.classList.add('thinking');
        aiQuestionInput.disabled = true;
        submitButton.disabled = true;

        try {
            const fetchPromise = fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question })
            });
            const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));
            const [response] = await Promise.all([fetchPromise, delayPromise]);

            if (!response.ok) { 
                throw new Error('Netzwerk-Antwort war nicht OK.'); 
            }

            const data = await response.json();
            aiStatus.innerText = data.answer;

        } catch (error) {
            console.error("Fehler bei der KI-Anfrage:", error);
            aiStatus.innerText = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        } finally {
            aiQuestionInput.value = '';
            aiQuestionInput.disabled = false;
            submitButton.disabled = false;
            aiQuestionInput.placeholder = "Haben Sie eine weitere Frage?";
            aiStatus.classList.remove('thinking');
            
            // Typewriter-Animation wieder sauber starten
            startPlaceholderAnimation(); 
        }
    });
}
