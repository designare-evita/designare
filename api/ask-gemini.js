import { GoogleGenerativeAI } from "@google/generative-ai";

// API-Schlüssel wird sicher aus den Umgebungsvariablen des Servers geladen
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { question } = req.body;

  // Prüfen, ob eine Frage gesendet wurde
  if (!question) {
    return res.status(400).json({ message: 'Question is required.' });
  }

  try {
    // GEÄNDERT: Modellname auf den aktuellen Wert aktualisiert
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});

    // Ein angepasster Prompt, um die KI in Ihrer Rolle antworten zu lassen
    const prompt = `Du bist Evita, ein freundlicher und professioneller KI-Assistent auf der digitalen Visitenkarte von Michael Kanda, einem Web-Strategen aus Wien. Antworte kurz (maximal 2-3 Sätze), professionell und hilfreich auf die folgende Frage des Besuchers: "${question}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Die Antwort der KI als JSON zurück an das Frontend senden
    res.status(200).json({ answer: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fehler bei der Kommunikation mit der KI." });
  }
}