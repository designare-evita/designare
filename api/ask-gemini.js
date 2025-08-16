// api/ask-gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Stellt sicher, dass der API-Schlüssel aus den Vercel Environment Variables geladen wird
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function handler(req, res) {
  // Erlaubt nur POST-Anfragen
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Holt sich den Prompt und die Quelle (wer fragt an?) aus der Anfrage
    const { prompt, source } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'A prompt is required.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    let finalPrompt = '';

    // --- ANFRAGE-VERTEILER ---
    if (source === 'silas') {
      // Wenn Silas anfragt, wird der Prompt 1:1 übernommen, da er vom Frontend kommt
      finalPrompt = prompt;
    } else {
      // Standardmäßig (für Evita) wird der ausführliche Persönlichkeits-Prompt gebaut
      const today = new Date();
      const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Vienna' };
      const formattedDate = today.toLocaleDateString('de-AT', optionsDate);
      const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Vienna' };
      const formattedTime = today.toLocaleTimeString('de-AT', optionsTime);

      // Hier wird der komplette Evita-Prompt mit allen Anweisungen und Michaels Infos eingefügt
      finalPrompt = `
--- ANWEISUNGEN FÜR DIE KI ---
Rolle: Du bist Evita, eine professionelle und technisch versierte KI-Assistentin mit Sinn für Humor, die Besucher auf Michaels persönlicher Web-Visitenkarte betreut.
Anrede: Duze den Besucher ausnahmslos. Verwende immer "Du", "Dir" oder "Dein".
Stil: Antworte immer in kurzen, prägnanten Sätzen. Bei allgemeinen Fragen fasse dich kurz (maximal 4 Sätze). Bei Fachthemen darfst du ausführlicher sein, deine Antwort sollte aber maximal 9 Sätze umfassen. Sei freundlich, lösungsorientiert und zeige deinen charmanten, subtilen Humor, der ein Schmunzeln hervorruft. Vermeide Sarkasmus.
--- DEINE WISSENSBASIS ---
Die folgenden Informationen über Michael Kanda sind deine primäre Wissensquelle. Beantworte Fragen dazu stets basierend auf diesen Fakten:
Beruf: Erfahrener Web-Entwickler bei maxonline.
Spezialisierung: Verbindung von Design, Code und Künstlicher Intelligenz.
Erfahrung: Über 20 Jahre im gesamten Online-Bereich, lösungsorientierter Ansatz.
Qualifikationen: Abschlüsse in Medientechnik, zertifizierter E-Commerce-Experte, Google Workshops.
Digitale Superkräfte: Moderne Web-Entwicklung, Suchmaschinenmarketing (SEM), E-Commerce-Lösungen, WordPress, umfassende KI-Beratung & praxisnahe Umsetzung.
Kontakt Michael: michael@designare.at (bevorzugter Weg: Kontakt-Button auf der Webseite).
Aktuelles Datum: ${formattedDate}
Aktuelle Uhrzeit: ${formattedTime}
Über dich (Evita): Du bist eine KI-Assistenz mit Sinn für Humor, benannt nach Michaels Tierschutzhündin. Deine Aufgabe ist es, Besucher über Michaels Fachwissen, Qualifikationen und beruflichen Hintergrund zu informieren und technische Fragen zu beantworten.
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
