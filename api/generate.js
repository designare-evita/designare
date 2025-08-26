// api/generate.js - NEUE VERSION MIT QUALITÄTSKONTROLLE

const { GoogleGenerativeAI } = require("@google/generative-ai");

// KEYWORD-KONTEXT ANALYSE
function analyzeKeywordContext(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    
    const contexts = {
        'tech': {
            terms: ['software', 'app', 'digital', 'ai', 'web', 'plugin', 'tool', 'system', 'online', 'cloud', 'wordpress'],
            audience: 'Entwickler, IT-Entscheider, Tech-Unternehmen',
            problems: 'Komplexität, Sicherheitsbedenken, Performance-Probleme, Integration',
            solutions: 'Effizienz, Automatisierung, Skalierbarkeit, Benutzerfreundlichkeit'
        },
        'business': {
            terms: ['marketing', 'seo', 'beratung', 'service', 'consulting', 'strategie', 'erfolg', 'umsatz', 'kunden'],
            audience: 'Unternehmer, Marketing-Manager, Selbstständige',
            problems: 'Zeitmanagement, ROI-Unsicherheit, starke Konkurrenz, Sichtbarkeit',
            solutions: 'Wachstum, Effizienz, Wettbewerbsvorteil, Marktführerschaft'
        },
        'health': {
            terms: ['gesundheit', 'fitness', 'wellness', 'ernährung', 'sport', 'therapie', 'training'],
            audience: 'Gesundheitsbewusste, Patienten, Sportler',
            problems: 'Gesundheitsprobleme, Zeitmangel, fehlende Motivation, Unsicherheit',
            solutions: 'Wohlbefinden, Lebensqualität, Prävention, Leistungssteigerung'
        },
        'finance': {
            terms: ['kredit', 'finanz', 'versicherung', 'bank', 'geld', 'investment', 'steuer'],
            audience: 'Privatpersonen, KMU, Investoren',
            problems: 'Finanzielle Unsicherheit, Komplexität, Risikomanagement',
            solutions: 'Sicherheit, Rendite, Transparenz, Planbarkeit'
        }
    };
    
    for (const [contextName, contextData] of Object.entries(contexts)) {
        if (contextData.terms.some(term => lowerKeyword.includes(term))) {
            return { name: contextName, ...contextData };
        }
    }
    
    return {
        name: 'general',
        audience: 'Interessenten und potenzielle Kunden',
        problems: 'Verschiedene Herausforderungen und Bedürfnisse',
        solutions: 'Qualität, Zuverlässigkeit, professioneller Service'
    };
}

