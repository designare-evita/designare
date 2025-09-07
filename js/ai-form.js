// js/ai-form.js (KORRIGIERTE VERSION - TERMIN-BUTTONS FUNKTIONAL)
import { showAIResponse, showLoadingState, hideLoadingState } from './modals.js';

// Formular auf der Hauptseite
const mainAiForm = document.getElementById('ai-form');
const mainAiInput = document.getElementById('ai-question');

// Der Gesprächs-Manager, der sich den Fortschritt merkt
let conversationState = {
  step: 'idle', // idle | awaiting_slot | awaiting_name | awaiting_email
  data: {}      // Hier sammeln wir die Infos (slot, name, email)
};

// ===================================================================
// KORRIGIERTE FUNKTION: Diese wird global verfügbar gemacht
// ===================================================================
function selectSlot(slot) {
  console.log('selectSlot aufgerufen mit:', slot);
  
  // Direkt die Slot-Auswahl verarbeiten
  conversationState.data.slot = slot;
  conversationState.step = 'awaiting_name';
  
  // Zeige die nächste Nachricht
  showAIResponse(`Super! Ich habe den Termin "${slot}" für Sie vorgemerkt. Wie lautet Ihr vollständiger Name?`, false);
}

// Mache die Funktion global verfügbar
window.selectSlot = selectSlot;

// Die zentrale Logik, die die Eingaben verarbeitet
async function handleConversation(userInput) {
  showLoadingState();
  
  // Disable input während der Verarbeitung
  const currentChatInput = document.getElementById('ai-chat-input');
  if (currentChatInput) currentChatInput.disabled = true;

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
          let html = `<p>${data.message}</p>`;
          
          try {
            const availabilityRes = await fetch('/api/get-availability');
            const availabilityData = await availabilityRes.json();
            
            if (availabilityData.slots && availabilityData.slots.length > 0) {
              html += `<p>Hier sind die nächsten freien Termine. Bitte wählen Sie einen passenden aus:</p>
                       <div class="booking-options" style="display: flex; flex-direction: column; gap: 10px; margin: 15px 0;">`;
              
              availabilityData.slots.forEach(slot => {
                html += `<button class="slot-button" 
                          onclick="window.selectSlot('${slot}')" 
                          style="background: #ffc107; color: #1a1a1a; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; transition: background 0.3s;"
                          onmouseover="this.style.background='#e0a800'" 
                          onmouseout="this.style.background='#ffc107'">${slot}</button>`;
              });
              html += `</div>`;
            } else {
              html += `<p>Momentan sind leider keine freien Termine verfügbar. Versuchen Sie es bitte später erneut.</p>`;
            }
          } catch (error) {
            console.error('Fehler beim Laden der Verfügbarkeiten:', error);
            html += `<p>Es gab ein Problem beim Laden der Termine. Bitte versuchen Sie es später erneut.</p>`;
          }
          
          showAIResponse(html, true);
        } else {
          showAIResponse(data.answer, false);
        }
        break;

      case 'awaiting_slot': // Nutzer hat einen Termin-Slot manuell eingegeben
        conversationState.data.slot = userInput;
        conversationState.step = 'awaiting_name';
        showAIResponse(`Super! Ich habe den Termin "${userInput}" für Sie vorgemerkt. Wie lautet Ihr vollständiger Name?`, false);
        break;

      case 'awaiting_name': // Nutzer hat seinen Namen eingegeben
        conversationState.data.name = userInput;
        conversationState.step = 'awaiting_email';
        showAIResponse(`Danke, ${userInput}! Und wie lautet Ihre E-Mail-Adresse für die Terminbestätigung?`, false);
        break;
      
      case 'awaiting_email': // Nutzer hat seine E-Mail eingegeben -> FINALE
        conversationState.data.email = userInput;
        
        try {
          const bookingResponse = await fetch('/api/create-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conversationState.data)
          });
          const bookingData = await bookingResponse.json();
          
          if (bookingData.success) {
            showAIResponse(`✅ ${bookingData.message}`, false);
          } else {
            showAIResponse(`❌ Es gab ein Problem: ${bookingData.message}`, false);
          }
        } catch (error) {
          console.error('Fehler bei der Terminbuchung:', error);
          showAIResponse('❌ Es gab einen technischen Fehler bei der Terminbuchung. Bitte versuchen Sie es später erneut.', false);
        }
        
        // Gespräch zurücksetzen
        conversationState = { step: 'idle', data: {} };
        break;
        
      default:
        showAIResponse('Es gab einen unerwarteten Fehler im Gesprächsablauf. Bitte starten Sie erneut.', false);
        conversationState = { step: 'idle', data: {} };
    }
  } catch (error) {
    console.error('Fehler im Dialog-Manager:', error);
    showAIResponse('Oh, da ist ein technischer Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.', false);
    conversationState = { step: 'idle', data: {} };
  } finally {
    hideLoadingState();
    if (currentChatInput) {
        currentChatInput.disabled = false;
        currentChatInput.focus();
    }
  }
}

// ===================================================================
// EVENT LISTENER SETUP
// ===================================================================

// 1. Für das Formular auf der Startseite
if (mainAiForm) {
  mainAiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userInput = mainAiInput.value.trim();
    if (!userInput) return;
    
    // Conversation state zurücksetzen für neue Gespräche
    conversationState = { step: 'idle', data: {} };
    
    // Chat-History leeren
    const chatHistory = document.getElementById('ai-chat-history');
    if (chatHistory) chatHistory.innerHTML = ''; 
    
    handleConversation(userInput);
    mainAiInput.value = '';
  });
}

// 2. Event Delegation für das Chat-Modal (da es dynamisch geladen wird)
document.addEventListener('submit', (e) => {
  if (e.target && e.target.id === 'ai-chat-form') {
    e.preventDefault();
    const chatInput = document.getElementById('ai-chat-input');
    if (!chatInput) return;
    
    const userInput = chatInput.value.trim();
    if (!userInput) return;
    
    handleConversation(userInput);
    chatInput.value = '';
  }
});

// 3. Debug-Info für Termin-Buttons
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList.contains('slot-button')) {
    console.log('Slot-Button geklickt:', e.target);
  }
});

console.log('AI-Form Modul geladen. selectSlot-Funktion verfügbar:', typeof window.selectSlot);
