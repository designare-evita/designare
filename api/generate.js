// api/generate.js - Aktualisierte Version mit sequenzieller Verarbeitung und Qualitätskontrolle

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { FactChecker } = require('./fact-checker.js'); // Stelle sicher, dass der Pfad korrekt ist

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const factChecker = new FactChecker();

function cleanJsonString(str) {
    // Entfernt Markdown-Codeblöcke und trimmt Leerzeichen
    return str.replace(/```json/g, '').replace(/```/g, '').trim();
}

// Hilfsfunktion für Verzögerungen
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { keywords } = req.body;
    // Prüft, ob ein spezieller Header für den Master-Modus gesetzt ist
    const isMasterRequest = req.headers['x-silas-master'] === process.env.SILAS_MASTER_PASSWORD;

    console.log(`[START] Beginne Verarbeitung für ${keywords.length} Keywords. Master-Modus: ${isMasterRequest}`);

    const results = [];
    // Gehe durch jedes Keyword nacheinander
    for (const keywordData of keywords) {
      const { keyword, intent, domain, email, phone, brand } = keywordData;
      console.log(`[PROCESSING] Verarbeite Keyword: '${keyword}'`);

      try {
        // Wähle das Modell basierend auf dem Master-Modus
        const usedModel = isMasterRequest ? "gemini-2.5-pro" : "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({ model: usedModel });

        // Erstelle den Prompt für die KI
        const prompt = factChecker.generateResponsiblePrompt(keywordData);

        // Generiere den Inhalt für das aktuelle Keyword
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = await response.text();

        let jsonData = {};
        let parseError = false;

        try {
            // Versuche, die Antwort als JSON zu parsen
            jsonData = JSON.parse(cleanJsonString(text));
        } catch (e) {
            console.warn(`[WARN] JSON-Parsing für '${keyword}' fehlgeschlagen. Versuche Fallback. Fehler:`, e.message);
            parseError = true;
            // Erstelle ein Fallback-Objekt im Fehlerfall
            jsonData = {
                post_title: `Fehler bei der Inhalts-Erstellung für: ${keyword}`,
                meta_description: "Der von der KI generierte Inhalt war kein valides JSON und konnte nicht verarbeitet werden.",
                h1: `Verarbeitungsfehler für: ${keyword}`,
                _fallback_used: true,
                _parse_error: e.message
            };
        }

        // Führe die Qualitätskontrolle durch, wenn das Parsen erfolgreich war
        if (!parseError) {
            const factCheckResult = await factChecker.checkContent(jsonData, keyword);
            jsonData._factCheck = factCheckResult;
        }

        // Füge Metadaten und ursprüngliche Keyword-Daten hinzu
        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData.domain = domain;
        jsonData.email = email;
        jsonData.phone = phone;
        jsonData.brand = brand;
        jsonData._meta = { model_used: usedModel, generation_time: new Date().toISOString(), master_mode: isMasterRequest, success: !parseError };

        console.log(`✅ Antwort für '${keyword}' bereit.`);
        results.push(jsonData); // Füge das Ergebnis zur Liste hinzu

      } catch (error) {
        console.error(`💥 Fehler bei der Verarbeitung von '${keyword}':`, error);
        // Füge ein Fehlerobjekt zur Ergebnisliste hinzu
        results.push({ keyword, intent, brand, error: error.message, _meta: { success: false, master_mode: isMasterRequest } });
      }

      // Füge eine Verzögerung ein, um das Rate Limit der API nicht zu überschreiten
      // 1 Sekunde Verzögerung (1000ms), reduziere auf 0.1s (100ms) im Master-Modus
      await delay(isMasterRequest ? 100 : 1000);
    } // Ende der for...of Schleife

    console.log('✅ Alle Antworten bereit, sende zum Client.');
    return res.status(200).json(results); // Sende die gesammelten Ergebnisse

  } catch (error) {
    console.error('💥 Unerwarteter, kritischer Fehler im Handler:', error);
    res.status(500).json({
      error: 'Interner Server-Fehler',
      details: 'Ein unerwarteter Fehler ist aufgetreten. Bitte überprüfe die Server-Logs.'
    });
  }
}
