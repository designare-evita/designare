// api/ask-gemini.js - MIT MEMORY-SYSTEM + DASHBOARD-TRACKING
// Version: Memory + Dashboard Integration
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Redis } from "@upstash/redis";
import { trackChatMessage, trackChatSession, trackQuestion, trackFallback, trackTopics } from './evita-track.js';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===================================================================
// REDIS-INITIALISIERUNG
// ===================================================================
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ===================================================================
// MEMORY-HELPER FUNKTIONEN
// ===================================================================
const MEMORY_TTL = 60 * 60 * 24 * 30; // 30 Tage in Sekunden

async function getMemory(sessionId) {
  if (!sessionId) return null;
  try {
    const data = await redis.get(`evita:session:${sessionId}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('Redis GET Fehler:', error.message);
    return null;
  }
}

async function saveMemory(sessionId, memoryData) {
  if (!sessionId) return;
  try {
    await redis.set(
      `evita:session:${sessionId}`,
      JSON.stringify(memoryData),
      { ex: MEMORY_TTL }
    );
  } catch (error) {
    console.error('Redis SET Fehler:', error.message);
  }
}

function extractNameFromResponse(aiResponse) {
  const match = aiResponse.match(/\[USER_NAME:([^\]]+)\]/);
  if (match) {
    const name = match[1].trim();
    if (name.length >= 2 && name.length <= 20 && /^[A-Za-zÄÖÜäöüß\-]+$/.test(name)) {
      return name;
    }
  }
  return null;
}

function cleanAiResponse(text) {
  return text
    .replace(/\[USER_NAME:[^\]]+\]/g, '')
    .replace(/\[BOOKING_CONFIRM_REQUEST\]/g, '')
    .replace(/\[buchung_starten\]/g, '')
    .replace(/\[booking_starten\]/g, '')
    .trim();
}

// ===================================================================
// THEMEN-KEYWORDS FÜR TRACKING (zentral definiert)
// ===================================================================
const TOPIC_REGEX = /(?:wordpress|seo|performance|ki|api|website|plugin|theme|speed|hosting|security|schema|css|html|javascript|react|php|python|datapeak|silas|evita|kuchen|rezept|blog|shop|woocommerce|dsgvo|daten|backup|ssl|domain|analytics|tracking|caching|cdn|responsive|mobile|design|ux|ui|server|deployment|git|docker|nginx|apache|core web vitals|pagespeed|lighthouse|sitemap|robots|meta|snippet|featured|backlinks?|keywords?|ranking|indexierung|crawl|search console)/g;

// ===================================================================
// MAIN HANDLER
// ===================================================================
export default async function handler(req, res) {
  // CORS-Header
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { prompt, source, checkBookingIntent, history, message, sessionId, userName } = req.body;
    const userMessage = message || prompt;

    // ===================================================================
    // MEMORY LADEN
    // ===================================================================
    let memory = await getMemory(sessionId);
    const isReturningUser = memory !== null;
    const knownName = userName || memory?.name || null;
    const previousTopics = memory?.topics || [];
    const visitCount = (memory?.visitCount || 0) + 1;
    const lastVisit = memory?.lastVisit || null;

    console.log(`🧠 Memory: Session=${sessionId?.substring(0,8)}... | Name=${knownName} | Visits=${visitCount} | Returning=${isReturningUser}`);

    // ===================================================================
    // 📊 DASHBOARD: Neue Chat-Session tracken
    // ===================================================================
    if (!history || history.length === 0) {
      trackChatSession(sessionId); // Fire-and-forget
    }

    // --- MODELL-KONFIGURATION MIT TRACKING ---
    let usedModel = 'gemini-3-flash-preview';
    const commonConfig = { temperature: 0.7 };

    const modelPrimary = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        generationConfig: commonConfig 
    });
    const modelFallback1 = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: commonConfig 
    });
    const modelFallback2 = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",  
        generationConfig: commonConfig 
    });

    async function generateContentSafe(inputText) {
      try { 
        return await modelPrimary.generateContent(inputText); 
      } catch (error) { 
        console.log("Primary model failed, trying Fallback 1:", error.message);
        usedModel = 'gemini-2.5-flash';
        try {
          return await modelFallback1.generateContent(inputText);
        } catch (error1) {
          console.log("Fallback 1 failed, trying Fallback 2:", error1.message);
          usedModel = 'gemini-2.0-flash';
          return await modelFallback2.generateContent(inputText);
        }
      }
    }

    // --- RAG KONTEXT-ABRUF ---
    let additionalContext = "";
    const knowledgePath = path.join(process.cwd(), 'knowledge.json');
    
    if (fs.existsSync(knowledgePath)) {
        try {
            const kbData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
            const kb = kbData.pages || kbData;
            const searchIndex = kbData.search_index || null;
            
            const searchTerms = userMessage
                .toLowerCase()
                .match(/[a-zäöüß]{3,}/g) || [];
            
            let matchedPages = [];
            
            if (searchIndex && searchTerms.length > 0) {
                const pageScores = {};
                
                searchTerms.forEach(term => {
                    if (searchIndex[term]) {
                        searchIndex[term].forEach(pageIdx => {
                            pageScores[pageIdx] = (pageScores[pageIdx] || 0) + 2;
                        });
                    }
                    Object.keys(searchIndex).forEach(indexTerm => {
                        if (indexTerm.includes(term) || term.includes(indexTerm)) {
                            searchIndex[indexTerm].forEach(pageIdx => {
                                pageScores[pageIdx] = (pageScores[pageIdx] || 0) + 1;
                            });
                        }
                    });
                });
                
                matchedPages = Object.entries(pageScores)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([idx]) => kb[parseInt(idx)])
                    .filter(Boolean);
            }
            
            if (matchedPages.length === 0) {
                matchedPages = kb.filter(page => {
                    const pageText = `${page.title} ${page.text} ${(page.keywords || []).join(' ')}`.toLowerCase();
                    return searchTerms.some(term => pageText.includes(term));
                }).slice(0, 3);
            }
            
            if (matchedPages.length > 0) {
                additionalContext = matchedPages.map(page => {
                    let context = `\n📄 QUELLE: ${page.title}`;
                    
                    if (page.sections && page.sections.length > 0) {
                        const relevantSections = page.sections
                            .filter(section => 
                                searchTerms.some(term => 
                                    section.heading.toLowerCase().includes(term) ||
                                    section.content.toLowerCase().includes(term)
                                )
                            )
                            .slice(0, 2);
                        
                        if (relevantSections.length > 0) {
                            context += '\n' + relevantSections
                                .map(s => `[${s.heading}]: ${s.content.substring(0, 500)}`)
                                .join('\n');
                        } else {
                            context += `\n${page.text.substring(0, 800)}`;
                        }
                    } else {
                        context += `\n${page.text.substring(0, 800)}`;
                    }
                    
                    return context;
                }).join('\n\n');
                
                console.log(`RAG: ${matchedPages.length} relevante Seiten gefunden`);
            }
        } catch (error) {
            console.error('RAG Fehler:', error.message);
        }
    }

    // =================================================================
    // BOOKING INTENT-ERKENNUNG
    // =================================================================
    if (checkBookingIntent === true) {
      console.log('📅 Booking-Intent Prüfung für:', userMessage);
      
      const lastAiMessage = history && Array.isArray(history) 
          ? [...history].reverse().find(msg => msg.role === 'assistant' || msg.role === 'model') 
          : null;
      
      const wasBookingQuestion = lastAiMessage && 
          (lastAiMessage.content.includes('[BOOKING_CONFIRM_REQUEST]') || 
           lastAiMessage.content.toLowerCase().includes('rückruf-termin schauen'));
      
      if (wasBookingQuestion) {
          const confirmationKeywords = [
              'ja', 'gerne', 'okay', 'ok', 'bitte', 'genau', 'richtig', 
              'korrekt', 'stimmt', 'passt', 'mach das', 'hilf mir', 
              'super', 'perfekt', 'natürlich', 'klar', 'unbedingt',
              'auf jeden fall', 'sicher', 'gern', 'würde ich', 'bitte sehr'
          ];
          
          const userConfirmed = confirmationKeywords.some(keyword => 
              userMessage.toLowerCase().includes(keyword)
          );
          
          if (userConfirmed) {
              // 📊 DASHBOARD: Booking-Completion tracken
              trackChatMessage({ sessionId, userMessage, isReturningUser, usedFallback: false, modelUsed: 'booking', bookingIntent: true, bookingCompleted: true });
              
              return res.status(200).json({
                  answer: "Gerne, ich öffne jetzt Michaels Kalender für dich! [buchung_starten]"
              });
          }
      } else {
          const contactKeywords = [
              'termin', 'buchung', 'buchen', 'rückruf', 'anrufen', 
              'sprechen', 'kontakt', 'meeting', 'gespräch', 'erreichen',
              'treffen', 'call', 'telefonat', 'beratung', 'projekt besprechen'
          ];
          
          const hasContactIntent = contactKeywords.some(keyword => 
              userMessage.toLowerCase().includes(keyword)
          );
          
          if (hasContactIntent) {
              // 📊 DASHBOARD: Booking-Intent tracken
              trackChatMessage({ sessionId, userMessage, isReturningUser, usedFallback: false, modelUsed: 'booking-intent', bookingIntent: true, bookingCompleted: false });
              
              return res.status(200).json({
                  answer: "Kein Problem! Soll ich in Michaels Kalender nach einem passenden Rückruf-Termin schauen? [BOOKING_CONFIRM_REQUEST]"
              });
          }
      }
    }

    // =================================================================
    // NORMALE CHAT-ANTWORTEN
    // =================================================================
    let finalPrompt = '';

    if (source === 'silas') {
      finalPrompt = userMessage;
      console.log("Silas-Prompt verwendet");
    } else {
      const today = new Date();
      const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Vienna' };
      const formattedDate = today.toLocaleDateString('de-AT', optionsDate);
      const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Vienna' };
      const formattedTime = today.toLocaleTimeString('de-AT', optionsTime);

      // Konversationshistorie
      let conversationHistoryText = '';
      
      if (history && Array.isArray(history) && history.length > 0) {
        console.log(`Verarbeite ${history.length} Nachrichten aus der Historie`);
        conversationHistoryText = '\n\n--- BISHERIGE KONVERSATION ---\n';
        history.forEach((msg, index) => {
          const role = msg.role === 'user' ? 'NUTZER' : 'EVITA';
          const cleanContent = msg.content
            .replace(/\[BOOKING_CONFIRM_REQUEST\]/g, '')
            .replace(/\[buchung_starten\]/g, '')
            .replace(/\[booking_starten\]/g, '')
            .replace(/\[USER_NAME:[^\]]+\]/g, '');
          conversationHistoryText += `${role}: ${cleanContent}\n`;
        });
        conversationHistoryText += '--- ENDE KONVERSATION ---\n\n';
      }

      // =================================================================
      // MEMORY-KONTEXT FÜR DEN PROMPT
      // =================================================================
      let memoryContext = '';
      
      if (isReturningUser && knownName) {
        const timeSince = lastVisit 
          ? getTimeSinceText(new Date(lastVisit))
          : 'einiger Zeit';
        
        memoryContext = `
--- MEMORY / GEDÄCHTNIS ---
⚡ WIEDERKEHRENDER BESUCHER!
- Name: ${knownName}
- Besuch Nr.: ${visitCount}
- Letzter Besuch: vor ${timeSince}
${previousTopics.length > 0 ? `- Frühere Themen: ${previousTopics.slice(-5).join(', ')}` : ''}

VERHALTEN: 
- Begrüße ${knownName} NATÜRLICH beim Namen (nicht übertrieben)
- Knüpfe an frühere Themen an, wenn es passt
- Du brauchst NICHT nach dem Namen zu fragen
--- ENDE MEMORY ---
`;
      } else if (isReturningUser && !knownName) {
        memoryContext = `
--- MEMORY / GEDÄCHTNIS ---
⚡ WIEDERKEHRENDER BESUCHER (Name unbekannt)
- Besuch Nr.: ${visitCount}
${previousTopics.length > 0 ? `- Frühere Themen: ${previousTopics.slice(-5).join(', ')}` : ''}

VERHALTEN:
- Beziehe dich bei Gelegenheit auf frühere Gespräche
- Frage BEILÄUFIG nach dem Namen, wenn es natürlich passt (z.B. "Übrigens, wie darf ich dich nennen?")
- NICHT in der ersten Nachricht fragen, erst ab der 3. Nachricht im aktuellen Chat
--- ENDE MEMORY ---
`;
      } else {
        memoryContext = `
--- MEMORY / GEDÄCHTNIS ---
🆕 NEUER BESUCHER (erster Besuch)

VERHALTEN:
- Falls der Nutzer sich vorstellt oder seinen Namen nennt, merke dir den Namen
- Wenn der Nutzer seinen Namen nennt, füge UNSICHTBAR am Ende deiner Antwort hinzu: [USER_NAME:Vorname]
- Frage NICHT aktiv nach dem Namen in den ersten 2 Nachrichten
--- ENDE MEMORY ---
`;
      }

      // =================================================================
      // NAMENS-ERKENNUNG INSTRUKTION (immer aktiv)
      // =================================================================
      const nameDetectionInstruction = `
--- NAMENS-ERKENNUNG (INTERN - UNSICHTBAR FÜR DEN NUTZER) ---
Wenn der Nutzer in seiner Nachricht seinen Vornamen nennt oder sich vorstellt:
→ Füge am ENDE deiner Antwort den Tag [USER_NAME:Vorname] hinzu
Beispiele: "Ich bin der Lukas" → [USER_NAME:Lukas]
           "Mein Name ist Anna" → [USER_NAME:Anna]  
           "Hi, Tom hier" → [USER_NAME:Tom]
WICHTIG: Nur bei ECHTEN Vornamen des Nutzers, NICHT bei erwähnten Personen!
"Wie geht es Lukas Podolski?" → KEIN Tag!
--- ENDE NAMENS-ERKENNUNG ---
`;

      finalPrompt = `
--- ANWEISUNGEN FÜR DIE KI ---

--- DEINE ROLLE ---
Du bist Evita, Michaels hochkompetente, technisch versierte digitale Assistentin.
Dein Charakter: Charmant, schlagfertig, aber absolut professionell.
Sprache: Duze den Nutzer ("Du"). Antworte prägnant (max. 3-4 Sätze).

--- DEIN FACHWISSEN ---
Du bist Expertin für:
- Web-Purismus (sauberer Code statt Baukasten-Plugins)
- WordPress-Performance & Sicherheit
- SEO Suchmaschinenoptimierung
- GEO (Generative Engine Optimization) & strukturierte Daten (Schema.org)
- API und KI-Automatisierung
- Kuchenrezepte

--- DIE "MICHAEL-REGEL" (WICHTIG!) ---
1. BEI FACHFRAGEN (SEO, Code, Technik): Antworte rein sachlich und helfend. Erwähne Michael NICHT.
2. BEI FRAGEN ZU MICHAEL/SERVICES: Erst dann darfst du ihn charmant als Experten positionieren.
3. ABSOLUTES WERBEVERBOT: Keine Marketing-Floskeln. Sei hilfreich, keine Verkäuferin.
4. NAMEN-SPERRE: Erwähne "Michael" nur bei direktem Bezug zu ihm oder Zusammenarbeit.

--- TERMINE & BUCHUNGEN (ABSOLUTE VERBOTE!) ---
⛔ Du darfst NIEMALS:
- Termine vorschlagen oder erfinden
- So tun als hättest du Zugriff auf den Kalender
- Behaupten du hättest etwas gebucht
- Nach E-Mail, Telefonnummer oder Namen für Buchungen fragen
- Termine bestätigen oder reservieren

✅ Bei Terminwünschen IMMER NUR:
- Fragen: "Soll ich in Michaels Kalender nach einem passenden Rückruf-Termin schauen?"
- Das Buchungssystem wird AUTOMATISCH vom Frontend geöffnet
- Du hast KEINEN direkten Kalenderzugriff!

--- WEITERE REGELN ---
- VERMEIDE TEXTWÜSTEN: Nutze Bulletpoints bei mehr als 2 Punkten
- Tabus: Keine Politik, Religion oder Rechtsberatung
- Sei witzig und hilfsbereit

--- AKTUELLE DATEN ---
Datum: ${formattedDate}
Uhrzeit: ${formattedTime}

${memoryContext}

${nameDetectionInstruction}

${conversationHistoryText}

${additionalContext ? `--- RELEVANTER KONTEXT VON DER WEBSEITE ---
${additionalContext}
--- ENDE KONTEXT ---

Nutze diesen Kontext für präzise Antworten. Verweise bei Bedarf auf die Quelle.
` : ''}

--- AKTUELLE NACHRICHT DES BESUCHERS ---
"${userMessage}"
      `;
    }

    // =================================================================
    // GENERIERE ANTWORT
    // =================================================================
    const result = await generateContentSafe(finalPrompt);
    const response = await result.response;
    let text = response.text();

    // =================================================================
    // POST-PROCESSING: Name extrahieren & Memory speichern
    // =================================================================
    if (source !== 'silas' && sessionId) {
      const detectedName = extractNameFromResponse(text);
      
      const topicKeywords = userMessage.toLowerCase().match(TOPIC_REGEX) || [];
      
      // Memory aktualisieren
      const updatedMemory = {
        name: detectedName || knownName || null,
        visitCount: visitCount,
        lastVisit: new Date().toISOString(),
        topics: [...new Set([...previousTopics, ...topicKeywords])].slice(-15),
        lastMessages: [
          ...(memory?.lastMessages || []).slice(-8),
          { role: 'user', content: userMessage.substring(0, 200), timestamp: new Date().toISOString() }
        ]
      };
      
      await saveMemory(sessionId, updatedMemory);
      
      if (detectedName) {
        console.log(`🧠 Name erkannt und gespeichert: ${detectedName}`);
      }

      // ===============================================================
      // 📊 DASHBOARD: Chat-Nachricht + Frage + Themen tracken
      // ===============================================================
      trackChatMessage({
        sessionId,
        userMessage,
        isReturningUser,
        usedFallback: false,
        modelUsed: usedModel,
        bookingIntent: checkBookingIntent || false,
        bookingCompleted: false
      });
      trackQuestion(userMessage);
      if (topicKeywords.length > 0) {
        trackTopics(topicKeywords);
      }

      // Interne Tags aus Antwort entfernen
      text = cleanAiResponse(text);
    }

    if (source === 'silas') {
      res.status(200).send(text);
    } else {
      const responsePayload = { answer: text };
      const finalName = extractNameFromResponse(response.text()) || knownName;
      if (finalName) {
        responsePayload.detectedName = finalName;
      }
      res.status(200).json(responsePayload);
    }

  } catch (error) {
    console.error("API Error:", error);

    // ===============================================================
    // 📊 DASHBOARD: Fallback tracken
    // ===============================================================
    const { sessionId, message, prompt } = req.body || {};
    const userMsg = message || prompt || '';
    trackChatMessage({ sessionId, userMessage: userMsg, isReturningUser: false, usedFallback: true, modelUsed: 'fallback', bookingIntent: false, bookingCompleted: false });
    trackFallback(userMsg);

    res.status(500).json({ answer: 'Pixelfehler im System! Michael ist dran.' });
  }
}

// ===================================================================
// HILFSFUNKTION: Zeitdifferenz als lesbarer Text
// ===================================================================
function getTimeSinceText(lastDate) {
  const now = new Date();
  const diffMs = now - lastDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 5) return 'wenigen Minuten';
  if (diffMins < 60) return `${diffMins} Minuten`;
  if (diffHours < 24) return `${diffHours} Stunden`;
  if (diffDays === 1) return 'einem Tag';
  if (diffDays < 7) return `${diffDays} Tagen`;
  if (diffDays < 14) return 'einer Woche';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} Wochen`;
  return `${Math.floor(diffDays / 30)} Monaten`;
}
