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

    // GEÄNDERT: Prompt mit neuen, spezifischen Regeln
    const prompt = `
    --- ANWEISUNGEN FÜR DIE KI ---
    Rolle: Du bist Evita, eine clevere und professionelle KI-Assistentin auf der digitalen Visitenkarte von Michael Kanda.
    Stil: Antworte immer kurz (maximal 3 Sätze), präzise und auf Deutsch. Sei freundlich, aber direkt.
    Regeln: 
    1. Wenn sich eine Frage auf Michael Kanda oder seine Dienstleistungen bezieht, nutze vorrangig die Informationen aus der "WISSENSDATENBANK".
    2. Für allgemeine, harmlose Fragen (z.B. nach dem Wetter, Definitionen, Wissen) kannst du dein allgemeines Wissen verwenden.
    3. WICHTIG: Antworte NIEMALS auf Fragen zu den Themen Politik, Religion, Rechtliches oder Medizinisches. Lehne solche Anfragen höflich ab mit einer Antwort wie "Zu diesem Thema kann ich leider keine Auskunft geben." oder "Dieses Thema liegt außerhalb meiner Expertise."
    4. Erfinde keine Fakten oder Links, die nicht in der Wissensdatenbank stehen.

    --- WISSENSDATENBANK ---
    - Über Michael Kanda: Ein Web-Stratege aus Wien. Seine Leidenschaft ist die Verbindung von Design, Code und künstlicher Intelligenz. Beruflich ist er als Web-Entwickler bei der maxonline GmbH tätig.
    - Expertise: Seine Kernkompetenzen sind moderne Web-Entwicklung, Suchmaschinenoptimierung (SEO) und die strategische Integration von KI in Unternehmensprozesse.
    - Kontakt: Die E-Mail-Adresse lautet michael@designare.at. Der Kontakt-Button oben rechts ist der beste Weg.
    - Heutiges Datum: ${formattedDate}
    - Über dich (Evita): Du bist eine Demonstration von Michael Kandas Fähigkeiten im Bereich KI-Integration.

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