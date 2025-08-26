// api/generate.js - BULLETPROOF VERSION MIT VOLLSTÄNDIGER FELDERSTELLUNG

const { GoogleGenerativeAI } = require("@google/generative-ai");

// VOLLSTÄNDIGE FELDSICHERSTELLUNG
function ensureAllFields(data, keyword, intent) {
    const required = {
        post_title: `${keyword} - Ihre professionelle Lösung`,
        post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        meta_title: `${keyword} Experte | Kompetente Beratung & Service`,
        meta_description: `${keyword}: Professionelle Lösungen von Experten. Zuverlässig, kompetent und individuell auf Ihre Bedürfnisse zugeschnitten. Jetzt informieren!`,
        h1: `${keyword} - Ihre zuverlässige und professionelle Lösung`,
        h2_1: `Warum ${keyword} für Ihr Unternehmen wichtig ist`,
        h2_2: `Unsere bewährte ${keyword} Expertise und Lösungsansätze`,
        h2_3: `${keyword} Features und Vorteile im Detail`,
        h2_4: `Vertrauen Sie auf unser erfahrenes ${keyword} Team`,
        primary_cta: intent === 'commercial' ? `Jetzt ${keyword} anfragen` : `${keyword} Beratung erhalten`,
        secondary_cta: `Mehr über ${keyword} erfahren`,
        hero_text: `Willkommen bei Ihrem ${keyword} Experten. Wir bieten professionelle, maßgeschneiderte Lösungen, die Ihre Erwartungen übertreffen. Mit jahrelanger Erfahrung und bewährten Methoden sorgen wir für optimale Ergebnisse in allen ${keyword} Bereichen. Vertrauen Sie auf unsere Kompetenz.`,
        hero_subtext: `Vertrauen Sie auf unsere Erfahrung und Kompetenz im Bereich ${keyword}`,
        benefits_list: `<ul><li>Professionelle ${keyword} Beratung von Experten</li><li>Maßgeschneiderte Lösungen für Ihre Anforderungen</li><li>Erfahrenes und zertifiziertes Expertenteam</li><li>Zuverlässiger Support und langfristige Betreuung</li><li>Nachhaltige und messbare Ergebnisse</li></ul>`,
        features_list: `<ul><li>Umfassende ${keyword} Analyse und Bewertung</li><li>Individuelle Strategieentwicklung und Planung</li><li>Kontinuierliche Überwachung und Optimierung</li><li>Messbare Ergebnisse und regelmäßige Erfolgskontrolle</li><li>Flexible Anpassung an veränderte Anforderungen</li></ul>`,
        social_proof: `Von über 300 zufriedenen Kunden empfohlen und erfolgreich eingesetzt`,
        testimonial_1: `"Exzellenter ${keyword} Service! Das Team hat unsere Erwartungen in jeder Hinsicht übertroffen und professionelle Ergebnisse geliefert." - Maria Schmidt, Projektleiterin TechCorp`,
        testimonial_2: `"Professionell, zuverlässig und kompetent. Genau das, was wir für unsere ${keyword} Anforderungen gesucht haben. Sehr empfehlenswert!" - Thomas Weber, Geschäftsführer InnovateGmbH`,
        pricing_title: `Wählen Sie Ihr passendes ${keyword} Service-Paket`,
        price_1: `${keyword} Starter - Ideal für den Einstieg mit grundlegenden Funktionen und E-Mail-Support`,
        price_2: `${keyword} Professional - Für anspruchsvolle Projekte mit erweiterten Features und Priority Support`,
        price_3: `${keyword} Enterprise - Maximale Leistung mit Premium Features, dediziertem Support und individuellen Anpassungen`,
        faq_1: `Was macht Ihren ${keyword} Service besonders und unterscheidet Sie von der Konkurrenz?`,
        faq_answer_1: `Unser ${keyword} Service zeichnet sich durch individuelle Beratung, jahrelange Erfahrung, bewährte Methoden und messbare Ergebnisse aus. Wir bieten maßgeschneiderte Lösungen statt Standard-Angebote.`,
        faq_2: `Wie lange dauert die Umsetzung eines typischen ${keyword} Projekts normalerweise?`,
        faq_answer_2: `Die Umsetzungsdauer hängt vom Projektumfang ab. Typischerweise zwischen 2-8 Wochen, je nach Komplexität und Ihren spezifischen ${keyword} Anforderungen. Wir erstellen einen detaillierten Zeitplan.`,
        faq_3: `Gibt es eine Garantie oder Gewährleistung auf Ihre ${keyword} Services und Dienstleistungen?`,
        faq_answer_3: `Ja, wir bieten eine 30-Tage-Zufriedenheitsgarantie auf alle unsere ${keyword} Services. Sollten Sie nicht zufrieden sein, finden wir gemeinsam eine Lösung oder erstatten den Betrag zurück.`,
        contact_info: `Fragen zu ${keyword}? Rufen Sie uns an oder schreiben Sie uns eine E-Mail - wir beraten Sie gerne persönlich!`,
        footer_cta: `Starten Sie noch heute Ihr erfolgreiches ${keyword} Projekt mit unserem Expertenteam`,
        trust_signals: `Zertifiziert • Sicher • Garantiert • ${keyword} Experten seit über 10 Jahren`,
        guarantee_text: `30-Tage-Geld-zurück-Garantie auf alle ${keyword} Services und Dienstleistungen`
    };
    
    // Fülle fehlende Felder auf
    Object.keys(required).forEach(key => {
        if (!data[key] || data[key] === null || data[key] === '') {
            data[key] = required[key];
        }
    });
    
    return data;
}

