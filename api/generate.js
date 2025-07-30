// api/generate.js

// Importiert die Google AI Bibliothek
import { GoogleGenerativeAI } from '@google/generative-ai';

// Handler-Funktion, die von Vercel aufgerufen wird
export default async function handler(req, res) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // API-Schlüssel sicher aus den Vercel Environment Variables laden
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // Daten aus der Anfrage des Frontends auslesen
    const { history, prompt } = req.body;

    // WICHTIG: Aktualisierte Modellnamen für 2025
    // Probiere verschiedene verfügbare Modelle in der Reihenfolge ihrer Verfügbarkeit
    const modelNames = [
      "gemini-2.0-flash-exp",      // Neuestes experimentelles Modell
      "gemini-1.5-flash",          // Falls noch verfügbar
      "gemini-1.5-pro",            // Falls noch verfügbar
      "gemini-pro"                 // Fallback (möglicherweise veraltet)
    ];

    let model = null;
    let lastError = null;

    // Versuche verschiedene Modelle, bis eines funktioniert
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Erfolgreich Modell geladen: ${modelName}`);
        break;
      } catch (error) {
        console.warn(`Modell ${modelName} nicht verfügbar:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!model) {
      throw new Error(`Kein verfügbares Modell gefunden. Letzter Fehler: ${lastError?.message}`);
    }

    const chat = model.startChat({
      history: history || [], // Benutze den übergebenen Verlauf
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Sende die Antwort der KI im JSON-Format zurück an das Frontend
    res.status(200).json({ text });

  } catch (error) {
    // Loggt den detaillierten Fehler auf dem Vercel-Server (sichtbar im Dashboard)
    console.error("Error in /api/generate:", error); 
    
    // Detailliertere Fehlermeldung für Debugging
    const errorMessage = error.message || 'Unbekannter Fehler';
    console.error("Detaillierter Fehler:", {
      message: errorMessage,
      stack: error.stack,
      name: error.name
    });
    
    // Sendet eine spezifischere Fehlermeldung an den Benutzer
    res.status(500).json({ 
      error: `Fehler bei der Kommunikation mit der KI: ${errorMessage}` 
    });
  }
}
