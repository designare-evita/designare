// js/ai-form.js
import { showAIResponse, showLoadingState, hideLoadingState } from './modals.js';

// Holt sich die HTML-Elemente. Diese können null sein, wenn man auf einer Unterseite ist.
const aiForm = document.getElementById('ai-form');
const aiQuestionInput = document.getElementById('ai-question');

// =================================================================
// Der "Gesprächs-Manager"
// =================================================================

// Dieses Objekt merkt sich, wo im Gespräch wir uns befinden.
let conversationState = {
  step: 'idle', // idle | awaiting_slot | awaiting_name | awaiting_email
  data: {}      // Hier sammeln wir die Infos (slot, name, email)
};

// --- Hilfsfunktionen für die Anzeige im Modal ---

// Zeigt einfachen Text von Evita an
function displayMessage(text) {
  showAIResponse(text, false); // Nutzt Ihre bestehende Funktion aus modals.js
}

// Zeigt die buchbaren Termine als klickbare Buttons an
function displayBookingOptions(slots) {
  const contentArea = document.getElementById('ai-response-content-area');
  
  // Überprüft, ob Slots gefunden wurden
  if (!slots || slots.length === 0) {
    showAIResponse("Momentan sind leider keine freien Termine verfügbar. Bitte versuchen Sie es später erneut.", false);
    return;
  }
  
  let html = `<p>Hier sind die nächsten freien Termine. Bitte wählen Sie einen passenden aus:</p><div class="booking-options">`;
  slots.forEach(slot => {
    // Jeder Button ruft die selectSlot Funktion auf
    html += `<button class="slot-button" onclick="window.selectSlot('${slot}')">${slot}</button>`;
  });
  html += `</div>`;
  
  showAIResponse(html, true); // Der zweite Parameter 'true' sagt der Funktion, dass es sich um HTML handelt
}

// Diese Funktion wird von den Termin-Buttons aufgerufen und muss global verfügbar sein.
window.selectSlot = function(slot) {
  if (aiQuestionInput) {
    aiQuestionInput.value = slot; // Füllt das Input-Feld
    aiQuestionInput.focus();
  }
  // Schliesst das Modal, damit der Nutzer nur noch "Senden" drücken muss
  const modal = document.getElementById('ai-response-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}

// =================================================================
// FINALE KORREKTUR: Der Code wird nur ausgeführt, wenn das Formular
// auf der aktuellen Seite auch wirklich existiert.
// =================================================================
if (aiForm && aiQuestionInput) {
  
  aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = aiQuestionInput.value.trim();
    if (!userInput) return;

    showLoadingState();
    aiQuestionInput.value = '';

    try {
      // Die Logik entscheidet basierend auf dem aktuellen Gesprächsschritt
      switch (conversationState.step) {
        
        case 'idle':
          // Standard-Anfrage an das "Gehirn"
          const response = await fetch('/api/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userInput, source: 'evita' })
          });
          const data = await response.json();

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
          
          // Gespräch zurücksetzen
          conversationState.step = 'idle';
          conversationState.data = {};
          break;
      }
    } catch (error) {
      console.error('Fehler im Dialog-Manager:', error);
      displayMessage('Oh, da ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.');
      // Bei Fehlern das Gespräch immer zurücksetzen
      conversationState.step = 'idle';
      conversationState.data = {};
    } finally {
      hideLoadingState();
    }
  });
}
