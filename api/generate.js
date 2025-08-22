// api/generate.js - STABILE VERSION OHNE CRASHS

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Handler-Funktion, die von Vercel aufgerufen wird
module.exports = async (req, res) => {
  console.log('🚀 Silas API gestartet');
  
  // CORS Headers für alle Antworten
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
    console.log('📝 Request Body:', req.body);
    console.log('🔑 Headers:', req.headers);

    // === BASIC VALIDATION ===
    const { prompt, keyword } = req.body;
    
    if (!prompt || !keyword) {
      console.log('❌ Fehlende Daten');
      return res.status(400).json({ 
        error: 'Prompt und Keyword sind erforderlich.',
        received: { prompt: !!prompt, keyword: !!keyword }
      });
    }

    console.log('✅ Validation passed für:', keyword);

    // === MASTER MODE CHECK ===
    const masterModeHeader = req.headers['x-silas-master'];
    const isMasterRequest = masterModeHeader === 'SilasUnlimited2024!';
    
    if (isMasterRequest) {
      console.log('🔓 Master Mode Request erkannt');
    }

    // === API KEY CHECK ===
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY nicht gesetzt');
      return res.status(500).json({ 
        error: 'Server-Konfigurationsfehler',
        details: 'API-Schlüssel nicht verfügbar'
      });
    }

    console.log('✅ API Key verfügbar');

    // === SIMPLE RATE LIMITING ===
    if (!isMasterRequest) {
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      console.log('🌐 Client IP:', clientIP.substring(0, 10) + '...');
      
      // Einfache Keyword-Validierung
      if (keyword.length > 50) {
        return res.status(400).json({ 
          error: 'Keyword zu lang',
          details: 'Keywords dürfen maximal 50 Zeichen lang sein.'
        });
      }
    }

    // === GOOGLE AI INITIALIZATION ===
    console.log('🤖 Initialisiere Google AI');
    
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (initError) {
      console.error('❌ Google AI Init Fehler:', initError);
      return res.status(500).json({ 
        error: 'KI-Service nicht verfügbar',
        details: 'Fehler bei der Initialisierung'
      });
    }

    // === MODEL SELECTION ===
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
            maxOutputTokens: 3000, // Reduziert für Stabilität
          }
        });
        usedModel = modelName;
        console.log('✅ Modell geladen:', modelName);
        break;
      } catch (modelError) {
        console.warn('⚠️ Modell nicht verfügbar:', modelName, modelError.message);
        continue;
      }
    }

    if (!model) {
      console.error('❌ Kein Modell verfügbar');
      return res.status(500).json({ 
        error: 'KI-Modell nicht verfügbar',
        details: 'Alle Modell-Varianten sind derzeit nicht erreichbar'
      });
    }

    // === SIMPLIFIED PROMPT ===
    const simplifiedPrompt = `
Erstelle JSON-Content für das Thema "${keyword}".

Antwort-Format (nur JSON, kein Markdown):
{
  "post_title": "SEO-Titel für ${keyword}",
  "post_name": "${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_title": "Meta-Titel für ${keyword}",
  "meta_description": "Meta-Beschreibung für ${keyword} (max 160 Zeichen)",
  "h1": "Hauptüberschrift für ${keyword}",
  "h2_1": "Erste Unterüberschrift",
  "h2_2": "Zweite Unterüberschrift",
  "primary_cta": "Hauptbutton-Text",
  "hero_text": "Einleitungstext für ${keyword}"
}

Wichtig: Nur das JSON-Objekt zurückgeben, keine anderen Texte oder Formatierungen.
    `;

    console.log('📤 Sende Anfrage an KI für:', keyword);

    // === CONTENT GENERATION ===
    let result;
    try {
      // Timeout für die Anfrage
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      result = await model.generateContent(simplifiedPrompt);
      clearTimeout(timeoutId);
      
      console.log('✅ KI-Antwort erhalten');
    } catch (genError) {
      console.error('❌ Generierungs-Fehler:', genError);
      return res.status(500).json({ 
        error: 'Fehler bei der Content-Generierung',
        details: genError.message
      });
    }

    // === RESPONSE PROCESSING ===
    let responseText;
    try {
      const response = await result.response;
      responseText = response.text();
      console.log('📝 Response Länge:', responseText.length);
    } catch (responseError) {
      console.error('❌ Response-Fehler:', responseError);
      return res.status(500).json({ 
        error: 'Fehler beim Abrufen der KI-Antwort',
        details: responseError.message
      });
    }

    // === JSON PARSING ===
    let jsonData;
    try {
      // Finde JSON in der Antwort
      const startIndex = responseText.indexOf('{');
      const endIndex = responseText.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Kein JSON gefunden');
      }

      let jsonString = responseText.substring(startIndex, endIndex + 1);
      
      // Bereinige den JSON-String
      jsonString = jsonString
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      jsonData = JSON.parse(jsonString);
      console.log('✅ JSON erfolgreich geparst');
      
    } catch (parseError) {
      console.warn('⚠️ JSON-Parse-Fehler, verwende Fallback');
      
      // Fallback-Content
      jsonData = {
        post_title: keyword + " - Professionelle Lösung",
        post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        meta_title: keyword + " | Ihre Experten",
        meta_description: "Professionelle " + keyword + " Services. Kompetent und zuverlässig.",
        h1: keyword + " - Ihre zuverlässige Lösung",
        h2_1: "Warum " + keyword + " wichtig ist",
        h2_2: "Unsere " + keyword + " Expertise",
        primary_cta: "Jetzt anfragen",
        hero_text: "Willkommen bei Ihrem " + keyword + " Experten. Professionelle Lösungen für Ihre Anforderungen.",
        _fallback_used: true,
        _parse_error: parseError.message
      };
    }

    // === FINAL RESPONSE ===
    jsonData.keyword = keyword;
    jsonData._meta = {
      model_used: usedModel,
      generation_time: new Date().toISOString(),
      master_mode: isMasterRequest
    };

    console.log('✅ Antwort bereit für:', keyword);
    
    res.status(200).json(jsonData);

  } catch (error) {
    console.error('💥 Unerwarteter Fehler:', error);
    console.error('Stack:', error.stack);
    
    // Sichere Fehlerantwort
    res.status(500).json({ 
      error: 'Interner Server-Fehler',
      details: 'Ein unerwarteter Fehler ist aufgetreten',
      timestamp: new Date().toISOString(),
      error_type: error.name || 'UnknownError'
    });
  }
};
