// api/generate.js - KORRIGIERTE VERSION (Datamuse deaktiviert)

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { FactChecker } = require('./fact-checker.js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const factChecker = new FactChecker();

// === HILFSFUNKTION FÜR SEMANTISCHE OPTIMIERUNG ===
async function fetchSemanticTerms(keyword) {
    // FIX: Wir geben hier sofort null zurück.
    // Grund: Die Datamuse API liefert nur englische Begriffe (z.B. "happy", "elements").
    // Wenn wir diese in einen deutschen Prompt zwingen, entsteht "Denglisch".
    // Solange wir keine deutsche Semantic-API haben, lassen wir das lieber weg.
    return null;

    /* --- ALTER CODE (DEAKTIVIERT) ---
    try {
        const response = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(keyword)}&max=15`);
        if (!response.ok) return null;
        const data = await response.json();
        if (!data || data.length === 0) return null;
        return data.map(item => item.word).join(', ');
    } catch (error) {
        return null; 
    }
    */
}
// ========================================================

function cleanJsonString(str) {
    let cleaned = str
        .replace(/```json\s*/gi, '')
        .replace(/```javascript\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    if (!cleaned.startsWith('{')) {
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
            cleaned = cleaned.substring(firstBracket, lastBracket + 1);
        }
    }
    
    return cleaned.trim();
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Modell-Hierarchie: vom besten zum Fallback
const MODEL_HIERARCHY = [
    "gemini-2.5-flash",           // Stabile Version, schnell und effizient
    "gemini-2.5-flash-lite",      // Noch schneller, kosteneffizienter
    "gemini-2.0-flash-exp"        // Experimentell
];

/**
 * Generiert Inhalt mit automatischem Retry und Modell-Fallback
 */
async function generateContentWithRetry(prompt, preferredModel, maxRetries = 3) {
    const modelsToTry = preferredModel === "gemini-2.5-pro" 
        ? MODEL_HIERARCHY 
        : ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-exp"];
    
    let lastError = null;
    
    for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[ATTEMPT] Modell: ${modelName}, Versuch: ${attempt}/${maxRetries}`);
                
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = await response.text();
                
                console.log(`✅ Erfolg mit Modell: ${modelName}`);
                return { text, modelUsed: modelName };
                
            } catch (error) {
                lastError = error;
                const errorMessage = error.message || String(error);
                
                console.warn(`⚠️ Fehler mit ${modelName} (Versuch ${attempt}/${maxRetries}):`, errorMessage);
                
                if (errorMessage.includes('503') || errorMessage.includes('overloaded') || 
                    errorMessage.includes('429') || errorMessage.includes('quota')) {
                    
                    if (attempt < maxRetries) {
                        const waitTime = Math.pow(2, attempt) * 1000;
                        console.log(`⏳ Warte ${waitTime/1000}s vor erneutem Versuch...`);
                        await delay(waitTime);
                    } else {
                        console.log(`⏭️ Wechsle zum nächsten Modell...`);
                        break;
                    }
                } else {
                    throw error;
                }
            }
        }
    }
    
    throw new Error(`Alle Modelle fehlgeschlagen. Letzter Fehler: ${lastError?.message || lastError}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { keywords } = req.body;
    const isMasterRequest = req.headers['x-silas-master'] === process.env.SILAS_MASTER_PASSWORD;

    console.log(`[START] Beginne Verarbeitung für ${keywords.length} Keywords. Master-Modus: ${isMasterRequest}`);

    const results = [];
    
    for (const keywordData of keywords) {
      const { keyword, intent, domain, email, phone, brand } = keywordData;
      console.log(`\n[PROCESSING] Keyword: '${keyword}'`);

      try {
        const preferredModel = isMasterRequest ? "gemini-2.5-pro" : "gemini-2.5-flash-lite";
        
        // SCHRITT 1: Semantische Daten (DEAKTIVIERT, gibt null zurück)
        const semanticTerms = await fetchSemanticTerms(keyword);
        
        // SCHRITT 2: Daten anreichern
        const enhancedKeywordData = { 
            ...keywordData, 
            semanticTerms 
        };

        // SCHRITT 3: Prompt generieren
        const prompt = factChecker.generateResponsiblePrompt(enhancedKeywordData);

        // SCHRITT 4: Generiere Inhalt
        const { text, modelUsed } = await generateContentWithRetry(prompt, preferredModel);

        let jsonData = {};
        let parseError = false;
        let originalText = text;

        try {
            const cleanedText = cleanJsonString(text);
            jsonData = JSON.parse(cleanedText);
        } catch (e) {
            console.warn(`[WARN] JSON-Parsing für '${keyword}' fehlgeschlagen:`, e.message);
            parseError = true;
            jsonData = {
                post_title: `Fehler bei der Inhalts-Erstellung für: ${keyword}`,
                meta_description: "Der von der KI generierte Inhalt war kein valides JSON.",
                h1: `Verarbeitungsfehler für: ${keyword}`,
                content: "<p>Die KI-Antwort konnte nicht korrekt verarbeitet werden.</p>",
                _fallback_used: true,
                _parse_error: e.message
            };
        }

        if (!parseError) {
            const factCheckResult = await factChecker.checkContent(jsonData, keyword);
            jsonData._factCheck = factCheckResult;
        }

        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData.domain = domain;
        jsonData.email = email;
        jsonData.phone = phone;
        jsonData.brand = brand;
        jsonData._seo = {
            semantic_terms_used: semanticTerms || "Deaktiviert (Sprach-Konflikt)"
        };
        jsonData._meta = { 
            model_used: modelUsed,
            model_requested: preferredModel,
            generation_time: new Date().toISOString(), 
            master_mode: isMasterRequest, 
            success: !parseError 
        };

        console.log(`✅ Antwort für '${keyword}' bereit (Modell: ${modelUsed})`);
        results.push(jsonData);

      } catch (error) {
        console.error(`💥 Fehler bei '${keyword}':`, error.message);
        results.push({ 
            keyword, 
            intent, 
            brand, 
            error: error.message,
            error_type: error.name,
            _meta: { success: false } 
        });
      }

      await delay(isMasterRequest ? 200 : 1500);
    }

    console.log('\n✅ Alle Antworten bereit, sende zum Client.');
    return res.status(200).json(results);

  } catch (error) {
    console.error('💥 Kritischer Fehler im Handler:', error);
    res.status(500).json({
      error: 'Interner Server-Fehler',
      details: error.message
    });
  }
}
