// js/ai-form.js (ENCODING-SICHERE VERSION)
import { showLoadingState, hideLoadingState } from './modals.js';

// Formular auf der Hauptseite
const mainAiForm = document.getElementById('ai-form');
const mainAiInput = document.getElementById('ai-question');

// Der Gespraechs-Manager, der sich den Fortschritt merkt
let conversationState = {
  step: 'idle', // idle | awaiting_slot | awaiting_name | awaiting_email
  data: {}      // Hier sammeln wir die Infos (slot, name, email)
};

// ===================================================================
// NEUE FUNKTION: Oeffnet das AI-Modal und zeigt Inhalt an
// ===================================================================
function openAIModal() {
  const modal = document.getElementById('ai-response-modal');
  if (modal) {
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('no-scroll');
  }
}

// ===================================================================
// NEUE FUNKTION: Fuegt Nachrichten zur Chat-History hinzu
// ===================================================================
function addMessageToHistory(message, sender) {
  const chatHistory = document.getElementById('ai-chat-history');
  if (!chatHistory) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  
  if (sender === 'ai' && typeof message === 'string' && message.includes('<')) {
    messageDiv.innerHTML = message;
  } else {
    messageDiv.textContent = message;
  }
  
  chatHistory.appendChild(messageDiv);
  
  // Scroll zum Ende
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ===================================================================
// KORRIGIERTE FUNKTION: Diese wird global verfuegbar gemacht
// ===================================================================
function selectSlot(slot) {
  console.log('selectSlot aufgerufen mit:', slot);
  
  // Direkt die Slot-Auswahl verarbeiten
  conversationState.data.slot = slot;
  conversationState.step = 'awaiting_name';
  
  console.log('conversationState nach selectSlot:', conversationState);
  
  // Chat-History updaten
  addMessageToHistory(`Termin gewaehlt: ${slot}`, 'user');
  addMessageToHistory(`Super! Ich habe den Termin "${slot}" fuer Dich vorgemerkt. Wie lautet Dein vollstaendiger Name?`, 'ai');
  
  // Fokus auf Input setzen
  setTimeout(() => {
    const chatInput = document.getElementById('ai-chat-input');
    if (chatInput) {
      chatInput.focus();
    }
  }, 100);
}

// Mache die Funktion global verfuegbar
window.selectSlot = selectSlot;

// ===================================================================
// NEUE FUNKTION: Prueft ob eine Eingabe im Booking-Kontext steht
// ===================================================================
function isInBookingProcess() {
  const result = conversationState.step !== 'idle';
  console.log('isInBookingProcess:', result, 'current step:', conversationState.step);
  return result;
}

// ===================================================================
// NEUE FUNKTION: Verarbeitet Booking-spezifische Eingaben
// ===================================================================
async function handleBookingInput(userInput) {
  console.log('Handle Booking Input:', conversationState.step, userInput);
  
  // Fuege die User-Nachricht zur History hinzu
  addMessageToHistory(userInput, 'user');
  
  switch (conversationState.step) {
    case 'awaiting_name':
      conversationState.data.name = userInput;
      conversationState.step = 'awaiting_email';
      console.log('Name gespeichert, wechsle zu awaiting_email:', conversationState);
      addMessageToHistory(`Danke, ${userInput}! Und wie lautet Deine E-Mail-Adresse fuer die Terminbestaetigung?`, 'ai');
      return true; // Indicates this was handled

    case 'awaiting_email':
      conversationState.data.email = userInput;
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInput)) {
        addMessageToHistory(`Bitte gebe eine gueltige E-Mail-Adresse ein (z.B. max@example.com):`, 'ai');
        return true;
      }
      
      // Loading-Nachricht
      addMessageToHistory('Einen Moment bitte, ich erstelle Deinen Termin...', 'ai');
      
      try {
        console.log('Sending booking data:', conversationState.data);
        
        const bookingResponse = await fetch('/api/create-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationState.data)
        });
        
        const bookingData = await bookingResponse.json();
        console.log('Booking response:', bookingData);
        
        if (bookingData.success) {
          addMessageToHistory(`✅ ${bookingData.message}`, 'ai');
        } else {
          addMessageToHistory(`❌ Es gab ein Problem: ${bookingData.message}`, 'ai');
        }
      } catch (error) {
        console.error('Fehler bei der Terminbuchung:', error);
        addMessageToHistory('❌ Es gab einen technischen Fehler bei der Terminbuchung. Bitte versuche es spaeter erneut.', 'ai');
      }
      
      // Gespraech zuruecksetzen
      conversationState = { step: 'idle', data: {} };
      return true; // Indicates this was handled

    default:
      console.log('Unbekannter booking step:', conversationState.step);
      return false; // Not handled
  }
}

