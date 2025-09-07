// js/ai-form.js
import { showAIResponse, showLoadingState, hideLoadingState } from './modals.js';

const aiForm = document.getElementById('ai-form');
const aiQuestionInput = document.getElementById('ai-question');

// =================================================================
// NEU START: Der "Gesprächs-Manager"
// =================================================================

// Dieses Objekt merkt sich, wo im Gespräch wir uns befinden.
let conversationState = {
  step: 'idle', // idle | awaiting_slot | awaiting_name | awaiting_email
  data: {}      // Hier sammeln wir die Infos (slot, name, email)
};

// --- Hilfsfunktionen für die Anzeige im Modal ---

// Zeigt einfachen Text von Evita an
function displayMessage(text) {
  showAIResponse(text); // Nutzt Ihre bestehende Funktion aus modals.js
}

// Zeigt die buchbaren Termine als klickbare Buttons an
function displayBookingOptions(slots) {
  const contentArea = document.getElementById('ai-response-content-area');
  
  let html = `<p>Hier sind die nächsten freien Termine. Bitte wählen Sie einen passenden aus:</p><div class="booking-options">`;
  slots.forEach(slot => {
    // Jeder Button ruft die selectSlot Funktion auf
    html += `<button class="slot-button" onclick="window.selectSlot('${slot}')">${slot}</button>`;
  });
  html += `</div>`;
  
  // Wir verwenden Ihre showAIResponse-Funktion, aber geben ihr direkt HTML-Inhalt
  showAIResponse(html, true); // Der zweite Parameter 'isHTML' muss ggf. in modals.js hinzugefügt werden
}

// Diese Funktion wird von den Termin-Buttons aufgerufen
window.selectSlot = function(slot) {
  aiQuestionInput.value = slot; // Füllt das Input-Feld
  aiQuestionInput.focus();
  // Optional: Schliesst das Modal, damit der Nutzer nur noch "Senden" drücken muss
  const modal = document.getElementById('ai-response-modal');
  if (modal) modal.classList.remove('active');
}

// --- Der Haupt-Event-Handler ---

aiForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userInput = aiQuestionInput.value.trim();
  if (!userInput) return;

  showLoadingState(); // Zeigt "Evita denkt nach..."
  aiQuestionInput.value = ''; // Leert das Feld nach dem Senden

  try {
    // Die Logik entscheidet basierend auf dem aktuellen Gesprächsschritt
    switch (conversationState.step) {
      
      case 'idle':
        // Standard-Anfrage an das "Gehirn"
        const response = await fetch('/api/ask-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userInput })
        });
        const data = await response.json();

        if (data.action === 'start_booking') {
          // Buchungsprozess wurde gestartet
          conversationState.step = 'awaiting_slot';
          displayMessage(data.message); // Zeigt "Gerne, ich prüfe..."
          // Ruft sofort die Verfügbarkeiten ab
          const availabilityRes = await fetch('/api/get-availability');
          const availabilityData = await availabilityRes.json();
          displayBookingOptions(availabilityData.slots);
        } else {
          // Normale Antwort
          displayMessage(data.answer);
        }
        break;

      case 'awaiting_slot':
        // Nutzer hat einen Termin-Slot gesendet
        conversationState.data.slot = userInput;
        conversationState.step = 'awaiting_name';
        displayMessage(`Super, Termin "${userInput}" ist vorgemerkt. Wie lautet Ihr voller Name?`);
        break;

      case 'awaiting_name':
        // Nutzer hat seinen Namen gesendet
        conversationState.data.name = userInput;
        conversationState.step = 'awaiting_email';
        displayMessage(`Danke, ${userInput}. Und wie lautet Ihre E-Mail-Adresse, damit ich Ihnen die Bestätigung senden kann?`);
        break;
      
      case 'awaiting_email':
        // Nutzer hat seine E-Mail gesendet -> FINALE
        conversationState.data.email = userInput;
        
        // Sende alle gesammelten Daten an die "Hände" zum Buchen
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
  } finally {
    hideLoadingState();
  }
});

// =================================================================
// NEU ENDE: Der "Gesprächs-Manager"
// =================================================================
