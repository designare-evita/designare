// api/generate.js - KORRIGIERTE VERSION OHNE EXTERNE ABHÄNGIGKEITEN

const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Eine kurze Pause einlegen, um API-Rate-Limits zu vermeiden.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sendet einen Prompt an das Google Gemini Modell.
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
        throw new Error(`API-Anfrage an ${modelName} fehlgeschlagen.`);
    }
}

/**
 * Bereinigt den JSON-String, den die KI zurückgibt.
 */
function cleanJsonString(text) {
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return cleanedText;
}

/**
 * Erstellt einen optimierten Prompt mit Fact-Checking Regeln
 */
function createOptimizedPrompt(keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone, brand) {
    const roleAndTask = intent === 'commercial' 
        ? 'Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet.'
        : 'Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich.';

    let kontext = "";
    if (zielgruppe) kontext += `- ZIELGRUPPE: ${zielgruppe}\n`;
    if (tonalitaet) kontext += `- TONALITÄT: ${tonalitaet}\n`;
    if (usp) kontext += `- ALLEINSTELLUNGSMERKMAL (USP): ${usp}\n`;
    if (domain) kontext += `- WEBSEITE: ${domain}\n`;
    if (email) kontext += `- E-MAIL: ${email}\n`;
    if (phone) kontext += `- TELEFONNUMMER: ${phone}\n`;
    if (brand) kontext += `- BRAND/ANSPRECHPARTNER: ${brand}\n`;

    return `
        Du bist ein erstklassiger SEO-Content-Strategist. Erstelle vollständigen Landingpage-Content für das Thema "${keyword}".

        ${kontext ? `ZUSÄTZLICHER KONTEXT, DER UNBEDINGT ZU BEACHTEN IST:\n${kontext}` : ''}

        ROLLE: ${roleAndTask}
        
        🚨 WICHTIGE QUALITÄTS-RICHTLINIEN:
        - VERMEIDE unbelegte Superlative wie "beste", "nummer 1", "marktführer"
        - VERWENDE KEINE absoluten Begriffe wie "garantiert", "100%", "immer", "nie"
        - ERSTELLE realistische, glaubwürdige Aussagen statt übertriebener Claims
        - NUTZE messbare, spezifische Begriffe statt vager Behauptungen
        - BEI Zahlen: verwende "bis zu", "durchschnittlich", "typischerweise"
        - KEINE unbelegten Studien-Referenzen ("Studien zeigen", "wissenschaftlich bewiesen")
        
        ERSETZE problematische Begriffe:
        ❌ "revolutionär" → ✅ "innovativ"
        ❌ "einzigartig" → ✅ "besonders"  
        ❌ "garantiert" → ✅ "in der Regel"
        ❌ "immer" → ✅ "üblicherweise"
        ❌ "marktführer" → ✅ "ein etablierter Anbieter"

        WICHTIG: Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }.
        
        Das JSON-Objekt muss ALLE folgenden Felder enthalten:
        {
          "post_title": "SEO-optimierter Titel (50-60 Zeichen) für ${keyword}",
          "post_name": "seo-freundlicher-url-slug",
          "meta_title": "Alternativer SEO-Titel (50-60 Zeichen)",
          "meta_description": "Fesselnde Meta-Beschreibung (150-160 Zeichen) mit CTA",
          "h1": "Kraftvolle H1-Überschrift, die den Hauptnutzen kommuniziert",
          "h2_1": "Erste H2-Überschrift (Problemorientiert)",
          "h2_2": "Zweite H2-Überschrift (Lösungsorientiert)",
          "h2_3": "Dritte H2-Überschrift (Feature-/Nutzen-orientiert)",
          "h2_4": "Vierte H2-Überschrift (Vertrauensbildend)",
          "primary_cta": "Kurzer, starker Call-to-Action Text",
          "secondary_cta": "Alternativer, sanfterer Call-to-Action",
          "hero_text": "Überzeugender Einleitungstext (50-80 Wörter) - OHNE Superlative",
          "hero_subtext": "Unterstützende Unterüberschrift (20-30 Wörter)",
          "benefits_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 realistischen Vorteilen",
          "features_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 konkreten Features",
          "social_proof": "Realistischer Satz über soziale Bewährtheit OHNE übertriebene Zahlen",
          "testimonial_1": "Glaubwürdiges Kunden-Testimonial mit Name und authentischer Aussage",
          "testimonial_2": "Zweites, realistisches Kunden-Testimonial mit Name",
          "pricing_title": "Überschrift für den Preisbereich",
          "price_1": "Realistische Beschreibung für das erste Preispaket (Starter/Basic)",
          "price_2": "Realistische Beschreibung für das zweite Preispaket (Professional)",
          "price_3": "Realistische Beschreibung für das dritte Preispaket (Enterprise/Premium)",
          "faq_1": "Erste häufig gestellte, realistische Frage",
          "faq_answer_1": "Ehrliche, hilfreiche Antwort (30-50 Wörter)",
          "faq_2": "Zweite häufig gestellte, praktische Frage",
          "faq_answer_2": "Ehrliche, hilfreiche Antwort (30-50 Wörter)",
          "faq_3": "Dritte häufig gestellte, relevante Frage",
          "faq_answer_3": "Ehrliche, hilfreiche Antwort (30-50 Wörter)",
          "contact_info": "Realistische Kontaktinformation oder Hinweis",
          "footer_cta": "Abschließender Call-to-Action OHNE übertriebene Versprechen",
          "trust_signals": "Ehrliche Vertrauenssignale OHNE Superlative",
          "guarantee_text": "Realistische Garantie-Aussage OHNE absolute Versprechen"
        }

        QUALITÄTS-ANFORDERUNGEN:
        - Jedes Textfeld muss mindestens 10-15 Wörter enthalten (außer CTAs)
        - Hero-Text: 50-80 Wörter, faktisch verantwortlich
        - FAQ-Antworten: 30-50 Wörter, ehrlich und hilfreich
        - Benefits/Features: 4-6 Listenelemente mit realistischen Beschreibungen
        - Testimonials: Authentische Zitate mit realistischen Namen
        - KEINE unbelegten Behauptungen oder Superlative
        - Alle Texte müssen spezifisch auf "${keyword}" bezogen sein
        - Deutsche Sprache
        - Alle Listen müssen vollständiges HTML-Markup enthalten
        
        Erstelle jetzt das vollständige JSON-Objekt für "${keyword}":
    `;
}

