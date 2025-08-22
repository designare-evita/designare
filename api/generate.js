// api/generate.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Handler-Funktion, die von Vercel aufgerufen wird
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // KORRIGIERT: Verwende den gleichen API-Schlüssel wie ask-gemini.js
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const { prompt, keyword } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Ein Prompt wird benötigt.' });
    }

    // Robuste Modell-Auswahl - verwende das gleiche Modell wie ask-gemini.js
    const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-pro"];
    let model = null;
    let usedModel = null;
    
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        });
        usedModel = modelName;
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

    console.log(`Silas generiert Content für Keyword: "${keyword}"`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log(`Rohe AI-Antwort für "${keyword}":`, responseText.substring(0, 200) + '...');

    // --- Verbesserte JSON-Bereinigung ---
    let jsonData;
    try {
      // Suche nach dem JSON-Objekt in der Antwort
      const startIndex = responseText.indexOf('{');
      const endIndex = responseText.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("Kein valides JSON-Objekt in der KI-Antwort gefunden.");
      }

      // JSON-String extrahieren und bereinigen
      let jsonString = responseText.substring(startIndex, endIndex + 1);
      
      // Häufige Markdown-Probleme beheben
      jsonString = jsonString
        .replace(/```json/gi, '')  // Markdown entfernen (case-insensitive)
        .replace(/```/g, '')       // Markdown entfernen
        .replace(/\\n/g, ' ')      // Escaped newlines ersetzen
        .replace(/\n/g, ' ')       // Echte newlines ersetzen
        .replace(/\r/g, ' ')       // Carriage returns entfernen
        .replace(/\t/g, ' ')       // Tabs ersetzen
        .replace(/\s+/g, ' ')      // Mehrfache Leerzeichen reduzieren
        .trim();

      // JSON parsen
      jsonData = JSON.parse(jsonString);
      
      console.log(`JSON erfolgreich geparst für "${keyword}":`, Object.keys(jsonData));
      
    } catch (parseError) {
      console.error("JSON-Parse-Fehler:", parseError.message);
      console.error("Problematischer Text:", responseText.substring(0, 500));
      
      // Fallback: Erstelle eine Standard-Struktur
      jsonData = {
        post_title: `${keyword} - Professionelle Lösungen`,
        post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        meta_title: `${keyword} | Ihre Experten`,
        meta_description: `Entdecken Sie unsere professionellen ${keyword} Services. Kompetent, zuverlässig und maßgeschneidert für Ihre Bedürfnisse.`,
        h1: `${keyword} - Ihre zuverlässige Lösung`,
        h2_1: `Warum ${keyword} so wichtig ist`,
        h2_2: `Unsere ${keyword} Expertise`,
        h2_3: `${keyword} Services im Detail`,
        h2_4: `Vertrauen Sie unserem ${keyword} Team`,
        primary_cta: "Jetzt anfragen",
        secondary_cta: "Mehr erfahren",
        hero_text: `Willkommen bei Ihrem ${keyword} Experten. Wir bieten professionelle, maßgeschneiderte Lösungen, die Ihre Erwartungen übertreffen.`,
        hero_subtext: `Vertrauen Sie auf unsere Erfahrung im Bereich ${keyword}`,
        benefits_list: `<ul><li>Professionelle ${keyword} Beratung</li><li>Maßgeschneiderte Lösungen</li><li>Erfahrenes Expertenteam</li><li>Zuverlässiger Service</li></ul>`,
        features_list: `<ul><li>Umfassende ${keyword} Analyse</li><li>Individuelle Strategieentwicklung</li><li>Kontinuierliche Betreuung</li><li>Messbare Ergebnisse</li></ul>`,
        social_proof: "Von über 100 zufriedenen Kunden empfohlen",
        testimonial_1: `"Exzellenter ${keyword} Service! Das Team hat unsere Erwartungen übertroffen." - Maria S., Projektleiterin`,
        testimonial_2: `"Professionell, zuverlässig und kompetent. Genau das, was wir für ${keyword} gesucht haben." - Thomas K., Geschäftsführer`,
        pricing_title: "Wählen Sie Ihr passendes Paket",
        price_1: `${keyword} Starter - Ideal für den Einstieg`,
        price_2: `${keyword} Professional - Für anspruchsvolle Projekte`,
        price_3: `${keyword} Enterprise - Maximale Leistung und Support`,
        faq_1: `Was macht Ihren ${keyword} Service besonders?`,
        faq_answer_1: `Unser ${keyword} Service zeichnet sich durch individuelle Beratung, jahrelange Erfahrung und messbare Ergebnisse aus.`,
        faq_2: `Wie lange dauert die Umsetzung?`,
        faq_answer_2: `Die Umsetzungsdauer hängt vom Projektumfang ab. Typischerweise zwischen 2-8 Wochen.`,
        faq_3: `Gibt es eine Garantie?`,
        faq_answer_3: `Ja, wir bieten eine 30-Tage-Zufriedenheitsgarantie auf alle unsere Services.`,
        contact_info: "Fragen? Rufen Sie uns an oder schreiben Sie uns eine E-Mail.",
        footer_cta: "Starten Sie noch heute Ihr Projekt",
        trust_signals: "Zertifiziert • Sicher • Garantiert",
        guarantee_text: "30-Tage-Geld-zurück-Garantie",
        _fallback_used: true,
        _parse_error: parseError.message
      };
      
      console.log(`Fallback-Content für "${keyword}" erstellt`);
    }
    
    // Keyword und Metadaten hinzufügen
    jsonData.keyword = keyword;
    jsonData._meta = {
      model_used: usedModel,
      generation_time: new Date().toISOString()
    };

    console.log(`Silas hat erfolgreich Content für "${keyword}" generiert`);
    res.status(200).json(jsonData);

  } catch (error) {
    console.error("Fehler in /api/generate (Silas):", error);
    
    // Detaillierte Fehlerbehandlung
    let errorMessage = 'Fehler bei der Inhaltsgenerierung';
    
    if (error.message.includes('API key not valid')) {
      errorMessage = 'API-Schlüssel ungültig. Bitte Konfiguration überprüfen.';
    } else if (error.message.includes('quota') || error.message.includes('RATE_LIMIT')) {
      errorMessage = 'API-Quota überschritten. Bitte später versuchen.';
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
