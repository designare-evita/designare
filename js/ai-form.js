// js/ai-form.js (FINALE VERSION FÜR DEN KALENDER-CHAT)
import { showAIResponse, showLoadingState, hideLoadingState } from './modals.js';

// Formular auf der Hauptseite
const mainAiForm = document.getElementById('ai-form');
const mainAiInput = document.getElementById('ai-question');

// Formular IN der Evita-Lightbox
const chatModalForm = document.getElementById('ai-chat-form');
const chatModalInput = document.getElementById('ai-chat-input');
const chatModalHistory = document.getElementById('ai-chat-history');

// Der Gesprächs-Manager, der sich den Fortschritt merkt
let conversationState = {
  step: 'idle', // idle | awaiting_slot | awaiting_name | awaiting_email
  data: {}      // Hier sammeln wir die Infos (slot, name, email)
};

// Diese Funktion wird von den Termin-Buttons geklickt
window.selectSlot = function(slot) {
  if (chatModalInput) {
    chatModalInput.value = slot;
    chatModalInput.focus();
    // Simuliert einen Klick auf den Senden-Button des Modal-Formulars
    const submitButton = chatModalForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.click();
    }
  }
}

// Die zentrale Logik, die die Eingaben verarbeitet
async function handleConversation(userInput) {
  showLoadingState();
  if (chatModalInput) chatModalInput.disabled = true;

  try {
    // Je nach Schritt im Gespräch, passiert etwas anderes
    switch (conversationState.step) {
      
      case 'idle': // Die allererste Frage
        const response = await fetch('/api/ask-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userInput, source: 'evita' })
        });
        const data = await response.json();

        if (data.action === 'start_booking') {
          conversationState.step = 'awaiting_slot';
          // Zeige die "Ich prüfe..." Nachricht und dann die Termine
          const availabilityRes = await fetch('/api/get-availability');
          const availabilityData = await availabilityRes.json();
          let html = `<p>${data.message}</p>`;
          if (availabilityData.slots && availabilityData.slots.length > 0) {
            html += `<p>Hier sind die nächsten freien Termine. Bitte wählen Sie einen passenden aus:</p><div class="booking-options">`;
            availabilityData.slots.forEach(slot => {
              html += `<button class="slot-button" onclick="window.selectSlot('${slot}')">${slot}</button>`;
            });
            html += `</div>`;
          } else {
            html += `<p>Momentan sind leider keine freien Termine verfügbar. Versuchen Sie es bitte später erneut.</p>`;
          }
          showAIResponse(html, true);
        } else {
          showAIResponse(data.answer, false);
        }
        break;

      case 'awaiting_slot': // Nutzer hat einen Termin-Slot ausgewählt/eingegeben
        conversationState.data.slot = userInput;
        conversationState.step = 'awaiting_name';
        showAIResponse(`Super, der Termin ist für Sie vorgemerkt. Wie lautet Ihr voller Name?`, false);
        break;

      case 'awaiting_name': // Nutzer hat seinen Namen eingegeben
        conversationState.data.name = userInput;
        conversationState.step = 'awaiting_email';
        showAIResponse(`Danke, ${userInput}. Und wie lautet Ihre E-Mail-Adresse für die Bestätigung?`, false);
        break;
      
      case 'awaiting_email': // Nutzer hat seine E-Mail eingegeben -> FINALE
        conversationState.data.email = userInput;
        const bookingResponse = await fetch('/api/create-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationState.data)
        });
        const bookingData = await bookingResponse.json();
        showAIResponse(bookingData.message, false);
        // Gespräch zurücksetzen für die nächste Anfrage
        conversationState = { step: 'idle', data: {} };
        break;
    }
  } catch (error) {
    console.error('Fehler im Dialog-Manager:', error);
    showAIResponse('Oh, da ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.', false);
    conversationState = { step: 'idle', data: {} }; // Reset bei Fehler
  } finally {
    hideLoadingState();
    if (chatModalInput) chatModalInput.disabled = false;
    if (chatModalInput) chatModalInput.focus();
  }
}

// --- Event Listener ---
// Nur hinzufügen, wenn die Elemente auf der Seite existieren.

// 1. Für das Formular auf der Startseite
if (mainAiForm) {
  mainAiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userInput = mainAiInput.value.trim();
    if (!userInput) return;
    
    // Gesprächszustand und Chatverlauf für eine saubere neue Anfrage zurücksetzen
    conversationState = { step: 'idle', data: {} };
    if (chatModalHistory) chatModalHistory.innerHTML = ''; 
    
    handleConversation(userInput);
    mainAiInput.value = '';
  });
}

// 2. Für das Formular IN der Lightbox
if (chatModalForm) {
  chatModalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userInput = chatModalInput.value.trim();
    if (!userInput) return;
    
    handleConversation(userInput);
    chatModalInput.value = '';
  });
}
