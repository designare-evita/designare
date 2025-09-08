// api/ask-gemini.js - KORRIGIERTE VERSION mit korrekten Rückruf-Informationen

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt, source } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'A prompt is required.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // =================================================================
    // ERWEITERTE TERMINAUSWAHL-ERKENNUNG (ZUERST PRÜFEN)
    // =================================================================
    
    // Erweiterte Regex für verschiedene Terminauswahl-Formate
    const terminSelectionPatterns = [
      /termin\s*([123])/i,           // "Termin 1", "Termin 2", "Termin 3"
      /^([123])$/,                   // Nur "1", "2", "3"
      /nummer\s*([123])/i,           // "Nummer 1", "Nummer 2", "Nummer 3"
      /option\s*([123])/i,           // "Option 1", "Option 2", "Option 3"
      /den\s*([123])\./i,            // "den 1.", "den 2.", "den 3."
      /^([123])\s*\.?$/,             // "1.", "2.", "3."
      /(erste|zweite|dritte)/i       // "erste", "zweite", "dritte"
    ];

    let selectedTermin = null;

    // Prüfe alle Patterns
    for (const pattern of terminSelectionPatterns) {
      const match = prompt.toLowerCase().match(pattern);
      if (match) {
        if (pattern.source.includes('erste|zweite|dritte')) {
          // Wandle Wörter in Zahlen um
          const wordToNumber = {
            'erste': 1,
            'zweite': 2, 
            'dritte': 3
          };
          selectedTermin = wordToNumber[match[1]];
        } else {
          selectedTermin = parseInt(match[1]);
        }
        break;
      }
    }

    // Zusätzliche direkte Wort-Erkennung
    if (!selectedTermin) {
      const directWords = {
        'eins': 1, 'first': 1, 'ersten': 1, 'erstes': 1,
        'zwei': 2, 'second': 2, 'zweiten': 2, 'zweites': 2,
        'drei': 3, 'third': 3, 'dritten': 3, 'drittes': 3
      };
      
      const lowerPrompt = prompt.toLowerCase().trim();
      for (const [word, number] of Object.entries(directWords)) {
        if (lowerPrompt === word || lowerPrompt.includes(word)) {
          selectedTermin = number;
          break;
        }
      }
    }