// Die zentrale Logik, die die Eingaben verarbeitet
async function handleConversation(userInput) {
  showLoadingState();
  
  // Disable input waehrend der Verarbeitung
  const currentChatInput = document.getElementById('ai-chat-input');
  if (currentChatInput) currentChatInput.disabled = true;

  try {
    console.log('handleConversation called with:', userInput, 'current state:', conversationState);
    
    // ===================================================================
    // NEUE PRIORITAET: Pruefe zuerst, ob wir im Booking-Prozess sind
    // ===================================================================
    if (isInBookingProcess()) {
      console.log('Im Booking-Prozess, rufe handleBookingInput auf');
      const wasHandled = await handleBookingInput(userInput);
      if (wasHandled) {
        console.log('Booking input wurde verarbeitet');
        return; // Exit frueh, da Booking-Input verarbeitet wurde
      }
    }

    // ===================================================================
    // URSPRUENGLICHE LOGIK: Nur fuer neue Gespraeche
    // ===================================================================
    if (conversationState.step === 'idle') {
      console.log('Im idle state, normale Gemini-Anfrage');
      // Fuer neue Gespraeche, fuege User-Input zur History hinzu
      addMessageToHistory(userInput, 'user');
      
      const response = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput, source: 'evita' })
      });
      const data = await response.json();

      if (data.action === 'start_booking') {
        conversationState.step = 'awaiting_slot';
        console.log('Booking gestartet, state:', conversationState);
        
        // Erste AI-Antwort
        addMessageToHistory(data.message, 'ai');
        
        try {
          const availabilityRes = await fetch('/api/get-availability');
          const availabilityData = await availabilityRes.json();
          
          if (availabilityData.slots && availabilityData.slots.length > 0) {
            let html = `<p>Hier sind die naechsten freien Termine. Bitte waehle einen passenden aus:</p>
                       <div class="booking-options" style="display: flex; flex-direction: column; gap: 10px; margin: 15px 0;">`;
            
            availabilityData.slots.forEach(slot => {
              html += `<button class="slot-button" 
                        onclick="window.selectSlot('${slot}')" 
                        style="background: #ffc107; color: #1a1a1a; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; transition: background 0.3s;"
                        onmouseover="this.style.background='#e0a800'" 
                        onmouseout="this.style.background='#ffc107'">${slot}</button>`;
            });
            html += `</div>`;
            
            addMessageToHistory(html, 'ai');
          } else {
            addMessageToHistory(`Momentan sind leider keine freien Termine verfuegbar. Versuche es bitte spaeter erneut.`, 'ai');
          }
        } catch (error) {
          console.error('Fehler beim Laden der Verfuegbarkeiten:', error);
          addMessageToHistory(`Es gab ein Problem beim Laden der Termine. Bitte versuche es spaeter erneut.`, 'ai');
        }
      } else {
        addMessageToHistory(data.answer, 'ai');
      }
    } else {
      // Fallback fuer unerwartete Zustaende
      console.log('Unerwarteter Zustand:', conversationState.step);
      addMessageToHistory('Es gab einen unerwarteten Fehler im Gespraechsablauf. Bitte starte erneut.', 'ai');
      conversationState = { step: 'idle', data: {} };
    }

  } catch (error) {
    console.error('Fehler im Dialog-Manager:', error);
    addMessageToHistory('Oh, da ist ein technischer Fehler aufgetreten. Bitte versuche es spaeter noch einmal.', 'ai');
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

// 1. Fuer das Formular auf der Startseite
if (mainAiForm) {
  mainAiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userInput = mainAiInput.value.trim();
    if (!userInput) return;
    
    // Conversation state zuruecksetzen fuer neue Gespraeche
    conversationState = { step: 'idle', data: {} };
    
    // Chat-History leeren und Modal oeffnen
    const chatHistory = document.getElementById('ai-chat-history');
    if (chatHistory) chatHistory.innerHTML = ''; 
    
    // Modal oeffnen
    openAIModal();
    
    handleConversation(userInput);
    mainAiInput.value = '';
  });
}

// 2. Event Delegation fuer das Chat-Modal (da es dynamisch geladen wird)
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

// 3. Modal schliessen Buttons
document.addEventListener('click', (e) => {
  // Schliessen Buttons
  if (e.target && (e.target.id === 'close-ai-response-modal-top' || e.target.id === 'close-ai-response-modal-bottom')) {
    const modal = document.getElementById('ai-response-modal');
    if (modal) {
      modal.classList.remove('visible');
      document.body.style.overflow = '';
      document.body.classList.remove('no-scroll');
    }
  }
  
  // Debug-Info fuer Termin-Buttons
  if (e.target && e.target.classList.contains('slot-button')) {
    console.log('Slot-Button geklickt:', e.target);
  }
});

// 4. Modal schliessen bei Hintergrund-Klick
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'ai-response-modal') {
    const modal = document.getElementById('ai-response-modal');
    if (modal) {
      modal.classList.remove('visible');
      document.body.style.overflow = '';
      document.body.classList.remove('no-scroll');
    }
  }
});

console.log('AI-Form Modul geladen. selectSlot-Funktion verfuegbar:', typeof window.selectSlot);
