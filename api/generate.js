// api/generate.js - MINIMALE VERBESSERUNG OHNE RISIKO

const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  console.log('Silas API gestartet');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Silas-Master');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // BASIC VALIDATION
    const { prompt, keyword, intent = 'informational' } = req.body;
    
    if (!prompt || !keyword) {
      return res.status(400).json({ 
        error: 'Prompt und Keyword sind erforderlich.',
        received: { prompt: !!prompt, keyword: !!keyword }
      });
    }

    console.log('Content-Generierung für:', keyword);

    // MASTER MODE CHECK
    const masterModeHeader = req.headers['x-silas-master'];
    const isMasterRequest = masterModeHeader === 'SilasUnlimited2024!';

    // API KEY CHECK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Server-Konfigurationsfehler',
        details: 'API-Schlüssel nicht verfügbar'
      });
    }

    // RATE LIMITING
    if (!isMasterRequest) {
      if (keyword.length > 50) {
        return res.status(400).json({ 
          error: 'Keyword zu lang',
          details: 'Keywords dürfen maximal 50 Zeichen lang sein.'
        });
      }
    }

    // GOOGLE AI INITIALIZATION
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (initError) {
      return res.status(500).json({ 
        error: 'KI-Service nicht verfügbar',
        details: 'Fehler bei der Initialisierung'
      });
    }

    // MODEL SELECTION
    const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
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
            maxOutputTokens: 8000,
          }
        });
        usedModel = modelName;
        console.log('Modell geladen:', modelName);
        break;
      } catch (modelError) {
        console.warn('Modell nicht verfügbar:', modelName, modelError.message);
        continue;
      }
    }

    if (!model) {
      return res.status(500).json({ 
        error: 'KI-Modell nicht verfügbar'
      });
    }

    // VERBESSERTE PROMPT-ERSTELLUNG
    const USE_ENHANCED = process.env.SILAS_ENHANCED === 'true';
    let finalPrompt;
    
    if (USE_ENHANCED) {
      // ENHANCED PROMPT (inline, keine externen Funktionen)
      const isCommercial = intent === 'commercial';
      const isTech = keyword.toLowerCase().includes('wordpress') || keyword.toLowerCase().includes('plugin') || keyword.toLowerCase().includes('software');
      
      finalPrompt = `Du bist ein ${isCommercial ? 'verkaufsorientierter Copywriter' : 'informativer Content-Experte'}.

Erstelle ${isCommercial ? 'conversion-optimierten' : 'hilfreichen, autoritativen'} Content für: "${keyword}"

${isTech ? 'KONTEXT: Technische Zielgruppe (Entwickler, IT-Manager)' : ''}

STRIKT VERMEIDEN:
- "jahrelange Erfahrung", "professionell und zuverlässig"
- "Ihr vertrauensvoller Partner", "maßgeschneiderte Lösungen"
- Wiederholungen zwischen Feldern

QUALITÄT:
- Jeder Text spezifisch für "${keyword}"
- Konkrete Nutzenversprechen
- ${isCommercial ? 'Verkaufsorientierte CTAs' : 'Beratende CTAs'}

Antwort nur als valides JSON:
{
  "post_title": "SEO-Titel mit ${keyword} + Nutzen (50-60 Zeichen)",
  "post_name": "${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_description": "Meta-Beschreibung für ${keyword} mit CTA (150-160 Zeichen)",
  "h1": "H1-Überschrift für ${keyword} + Hauptnutzen",
  "h2_1": "Problem-H2: Warum ${keyword} wichtig ist",
  "h2_2": "Lösungs-H2: Unser ${keyword}-Ansatz",
  "h2_3": "Nutzen-H2: ${keyword} Vorteile",
  "h2_4": "Vertrauens-H2: Warum uns wählen",
  "primary_cta": "${isCommercial ? 'Jetzt ' + keyword + ' starten' : keyword + ' Guide erhalten'}",
  "secondary_cta": "Mehr über ${keyword} erfahren",
  "hero_text": "Hero-Text (70-90 Wörter): ${keyword}-Nutzen für Zielgruppe vermitteln",
  "hero_subtext": "Unterstützende Unterüberschrift (25-35 Wörter)",
  "benefits_list": "HTML-Liste mit 5 spezifischen ${keyword}-Vorteilen",
  "features_list": "HTML-Liste mit 5 ${keyword}-Features",
  "social_proof": "Sozialbeweise mit konkreten Zahlen",
  "testimonial_1": "Testimonial mit Name + ${keyword}-Bezug",
  "testimonial_2": "Zweites Testimonial, andere Perspektive",
  "pricing_title": "${keyword}-Pakete Überschrift",
  "price_1": "Starter ${keyword}-Paket Beschreibung",
  "price_2": "Professional ${keyword}-Paket Beschreibung", 
  "price_3": "Enterprise ${keyword}-Paket Beschreibung",
  "faq_1": "Häufige ${keyword}-Frage 1",
  "faq_answer_1": "Detaillierte Antwort zu ${keyword} (40-60 Wörter)",
  "faq_2": "Häufige ${keyword}-Frage 2", 
  "faq_answer_2": "Praktische ${keyword}-Antwort (40-60 Wörter)",
  "faq_3": "Häufige ${keyword}-Frage 3",
  "faq_answer_3": "Fachliche ${keyword}-Antwort (40-60 Wörter)",
  "contact_info": "Kontakt-Info mit ${keyword}-Bezug",
  "footer_cta": "Footer CTA für ${keyword}",
  "trust_signals": "Vertrauenselemente für ${keyword}",
  "guarantee_text": "${keyword}-Garantie Text"
}`;
    } else {
      // BESTEHENDER PROMPT (sichere Fallback-Version)
      finalPrompt = `Du bist ein erstklassiger SEO-Content-Strategist. Erstelle vollständigen Landingpage-Content für das Thema "${keyword}".

WICHTIG: Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }. Gib keine Markdown-Formatierung oder andere Texte aus.

Das JSON-Objekt muss ALLE folgenden Felder enthalten:

{
  "post_title": "SEO-optimierter Titel (50-60 Zeichen) für ${keyword}",
  "post_name": "seo-freundlicher-url-slug-fuer-${keyword.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_description": "Fesselnde Meta-Beschreibung (150-160 Zeichen) mit CTA für ${keyword}",
  "h1": "Kraftvolle H1-Überschrift für ${keyword}",
  "hero_text": "Fesselnder Einleitungstext für den Hero-Bereich (50-80 Wörter) über ${keyword}",
  "benefits_list": "HTML-Liste mit 4-6 überzeugenden Vorteilen von ${keyword}",
  "primary_cta": "Kurzer, starker Call-to-Action Text für ${keyword}"
}

Erstelle jetzt das vollständige JSON-Objekt:`;
    }

    console.log('Prompt erstellt, starte Generierung');

    // CONTENT GENERATION
    let result;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      result = await model.generateContent(finalPrompt);
      clearTimeout(timeoutId);
      
    } catch (genError) {
      console.error('Generierungs-Fehler:', genError);
      return res.status(500).json({ 
        error: 'Fehler bei der Content-Generierung',
        details: genError.message
      });
    }

    // RESPONSE PROCESSING
    let responseText;
    try {
      const response = await result.response;
      responseText = response.text();
    } catch (responseError) {
      return res.status(500).json({ 
        error: 'Fehler beim Abrufen der KI-Antwort'
      });
    }

    // JSON PARSING
    let jsonData;
    try {
      const startIndex = responseText.indexOf('{');
      const endIndex = responseText.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Kein JSON gefunden');
      }

      let jsonString = responseText.substring(startIndex, endIndex + 1);
      jsonData = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.warn('JSON-Parse-Fehler, verwende Fallback');
      
      // VEREINFACHTER FALLBACK
      jsonData = {
        post_title: keyword + " - Ihre zuverlässige Lösung",
        post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        meta_description: "Professionelle " + keyword + " Services. Kompetent, zuverlässig und maßgeschneidert. Jetzt informieren!",
        h1: keyword + " - Ihre professionelle Lösung",
        hero_text: "Willkommen bei Ihrem " + keyword + " Experten. Wir bieten professionelle Lösungen mit messbaren Ergebnissen.",
        benefits_list: "<ul><li>" + keyword + " von Experten</li><li>Individuelle Lösungen</li><li>Zuverlässiger Support</li></ul>",
        primary_cta: "Jetzt " + keyword + " anfragen",
        _fallback_used: true
      };
    }

    // FINAL RESPONSE
    jsonData.keyword = keyword;
    jsonData.intent = intent;
    jsonData._meta = {
      model_used: usedModel,
      generation_time: new Date().toISOString(),
      enhanced_mode: USE_ENHANCED
    };

    console.log('Content erstellt für:', keyword);
    
    res.status(200).json(jsonData);

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    
    res.status(500).json({ 
      error: 'Interner Server-Fehler',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
