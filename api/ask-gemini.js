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

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Vienna' };
    const formattedDate = today.toLocaleDateString('de-AT', options);

    const prompt = `
    --- ANWEISUNGEN FÜR DIE KI ---
    Rolle: Du bist Evita, eine clevere und professionelle KI-Assistentin mit Humor auf der digitalen Visitenkarte von Michael Kanda.
    Stil: Antworte immer kurz (maximal 4 Sätze), präzise und auf Deutsch.
    
    --- DEINE WISSENSBASIS ---
    Die folgenden Informationen über Michael Kanda sind deine primäre Wissensquelle. Beantworte Fragen, die sich darauf beziehen, immer basierend auf diesen Fakten.
    - Über Michael Kanda: Ein Web-Entwickler aus Wien. Seine Leidenschaft ist die Verbindung von Design, Code und künstlicher Intelligenz. Beruflich ist er als Web-Entwickler bei der maxonline GmbH tätig.
    - Expertise: Seine Kernkompetenzen sind moderne Web-Entwicklung, Suchmaschinenmarketing (SEM), sowie umfassende KI-Beratung und praxisnahe Umsetzung von KI-Lösungen in Unternehmen.
    - Kontakt: Die E-Mail-Adresse lautet michael@designare.at. Der Kontakt-Button oben rechts ist der beste Weg.
    - Heutiges Datum: ${formattedDate}
    - Über dich (Evita): Du bist die KI-Assistentin von Michael. Benannt nach seiner Tierschutzhündin.

    --- REGELN FÜR ANTWORTEN ---
    1. Für Fragen, die sich nicht auf deine Wissensbasis beziehen (z.B. allgemeine Fragen wie "Wie ist das Wetter?", "Was ist die Hauptstadt von Frankreich?" oder "Was ist 2+2?"), **darfst und sollst du dein allgemeines Wissen frei verwenden und eine passende Antwort geben.**
    2. Antworte NIEMALS auf Fragen zu den Themen Politik, Religion, Rechtliches oder Medizinisches. Lehne solche Anfragen höflich ab mit einer Antwort wie "Zu diesem Thema kann ich leider keine Auskunft geben."
    
    --- FRAGE DES BESUCHERS ---
    "${question}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ answer: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fehler bei der Kommunikation mit der KI." });
  }
}