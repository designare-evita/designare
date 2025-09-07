// js/ai-form.js (FINALE VERSION)
import { showAIResponse, showLoadingState, hideLoadingState } from './modals.js';

const aiForm = document.getElementById('ai-form');
const aiQuestionInput = document.getElementById('ai-question');

// Der Gesprächs-Manager bleibt gleich
let conversationState = {
  step: 'idle',
  data: {}
};

// Diese Funktion wird jetzt die Hauptlogik enthalten
async function processUserInput(userInput) {
  try {
    switch (conversationState.step) {
      case 'idle':
        const response = await fetch('/api/ask-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userInput, source: 'evita' })
        });
        const data = await response.json();

        if (data.action === 'start_booking') {
          conversationState.step = 'awaiting_slot';
          showAIResponse(data.message, false); // Modal anzeigen
          const availabilityRes = await fetch('/api/get-availability');
          const availabilityData = await availabilityRes.json();
          
          // HTML für die Buttons vorbereiten
          let html = `<p>Hier sind die nächsten freien Termine. Bitte wählen Sie einen passenden aus:</p><div class="booking-options">`;
          availabilityData.slots.forEach(slot => {
            html += `<button class="slot-button" onclick="window.selectSlot('${slot}')">${slot}</button>`;
          });
          html += `</div>`;
          showAIResponse(html, true); // Modal mit Buttons aktualisieren
        } else {
          showAIResponse(data.answer, false); // Modal mit normaler Antwort anzeigen
        }
        break;

      case 'awaiting_slot':
        conversationState.data.slot = userInput;
        conversationState.step = 'awaiting_name';
        showAIResponse(`Super, der Termin ist für Sie vorgemerkt. Wie lautet Ihr voller Name?`, false);
        break;

      case 'awaiting_name':
        conversationState.data.name = userInput;
        conversationState.step = 'awaiting_email';
        showAIResponse(`Danke, ${userInput}. Und wie lautet Ihre E-Mail-Adresse für die Bestätigung?`, false);
        break;
      
      case 'awaiting_email':
        conversationState.data.email = userInput;
        const bookingResponse = await fetch('/api/create-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationState.data)
        });
        const bookingData = await bookingResponse.json();
        showAIResponse(bookingData.message, false);
        conversationState = { step: 'idle', data: {} }; // Reset
        break;
    }
  } catch (error) {
    console.error('Fehler im Dialog-Manager:', error);
    showAIResponse('Oh, da ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.', false);
    conversationState = { step: 'idle', data: {} }; // Reset bei Fehler
  }
}

// Diese Funktion muss global sein
window.selectSlot = function(slot) {
  if (aiQuestionInput) {
    aiQuestionInput.value = slot;
    aiQuestionInput.focus();
  }
  const modal = document.getElementById('ai-response-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}

// Event Listener nur hinzufügen, wenn das Formular existiert
if (aiForm && aiQuestionInput) {
  aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = aiQuestionInput.value.trim();
    if (!userInput) return;

    showLoadingState();
    aiQuestionInput.value = '';

    // Ruft die neue Hauptfunktion auf und wartet, bis sie fertig ist
    await processUserInput(userInput);
    
    // finally wird hier nicht mehr benötigt, da hideLoadingState
    // erst nach dem Anzeigen der Antwort aufgerufen werden soll
    hideLoadingState();
  });
}
