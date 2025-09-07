// js/ai-form.js (FINALE DIAGNOSE-VERSION)
console.log("🟢 Modul: ai-form.js wird geladen...");

import { initBookingModal, showStep } from './booking.js';
console.log("✅ Import von booking.js in ai-form.js erfolgreich.");

export const initAiForm = () => {
    console.log("➡️ Funktion: initAiForm() wird ausgeführt.");
    
    const aiForm = document.getElementById('ai-form');
    const aiQuestion = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const modalOverlay = document.getElementById('ai-response-modal');
    const responseArea = document.getElementById('ai-response-content-area');
    const closeButtons = document.querySelectorAll('#close-ai-response-modal-top, #close-ai-response-modal-bottom');

    if (!aiForm) {
        console.warn("🔴 AI-Formular nicht gefunden. Initialisierung übersprungen.");
        return;
    }
    console.log("✅ AI-Formular gefunden, initialisiere Event-Listener.");

    const launchBookingModal = async () => { /* ... bleibt unverändert ... */ };

    const handleFormSubmit = async (event) => {
        console.log("➡️ handleFormSubmit: Formular abgeschickt!");
        event.preventDefault();
        
        const question = aiQuestion.value.trim();
        console.log(`➡️ handleFormSubmit: Frage lautet "${question}"`);
        if (!question) {
            console.log("🔴 handleFormSubmit: Frage ist leer. Abbruch.");
            return;
        }

        console.log("➡️ handleFormSubmit: Setze Status auf 'Evita denkt nach...'");
        aiStatus.textContent = 'Evita denkt nach...';
        aiStatus.style.display = 'block';

        console.log("➡️ handleFormSubmit: Deaktiviere Formular.");
        aiQuestion.disabled = true;
        aiForm.querySelector('button').disabled = true;

        try {
            console.log("➡️ handleFormSubmit: Starte fetch-Anfrage an /api/ask-gemini...");
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: question }),
            });
            console.log("✅ handleFormSubmit: Fetch-Antwort erhalten.");

            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }

            console.log("➡️ handleFormSubmit: Öffne Antwort-Modal.");
            responseArea.innerHTML = '';
            modalOverlay.style.display = 'flex';

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            console.log("➡️ handleFormSubmit: Starte Stream-Verarbeitung...");
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("✅ handleFormSubmit: Stream beendet.");
                    break;
                }
                
                accumulatedContent += decoder.decode(value, { stream: true });
                // (Der Rest der Stream-Logik bleibt gleich)
                let processedContent = accumulatedContent.replace(/\\n/g, '<br>');

                if (processedContent.includes('[BUCHUNG STARTEN]')) {
                    processedContent = processedContent.replace('[BUCHUNG STARTEN]', '');
                    responseArea.innerHTML = processedContent;
                    launchBookingModal();
                    return;
                }
                responseArea.innerHTML = processedContent;
            }

        } catch (error) {
            console.error("❌ handleFormSubmit: Fehler im try-Block:", error);
            aiStatus.textContent = 'Ein Fehler ist aufgetreten.';
            responseArea.innerHTML = `<p>Entschuldigung, ich habe gerade technische Schwierigkeiten.</p>`;
            modalOverlay.style.display = 'flex';
        } finally {
            console.log("➡️ handleFormSubmit: Führe 'finally'-Block aus (Formular reaktivieren).");
            aiQuestion.value = '';
            aiStatus.style.display = 'none';
            aiQuestion.disabled = false;
            aiForm.querySelector('button').disabled = false;
        }
    };
    
    aiForm.addEventListener('submit', handleFormSubmit);

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    });
};
