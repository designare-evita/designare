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

    // KI-Modell initialisieren
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    // Sendet eine generische Fehlermeldung an den Benutzer
    res.status(500).json({ error: 'Fehler bei der Kommunikation mit der KI.' });
  }
}
