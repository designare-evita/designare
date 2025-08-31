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
        throw new Error(`Konnte keine Antwort vom Modell ${modelName} erhalten.`);
    }
}

/**
 * DEIN ORIGINALER HAUPT-HANDLER: Verarbeitet die Massen-Anfragen zur Content-Generierung,
 * jetzt erweitert um den FactChecker-Workflow.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Nur POST-Anfragen sind erlaubt' });
    }

    try {
        const { keywords, intent, zielgruppe, tonalitaet, usp, domain, email, phone, brand, isMasterRequest } = req.body;

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({ error: 'Keywords müssen als Array bereitgestellt werden.' });
        }

        console.log(`Starte Bulk-Generierung für ${keywords.length} Keywords...`);

        // DEINE ORIGINALE LOGIK: Alle Keyword-Anfragen werden parallel verarbeitet.
        const generationPromises = keywords.map(async (keyword, index) => {
            try {
                if (index > 0) await sleep(500);

                // --- START DER FACTCHECKER-INTEGRATION ---

                // 1. PROMPT ERSTELLEN (PROAKTIV)
                // Die alte `createSilasPrompt` Funktion wird durch die Methode des FactCheckers ersetzt.
                // Diese enthält bereits alle Anweisungen für qualitativ hochwertigen, FAKTENBASIERTEN Content.
                const factCheckAwarePrompt = FactChecker.createFactCheckAwarePrompt(
                    keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone, brand
                );
                
                // 2. INHALT GENERIEREN (DEINE FALLBACK-LOGIK BLEIBT ERHALTEN)
                let aiResponseJson;
                let usedModel = isMasterRequest ? "gemini-1.5-pro-latest" : "gemini-1.5-flash-latest";
                try {
                    aiResponseJson = await askGemini(factCheckAwarePrompt, usedModel);
                } catch (e) {
                    console.warn(`Modell ${usedModel} fehlgeschlagen für '${keyword}', versuche Fallback...`);
                    usedModel = "gemini-1.5-flash-latest";
                    aiResponseJson = await askGemini(factCheckAwarePrompt, usedModel);
                }

                // DEINE ORIGINALE JSON-PARSE-LOGIK BLEIBT ERHALTEN
                let initialContent;
                try {
                     initialContent = JSON.parse(aiResponseJson);
                } catch (e) {
                    console.error(`JSON-Parse-Fehler für '${keyword}':`, e.message);
                    initialContent = { 
                        "post_title": `Fehler bei der Generierung für ${keyword}`, 
                        "meta_description": "Die KI-Antwort war kein valides JSON.", 
                        "_parse_error": true 
                    };
                }

                // 3. INHALT PRÜFEN & KORRIGIEREN (REAKTIV)
                // Der von der KI gelieferte Inhalt wird nun analysiert, automatisch korrigiert und bewertet.
                const factChecker = new FactChecker();
                const factCheckResult = await factChecker.checkContent(initialContent, keyword);

                // 4. METADATEN HINZUFÜGEN (DEINE LOGIK BLEIBT ERHALTEN)
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