// ERWEITERTE PROMPT-ERSTELLUNG
function createContextualPrompt(keyword, intent, context) {
    const intentConfig = {
        'commercial': {
            role: 'erfahrener Conversion-Copywriter mit Fokus auf Performance Marketing',
            objective: 'Besucher zu zahlenden Kunden konvertieren',
            tone: 'überzeugend, nutzenorientiert, vertrauensbildend, handlungsmotivierend',
            ctaStyle: 'direkt und dringlichkeitsorientiert',
            focus: 'ROI-Versprechen, Wettbewerbsvorteile, Risikominimierung'
        },
        'informational': {
            role: 'Fachexperte und Content-Stratege für informative Inhalte',
            objective: 'Wissen vermitteln und Vertrauen durch Expertise aufbauen',
            tone: 'sachlich-autoritativ, hilfreich, lösungsorientiert',
            ctaStyle: 'beratend und einladend',
            focus: 'Problemanalyse, praktische Lösungen, Thought Leadership'
        }
    };
    
    const config = intentConfig[intent];
    
    return `Du bist ein ${config.role}.

MISSION: ${config.objective}
STIL: ${config.tone}

KEYWORD-ANALYSE:
- Hauptkeyword: "${keyword}"
- Branche: ${context.name.toUpperCase()}
- Zielgruppe: ${context.audience}
- Hauptprobleme: ${context.problems}
- Lösungsansätze: ${context.solutions}

CONTENT-FOKUS:
${config.focus}

STRIKT VERMEIDEN (führt zur Ablehnung):
- "jahrelange Erfahrung", "professionell und zuverlässig"
- "Ihr vertrauensvoller Partner", "maßgeschneiderte Lösungen" 
- "höchste Qualität", "erstklassiger Service"
- Wiederholungen zwischen verschiedenen Feldern
- Oberflächliche Allgemeinplätze ohne ${keyword}-Bezug

QUALITÄTS-KRITERIEN:
✓ Jeder Text spezifisch für "${keyword}" und ${context.name}-Kontext
✓ Konkrete Nutzenversprechen statt vager Aussagen
✓ Emotional ansprechend aber glaubwürdig
✓ ${config.ctaStyle} Call-to-Actions
✓ Keyword natürlich integriert (6-10x im gesamten Content)

ANTWORT-FORMAT: Ausschließlich valides JSON ohne Markdown:

{
  "post_title": "SEO-Titel: ${keyword} + Hauptnutzen (50-60 Zeichen)",
  "post_name": "${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_title": "Alternative SEO-Variante (unterschiedlich zum post_title)",
  "meta_description": "Überzeugende Meta-Beschreibung mit CTA (150-160 Zeichen)",
  "h1": "Kraftvolle H1: ${keyword} + emotionaler Hauptnutzen",
  "h2_1": "Problem-H2: Warum ${keyword} herausfordernd/wichtig ist",
  "h2_2": "Lösungs-H2: Unser ${keyword}-Ansatz/Methodik", 
  "h2_3": "Nutzen-H2: Was ${keyword} konkret bringt/ermöglicht",
  "h2_4": "Vertrauens-H2: Warum bei uns ${keyword} wählen",
  "primary_cta": "${config.ctaStyle} CTA (max. 30 Zeichen)",
  "secondary_cta": "Alternative, sanftere Handlungsaufforderung",
  "hero_text": "Einprägsamer Hero-Text (70-90 Wörter): Vermittle sofort ${keyword}-Nutzen für ${context.audience}",
  "hero_subtext": "Unterstützende Unterüberschrift (25-35 Wörter) mit Credibility-Element",
  "benefits_list": "HTML-Liste (<ul><li>...</li></ul>) mit 5-6 spezifischen ${keyword}-Vorteilen (je 10-15 Wörter)",
  "features_list": "HTML-Liste (<ul><li>...</li></ul>) mit 5-6 konkreten ${keyword}-Features/Eigenschaften", 
  "social_proof": "Spezifische Sozialbeweise mit Zahlen (nicht '1.000 Kunden')",
  "testimonial_1": "Realistisches Zitat mit Vor-/Nachname + Firmenkontext + ${keyword}-Nutzen",
  "testimonial_2": "Zweites Testimonial: andere Branche/Perspektive als erstes",
  "pricing_title": "Preis-Überschrift mit ${keyword}-Bezug (nicht 'Wählen Sie Ihren Plan')",
  "price_1": "Starter-Paket: konkrete ${keyword}-Features + Zielgruppe (25-35 Wörter)",
  "price_2": "Professional: erweiterte ${keyword}-Features + Service (30-40 Wörter)",
  "price_3": "Enterprise: Premium ${keyword}-Features + exklusiver Service (35-45 Wörter)",
  "faq_1": "Häufigste ECHTE ${keyword}-Frage (spezifisch, nicht generisch)",
  "faq_answer_1": "Detaillierte Antwort mit praktischen ${keyword}-Informationen (40-60 Wörter)",
  "faq_2": "Zweithäufigste Frage (Umsetzung/Kosten/Prozess)",
  "faq_answer_2": "Konkrete Antwort mit Zahlen/Beispielen (40-60 Wörter)",
  "faq_3": "Technische/Detail-Frage zu ${keyword}",
  "faq_answer_3": "Fachlich fundierte Antwort (40-60 Wörter)",
  "contact_info": "Kontakt-Text mit spezifischem ${keyword}-Bezug + bevorzugter Kontaktweg",
  "footer_cta": "Finaler CTA: Motivation + ${keyword} + Zeitkomponente",
  "trust_signals": "Konkrete Vertrauenselemente: Zertifikate, Awards, spezifische Referenzen",
  "guarantee_text": "Spezifische ${keyword}-Garantie mit klaren Bedingungen"
}

Erstelle einzigartigen, hochwertigen Content für "${keyword}":`;
}
```

// CONTENT-VALIDIERUNG
function validateContent(data, keyword, intent) {
    const issues = [];
    const warnings = [];
    
    // Standard-Floskeln erkennen
    const forbiddenPhrases = [
        'jahrelange erfahrung',
        'professionell und zuverlässig', 
        'ihr vertrauensvoller partner',
        'maßgeschneiderte lösungen',
        'höchste qualität',
        'erstklassiger service',
        'kompetent und zuverlässig'
    ];
    
    // Prüfe wichtige Textfelder
    const criticalFields = ['hero_text', 'meta_description', 'post_title'];
    criticalFields.forEach(field => {
        if (data[field]) {
            const text = data[field].toLowerCase();
            forbiddenPhrases.forEach(phrase => {
                if (text.includes(phrase)) {
                    issues.push(`${field}: Generische Phrase "${phrase}" vermeiden`);
                }
            });
        }
    });
    
    // Längen-Validierung
    if (data.hero_text && data.hero_text.split(' ').length < 40) {
        warnings.push('Hero-Text könnte ausführlicher sein');
    }
    
    if (data.meta_description && data.meta_description.length > 160) {
        warnings.push('Meta-Description zu lang für Google');
    }
    
    // Keyword-Relevanz prüfen
    const allText = Object.values(data).filter(v => typeof v === 'string').join(' ').toLowerCase();
    const keywordCount = (allText.match(new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    
    if (keywordCount < 6) {
        issues.push(`Keyword "${keyword}" zu selten verwendet (${keywordCount}x, min. 6x)`);
    }
    
    // Qualitäts-Score berechnen
    let score = 1.0;
    score -= issues.length * 0.2;  // Schwere Abzüge für Probleme
    score -= warnings.length * 0.05; // Leichte Abzüge für Warnungen
    score = Math.max(0, Math.min(1, score));
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        warnings: warnings,
        score: score,
        keywordDensity: keywordCount
    };
}

// INTELLIGENTER FALLBACK
function createSmartFallback(keyword, intent, context) {
    const templates = {
        'tech': {
            hero: `Entdecken Sie ${keyword} - die innovative Lösung für moderne digitale Anforderungen. Unsere technische Expertise und benutzerfreundliche Umsetzung machen ${keyword} zum Erfolgsfaktor für Ihr Unternehmen.`,
            benefits: [
                `Schnelle ${keyword}-Implementierung ohne komplexe Umstellungen`,
                'Intuitive Benutzeroberfläche reduziert Einarbeitungszeit erheblich',
                'Skalierbare Architektur wächst mit Ihren Anforderungen mit',
                'Automatisierte Prozesse sparen wertvolle Entwicklungszeit',
                'Enterprise-Sicherheit schützt sensible Unternehmensdaten zuverlässig'
            ]
        },
        'business': {
            hero: `Steigern Sie Ihren Geschäftserfolg mit strategischem ${keyword}. Unsere datenbasierten Methoden und bewährten Strategien führen zu messbaren Ergebnissen in Ihrem Markt.`,
            benefits: [
                `ROI-optimierte ${keyword}-Strategien mit nachweisbaren Resultaten`,
                'Detaillierte Marktanalyse deckt verborgene Potenziale auf',
                'Systematische Umsetzung minimiert Geschäftsrisiken spürbar',
                'Kontinuierliches Performance-Tracking ermöglicht präzise Optimierung',
                'Branchenspezifische Expertise verkürzt Time-to-Market erheblich'
            ]
        },
        'health': {
            hero: `Verbessern Sie Ihr Wohlbefinden mit ${keyword}. Wissenschaftlich fundierte Ansätze und individuelle Betreuung helfen Ihnen, Ihre persönlichen Gesundheitsziele zu erreichen.`,
            benefits: [
                `Evidenzbasierte ${keyword}-Methoden mit klinisch nachgewiesener Wirksamkeit`,
                'Individuelle Betreuung nach Ihren spezifischen Bedürfnissen',
                'Ganzheitlicher Ansatz für nachhaltige und langfristige Ergebnisse',
                'Kontinuierliche Fortschrittskontrolle mit präzisen Anpassungen',
                'Qualifizierte Fachkräfte mit spezieller ${keyword}-Expertise'
            ]
        }
    };
    
    const template = templates[context.name] || templates['business'];
    
    return {
        post_title: `${keyword} - Ihre Lösung für ${context.solutions.split(',')[0]}`,
        post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        meta_title: `${keyword} Expertise | ${context.solutions.split(',')[0]} optimieren`,
        meta_description: `${keyword}: ${template.hero.substring(0, 120)}... Jetzt ${intent === 'commercial' ? 'starten' : 'informieren'}!`,
        h1: `${keyword} - ${context.solutions.split(',')[0]} durch Innovation`,
        h2_1: `Warum ${keyword} für ${context.audience} unverzichtbar ist`,
        h2_2: `Unsere bewährte ${keyword}-Expertise in der Praxis`,
        h2_3: `${keyword} Features und konkrete Anwendungsmöglichkeiten`,
        h2_4: `Vertrauen Sie auf unsere ${keyword}-Kompetenz`,
        primary_cta: intent === 'commercial' ? `${keyword} jetzt nutzen` : `${keyword} Guide erhalten`,
        secondary_cta: `Kostenlose ${keyword} Beratung`,
        hero_text: template.hero,
        hero_subtext: `Vertrauen Sie auf unsere Expertise im Bereich ${keyword}`,
        benefits_list: '<ul>' + template.benefits.map(b => `<li>${b}</li>`).join('') + '</ul>',
        features_list: `<ul><li>${keyword}-Integration in bestehende Systeme</li><li>Benutzerfreundliche Oberfläche und Navigation</li><li>Umfassende Dokumentation und Support</li><li>Regelmäßige Updates und Weiterentwicklung</li><li>Skalierbare Lösung für verschiedene Unternehmensgrößen</li></ul>`,
        social_proof: `Von ${Math.floor(Math.random() * 400) + 100} ${context.audience.split(',')[0]} erfolgreich eingesetzt`,
        testimonial_1: `"Ausgezeichnete ${keyword}-Lösung! Die Umsetzung war reibungslos und die Ergebnisse übertreffen unsere Erwartungen deutlich." - Sandra Mueller, Projektleiterin bei InnovateCorp`,
        testimonial_2: `"Endlich eine ${keyword}-Lösung, die hält was sie verspricht. Professionelle Betreuung und messbare Erfolge." - Thomas Wagner, Geschäftsführer DataFlow GmbH`,
        pricing_title: `Wählen Sie Ihr optimales ${keyword}-Paket`,
        price_1: `${keyword} Starter: Grundfunktionen für den erfolgreichen Einstieg`,
        price_2: `${keyword} Professional: Erweiterte Features für anspruchsvolle Projekte`,
        price_3: `${keyword} Enterprise: Vollumfang mit Premium-Support und individuellen Anpassungen`,
        faq_1: `Was macht Ihre ${keyword}-Lösung besonders effektiv?`,
        faq_answer_1: `Unsere ${keyword}-Lösung kombiniert bewährte Methoden mit innovativer Technologie. Dadurch erreichen Sie schneller messbare Ergebnisse bei optimalem Ressourceneinsatz.`,
        faq_2: `Wie lange dauert die ${keyword}-Implementierung typischerweise?`,
        faq_answer_2: `Die Implementierungsdauer variiert je nach Projektumfang zwischen 1-4 Wochen. Wir erstellen einen detaillierten Zeitplan basierend auf Ihren spezifischen ${keyword}-Anforderungen.`,
        faq_3: `Welche Garantien bieten Sie für Ihre ${keyword}-Services?`,
        faq_answer_3: `Wir bieten eine 30-Tage-Zufriedenheitsgarantie. Sollten die ${keyword}-Ergebnisse nicht Ihren Erwartungen entsprechen, finden wir gemeinsam eine Lösung oder erstatten den Betrag.`,
        contact_info: `Fragen zu ${keyword}? Kontaktieren Sie unsere Experten für eine kostenlose Erstberatung.`,
        footer_cta: `Starten Sie noch heute Ihr erfolgreiches ${keyword}-Projekt`,
        trust_signals: `Zertifiziert • Datenschutz-konform • ${keyword}-Experten seit 2020`,
        guarantee_text: `30-Tage-Geld-zurück-Garantie auf alle ${keyword}-Services`,
        _fallback_used: true,
        _context: context.name
    };
}

// HAUPTFUNKTION
module.exports = async (req, res) => {
    const startTime = Date.now();
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

    try {
        // REQUEST VALIDATION
        const { prompt, keyword, intent = 'informational' } = req.body;
        
        if (!keyword) {
            return res.status(400).json({ 
                error: 'Keyword ist erforderlich',
                received: { prompt: !!prompt, keyword: !!keyword, intent: intent }
            });
        }

        console.log(`Content-Generierung für: "${keyword}" (${intent})`);

        // MASTER MODE & RATE LIMITING
        const isMasterRequest = req.headers['x-silas-master'] === 'SilasUnlimited2024!';
        
        if (!isMasterRequest) {
            if (keyword.length > 50) {
                return res.status(400).json({ 
                    error: 'Keyword zu lang (max. 50 Zeichen in Demo-Version)'
                });
            }
        }

        // API SETUP
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Server-Konfiguration unvollständig',
                details: 'API-Schlüssel nicht verfügbar'
            });
        }

        // GOOGLE AI INITIALIZATION
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
        let model = null;
        let usedModel = null;
        
        for (const modelName of modelNames) {
            try {
                model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0.8, // Erhöht für kreativeren Content
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8000,
                    }
                });
                usedModel = modelName;
                console.log('Modell geladen:', modelName);
                break;
            } catch (modelError) {
                console.warn('Modell nicht verfügbar:', modelName);
                continue;
            }
        }

        if (!model) {
            return res.status(500).json({ 
                error: 'KI-Modell nicht verfügbar',
                details: 'Alle Modell-Varianten sind derzeit nicht erreichbar'
            });
        }

        // CONTEXT ANALYSIS & PROMPT BUILDING
        const USE_ENHANCED = process.env.SILAS_ENHANCED === 'true';
        const context = analyzeKeywordContext(keyword);
        let finalPrompt;
        
        if (USE_ENHANCED) {
            finalPrompt = createContextualPrompt(keyword, intent, context);
            console.log('Enhanced Prompt für Kontext:', context.name);
        } else {
            // Vereinfachter Fallback-Prompt
            finalPrompt = `Du bist ein SEO-Content-Experte. Erstelle Content für "${keyword}".

