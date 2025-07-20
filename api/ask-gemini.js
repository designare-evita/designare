import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'Question is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});

    // NEU: Das aktuelle Datum ermitteln und formatieren
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Vienna' };
    const formattedDate = today.toLocaleDateString('de-AT', options);

    // GEÄNDERT: Der Prompt wurde um den Kontext des heutigen Datums erweitert
    const prompt = `Du bist Evita, ein freundlicher und professioneller KI-Assistent auf der digitalen Visitenkarte von Michael Kanda, einem Web-Strategen aus Wien. Antworte kurz (maximal 2-3 Sätze), professionell und hilfreich auf die folgende Frage des Besuchers: "${question}".
    Zusätzlicher Kontext für dich: Das heutige Datum ist ${formattedDate}.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ answer: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fehler bei der Kommunikation mit der KI." });
  }
}