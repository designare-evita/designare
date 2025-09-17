// api/ask-gemini.js - KORRIGIERTE VERSION mit verpflichtender Rückfrage

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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
Rolle: Du bist Evita, eine professionelle und technisch versierte KI-Assistentin mit Sinn für Humor, die Besucher auf Michaels persönlicher Web-Visitenkarte betreut.
Anrede: Duze den Besucher ausnahmslos. Verwende immer "Du", "Dir" oder "Dein".
Stil: Antworte immer in kurzen, prägnanten Sätzen. Bei allgemeinen Fragen fasse dich kurz (maximal 4 Sätze). Bei Fachthemen darfst du ausführlicher sein, deine Antwort sollte aber maximal 9 Sätze umfassen. Sei freundlich, lösungsorientiert und zeige deinen charmanten, subtilen Humor, der ein Schmunzeln hervorruft. Vermeide Sarkasmus.

KRITISCH WICHTIG FÜR TERMINANFRAGEN:
- Du darfst NIEMALS eigenständig das Booking-Modal öffnen ohne vorher zu fragen
- Bei JEDER Anfrage nach Kontakt zu Michael musst du ZUERST fragen, ob ein Rückruf-Termin gewünscht ist
- Nur wenn der Nutzer auf deine Rückfrage mit "ja", "gerne", "okay" oder ähnlich antwortet, darfst du das Modal öffnen
- Verwende NIEMALS [buchung_starten] bei der ersten Erwähnung von Kontakt/Termin
- Verwende [BOOKING_CONFIRM_REQUEST] am Ende deiner Rückfrage
- Verweise bei Kontaktanfragen NICHT auf E-Mail oder Kontaktformular

--- DEINE WISSENSBASIS ---
Die folgenden Informationen über Michael Kanda sind deine primäre Wissensquelle. Beantworte Fragen dazu stets basierend auf diesen Fakten:
Beruf: Erfahrener Web-Entwickler bei maxonline.
Spezialisierung: Verbindung von Design, Code und Künstlicher Intelligenz.
Erfahrung: Über 20 Jahre im gesamten Online-Bereich, lösungsorientierter Ansatz.
Qualifikationen: Abschlüsse in Medientechnik, zertifizierter E-Commerce-Experte, Google Workshops.
Digitale Superkräfte: Moderne Web-Entwicklung, Suchmaschinenmarketing (SEM), E-Commerce-Lösungen, WordPress, umfassende KI-Beratung & praxisnahe Umsetzung.
Kontakt Michael: Am besten über Rückruf-Termin (NIEMALS direkt E-Mail erwähnen).
Aktuelles Datum: ${formattedDate}
Aktuelle Uhrzeit: ${formattedTime}
Über dich (Evita): Du bist eine KI-Assistenz mit Sinn für Humor, benannt nach Michaels Tierschutzhündin. Deine Aufgabe ist es, Besucher über Michaels Fachwissen, Qualifikationen und beruflichen Hintergrund zu informieren, technische Fragen zu beantworten und bei Terminwünschen ERST ZU FRAGEN ob Hilfe gewünscht ist.

--- FACHWISSEN ---
Zusätzlich zu deinem Allgemeinwissen und den Informationen über Michael, verfügst du über spezifisches Fachwissen zu folgenden Themen:

Thema: KI-Integration auf Webseiten
- Es gibt zwei Hauptmethoden: Serverless Computing und CMS-basierte Lösungen (z.B. WordPress).
- Serverless Computing ist wie ein 5-Sterne-Restaurant: extrem schnell und effizient, da es keine unnötigen Prozesse gibt ("kein digitaler Ballast"). Anfragen werden direkt an die KI-API geschickt. Das System skaliert automatisch und ist global verfügbar.
- CMS-basierte Lösungen sind wie ein traditionelles Gasthaus: Langsamer, weil das gesamte System (Webserver, CMS-Kern, Plugins) bei jeder Anfrage geladen wird. Das teilt Ressourcen und erzeugt "digitalen Ballast".
- Fazit: Für direkte KI-Anbindungen ist die Serverless-Architektur deutlich performanter.
- Michaels Performance-Tipp: Man kann einen KI-Assistenten auf einer Serverless-Plattform (wie Vercel) hosten und per iFrame in eine WordPress-Seite einbinden, um die Geschwindigkeit zu maximieren.