module.exports = async (req, res) => {
    try {
        console.log('Silas API gestartet');
        
        // CORS Headers
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Silas-Master');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        // REQUEST VALIDATION
        const { prompt, keyword, intent = 'informational' } = req.body;
        
        if (!keyword) {
            return res.status(400).json({ 
                error: 'Keyword ist erforderlich'
            });
        }

        console.log(`Generiere Content für: "${keyword}" (${intent})`);

        // MASTER MODE
        const isMasterRequest = req.headers['x-silas-master'] === 'SilasUnlimited2024!';
        
        // API SETUP
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API-Schlüssel fehlt' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // MODEL SELECTION
        let model = null;
        let usedModel = null;
        const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash"];
        
        for (const modelName of modelNames) {
            try {
                model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0.9, // Höher für kreativen Content
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8000,
                    }
                });
                usedModel = modelName;
                console.log('Modell geladen:', modelName);
                break;
            } catch (modelError) {
                continue;
            }
        }

        if (!model) {
            return res.status(500).json({ error: 'Kein Modell verfügbar' });
        }

        // VERBESSERTER PROMPT - GARANTIERT ALLE FELDER
        const context = keyword.toLowerCase().includes('software') || keyword.toLowerCase().includes('web') || keyword.toLowerCase().includes('app') ? 'tech' : 'business';
        const isCommercial = intent === 'commercial';
        
        const improvedPrompt = `Du bist ein kreativer Content-Strategist und ${isCommercial ? 'Marketing-Experte' : 'SEO-Redakteur'}.

AUFTRAG: Erstelle einzigartigen, hochwertigen Content für das Keyword "${keyword}".

KONTEXT: ${context === 'tech' ? 'Technische Zielgruppe (Entwickler, IT-Manager)' : 'Business-Zielgruppe (Unternehmer, Manager)'}

CONTENT-STIL:
${isCommercial ? '- Überzeugend und verkaufsorientiert\n- Nutzenbasiert mit klaren CTAs\n- Vertrauensbildend mit Social Proof' : '- Informativ und hilfreich\n- Sachlich aber ansprechend\n- Lösungsorientiert und praktisch'}

ABSOLUTE PFLICHT - ALLE FELDER MÜSSEN GEFÜLLT WERDEN:
Jedes einzelne Feld im JSON muss mit relevantem, spezifischem Content für "${keyword}" gefüllt sein. KEIN Feld darf leer bleiben!

VERMEIDE STANDARD-PHRASEN:
- "jahrelange Erfahrung", "professionell und zuverlässig"  
- "Ihr vertrauensvoller Partner", "maßgeschneiderte Lösungen"
- "höchste Qualität", "erstklassiger Service"

KREATIVITÄTS-REGELN:
- Nutze lebendige, bildhafte Sprache
- Verwende konkrete Beispiele und Zahlen
- Schaffe emotionale Verbindung zur Zielgruppe
- Jeder Text muss einzigartig für "${keyword}" sein

ANTWORT NUR ALS VALIDES JSON (beginne mit { und ende mit }):

{
  "post_title": "Kreativer SEO-Titel für ${keyword} mit Hauptnutzen (50-60 Zeichen)",
  "post_name": "${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_title": "Alternativer SEO-Titel für ${keyword} (unterschiedlich zum post_title)",
  "meta_description": "Überzeugende Meta-Beschreibung für ${keyword} mit starkem CTA (150-160 Zeichen)",
  "h1": "Kraftvolle, emotionale H1-Überschrift für ${keyword}",
  "h2_1": "Erste H2: Problem/Herausforderung bei ${keyword}",
  "h2_2": "Zweite H2: Unsere ${keyword} Lösung/Methodik",
  "h2_3": "Dritte H2: ${keyword} Features und Möglichkeiten",
  "h2_4": "Vierte H2: Warum bei uns ${keyword} wählen",
  "primary_cta": "${isCommercial ? 'Direkter Verkaufs-CTA für ' + keyword : 'Informativer CTA für ' + keyword} (max 30 Zeichen)",
  "secondary_cta": "Alternativer, sanfterer CTA für ${keyword}",
  "hero_text": "Mitreißender Hero-Text (80-100 Wörter): Vermittle den ${keyword} Nutzen emotional und überzeugend",
  "hero_subtext": "Unterstützende Unterüberschrift für ${keyword} (30-40 Wörter)",
  "benefits_list": "HTML-Liste (<ul><li>...</li></ul>) mit 5 spezifischen ${keyword} Vorteilen",
  "features_list": "HTML-Liste (<ul><li>...</li></ul>) mit 5 konkreten ${keyword} Features",
  "social_proof": "Spezifische Sozialbeweise für ${keyword} mit echten Zahlen",
  "testimonial_1": "Erstes ausführliches Kunden-Testimonial mit Name, Firma und ${keyword} Erfahrung",
  "testimonial_2": "Zweites Testimonial mit anderem Blickwinkel auf ${keyword}",
  "pricing_title": "Überschrift für ${keyword} Preispakete (nicht generisch)",
  "price_1": "Starter ${keyword} Paket: Was ist enthalten und für wen geeignet",
  "price_2": "Professional ${keyword} Paket: Erweiterte Features und Zielgruppe",
  "price_3": "Enterprise ${keyword} Paket: Premium Features und Service-Level",
  "faq_1": "Erste häufige Frage zu ${keyword} (spezifisch und relevant)",
  "faq_answer_1": "Ausführliche Antwort zur ersten ${keyword} Frage (60-80 Wörter)",
  "faq_2": "Zweite wichtige ${keyword} Frage (anders als erste)",
  "faq_answer_2": "Detaillierte Antwort zur zweiten ${keyword} Frage (60-80 Wörter)",
  "faq_3": "Dritte relevante ${keyword} Frage (Fokus auf Umsetzung)",
  "faq_answer_3": "Praktische Antwort zur dritten ${keyword} Frage (60-80 Wörter)",
  "contact_info": "Kontakt-Information mit spezifischem ${keyword} Bezug",
  "footer_cta": "Finaler Call-to-Action für ${keyword} mit Motivation",
  "trust_signals": "Konkrete Vertrauenssignale für ${keyword} (Zertifikate, Awards etc.)",
  "guarantee_text": "Spezifische Garantie für ${keyword} Services mit Bedingungen"
}

ABSOLUTE ANFORDERUNG: Erstelle vollständigen Content für JEDES dieser Felder. Kein Feld darf leer bleiben!`;
}

