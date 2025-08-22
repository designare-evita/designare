// api/generate.js

// Korrigiert: Node.js 'require' Syntax verwenden
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Handler-Funktion, die von Vercel aufgerufen wird
module.exports = async (req, res) => {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // API-Schlüssel sicher aus den Vercel Environment Variables laden
    // Stelle sicher, dass der Schlüssel in Vercel 'GOOGLE_API_KEY' heißt
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // Daten aus der Anfrage von silas-form.js auslesen
    const { prompt, keyword } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Ein Prompt wird benötigt.' });
    }

    // Hinzugefügt: Robuste Modell-Auswahl wie bei Evita
    const modelNames = [
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash",
      "gemini-pro"
    ];

    let model = null;
    let lastError = null;

    // Versuche verschiedene Modelle, bis eines funktioniert
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Silas verwendet erfolgreich das Modell: ${modelName}`);
        break; 
      } catch (error) {
        console.warn(`Modell ${modelName} für Silas nicht verfügbar:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!model) {
      throw new Error(`Kein verfügbares KI-Modell für Silas gefunden. Letzter Fehler: ${lastError?.message}`);
    }

    // Führe den einzelnen Prompt aus
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Bereinige die Antwort, um sicherzustellen, dass es valides JSON ist
    const cleanJsonText = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
    const jsonData = JSON.parse(cleanJsonText);
    
    // Füge das Keyword wieder hinzu für die Anzeige im Frontend
    jsonData.keyword = keyword;

    // Sende das fertige JSON-Objekt zurück
    res.status(200).json(jsonData);

  } catch (error) {
    // Loggt den detaillierten Fehler auf dem Vercel-Server
    console.error("Fehler in /api/generate (Silas):", error); 
    res.status(500).json({ error: 'Fehler bei der Inhaltsgenerierung', details: error.message });
  }
};
