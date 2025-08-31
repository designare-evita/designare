// api/generate.js - FINALE, VOLLSTÄNDIGE VERSION MIT FACTCHECKER
// Basierend auf deiner robusten Original-Datei mit über 200 Zeilen.

// Erforderliche Module importieren
const { GoogleGenerativeAI } = require("@google/generative-ai");
// HINZUGEFÜGT: Der FactChecker wird importiert und ersetzt die alte Prompt-Logik.
const { FactChecker } = require('./fact-checker.js');

/**
 * DEINE ORIGINALE HILFSFUNKTION: Eine kurze Pause einlegen,
 * um API-Rate-Limits zu vermeiden.
 * @param {number} ms - Die Wartezeit in Millisekunden.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * DEINE ORIGINALE FUNKTION: Sendet einen Prompt an das Google Gemini Modell.
 * @param {string} prompt - Der an die KI zu sendende Text.
 * @param {string} modelName - Der Name des zu verwendenden KI-Modells.
 * @returns {Promise<string>} Die Textantwort der KI.
 */
async function askGemini(prompt, modelName = "gemini-1.5-flash-latest") {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error(`Fehler bei der Anfrage an das Modell ${modelName}:`, error);
        // Wirft den Fehler weiter, damit das Fallback-System greifen kann.
        throw new Error(`API-Anfrage an ${modelName} fehlgeschlagen.`);
    }
}

/**
 * DEINE ORIGINALE HILFSFUNKTION: Bereinigt den JSON-String, den die KI zurückgibt.
 * @param {string} text - Der rohe Text von der KI.
 * @returns {string} Ein bereinigter, JSON-kompatibler String.
 */
function cleanJsonString(text) {
    // Entfernt "```json" und "```" sowie führende/nachfolgende Leerzeichen
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return cleanedText;
}

/**
 * DEINE ORIGINALE HAUPTFUNKTION: Der Vercel Serverless Handler
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { keywords, intent, zielgruppe, tonalitaet, usp, domain, email, phone, brand, isMasterRequest } = req.body;

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({ error: 'Keywords-Array fehlt oder ist leer.' });
        }

        console.log(`Starte Verarbeitung für ${keywords.length} Keywords...`);

        // DEINE ORIGINALE LOGIK: Parallele Verarbeitung aller Keywords
        const generationPromises = keywords.map(async (keyword, index) => {
            try {
                // Kurze Pause zwischen den Anfragen, um Rate-Limits zu schonen
                if (index > 0) {
                    const delay = isMasterRequest ? 500 : 2000;
                    await sleep(delay);
                }
                
                console.log(`[${index + 1}/${keywords.length}] Verarbeite Keyword: '${keyword}'`);

                // --- START DER FACTCHECKER-INTEGRATION ---

                // 1. Erstelle den optimierten Prompt mit den Fact-Checking Regeln
                const factCheckAwarePrompt = FactChecker.createFactCheckAwarePrompt(
                    keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone, brand
                );

                // 2. Rufe die KI auf, mit Fallback-System
                let textResponse;
                let usedModel = "gemini-1.5-flash-latest";
                try {
                    textResponse = await askGemini(factCheckAwarePrompt, usedModel);
                } catch (e) {
                    console.warn(`Modell ${usedModel} fehlgeschlagen, versuche Fallback gemini-1.0-pro...`);
                    usedModel = "gemini-1.0-pro";
                    textResponse = await askGemini(factCheckAwarePrompt, usedModel);
                }

                // 3. Verarbeite die KI-Antwort
                let initialContent;
                try {
                    initialContent = JSON.parse(cleanJsonString(textResponse));
                } catch (e) {
                    // Wenn das Parsen fehlschlägt, wird ein Fehlerobjekt für die UI erstellt
                    console.error(`Fehler beim Parsen des JSON für '${keyword}':`, e);
                    initialContent = {
                        _parse_error: true,
                        meta_description: `Fehler beim Verarbeiten der KI-Antwort. Bitte erneut versuchen. Details: ${e.message}`
                    };
                }

                // 4. Führe den reaktiven Faktencheck durch
                const factChecker = new FactChecker();
                const factCheckResult = await factChecker.checkContent(initialContent, keyword);
                
                // 5. Füge die Metadaten deiner Original-Logik zum Ergebnis hinzu
                factCheckResult.keyword = keyword;
                factCheckResult._meta = {
                    model_used: usedModel,
                    generation_time: new Date().toISOString(),
                    master_mode: isMasterRequest,
                    success: !initialContent._parse_error
                };
                
                console.log(`✅ Verarbeitung für '${keyword}' abgeschlossen.`);
                // GEÄNDERT: Das vollständige Ergebnis des Faktenchecks wird zurückgegeben
                return factCheckResult; 

                // --- ENDE DER FACTCHECKER-INTEGRATION ---

            } catch (error) {
                // DEINE ORIGINALE FEHLERBEHANDLUNG FÜR EIN KEYWORD
                console.error(`💥 Fehler bei der Verarbeitung von '${keyword}':`, error);
                return { 
                    keyword, 
                    error: error.message, 
                    _meta: { success: false, master_mode: isMasterRequest } 
                };
            }
        });

        // DEINE ORIGINALE LOGIK: Warten, bis alle Keywords verarbeitet sind.
        const results = await Promise.all(generationPromises);
        console.log('✅ Alle Antworten bereit, sende zum Client.');
        return res.status(200).json(results);

    } catch (error) {
        // DEINE ORIGINALE GLOBALE FEHLERBEHANDLUNG
        console.error('💥 Unerwarteter, kritischer Fehler im Handler:', error);
        res.status(500).json({ 
            error: 'Interner Server-Fehler',
            details: error.message 
        });
    }
}

