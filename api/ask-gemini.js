// api/ask-gemini.js - REPARIERT: Booking-Flow wie ursprünglich
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { prompt, source, checkBookingIntent, history, message } = req.body;
    const userMessage = message || prompt;

    // --- MODELL-KONFIGURATION (ERWEITERT UM 3. FALLBACK) ---
    const commonConfig = { temperature: 0.7 };
    // HYBRID: Preview + Paid Fallback
    const modelPrimary = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",  // Gratis solange es geht
        generationConfig: commonConfig 
    });
    const modelFallback1 = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",  // Paid Fallback
        generationConfig: commonConfig 
    });
    const modelFallback2 = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",  
        generationConfig: commonConfig 
    });

    async function generateContentSafe(inputText) {
      try { 
        // 1. Versuch: Primary Model
        return await modelPrimary.generateContent(inputText); 
      } catch (error) { 
        console.log("Primary model failed, trying Fallback 1:", error.message);
        
        try {
          // 2. Versuch: Fallback 1
          return await modelFallback1.generateContent(inputText);
        } catch (error1) {
          console.log("Fallback 1 failed, trying Fallback 2 (Gemini 2.0):", error1.message);
          
          // 3. Versuch: Fallback 2 (Gemini 2.0 Flash - stabilste Option)
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
        
        // Prüfe ob die letzte AI-Nachricht eine Booking-Rückfrage war
        const lastAiMessage = history && history.length > 0 
            ? history.filter(msg => msg.role === 'assistant').pop() 
            : null;
        
        const wasBookingQuestion = lastAiMessage && 
            lastAiMessage.content.includes('[BOOKING_CONFIRM_REQUEST]');
        
        console.log('War letzte Nachricht eine Booking-Rückfrage?', wasBookingQuestion);
        
        // ===== FALL 1: User bestätigt eine vorherige Booking-Rückfrage =====
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
                console.log('✅ User hat Booking bestätigt - öffne Modal');
                
                // DIREKT das Modal öffnen - keine weitere Konversation!
                return res.status(200).json({
                    answer: "Gerne, ich öffne jetzt Michaels Kalender für dich! [buchung_starten]"
                });
            } else {
                console.log('❌ User hat nicht bestätigt, normale Antwort');
            }
        } 
        // ===== FALL 2: Neue Kontakt/Termin-Anfrage - stelle Rückfrage =====
        else {
            const contactKeywords = [
                'termin', 'buchung', 'buchen', 'rückruf', 'anrufen', 
                'sprechen', 'kontakt', 'meeting', 'gespräch', 'erreichen',
                'treffen', 'call', 'telefonat', 'beratung', 'projekt besprechen'
            ];
            
            const hasContactIntent = contactKeywords.some(keyword => 
                userMessage.toLowerCase().includes(keyword)
            );
            
            if (hasContactIntent) {
                console.log('📞 Kontakt-Intent erkannt - stelle Rückfrage');
                
                // Einfache, direkte Rückfrage - KEINE Terminvorschläge!
                return res.status(200).json({
                    answer: "Kein Problem! Soll ich in Michaels Kalender nach einem passenden Rückruf-Termin schauen? [BOOKING_CONFIRM_REQUEST]"
                });
            }
        }
        
        console.log('💬 Kein Booking-Intent - normale Evita-Antwort');
    }

    // =================================================================
    // NORMALE CHAT-ANTWORTEN
    // =================================================================
    let finalPrompt = '';

    if (source === 'silas') {
      finalPrompt = userMessage;
      console.log("Silas-Prompt verwendet");
    } else {
      // Evita-Prompt
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
          // Entferne interne Tags aus der Historie
          const cleanContent = msg.content
            .replace(/\[BOOKING_CONFIRM_REQUEST\]/g, '')
            .replace(/\[buchung_starten\]/g, '')
            .replace(/\[booking_starten\]/g, '');
          conversationHistoryText += `${role}: ${cleanContent}\n`;
        });
        conversationHistoryText += '--- ENDE KONVERSATION ---\n\n';
      }

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
- Termine vorschlagen oder erfinden ("Montag 9 Uhr wäre frei...")
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
    const text = response.text();

    if (source === 'silas') {
      res.status(200).send(text);
    } else {
      res.status(200).json({ answer: text });
    }

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ answer: 'Pixelfehler im System! Michael ist dran.' });
  }
}
