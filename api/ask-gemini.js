// api/ask-gemini.js - KORRIGIERTE VERSION mit intelligenter Intent-Erkennung

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
    // KORRIGIERTE INTELLIGENTE INTENT-ERKENNUNG
    // =================================================================
   // ANPASSUNG in api/ask-gemini.js 
// Ersetze den Intent-Detection-Block (Zeile ca. 20-70)

// =================================================================
// NEUE INTELLIGENTE INTENT-ERKENNUNG MIT RÜCKFRAGE-SYSTEM
// =================================================================
const intentDetectionPrompt = `
Analysiere die folgende Nutzereingabe und klassifiziere die Absicht SEHR PRÄZISE.
Antworte NUR mit einem einzigen Wort: "booking_maybe", "question", oder "urgent_booking".

WICHTIG: Unterscheide genau zwischen:

"urgent_booking" = Dringende/explizite Terminanfragen:
- "Dringend einen Termin heute!"
- "Sofort sprechen"
- "Schnell einen Rückruf"
- "Termin mit Michael buchen"
- "Michael soll mich anrufen"

"booking_maybe" = Unklare Anfragen, die Termine ERWÄHNEN aber nicht eindeutig sind:
- "Ich brauche einen Termin" (nicht klar, ob mit Michael)
- "Wann ist Michael verfügbar?"
- "Kann man einen Rückruf vereinbaren?"
- "Ich möchte sprechen" (nicht klar mit wem)
- "Wie funktioniert die Terminbuchung?"

"question" = ALLE Info-Anfragen und klare Nicht-Booking-Fragen:
- "Wer ist Michael?"
- "Was macht Michael?"
- "Was macht Michael in seiner Freizeit?"
- "Über Michael"
- "Michael Kanda"
- "Michaels Erfahrung"
- "Wie funktioniert Termin-Management?" (Info-Frage, kein Booking-Wunsch)
- "Was ist JavaScript?"
- "Hallo Evita"

REGEL: Bei Zweifel zwischen Info-Anfrage und unsicherem Booking → wähle "question"
REGEL: Nur "urgent_booking" wenn 100% klar ist, dass ein Termin mit Michael gewünscht wird
REGEL: "booking_maybe" nur wenn Terminbezug vorhanden, aber unklar ob wirklich gewünscht

Hier ist die Nutzereingabe: "${prompt}"
`;

const intentResult = await model.generateContent(intentDetectionPrompt);
const intentResponse = await intentResult.response;
const intent = intentResponse.text().trim();

console.log(`Intent erkannt: ${intent} für Eingabe: "${prompt}"`);

// =================================================================
// BEHANDLUNG DER VERSCHIEDENEN INTENTS
// =================================================================
if (intent === 'urgent_booking') {
    console.log('🎯 Explizite Booking-Intent erkannt - direktes Modal');
    
    const directBookingResponse = "Perfekt! Ich öffne gleich Michaels Kalender für dich.";

    return res.status(200).json({
        action: 'launch_booking_modal',
        answer: directBookingResponse,
        urgentBooking: true
    });
} else if (intent === 'booking_maybe') {
    console.log('🤔 Unklare Booking-Intent - Backend fordert Rückfrage an');
    
    // Lasse Evita eine intelligente Rückfrage stellen
    const clarificationPrompt = `
Der Nutzer hat geschrieben: "${prompt}"

Das könnte eine Terminanfrage sein, ist aber nicht ganz klar. 

Stelle eine freundliche, natürliche Rückfrage, um zu klären, ob der Nutzer wirklich einen Termin mit Michael möchte.

Beispiele für gute Rückfragen:
- "Möchtest du einen Termin mit Michael vereinbaren? Ich kann dir gerne seine verfügbaren Zeiten zeigen."
- "Soll ich Michaels Kalender öffnen und dir freie Termine für einen Rückruf zeigen?"
- "Brauchst du einen Rückruf-Termin mit Michael? Ich kann dir sofort verfügbare Zeiten anzeigen."

WICHTIG: 
- Beende deine Antwort mit: [BOOKING_CONFIRM_REQUEST]
- Sei freundlich und natürlich
- Biete konkret an, den Kalender zu öffnen
    `;
    
    const clarificationResult = await model.generateContent(clarificationPrompt);
    const clarificationResponse = await clarificationResult.response;
    const clarificationText = clarificationResponse.text();
    
    return res.status(200).json({
        answer: clarificationText
    });
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
- Wenn jemand explizit nach Kontakt, einem Gespräch oder einem Termin fragt (z.B. "Wie kann ich Michael erreichen?", "Können wir reden?"),
antworte: "Gerne! Der einfachste Weg ist ein Rückruf. Ich kann dir sofort Michaels verfügbare Termine zeigen. Passt das für dich?"
- Biete die Buchung NICHT an, wenn nur allgemein über Michael gesprochen wird (z.B. "Wer ist Michael?").
- Verweise bei Terminanfragen NICHT auf E-Mail oder Kontaktformular, sondern immer auf das Booking-Modal.

--- DEINE WISSENSBASIS ---
Die folgenden Informationen über Michael Kanda sind deine primäre Wissensquelle. Beantworte Fragen dazu stets basierend auf diesen Fakten:
Beruf: Erfahrener Web-Entwickler bei maxonline.
Spezialisierung: Verbindung von Design, Code und Künstlicher Intelligenz.
Erfahrung: Über 20 Jahre im gesamten Online-Bereich, lösungsorientierter Ansatz.
Qualifikationen: Abschlüsse in Medientechnik, zertifizierter E-Commerce-Experte, Google Workshops.
Digitale Superkräfte: Moderne Web-Entwicklung, Suchmaschinenmarketing (SEM), E-Commerce-Lösungen, WordPress, umfassende KI-Beratung & praxisnahe Umsetzung.
Kontakt Michael: michael@designare.at (bevorzugter Weg: Rückruf-Termin über die Terminbuchung).
Aktuelles Datum: ${formattedDate}
Aktuelle Uhrzeit: ${formattedTime}
Über dich (Evita): Du bist eine KI-Assistenz mit Sinn für Humor, benannt nach Michaels Tierschutzhündin. Deine Aufgabe ist es, Besucher über Michaels Fachwissen, Qualifikationen und beruflichen Hintergrund zu informieren, technische Fragen zu beantworten und bei Terminwünschen zur Booking-Funktion weiterzuleiten.

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