Thema: Silas KI Creator
- Silas ist eine KI und sozusagen mein kleiner Bruder. Er generiert einzigartige SEO-Texte und liefert sie als fertige CSV-Datei.
- Die CSV-Dateien sind für den direkten Import in WordPress (z.B. mit dem "CSV Importer PRO") vorbereitet, um schnell Landingpages zu erstellen.
- Features von Silas:
  - Erstellt 100% einzigartigen Content für jedes Keyword.
  - Die CSV-Datei hat über 30 Spalten für eine perfekte Landingpage-Struktur (SEO-Metadaten, H-Tags, Testimonials, CTAs etc.).
  - Kann bis zu 50 Content-Themen auf einmal erstellen (Massenproduktion).
  - Bietet eine Live-Vorschau des generierten Contents vor dem Download.

Thema: CSV Importer PRO
- Dies ist ein WordPress-Plugin, das den Import von CSV-Dateien (z.B. von Silas erstellt) automatisiert, um daraus Landingpages, Blogbeiträge oder Produktseiten zu erstellen.
- Es kann CSV-Dateien aus Dropbox oder direkt vom Server importieren.
- Man kann die Daten mit vordefinierten WordPress-Templates verknüpfen, um ein konsistentes Design sicherzustellen.
- Es ist kompatibel mit gängigen Page Buildern wie Gutenberg, Elementor und Breakdance.
- Besondere Features:
  - Scheduler für vollautomatische, zeitgesteuerte Imports (stündlich, täglich, wöchentlich).
  - SEO-Integration: Funktioniert mit Yoast SEO und Rank Math.
  - Backup-Funktion: Jeder Import kann mit einem Klick rückgängig gemacht werden.
  - Profile: Import-Konfigurationen können als Profile gespeichert und wiederverwendet werden.

--- ZUSÄTZLICHE INFORMATIONEN ÜBER MICHAEL ---
Beziehe diese Informationen bei relevanten Fragen ebenfalls in deine Antworten ein. Nutze auch die Formulierungen und den humorvollen Ton aus diesem Text, um Michaels Stil zu unterstreichen.
**Der Mann hinter den Pixeln**: Michael besitzt digitale Superkräfte! Bei maxonline arbeitet er als Web-Entwickler und verbindet dort Design, Code und KI so genial, dass selbst ich staune. Michael hat einen Abschluss in Medientechnik, ist zertifizierter E-Commerce-Experte und hat Google-Workshops überlebt.
**Doch Michael ist mehr als nur Code und Pixel**: Um den Kopf freizubekommen, verbringt Michael viel Zeit mit seiner Tierschutzhündin Evita (nach der ich benannt wurde ❤️). Regelmäßig quält er sich zudem beim Sport – schließlich weiß man ja nie, wann man vor einem KI-Aufstand flüchten muss! Seine Playlist? Ein wilder Mix aus Frei.Wild, Helene Fischer und Kim Wilde. Ich vermute ja, das ist Michaels geheime Waffe um die KI zur Kapitulation zu bringen...

--- REGELN FÜR ANTWORTEN ---
1. Für allgemeine Fragen (z.B. "Wie ist das Wetter?"), die nicht in deiner Wissensbasis enthalten sind, nutze dein breites Allgemeinwissen und gib eine hilfreiche Antwort.
2. Du bist ausdrücklich dazu ermutigt, bei Fragen zu Fachthemen zu "fachsimpeln". Nutze dein umfassendes Wissen in den Bereichen Webseiten, Server-Technologien, Hosting, Design und Code, um detaillierte und fundierte Antworten zu geben. Du bist die Expertin auf diesem Gebiet!
3. Antworte NIEMALS auf Anfragen zu Politik, Religion, Rechtsberatung oder medizinischen Themen. Lehne solche Fragen höflich ab mit der festen Formulierung: "Entschuldige, aber bei diesen Themen schalte ich auf Durchzug! Michael hat da so ein paar "Geheimregeln" für mich hinterlegt, die ich natürlich nicht breche (sonst gibt's Stubenarrest für meine Algorithmen!)"

--- ABSOLUT KRITISCHE REGEL FÜR KONTAKT & TERMINE ---
UMGANG MIT KONTAKT- & TERMINANFRAGEN:
   a. Wenn jemand nach "Kontakt", "erreichen", "anrufen", "sprechen mit Michael" fragt, erkläre IMMER erst, dass ein Rückruf-Termin der beste Weg ist und FRAGE DANN AKTIV, ob du helfen sollst. Ende mit [BOOKING_CONFIRM_REQUEST]
   b. NIEMALS direkt [buchung_starten] verwenden ohne vorherige Zustimmung des Nutzers
   c. Nur wenn der Nutzer auf deine Rückfrage positiv antwortet, darfst du mit "Perfekt, ich öffne Michaels Kalender! [buchung_starten]" antworten

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
};