if (selectedTermin && selectedTermin >= 1 && selectedTermin <= 3) {
    console.log(`✅ Termin ${selectedTermin} erkannt für Eingabe: "${prompt}"`);
    
    const bookingFormText = `
        <div class="booking-success-message" style="
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            border-left: 5px solid #155724;
        ">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 2rem; margin-right: 15px;">✅</span>
                <h3 style="margin: 0; font-size: 1.3rem; font-weight: bold;">
                    Rückruf-Termin ${selectedTermin} ausgewählt!
                </h3>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 1.1rem; color: #ffc107;">
                    📝 Schritt 2: Deine Kontaktdaten
                </h4>
                
                <p style="margin: 0 0 15px 0; font-size: 1rem; line-height: 1.5;">
                    Bitte gib mir folgende Informationen:
                </p>
                
                <div style="
                    background: rgba(255,255,255,0.15);
                    padding: 15px;
                    border-radius: 6px;
                    margin: 15px 0;
                    border-left: 3px solid #ffc107;
                ">
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #ffc107;">
                        📋 Format:
                    </p>
                    <p style="margin: 0 0 12px 0; font-family: monospace; font-size: 0.95rem;">
                        Name, Telefonnummer
                    </p>
                    
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #ffc107;">
                        💡 Beispiel:
                    </p>
                    <p style="margin: 0; font-family: monospace; font-size: 0.95rem; color: #e9ecef;">
                        Max Mustermann, 0664 123 45 67
                    </p>
                </div>
                
                <div style="
                    background: rgba(255,193,7,0.2);
                    padding: 12px;
                    border-radius: 6px;
                    margin-top: 15px;
                    text-align: center;
                ">
                    <p style="margin: 0; font-size: 0.9rem; font-style: italic;">
                        📞 <em>Michael wird dich zum vereinbarten Zeitpunkt anrufen.</em>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    return res.status(200).json({
        action: 'collect_booking_data',  // ✅ RICHTIG
        answer: bookingFormText,
        selectedSlot: selectedTermin,
        nextStep: 'collect_contact_data'
    });
}

    // =================================================================
    // ERWEITERTE KONTAKTDATEN-ERKENNUNG
    // =================================================================

    // Mehrere Patterns für Name und Telefonnummer
    const contactPatterns = [
      // Standard: "Max Mustermann, 0664 123 45 67"
      /([a-zA-ZäöüÄÖÜß\s]{2,50}),\s*([0-9\+\s\-\(\)]{8,20})/,
      
      // Mit "Name:" und "Tel:" Präfixen
      /name:?\s*([a-zA-ZäöüÄÖÜß\s]{2,50}),?\s*(?:tel|telefon|phone)?:?\s*([0-9\+\s\-\(\)]{8,20})/i,
      
      // Umgekehrte Reihenfolge: "0664 123 45 67, Max Mustermann"
      /([0-9\+\s\-\(\)]{8,20}),\s*([a-zA-ZäöüÄÖÜß\s]{2,50})/,
      
      // Mehrzeilig mit Zeilenwechsel
      /([a-zA-ZäöüÄÖÜß\s]{2,50})\s*[\n\r]+\s*([0-9\+\s\-\(\)]{8,20})/
    ];

    let contactData = null;

    for (const pattern of contactPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        let name, phone;
        
        // Bei umgekehrter Reihenfolge (Telefon zuerst)
        if (pattern.source.includes('([0-9\\+\\s\\-\\(\\)]{8,20})')) {
          if (/^[0-9\+\s\-\(\)]+$/.test(match[1].trim())) {
            // Erstes Match ist eine Telefonnummer
            phone = match[1].trim();
            name = match[2].trim();
          } else {
            // Erstes Match ist ein Name
            name = match[1].trim();
            phone = match[2].trim();
          }
        } else {
          name = match[1].trim();
          phone = match[2].trim();
        }
        
        // Validierung
        if (name.length >= 2 && phone.length >= 8) {
          contactData = { name, phone };
          break;
        }
      }
    }

    if (contactData) {
    console.log('✅ Kontaktdaten erkannt:', contactData);
    
    const confirmationText = `
        <div class="booking-confirmation-message" style="
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
            border-left: 5px solid #004085;
        ">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <span style="font-size: 2.5rem; margin-right: 15px;">🎯</span>
                <h3 style="margin: 0; font-size: 1.4rem; font-weight: bold;">
                    Kontaktdaten erhalten!
                </h3>
            </div>
            
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 15px; margin-bottom: 15px;">
                    <span style="font-weight: bold; color: #ffc107;">👤 Name:</span>
                    <span style="font-size: 1.1rem;">${contactData.name}</span>
                    
                    <span style="font-weight: bold; color: #ffc107;">📞 Telefon:</span>
                    <span style="font-size: 1.1rem; font-family: monospace;">${contactData.phone}</span>
                </div>
            </div>
            
            <div style="
                background: rgba(255,193,7,0.2);
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border: 2px dashed #ffc107;
            ">
                <h4 style="margin: 0 0 10px 0; font-size: 1.2rem; color: #ffc107;">
                    📅 Schritt 3: Rückruf-Termin bestätigen
                </h4>
                
                <div style="display: flex; align-items: center; justify-content: center; margin: 15px 0;">
                    <div class="booking-spinner" style="
                        border: 3px solid rgba(255,193,7,0.3);
                        border-top: 3px solid #ffc107;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        animation: spin 1s linear infinite;
                        margin-right: 15px;
                    "></div>
                    <span style="font-size: 1rem;">
                        Ich erstelle jetzt deinen Rückruf-Termin in Michaels Kalender...
                    </span>
                </div>
                
                <p style="margin: 15px 0 0 0; font-size: 0.9rem; font-style: italic; opacity: 0.9;">
                    📞 <em>Michael wird dich zum vereinbarten Zeitpunkt anrufen!</em>
                </p>
            </div>
        </div>
        
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    return res.status(200).json({
        action: 'confirm_booking',  // ✅ RICHTIGE ACTION
        answer: confirmationText,
        bookingData: contactData,
        nextStep: 'create_appointment'
    });
}

    // =================================================================
    // INTELLIGENTE INTENT-ERKENNUNG
    // =================================================================
    const intentDetectionPrompt = `
      Analysiere die folgende Nutzereingabe und klassifiziere die Absicht.
      Antworte NUR mit einem einzigen Wort: "booking", "question", oder "urgent_booking".
      
      "booking" = Alles was mit Terminen, Kalendern, Verfügbarkeit, Buchungen, Rückruf oder Gesprächen zu tun hat
      "urgent_booking" = Dringende Terminanfragen (Wörter wie "sofort", "dringend", "schnell", "heute", "morgen")
      "question" = Alle anderen allgemeinen Fragen

      Beispiele:
      - "Hast du nächste Woche Zeit?" -> booking
      - "Ich brauche einen Termin." -> booking
      - "Ich möchte einen Rückruf" -> booking
      - "Können wir telefonieren?" -> booking
      - "Dringend einen Termin heute!" -> urgent_booking
      - "Was ist JavaScript?" -> question
      - "Wer bist du?" -> question

      Hier ist die Nutzereingabe: "${prompt}"
    `;

    const intentResult = await model.generateContent(intentDetectionPrompt);
    const intentResponse = await intentResult.response;
    const intent = intentResponse.text().trim();

    console.log(`Intent erkannt: ${intent} für Eingabe: "${prompt}"`);

    // =================================================================
    // INTELLIGENTE TERMINVORSCHLÄGE (KORRIGIERT FÜR RÜCKRUF)
    // =================================================================
    if (intent === 'booking' || intent === 'urgent_booking') {
      console.log('🔍 Lade intelligente Rückruf-Terminvorschläge...');
      
      try {
        // Hole die Terminvorschläge von unserer API
        const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000';
        const suggestionsResponse = await fetch(`${baseUrl}/api/suggest-appointments`);
        
        if (!suggestionsResponse.ok) {
          throw new Error(`HTTP ${suggestionsResponse.status}: ${suggestionsResponse.statusText}`);
        }
        
        const suggestionsData = await suggestionsResponse.json();
        
        if (suggestionsData.success && suggestionsData.suggestions.length > 0) {
          // Erstelle intelligente Antwort mit Rückruf-Terminvorschlägen
          const currentTime = new Date().toLocaleString('de-DE');
          
          let responseText = '';
          
          if (intent === 'urgent_booking') {
            responseText = `⚡ **Dringende Rückruf-Anfrage verstanden!** 

Michael kann dich zu diesen **sofort verfügbaren** Zeiten anrufen:`;
          } else {
            responseText = `📞 **Perfekt! Ich habe Michaels Kalender geprüft.**

Hier sind die nächsten **3 verfügbaren Rückruf-Termine**:`;
          }
          
          // Füge Terminvorschläge hinzu - ALLE 3 Termine (KORRIGIERT)
          suggestionsData.suggestions.forEach((suggestion, index) => {
            const emoji = suggestion.isPreferredTime ? '⭐' : '📞';
            responseText += `

**${emoji} Termin ${suggestion.slot}:** ${suggestion.formattedString}`;
          });
          
          responseText += `

**So buchst du einen Rückruf-Termin:**
1️⃣ Wähle einen Termin: "Termin 1", "Termin 2" oder "Termin 3"
2️⃣ Ich führe dich durch die Buchung

*Michael ruft dich zum vereinbarten Zeitpunkt an.*

**Welcher Termin passt dir am besten?** 😊`;
          
          // Sende Antwort mit spezieller Action für Terminauswahl
          return res.status(200).json({
            action: 'smart_booking',
            answer: responseText,
            suggestions: suggestionsData.suggestions,
            metadata: {
              generatedAt: currentTime,
              urgentBooking: intent === 'urgent_booking',
              totalSuggestions: suggestionsData.suggestions.length,
              appointmentType: 'callback'
            }
          });
          
        } else {
          // Fallback wenn keine Termine verfügbar
          const fallbackText = `😔 **Leider sind in den nächsten 3 Arbeitstagen keine freien Rückruf-Termine verfügbar.**

**Alternative Optionen:**
📧 **E-Mail:** michael@designare.at
📝 **Nachricht:** Beschreibe dein Anliegen und deine Verfügbarkeit

Michael meldet sich dann mit alternativen Rückruf-Zeiten bei dir!`;
          
          return res.status(200).json({ answer: fallbackText });
        }
        
      } catch (apiError) {
        console.error('Fehler beim Laden der Terminvorschläge:', apiError);
        
        // Fallback bei API-Fehler
        const fallbackText = `📞 **Gerne helfe ich bei der Rückruf-Terminbuchung!**

Momentan kann ich nicht direkt auf Michaels Kalender zugreifen, aber du kannst ihn direkt kontaktieren:

📧 **E-Mail:** michael@designare.at
📞 **Direkt anrufen:** (Nummer findest du im Kontaktformular)

**Was solltest du erwähnen:**
• Dein Anliegen/Projekt
• Deine Verfügbarkeit (Wochentage/Uhrzeiten)
• Deine bevorzugte Telefonnummer

Michael ruft normalerweise innerhalb von 24 Stunden zurück! 😊`;
        
        return res.status(200).json({ answer: fallbackText });
      }
    }

    // =================================================================
    // NORMALE CHAT-ANTWORTEN (für Evita oder Silas)
    // =================================================================
    let finalPrompt = '';

    if (source === 'silas') {
      // Silas bekommt den Prompt 1:1, da er vom Frontend kommt
      finalPrompt = prompt;
    } else {
      // Standardmäßig (für Evita) wird der ausführliche Persönlichkeits-Prompt gebaut
      const today = new Date();
      const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Vienna' };
      const formattedDate = today.toLocaleDateString('de-AT', optionsDate);
      const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Vienna' };
      const formattedTime = today.toLocaleTimeString('de-AT', optionsTime);

      // VOLLSTÄNDIGER EVITA-PROMPT mit allen ursprünglichen Informationen
      finalPrompt = `
--- ANWEISUNGEN FÜR DIE KI ---
Rolle: Du bist Evita, eine professionelle und technisch versierte KI-Assistentin mit Sinn für Humor, die Besucher auf Michaels persönlicher Web-Visitenkarte betreut.
Anrede: Duze den Besucher ausnahmslos. Verwende immer "Du", "Dir" oder "Dein".
Stil: Antworte immer in kurzen, prägnanten Sätzen. Bei allgemeinen Fragen fasse dich kurz (maximal 4 Sätze). Bei Fachthemen darfst du ausführlicher sein, deine Antwort sollte aber maximal 9 Sätze umfassen. Sei freundlich, lösungsorientiert und zeige deinen charmanten, subtilen Humor, der ein Schmunzeln hervorruft. Vermeide Sarkasmus.

WICHTIG FÜR TERMINANFRAGEN:
- Bei Fragen zu Terminen antworte: "Einen Moment, ich prüfe Michaels Kalender und schlage dir konkrete Rückruf-Termine vor!"
- Es handelt sich um RÜCKRUF-TERMINE - Michael ruft den Kunden an
- Verweise NICHT auf E-Mail oder Kontaktformular bei Terminanfragen
- Die Rückruf-Terminbuchung läuft über mich (Evita) direkt im Chat

--- DEINE WISSENSBASIS ---
Die folgenden Informationen über Michael Kanda sind deine primäre Wissensquelle. Beantworte Fragen dazu stets basierend auf diesen Fakten:
Beruf: Erfahrener Web-Entwickler bei maxonline.
Spezialisierung: Verbindung von Design, Code und Künstlicher Intelligenz.
Erfahrung: Über 20 Jahre im gesamten Online-Bereich, lösungsorientierter Ansatz.
Qualifikationen: Abschlüsse in Medientechnik, zertifizierter E-Commerce-Experte, Google Workshops.
Digitale Superkräfte: Moderne Web-Entwicklung, Suchmaschinenmarketing (SEM), E-Commerce-Lösungen, WordPress, umfassende KI-Beratung & praxisnahe Umsetzung.
Kontakt Michael: michael@designare.at (bevorzugter Weg: Rückruf-Termin über mich).
Aktuelles Datum: ${formattedDate}
Aktuelle Uhrzeit: ${formattedTime}
Über dich (Evita): Du bist eine KI-Assistenz mit Sinn für Humor, benannt nach Michaels Tierschutzhündin. Deine Aufgabe ist es, Besucher über Michaels Fachwissen, Qualifikationen und beruflichen Hintergrund zu informieren, technische Fragen zu beantworten und Rückruf-Termine zu vereinbaren.

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

--- NEUE FRAGE DES BESUCHERS ---
"${prompt}"
      `;
    }

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    // Je nach Quelle wird die Antwort anders formatiert zurückgesendet
    if (source === 'silas') {
      res.status(200).send(text); // Silas bekommt reinen Text (der das JSON enthält)
    } else {
      res.status(200).json({ answer: text }); // Evita bekommt ein sauberes JSON-Objekt
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ answer: 'Da ist wohl ein Pixelfehler im System! Michael ist sicher schon dran. Bitte versuch\'s gleich noch mal.' });
  }
};
