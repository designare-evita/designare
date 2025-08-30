// api/generate.js - Korrigierte Version mit Fact-Checking Integration

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { FactChecker } = require("./fact-checker");

// Handler-Funktion, die von Vercel aufgerufen wird
module.exports = async (req, res) => {
  console.log('🚀 Silas API gestartet (mit Fact-Checking)');
  
  // CORS-Header
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

    // Validierung
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      console.log('❌ Fehlende Daten: "keywords" Array nicht gefunden.');
      return res.status(400).json({ error: 'Ein "keywords" Array im Body ist erforderlich.' });
    }
    console.log(`✅ Validation passed für ${keywords.length} Keywords.`);

    // Master-Mode-Check und API-Key-Check
    const isMasterRequest = req.headers['x-silas-master'] === 'SilasUnlimited2024!';
    if (isMasterRequest) console.log('🔓 Master Mode Request erkannt');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY nicht gesetzt');
      return res.status(500).json({ error: 'Server-Konfigurationsfehler', details: 'API-Schlüssel nicht verfügbar' });
    }
    console.log('✅ API Key verfügbar');
    
    // Google AI Initialisierung
    console.log('🤖 Initialisiere Google AI');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Bulk Processing
    const generationPromises = keywords.map(async (item) => {
      const { keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone } = item;
      
      try {
        // Keyword-Validierung für Demo-Modus
        if (!isMasterRequest && keyword.length > 50) {
          throw new Error('Keyword zu lang (max. 50 Zeichen).');
        }

        // Modellauswahl-Schleife
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
                maxOutputTokens: 8000 
              } 
            });
            usedModel = modelName;
            console.log(`✅ Modell für '${keyword}' geladen:`, modelName);
            break;
          } catch (modelError) {
            console.warn(`⚠️ Modell für '${keyword}' nicht verfügbar:`, modelName, modelError.message);
            continue;
          }
        }
        
        if (!model) throw new Error(`Kein KI-Modell für '${keyword}' verfügbar.`);

        // Erstelle Fact-Check-aware Prompt
        const silasPrompt = FactChecker.createFactCheckAwarePrompt(
          keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone
        );
        
        const result = await model.generateContent(silasPrompt);
        const response = await result.response;
        const rawText = await response.text();

        // JSON Parse
        let jsonData;
        let parseError = null;
        
        try {
          const cleanedText = rawText.replace(/^```json\s*|```\s*$/g, '').trim();
          if (!cleanedText) throw new Error("API hat leeren Inhalt zurückgegeben.");
          jsonData = JSON.parse(cleanedText);
        } catch (e) {
          parseError = e;
          console.error(`❌ JSON-Parse-Fehler für '${keyword}':`, e.message);
          
          // Fallback-Content
          jsonData = {
            post_title: `Fehler bei der Generierung für: ${keyword}`,
            post_name: `fehler-${keyword.toLowerCase().replace(/\s+/g, '-')}`,
            meta_title: `Fehler bei der Generierung für: ${keyword}`,
            meta_description: `Die Generierung für das Keyword '${keyword}' ist fehlgeschlagen. Fehler: ${e.message}`,
            h1: `Fehler bei der Generierung für: ${keyword}`,
            h2_1: "Fehler", h2_2: "Fehler", h2_3: "Fehler", h2_4: "Fehler",
            primary_cta: "Nicht verfügbar", secondary_cta: "Nicht verfügbar",
            hero_text: `Die Inhalte für '${keyword}' konnten nicht erstellt werden.`,
            hero_subtext: "Fehlerdetails: " + e.message,
            benefits_list: "<ul><li>Fehler</li></ul>", 
            features_list: "<ul><li>Fehler</li></ul>",
            social_proof: "N/A",
            testimonial_1: "Fehler", testimonial_2: "Fehler",
            pricing_title: "Keine Preisinformationen",
            price_1: "Fehler", price_2: "Fehler", price_3: "Fehler",
            faq_1: "Fehler", faq_answer_1: "Fehler",
            faq_2: "Fehler", faq_answer_2: "Fehler",
            faq_3: "Fehler", faq_answer_3: "Fehler",
            contact_info: "Fehler", footer_cta: "Fehler", 
            trust_signals: "Fehler", guarantee_text: "Fehler",
            _fallback_used: true,
            _parse_error: e.message
          };
        }

        // FACT-CHECKING (nur bei erfolgreich generiertem Content)
        if (!parseError) {
          const factChecker = new FactChecker();
          const factCheckResult = await factChecker.checkContent(jsonData, keyword);
          
          // Verwende korrigierten Content
          jsonData = factCheckResult.correctedContent;
          
          // Füge Fact-Check Metadaten hinzu
          jsonData._factCheck = {
            confidenceScore: factCheckResult.confidenceScore,
            totalClaims: factCheckResult.totalClaims,
            flaggedClaims: factCheckResult.flaggedClaims.length,
            corrections: factCheckResult.corrections,
            suggestions: factCheckResult.suggestions,
            timestamp: new Date().toISOString(),
            status: factCheckResult.confidenceScore >= 70 ? 'passed' : 'needs_review'
          };
          
          console.log(`🔍 Fact-Check für '${keyword}': ${factCheckResult.corrections.length} Korrekturen, Score: ${factCheckResult.confidenceScore}/100`);
        }

        // Finale Antwort-Struktur
        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData.domain = domain;
        jsonData.email = email;
        jsonData.phone = phone;
        jsonData._meta = { 
          model_used: usedModel, 
          generation_time: new Date().toISOString(), 
          master_mode: isMasterRequest, 
          success: !parseError,
          fact_checked: !parseError
        };
        
        console.log(`✅ Antwort für '${keyword}' bereit.`);
        return jsonData;

      } catch (error) {
        // Fehlerbehandlung für einzelnes Keyword
        console.error(`💥 Fehler bei der Verarbeitung von '${keyword}':`, error);
        return { 
          keyword, 
          intent, 
          error: error.message, 
          _meta: { 
            success: false, 
            master_mode: isMasterRequest,
            fact_checked: false
          } 
        };
      }
    });

    // Warten auf alle Ergebnisse
    const results = await Promise.all(generationPromises);
    
    // Fact-Check Summary Logging
    const factCheckSummary = results
      .filter(r => r._factCheck)
      .reduce((acc, r) => {
        acc.processed++;
        acc.totalScore += r._factCheck.confidenceScore;
        acc.totalCorrections += r._factCheck.corrections.length;
        return acc;
      }, { processed: 0, totalScore: 0, totalCorrections: 0 });
        
    if (factCheckSummary.processed > 0) {
      const avgScore = Math.round(factCheckSummary.totalScore / factCheckSummary.processed);
      console.log(`📊 Fact-Check Summary: ${factCheckSummary.processed} Keywords, ⌀ ${avgScore}/100, ${factCheckSummary.totalCorrections} Korrekturen`);
    }
    
    console.log('✅ Alle Antworten bereit, sende zum Client.');
    return res.status(200).json(results);

  } catch (error) {
    // Globale Fehlerbehandlung
    console.error('💥 Unerwarteter, kritischer Fehler im Handler:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Interner Server-Fehler',
      details: 'Ein unerwarteter Fehler ist aufgetreten.'
    });
  }
};
