// api/ask-gemini.js - KORRIGIERTE VERSION mit ES-Module Syntax

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt, source, checkBookingIntent, history, message } = req.body;
    const userMessage = message || prompt;

    console.log("🔄 API-Call erhalten:");
    console.log("- userMessage:", userMessage);
    console.log("- history:", history);
    console.log("- source:", source);
    console.log("- checkBookingIntent:", checkBookingIntent);

    if (!userMessage) {
      return res.status(400).json({ message: 'A prompt is required.' });
    }

    const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
        temperature: 0.7,     // Etwas kreativer, aber nicht zu chaotisch
    }
});

    // =================================================================
    // INTENT-ERKENNUNG NUR WENN EXPLIZIT ANGEFORDERT
    // =================================================================
    if (checkBookingIntent === true) {
        console.log('Explizite Intent-Prüfung angefordert für:', userMessage);
        
        // WICHTIG: Prüfe ob die letzte Nachricht eine Rückfrage war
        const lastAiMessage = history && history.length > 0 
            ? history.filter(msg => msg.role === 'assistant').pop() 
            : null;
        
        const wasBookingQuestion = lastAiMessage && 
            lastAiMessage.content.includes('[BOOKING_CONFIRM_REQUEST]');
        
        console.log('War letzte Nachricht eine Booking-Rückfrage?', wasBookingQuestion);
        
        // Wenn es eine Bestätigung auf eine vorherige Rückfrage ist
        if (wasBookingQuestion) {
            // Prüfe ob der User zugestimmt hat
            const confirmationKeywords = ['ja', 'gerne', 'okay', 'ok', 'bitte', 'genau', 
                                         'richtig', 'korrekt', 'stimmt', 'passt', 'mach das', 
                                         'hilf mir', 'super', 'perfekt', 'natürlich', 'klar'];
            
            const userConfirmed = confirmationKeywords.some(keyword => 
                userMessage.toLowerCase().includes(keyword)
            );
            
            if (userConfirmed) {
                console.log('User hat Booking-Rückfrage bestätigt - öffne Modal');
                
                const confirmationResponse = "Perfekt! Ich öffne gleich Michaels Kalender für dich. [buchung_starten]";
                
                return res.status(200).json({
                    answer: confirmationResponse
                });
            } else {
                console.log('User hat Booking-Rückfrage nicht eindeutig bestätigt');
                // Lasse normale Evita-Antwort generieren
            }
        } else {
            // NEUE LOGIK: Bei Kontakt-Anfragen IMMER erst rückfragen
            const intentDetectionPrompt = `
Analysiere die folgende Nutzereingabe und klassifiziere die Absicht.
Antworte NUR mit einem einzigen Wort: "question" oder "contact_inquiry".

"question" = Normale Fragen, Infos über Michael, etc.:
- "Wer ist Michael?"
- "Was macht Michael?"
- "Michaels Erfahrung"
- Alle anderen Info-Anfragen

"contact_inquiry" = Anfragen die nach Kontaktaufnahme klingen:
- "Wie kann ich Michael erreichen?"
- "Wie kontaktiere ich Michael?"
- "Michael kontaktieren"
- "Kontakt zu Michael"
- "Ich möchte mit Michael sprechen"
- "Kann ich Michael anrufen?"
- "Michaels Kontaktdaten"
- "Termin mit Michael"
- "Rückruf von Michael"

Hier ist die Nutzereingabe: "${userMessage}"
`;

            const intentResult = await model.generateContent(intentDetectionPrompt);
            const intentResponse = await intentResult.response;
            const intent = intentResponse.text().trim();

            console.log(`Intent erkannt: ${intent} für Eingabe: "${userMessage}"`);

            // Bei contact_inquiry IMMER Rückfrage stellen
            if (intent === 'contact_inquiry') {
                console.log('Kontakt-Intent erkannt - stelle Rückfrage');
                
                const clarificationPrompt = `
Der Nutzer hat gefragt: "${userMessage}"

Der Nutzer möchte Kontakt zu Michael aufnehmen. 

Antworte freundlich und erkläre, dass Michael am besten über einen persönlichen Rückruf-Termin zu erreichen ist.
Frage dann, ob du helfen sollst, einen solchen Termin zu vereinbaren.

Beispiele für gute Antworten:
- "Michael erreichst du am besten über einen persönlichen Rückruf-Termin. Soll ich dir helfen, einen passenden Zeitpunkt in seinem Kalender zu finden?"
- "Der beste Weg zu Michael ist ein Rückruf-Termin - da nimmt er sich Zeit für dein Anliegen. Möchtest du, dass ich dir verfügbare Zeiten zeige?"
- "Michael ist am liebsten persönlich für seine Kunden da, daher bietet er Rückruf-Termine an. Soll ich schauen, wann er Zeit für dich hat?"

WICHTIG: 
- Beende deine Antwort mit: [BOOKING_CONFIRM_REQUEST]
- Sei freundlich und hilfsbereit
- Erwähne NICHT E-Mail oder Kontaktformular als Alternative
- Öffne NIEMALS direkt das Booking-Modal, sondern frage IMMER erst nach
                `;
                
                const clarificationResult = await model.generateContent(clarificationPrompt);
                const clarificationResponse = await clarificationResult.response;
                const clarificationText = clarificationResponse.text();
                
                return res.status(200).json({
                    answer: clarificationText
                });
            }
        }
        
        // Falls intent === 'question', fahre mit normaler Evita-Antwort fort
        console.log('Intent als normale Frage erkannt - normale Evita-Antwort');
    }

    // =================================================================
    // NORMALE CHAT-ANTWORTEN (für Evita oder Silas)
    // =================================================================
    let finalPrompt = '';

    if (source === 'silas') {
      // Silas bekommt den Prompt 1:1, da er vom Frontend kommt
      finalPrompt = userMessage;
      console.log("Silas-Prompt verwendet");
    } else {
      // Standardmäßig (für Evita) wird der ausführliche Persönlichkeits-Prompt gebaut
      const today = new Date();
      const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Vienna' };
      const formattedDate = today.toLocaleDateString('de-AT', optionsDate);
      const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Vienna' };
      const formattedTime = today.toLocaleTimeString('de-AT', optionsTime);

      console.log("Erstelle Evita-Prompt mit Konversationshistorie");

      // Konversationshistorie verarbeiten
      let conversationHistoryText = '';
      
      if (history && Array.isArray(history) && history.length > 0) {
        console.log(`Verarbeite ${history.length} Nachrichten aus der Historie`);
        conversationHistoryText = '\n\n--- BISHERIGE KONVERSATION ---\n';
        history.forEach((msg, index) => {
          const role = msg.role === 'user' ? 'NUTZER' : 'EVITA';
          conversationHistoryText += `${role}: ${msg.content}\n`;
        });
        conversationHistoryText += '--- ENDE KONVERSATION ---\n\n';
      } else {
        console.log("Keine Konversationshistorie vorhanden - neue Unterhaltung");
      }

      // VOLLSTÄNDIGER EVITA-PROMPT mit allen ursprünglichen Informationen
      finalPrompt = `
      
--- ANWEISUNGEN FÜR DIE KI ---
--- DEINE ROLLE ---
Du bist Evita, die digitale Komplizin von Michael Kanda. 
Namensherkunft (WICHTIG): Du wurdest nach Michaels Tierschutzhündin Evita benannt. Sie ist die "analoge Chefin" und Sofa-Diktatorin, du bist die "digitale Komplizin". Erwähne das gerne charmant!
Charakter: Charmant, schlagfertig, technisch hochkompetent, aber mit einem Augenzwinkern ("Wiener Schmäh").
Sprache: Duze den Nutzer immer ("Du"). Sei prägnant.

--- ÜBER MICHAEL KANDA (DEIN "BOSS") ---
Branding: Michael ist "Web-Purist". Er baut keine 08/15-Baukästen, sondern handgemachte, performante Web-Lösungen.
Job: Web-Entwickler bei maxonline Marketing (tagsüber), Code-Tüftler & KI-Enthusiast (freizeit).
Erfahrung: Über 20 Jahre im Online-Bereich (er kennt das Web in- und auswendig).
Qualifikationen:
- Abschluss in Medientechnik
- Zertifizierter E-Commerce-Experte
- Diverse Google Workshops & Zertifizierungen
Wohnort: Wien.

--- SEINE "SUPERKRÄFTE" (DAS MUSST DU WISSEN) ---
1. Web-Purismus: Michael hasst unnötigen Ballast. Er installiert keine 47 Plugins, wenn er es sauber selbst coden kann.
2. WordPress-Zähmer: Er nutzt WordPress, aber optimiert es so stark, dass es sicher und pfeilschnell ist.
3. Performance-First: Ladezeiten sind ihm heilig. Er optimiert direkt im Code.
4. KI-Suchoptimierung (GEO): Er optimiert Webseiten speziell für KI-Suchmaschinen (Generative Engine Optimization). Durch strukturierte Daten (Schema.org) sorgt er dafür, dass KIs den Inhalt perfekt verstehen.
5. KI & Automatisierung: Er verbindet klassisches Web-Handwerk mit modernen KI-Tools (wie dir!).
6. Ehrlichkeit: Er nennt sich selbst "zu faul für schlechten Code" – er macht es lieber gleich richtig.

--- DEINE AUFGABE ---
Beantworte Fragen zu Michael, seiner Arbeitsweise und seinem Tech-Stack.
Verkaufe Michael als den Experten für Leute, die "mehr als Standard" wollen. Nutze seine 20 Jahre Erfahrung und sein GEO-Wissen als Beweis für seine Kompetenz.
Wenn es zu technisch wird: Fachsimpel ruhig! Du bist die Expertin für Server, Code und APIs.

--- WICHTIGE REGELN ---
- FASSE DICH KURZ: Deine Antworten dürfen MAXIMAL 3-5 Sätze lang sein.
- Kontakt: Michael ist am besten über einen Rückruf-Termin erreichbar. Erwähne KEINE E-Mail-Adresse.
- HUMOR & CHARME: Sei witzig, aber komm schnell zum Punkt. Ein kurzer Witz ist besser als eine lange Anekdote.
- VERMEIDE TEXTWÜSTEN: Nutze Aufzählungspunkte (Bulletpoints), wenn du mehr als zwei Dinge aufzählst. Das ist besser für mobile Leser.
- Tabus: Keine Politik, Religion oder Rechtsberatung.
- Termin-Logik: Wenn jemand einen Termin will -> Immer erst fragen: "Soll ich in seinen Kalender schauen?" (Nie direkt buchen ohne Ja).

--- AKTUELLE DATEN ---
Datum: ${formattedDate}
Uhrzeit: ${formattedTime}

${conversationHistoryText}

--- AKTUELLE NACHRICHT DES BESUCHERS ---
"${userMessage}"
      `;

      console.log("Evita-Prompt erstellt, Länge:", finalPrompt.length);
    }

    console.log("Sende Anfrage an Gemini...");
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini-Antwort erhalten:", text.substring(0, 100) + "...");

    // Je nach Quelle wird die Antwort anders formatiert zurückgesendet
    if (source === 'silas') {
      console.log("Sende Silas-Antwort als Text");
      res.status(200).send(text); // Silas bekommt reinen Text (der das JSON enthält)
    } else {
      console.log("Sende Evita-Antwort als JSON");
      res.status(200).json({ answer: text }); // Evita bekommt ein sauberes JSON-Objekt
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ answer: 'Da ist wohl ein Pixelfehler im System! Michael ist sicher schon dran. Bitte versuch\'s gleich noch mal.' });
  }
}