/**
 * Einfache Nachbearbeitung der generierten Inhalte
 */
function processGeneratedContent(contentData, keyword) {
    // Grundlegende Nachbearbeitung ohne externe Abhängigkeiten
    const result = {
        keyword,
        correctedContent: { ...contentData },
        confidenceScore: 85, // Standard-Score
        corrections: [],
        flaggedClaims: [],
        totalClaims: 0,
        suggestions: [],
        _meta: {
            processed: true,
            generation_time: new Date().toISOString()
        }
    };

    // Einfache Qualitätsprüfungen
    const problematicPhrases = {
        'garantiert': 'in der Regel',
        '100%': 'sehr hohe',
        'immer': 'üblicherweise',
        'nie': 'selten',
        'beste': 'sehr gute',
        'marktführer': 'ein etablierter Anbieter'
    };

    // Durchsuche kritische Felder nach problematischen Phrasen
    const fieldsToCheck = ['hero_text', 'benefits_list', 'social_proof', 'guarantee_text'];
    
    fieldsToCheck.forEach(field => {
        if (result.correctedContent[field]) {
            let fieldContent = result.correctedContent[field];
            let wasChanged = false;
            
            Object.entries(problematicPhrases).forEach(([problematic, replacement]) => {
                const regex = new RegExp(`\\b${problematic}\\b`, 'gi');
                if (regex.test(fieldContent)) {
                    fieldContent = fieldContent.replace(regex, replacement);
                    result.corrections.push({
                        field: field,
                        from: problematic,
                        to: replacement
                    });
                    wasChanged = true;
                }
            });
            
            if (wasChanged) {
                result.correctedContent[field] = fieldContent;
                result.confidenceScore -= 5; // Reduziere Score für jede Korrektur
            }
        }
    });

    return result;
}

/**
 * Haupthandler für die API
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

        // Parallele Verarbeitung aller Keywords
        const generationPromises = keywords.map(async (keyword, index) => {
            try {
                // Pause zwischen den Anfragen
                if (index > 0) {
                    const delay = isMasterRequest ? 500 : 2000;
                    await sleep(delay);
                }
                
                console.log(`[${index + 1}/${keywords.length}] Verarbeite Keyword: '${keyword}'`);

                // Erstelle optimierten Prompt
                const optimizedPrompt = createOptimizedPrompt(
                    keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone, brand
                );

                // KI-Aufruf mit Fallback
                let textResponse;
                let usedModel = "gemini-1.5-flash-latest";
                try {
                    textResponse = await askGemini(optimizedPrompt, usedModel);
                } catch (e) {
                    console.warn(`Modell ${usedModel} fehlgeschlagen, versuche Fallback...`);
                    usedModel = "gemini-1.0-pro";
                    textResponse = await askGemini(optimizedPrompt, usedModel);
                }

                // Parse die Antwort
                let initialContent;
                try {
                    initialContent = JSON.parse(cleanJsonString(textResponse));
                } catch (e) {
                    console.error(`Fehler beim Parsen des JSON für '${keyword}':`, e);
                    initialContent = {
                        _parse_error: true,
                        post_title: `Fehler: ${keyword}`,
                        meta_description: `Fehler beim Verarbeiten der KI-Antwort für ${keyword}. Details: ${e.message}`
                    };
                }

                // Nachbearbeitung
                const processedResult = processGeneratedContent(initialContent, keyword);
                processedResult._meta.model_used = usedModel;
                processedResult._meta.master_mode = isMasterRequest;
                processedResult._meta.success = !initialContent._parse_error;
                
                console.log(`✅ Verarbeitung für '${keyword}' abgeschlossen.`);
                return processedResult;

            } catch (error) {
                console.error(`💥 Fehler bei der Verarbeitung von '${keyword}':`, error);
                return { 
                    keyword, 
                    error: error.message, 
                    correctedContent: {
                        post_title: `Fehler: ${keyword}`,
                        meta_description: `Fehler bei der Verarbeitung von ${keyword}: ${error.message}`
                    },
                    confidenceScore: 0,
                    corrections: [],
                    _meta: { success: false, master_mode: isMasterRequest } 
                };
            }
        });

        // Warten auf alle Ergebnisse
        const results = await Promise.all(generationPromises);
        console.log('✅ Alle Antworten bereit, sende zum Client.');
        return res.status(200).json(results);

    } catch (error) {
        console.error('💥 Unerwarteter, kritischer Fehler im Handler:', error);
        res.status(500).json({ 
            error: 'Interner Server-Fehler',
            details: error.message 
        });
    }
}
