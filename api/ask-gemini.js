// api/ask-gemini.js - NEUE VEREINFACHTE VERSION für einheitliches Booking-Modal

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
    // BOOKING-ANFRAGEN → MODAL WEITERLEITUNG
    // =================================================================
    if (intent === 'booking' || intent === 'urgent_booking') {
        console.log('🎯 Booking-Intent erkannt - leite zu Modal weiter');
        
        const simpleBookingResponse = intent === 'urgent_booking' 
            ? "Verstehe, du brauchst dringend einen Termin! Ich öffne gleich Michaels Kalender für dich."
            : "Perfekt! Ich öffne Michaels Kalender und zeige dir die verfügbaren Termine.";

        return res.status(200).json({
            action: 'launch_booking_modal',
            answer: simpleBookingResponse,
            urgentBooking: intent === 'urgent_booking'
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
