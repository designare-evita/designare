// api/generate.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FactChecker } from './fact-checker.js'; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const factChecker = new FactChecker();

// === HILFSFUNKTION FÜR SEMANTISCHE OPTIMIERUNG ===
async function fetchSemanticTerms(keyword) {
    // Gibt null zurück, um Denglisch zu vermeiden
    return null;
}

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

async function generateContentWithRetry(prompt, preferredModel, maxRetries = 3) {
    // HIER DIE KORRIGIERTE HIERARCHIE NACH DEINEN VORGABEN:
    let modelsToTry = [];

    if (preferredModel === "gemini-2.5-pro") {
        // Master Mode Hierarchie
        modelsToTry = ["gemini-2.5-pro", "gemini-3-flash-preview", "gemini-2.5-flash"];
    } else {
        // Standard Mode Hierarchie (Deine Vorgabe)
        modelsToTry = [
            "gemini-3-flash-preview", 
            "gemini-2.5-flash",
            "gemini-1.5-flash" // Letzter Sicherheits-Fallback
        ];
    }
    
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
                    // Bei Modell-Nicht-Gefunden etc. sofort weiter
                    break;
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
      const { keyword, intent, domain, email, phone, brand, address } = keywordData;
      console.log(`\n[PROCESSING] Keyword: '${keyword}'`);

      try {
        // Standard: gemini-3-flash-preview (wird in generateContentWithRetry gesetzt)
        const preferredModel = isMasterRequest ? "gemini-2.5-pro" : "gemini-3-flash-preview";
        
        const semanticTerms = await fetchSemanticTerms(keyword);
        
        const enhancedKeywordData = { 
            ...keywordData, 
            semanticTerms 
        };

        const prompt = factChecker.generateResponsiblePrompt(enhancedKeywordData);
        const { text, modelUsed } = await generateContentWithRetry(prompt, preferredModel);

        let jsonData = {};
        let parseError = false;
        
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
        jsonData.address = address;

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
