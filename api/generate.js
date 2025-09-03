// api/generate.js - Aktualisierte Version mit nachträglicher Qualitätskontrolle

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { FactChecker } = require('./fact-checker.js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const factChecker = new FactChecker();

function cleanJsonString(str) {
    return str.replace(/```json/g, '').replace(/```/g, '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { keywords } = req.body;
    const isMasterRequest = req.headers['x-silas-master'] === process.env.SILAS_MASTER_PASSWORD;

    console.log(`[START] Beginne Verarbeitung für ${keywords.length} Keywords. Master-Modus: ${isMasterRequest}`);

    const generationPromises = keywords.map(async (keywordData) => {
      const { keyword, intent, domain, email, phone, brand } = keywordData;
      console.log(`[PROCESSING] Verarbeite Keyword: '${keyword}'`);

      try {
        const usedModel = isMasterRequest ? "gemini-1.5-pro-latest" : "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: usedModel });

        const prompt = factChecker.generateResponsiblePrompt(keywordData);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = await response.text();
        
        let jsonData = {};
        let parseError = false;

        try {
            jsonData = JSON.parse(cleanJsonString(text));
        } catch (e) {
            console.warn(`[WARN] JSON-Parsing für '${keyword}' fehlgeschlagen. Versuche Fallback. Fehler:`, e.message);
            parseError = true;
            jsonData = { 
                post_title: `Fehler bei der Inhalts-Erstellung für: ${keyword}`,
                meta_description: "Der von der KI generierte Inhalt war kein valides JSON und konnte nicht verarbeitet werden.",
                h1: `Verarbeitungsfehler für: ${keyword}`,
                _fallback_used: true,
                _parse_error: e.message
            };
        }

        // =================================================================
        // NEU: NACHTRÄGLICHE QUALITÄTSKONTROLLE WIRD HIER DURCHGEFÜHRT
        // =================================================================
        if (!parseError) {
            // Wir rufen die checkContent-Funktion auf, die den Inhalt analysiert.
            const factCheckResult = await factChecker.checkContent(jsonData, keyword);
            // Wir hängen das komplette Prüfergebnis an unsere JSON-Antwort an.
            jsonData._factCheck = factCheckResult;
        }
        // =================================================================

        // Deine originale Logik zur Anreicherung der Daten bleibt erhalten
        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData.domain = domain;
        jsonData.email = email;
        jsonData.phone = phone;
        jsonData.brand = brand;
        jsonData._meta = { model_used: usedModel, generation_time: new Date().toISOString(), master_mode: isMasterRequest, success: !parseError };
        
        console.log(`✅ Antwort für '${keyword}' bereit.`);
        return jsonData;

      } catch (error) {
        console.error(`💥 Fehler bei der Verarbeitung von '${keyword}':`, error);
        return { keyword, intent, brand, error: error.message, _meta: { success: false, master_mode: isMasterRequest } };
      }
    });

    const results = await Promise.all(generationPromises);
    console.log('✅ Alle Antworten bereit, sende zum Client.');
    return res.status(200).json(results);

  } catch (error) {
    console.error('💥 Unerwarteter, kritischer Fehler im Handler:', error);
    res.status(500).json({ 
      error: 'Interner Server-Fehler',
      details: 'Ein unerwarteter Fehler ist aufgetreten. Bitte überprüfe die Server-Logs.'
    });
  }
}
