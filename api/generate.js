// api/generate.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Handler-Funktion, die von Vercel aufgerufen wird
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // API-Schlüssel aus den Vercel Environment Variables laden
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    const { prompt, keyword } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Ein Prompt wird benötigt.' });
    }

    // Robuste Modell-Auswahl
    const modelNames = ["gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-pro"];
    let model = null;
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Silas verwendet erfolgreich das Modell: ${modelName}`);
        break;
      } catch (error) {
        console.warn(`Modell ${modelName} für Silas nicht verfügbar:`, error.message);
        continue;
      }
    }

    if (!model) {
      throw new Error(`Kein verfügbares KI-Modell für Silas gefunden.`);
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // --- NEU: Verbesserte JSON-Bereinigung ---
    // Wir suchen den Start und das Ende des JSON-Objekts in der Antwort der KI.
    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');

    // Wenn kein gültiges Objekt gefunden wird, werfen wir einen Fehler.
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("Kein valides JSON-Objekt in der KI-Antwort gefunden. Antwort war: " + responseText);
    }

    // Wir extrahieren den sauberen JSON-String.
    const jsonString = responseText.substring(startIndex, endIndex + 1);
    
    // Und wandeln ihn dann um.
    const jsonData = JSON.parse(jsonString);
    // --- Ende der Verbesserung ---
    
    jsonData.keyword = keyword;
    res.status(200).json(jsonData);

  } catch (error) {
    console.error("Fehler in /api/generate (Silas):", error);
    res.status(500).json({ error: 'Fehler bei der Inhaltsgenerierung', details: error.message });
  }
};
