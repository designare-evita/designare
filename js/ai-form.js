// js/ai-form.js (DEBUG-VERSION)
import { showAIResponse, showLoadingState, hideLoadingState } from './modals.js';

console.log('✅ DEBUG: ai-form.js wurde geladen und wird jetzt ausgeführt.');

const aiForm = document.getElementById('ai-form');
const aiQuestionInput = document.getElementById('ai-question');

let conversationState = {
  step: 'idle',
  data: {}
};

function displayMessage(text) {
  showAIResponse(text, false);
}

function displayBookingOptions(slots) {
  const contentArea = document.getElementById('ai-response-content-area');
  if (!slots || slots.length === 0) {
    showAIResponse("Momentan sind leider keine freien Termine verfügbar. Bitte versuchen Sie es später erneut.", false);
    return;
  }
  let html = `<p>Hier sind die nächsten freien Termine. Bitte wählen Sie einen passenden aus:</p><div class="booking-options">`;
  slots.forEach(slot => {
    html += `<button class="slot-button" onclick="window.selectSlot('${slot}')">${slot}</button>`;
  });
  html += `</div>`;
  showAIResponse(html, true);
}

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

if (aiForm && aiQuestionInput) {
  console.log('✅ DEBUG: Formular (#ai-form) wurde gefunden. Event Listener wird jetzt hinzugefügt.');
  
  aiForm.addEventListener('submit', async (e) => {
    console.log('✅ DEBUG: Formular wurde abgesendet! Die submit-Funktion startet.');
    e.preventDefault();
    const userInput = aiQuestionInput.value.trim();
    if (!userInput) return;

    console.log('✅ DEBUG: Benutzereingabe:', userInput);
    showLoadingState();
    aiQuestionInput.value = '';

    try {
      console.log('✅ DEBUG: Aktueller Gesprächsschritt:', conversationState.step);
      switch (conversationState.step) {
        
        case 'idle':
          console.log('✅ DEBUG: Rufe /api/ask-gemini auf...');
          const response = await fetch('/api/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userInput, source: 'evita' })
          });
          const data = await response.json();
          console.log('✅ DEBUG: Antwort von ask-gemini erhalten:', data);

          if (data.action === 'start_booking') {
            conversationState.step = 'awaiting_slot';
            displayMessage(data.message);
            const availabilityRes = await fetch('/api/get-availability');
            const availabilityData = await availabilityRes.json();
            displayBookingOptions(availabilityData.slots);
          } else {
            displayMessage(data.answer);
          }
          break;

        // ... (die anderen cases bleiben gleich) ...
        case 'awaiting_slot':
          conversationState.data.slot = userInput;
          conversationState.step = 'awaiting_name';
          displayMessage(`Super, der Termin ist für Sie vorgemerkt. Wie lautet Ihr voller Name?`);
          break;

        case 'awaiting_name':
          conversationState.data.name = userInput;
          conversationState.step = 'awaiting_email';
          displayMessage(`Danke, ${userInput}. Und wie lautet Ihre E-Mail-Adresse für die Bestätigung?`);
          break;
        
        case 'awaiting_email':
          conversationState.data.email = userInput;
          const bookingResponse = await fetch('/api/create-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conversationState.data)
          });
          const bookingData = await bookingResponse.json();
          displayMessage(bookingData.message);
          conversationState.step = 'idle';
          conversationState.data = {};
          break;
      }
    } catch (error) {
      console.error('❌ DEBUG: Ein Fehler ist im Dialog-Manager aufgetreten:', error);
      displayMessage('Oh, da ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.');
      conversationState.step = 'idle';
      conversationState.data = {};
    } finally {
      hideLoadingState();
    }
  });

} else {
    console.warn('⚠️ DEBUG: Formular (#ai-form) wurde auf dieser Seite NICHT gefunden. Das ist auf Unterseiten normal.');
}