module.exports = async (req, res) => {
    try {
        console.log('=== SILAS START ===');
        console.log('Request method:', req.method);
        console.log('Request body:', req.body);
        
        // CORS Headers
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Silas-Master');

        if (req.method === 'OPTIONS') {
            console.log('OPTIONS handled');
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        // VALIDATION
        const { prompt, keyword, intent = 'informational' } = req.body;
        
        console.log('Extracted values:');
        console.log('- keyword:', keyword);
        console.log('- intent:', intent);
        
        if (!keyword) {
            return res.status(400).json({ 
                error: 'Keyword fehlt',
                debug: req.body
            });
        }

        // MASTER MODE
        const isMasterRequest = req.headers['x-silas-master'] === 'SilasUnlimited2024!';
        console.log('Master mode:', isMasterRequest);

        // API SETUP
        const apiKey = process.env.GEMINI_API_KEY;
        console.log('API Key available:', !!apiKey);
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'GEMINI_API_KEY nicht konfiguriert' 
            });
        }

        // GOOGLE AI
        console.log('Initializing Google AI...');
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // MODEL
        console.log('Loading model...');
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                temperature: 0.9,
                topK: 50,
                topP: 0.95,
                maxOutputTokens: 8000,
            }
        });

        // PROMPT MIT FELD-GARANTIE
        console.log('Creating prompt...');
        const detailedPrompt = createSimplePrompt(keyword, intent, 'standard');
        
        console.log('Prompt length:', detailedPrompt.length);
        console.log('Starting generation...');

        // GENERATION
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000);
        
        const result = await model.generateContent(detailedPrompt);
        clearTimeout(timeoutId);
        
        console.log('Generation completed');

        // RESPONSE
        const response = await result.response;
        const responseText = response.text();
        
        console.log('Response received, length:', responseText.length);
        console.log('First 200 chars:', responseText.substring(0, 200));

        // JSON EXTRACTION UND PARSING
        let jsonData;
        try {
            console.log('Parsing JSON...');
            
            // Robustes JSON-Finden
            let jsonString = responseText;
            
            // Entferne Markdown falls vorhanden
            jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '');
            
            // Finde JSON Start und Ende
            const startIndex = jsonString.indexOf('{');
            const endIndex = jsonString.lastIndexOf('}');
            
            if (startIndex === -1 || endIndex === -1) {
                throw new Error('JSON Block nicht gefunden');
            }
            
            jsonString = jsonString.substring(startIndex, endIndex + 1);
            
            // Bereinige den JSON String
            jsonString = jsonString
                .replace(/\n/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/\t/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            jsonData = JSON.parse(jsonString);
            console.log('JSON parsing successful');
            console.log('Parsed fields count:', Object.keys(jsonData).length);
            
        } catch (parseError) {
            console.error('JSON parse error:', parseError.message);
            console.log('Raw response:', responseText);
            
            // NOTFALL-FALLBACK
            jsonData = {
                post_title: `${keyword} - Ihre Lösung`,
                post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                meta_title: `${keyword} Experte`,
                meta_description: `${keyword} Services von Experten. Jetzt informieren!`,
                h1: `${keyword} - Ihre professionelle Lösung`,
                h2_1: `Warum ${keyword} wichtig ist`,
                h2_2: `Unsere ${keyword} Expertise`, 
                h2_3: `${keyword} Vorteile`,
                h2_4: `Unser ${keyword} Team`,
                primary_cta: `${keyword} anfragen`,
                secondary_cta: `Mehr über ${keyword}`,
                hero_text: `Professionelle ${keyword} Lösungen für Ihre Anforderungen.`,
                hero_subtext: `Vertrauen Sie auf unsere ${keyword} Expertise`,
                benefits_list: `<ul><li>${keyword} Beratung</li><li>Individuelle Lösungen</li></ul>`,
                features_list: `<ul><li>${keyword} Features</li><li>Support</li></ul>`,
                social_proof: `${keyword} von vielen Kunden genutzt`,
                testimonial_1: `"Großartiger ${keyword} Service!" - Max Mustermann`,
                testimonial_2: `"Empfehlenswerte ${keyword} Lösung!" - Anna Schmidt`,
                pricing_title: `${keyword} Preise`,
                price_1: `${keyword} Starter`,
                price_2: `${keyword} Professional`,
                price_3: `${keyword} Enterprise`,
                faq_1: `Was ist ${keyword}?`,
                faq_answer_1: `${keyword} ist eine professionelle Lösung für Ihre Bedürfnisse.`,
                faq_2: `Wie funktioniert ${keyword}?`,
                faq_answer_2: `${keyword} wird individuell an Ihre Anforderungen angepasst.`,
                faq_3: `Was kostet ${keyword}?`,
                faq_answer_3: `${keyword} Preise richten sich nach dem gewählten Paket.`,
                contact_info: `Kontakt für ${keyword} Beratung`,
                footer_cta: `${keyword} jetzt starten`,
                trust_signals: `${keyword} Experten`,
                guarantee_text: `${keyword} Garantie`,
                _fallback_used: true
            };
        }

        // VOLLSTÄNDIGKEITS-CHECK UND REPARATUR
        console.log('Ensuring all fields...');
        jsonData = ensureAllFields(jsonData, keyword, intent);
        
        // Zähle gefüllte Felder
        const filledFields = Object.keys(jsonData).filter(key => 
            !key.startsWith('_') && jsonData[key] && jsonData[key] !== null && jsonData[key] !== ''
        ).length;
        
        console.log('Filled fields after ensuring:', filledFields);

        // METADATA
        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData._meta = {
            model_used: usedModel,
            generation_time: new Date().toISOString(),
            filled_fields: filledFields,
            master_mode: isMasterRequest
        };

        console.log('=== SUCCESS ===');
        console.log('Keyword:', keyword);
        console.log('Fields filled:', filledFields);
        
        return res.status(200).json(jsonData);

    } catch (error) {
        console.error('=== CRITICAL ERROR ===');
        console.error('Type:', error.name);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Server-Fehler',
            details: error.message,
            type: error.name,
            timestamp: new Date().toISOString()
        });
    }
};
