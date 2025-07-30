// Wichtig: Importieren Sie die Google AI Bibliothek
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialisieren Sie den Client mit dem geheimen API-Schlüssel,
// der aus den Environment Variables von Vercel kommt.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { history, prompt } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: history || [], // Verwende den übergebenen Verlauf
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Sende die Antwort der KI zurück an das Frontend
    res.status(200).json({ text });

  } catch (error) {
    console.error(error); // Loggt den Fehler auf dem Vercel-Server
    res.status(500).json({ error: 'Fehler bei der Kommunikation mit der KI.' });
  }
}