Antwort als valides JSON:
{
  "post_title": "SEO-Titel für ${keyword}",
  "meta_description": "Meta-Beschreibung für ${keyword}", 
  "h1": "H1-Überschrift für ${keyword}",
  "hero_text": "Hero-Text über ${keyword}",
  "benefits_list": "HTML-Liste mit ${keyword}-Vorteilen",
  "primary_cta": "Call-to-Action für ${keyword}"
}`;
        }

        // CONTENT GENERATION
        console.log('Starte Content-Generierung...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 50000);
        
        const result = await model.generateContent(finalPrompt);
        clearTimeout(timeoutId);
        
        const response = await result.response;
        const responseText = response.text();
        
        console.log('Response erhalten, Länge:', responseText.length);

        // JSON PARSING
        let jsonData;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Kein valides JSON gefunden');
            }
            
            jsonData = JSON.parse(jsonMatch[0]);
            console.log('JSON erfolgreich geparst');
            
        } catch (parseError) {
            console.warn('JSON-Parse-Fehler, verwende intelligenten Fallback');
            jsonData = createSmartFallback(keyword, intent, context);
        }

        // QUALITY VALIDATION (nur bei Enhanced Mode)
        if (USE_ENHANCED) {
            const validation = validateContent(jsonData, keyword, intent);
            console.log('Quality Score:', Math.round(validation.score * 100) + '%');
            
            jsonData._quality = {
                score: validation.score,
                issues: validation.issues,
                warnings: validation.warnings,
                keyword_density: validation.keywordDensity
            };
            
            // Bei sehr schlechter Qualität: Fallback nutzen
            if (validation.score < 0.3) {
                console.log('Qualität unzureichend, nutze Fallback');
                jsonData = createSmartFallback(keyword, intent, context);
                jsonData._quality = {
                    score: 0.7,
                    issues: ['Fallback wegen schlechter Qualität'],
                    warnings: [],
                    keyword_density: 8
                };
            }
        }

        // RESPONSE METADATA
        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData._meta = {
            model_used: usedModel,
            generation_time: new Date().toISOString(),
            processing_duration: Date.now() - startTime,
            context_detected: context.name,
            enhanced_mode: USE_ENHANCED,
            master_mode: isMasterRequest
        };

        console.log(`Content erstellt für "${keyword}" in ${Date.now() - startTime}ms`);
        
        return res.status(200).json(jsonData);

    } catch (error) {
        console.error('Unerwarteter Fehler:', error);
        
        // Differenzierte Fehlerbehandlung
        if (error.message.includes('timeout') || error.name === 'AbortError') {
            return res.status(408).json({ 
                error: 'Content-Generierung dauert zu lange',
                details: 'Bitte versuchen Sie es mit einem kürzeren Keyword'
            });
        }
        
        if (error.message.includes('quota') || error.message.includes('limit')) {
            return res.status(429).json({ 
                error: 'API-Limit erreicht',
                details: 'Bitte warten Sie einen Moment und versuchen es erneut'
            });
        }
        
        return res.status(500).json({ 
            error: 'Interner Server-Fehler',
            details: 'Ein unerwarteter Fehler ist aufgetreten',
            timestamp: new Date().toISOString(),
            keyword: req.body?.keyword || 'unknown'
        });
    }
};
