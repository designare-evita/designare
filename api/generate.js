// api/generate.js - FINALE VERSION MIT DYNAMISCHEN PROMPTS

const { GoogleGenerativeAI } = require("@google/generative-ai");

// KEYWORD-SPEZIFISCHE PROMPT-ERSTELLUNG
function createSmartPrompt(keyword, intent) {
    const lowerKeyword = keyword.toLowerCase();
    
    // AUTOMATISCHE KONTEXT-ERKENNUNG
    let context = 'general';
    let audience = 'Interessenten';
    let problems = 'verschiedene Herausforderungen';
    let solutions = 'passende Lösungen';
    
    if (lowerKeyword.includes('hund') || lowerKeyword.includes('tier') || lowerKeyword.includes('haustier')) {
        context = 'pets';
        audience = 'Hundebesitzer und Tierliebhaber';
        problems = 'Sicherheit, Gesundheit und Wohlbefinden der Vierbeiner';
        solutions = 'artgerechte Betreuung und Sicherheit';
    } else if (lowerKeyword.includes('wordpress') || lowerKeyword.includes('plugin') || lowerKeyword.includes('web') || lowerKeyword.includes('software')) {
        context = 'tech';
        audience = 'Entwickler, Website-Betreiber und IT-Entscheider';
        problems = 'technische Komplexität und Performance-Optimierung';
        solutions = 'benutzerfreundliche Tools und Automatisierung';
    } else if (lowerKeyword.includes('cafe') || lowerKeyword.includes('restaurant') || lowerKeyword.includes('gastronomie')) {
        context = 'gastro';
        audience = 'Gastronomiebetreiber und Genießer';
        problems = 'Qualität, Service und Kundenzufriedenheit';
        solutions = 'exzellente Kulinarik und Atmosphäre';
    } else if (lowerKeyword.includes('marketing') || lowerKeyword.includes('seo') || lowerKeyword.includes('beratung')) {
        context = 'business';
        audience = 'Unternehmer, Marketing-Manager und Selbstständige';
        problems = 'Sichtbarkeit, Konkurrenz und ROI-Optimierung';
        solutions = 'strategisches Wachstum und Marktvorteile';
    }
    
    // INTENT-SPEZIFISCHE ANPASSUNGEN
    const isCommercial = intent === 'commercial';
    const roleDefinition = isCommercial ? 
        'verkaufsorientierter Marketing-Copywriter mit Fokus auf Conversion-Optimierung' :
        'informativer Content-Experte mit Fokus auf Mehrwert und Problemlösung';
    
    const ctaStyle = isCommercial ? 'direkt und handlungsorientiert' : 'beratend und einladend';
    
    // KONTEXT-SPEZIFISCHE BEISPIELE
    const contextExamples = {
        'pets': {
            titleExample: `"${keyword}: Sicherheitstipps für Hundebesitzer"`,
            heroExample: `"Entspannte ${keyword}-Erlebnisse für Sie und Ihren Vierbeiner"`,
            benefitExample: `"Sicherheits-Checkliste für ${keyword}-Ausflüge"`
        },
        'tech': {
            titleExample: `"${keyword} - Entwickler-Guide & Best Practices"`,
            heroExample: `"Optimieren Sie Ihre Workflow mit ${keyword}-Lösungen"`,
            benefitExample: `"Performance-Boost durch ${keyword}-Integration"`
        },
        'gastro': {
            titleExample: `"${keyword} - Kulinarische Highlights & Atmosphäre"`,
            heroExample: `"Genießen Sie unvergessliche Momente in unserem ${keyword}"`,
            benefitExample: `"Frische Zutaten und authentische ${keyword}-Spezialitäten"`
        },
        'business': {
            titleExample: `"${keyword} - ROI-optimierte Strategien & Umsetzung"`,
            heroExample: `"Steigern Sie Ihren Erfolg mit professionellem ${keyword}"`,
            benefitExample: `"Messbare Ergebnisse durch ${keyword}-Expertise"`
        }
    };
    
    const examples = contextExamples[context] || contextExamples['business'];
    
    return `Du bist ein ${roleDefinition}.

KEYWORD-ANALYSE:
Hauptkeyword: "${keyword}"
Kontext: ${context.toUpperCase()}
Zielgruppe: ${audience}
Hauptprobleme: ${problems}
Lösungsansätze: ${solutions}

CONTENT-AUSRICHTUNG:
${isCommercial ? 
`- Verkaufsorientiert mit klaren Nutzenversprechen
- Vertrauensbildende Elemente und Social Proof
- Starke, handlungsorientierte Call-to-Actions
- ROI und konkrete Vorteile betonen` :
`- Informativ und lösungsorientiert
- Hilfreiche Tipps und praktische Anleitungen
- Vertrauensaufbau durch Expertise
- Beratende, einladende Call-to-Actions`}

KREATIVITÄTS-RICHTLINIEN:
- Verwende lebendige, bildhafte Sprache statt Fachkauderwelsch
- Nutze konkrete Beispiele und spezifische Details für "${keyword}"
- Schaffe emotionale Verbindung zur Zielgruppe
- Jeder Text muss einzigartig und keyword-spezifisch sein

BEISPIELE FÜR GUTEN ${keyword.toUpperCase()}-CONTENT:
Titel-Stil: ${examples.titleExample}
Hero-Stil: ${examples.heroExample}
Benefit-Stil: ${examples.benefitExample}

STRIKT VERMEIDEN (führt zur Ablehnung):
❌ "jahrelange Erfahrung", "professionell und zuverlässig"
❌ "Ihr vertrauensvoller Partner", "maßgeschneiderte Lösungen"
❌ "höchste Qualität", "erstklassiger Service"
❌ Wiederholungen zwischen verschiedenen Textfeldern
❌ Oberflächliche Allgemeinplätze ohne ${keyword}-Bezug

QUALITÄTS-KONTROLLE:
✓ Keyword "${keyword}" mindestens 8x natürlich eingebaut
✓ Jeder Text spezifisch für ${context}-Kontext
✓ ${ctaStyle} Call-to-Actions verwenden
✓ Emotionale Ansprache der Zielgruppe: ${audience}

ANTWORT-FORMAT: 
Antworte ausschließlich mit einem validen JSON-Objekt. Beginne direkt mit { und ende mit }. Keine Markdown-Formatierung!

ALLE FELDER MÜSSEN VOLLSTÄNDIG AUSGEFÜLLT WERDEN:

{
  "post_title": "Einprägsamer SEO-Titel für ${keyword} mit emotionalem Hook (50-60 Zeichen)",
  "post_name": "${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_title": "Alternative SEO-Variante mit anderem Blickwinkel auf ${keyword}",
  "meta_description": "Überzeugende Meta-Beschreibung für ${keyword} mit starkem CTA (150-160 Zeichen)",
  "h1": "Kraftvolle H1: ${keyword} + emotionaler Hauptnutzen für ${audience}",
  "h2_1": "Problem-H2: Welche Herausforderungen gibt es bei ${keyword}?",
  "h2_2": "Lösungs-H2: Wie wir ${keyword}-Probleme erfolgreich angehen",
  "h2_3": "Nutzen-H2: Was ${keyword} für ${audience} ermöglicht",
  "h2_4": "Vertrauens-H2: Warum Sie bei ${keyword} auf uns setzen sollten",
  "primary_cta": "${isCommercial ? 'Starker Verkaufs-CTA' : 'Informativer CTA'} für ${keyword} (max. 30 Zeichen)",
  "secondary_cta": "Alternative, sanftere Handlungsaufforderung für ${keyword}",
  "hero_text": "Mitreißender Hero-Text (80-100 Wörter): Vermittle ${keyword}-Begeisterung und spreche ${audience} direkt an",
  "hero_subtext": "Verstärkende Unterüberschrift für ${keyword} (30-40 Wörter) mit Credibility",
  "benefits_list": "HTML-Liste mit 5-6 spezifischen ${keyword}-Vorteilen für ${audience} (je 12-18 Wörter pro Punkt)",
  "features_list": "HTML-Liste mit 5-6 konkreten ${keyword}-Features oder Eigenschaften",
  "social_proof": "Spezifische Sozialbeweise für ${keyword} mit echten Zahlen (nicht '1000 Kunden')",
  "testimonial_1": "Ausführliches Testimonial: Name + Hintergrund + spezifische ${keyword}-Erfahrung (40-60 Wörter)",
  "testimonial_2": "Zweites Testimonial mit anderer Perspektive auf ${keyword} (40-60 Wörter)",
  "pricing_title": "Preis-Überschrift für ${keyword} (nicht 'Wählen Sie Ihren Plan')",
  "price_1": "Starter-Paket: Was bei ${keyword} enthalten ist + Zielgruppe (30-40 Wörter)",
  "price_2": "Professional-Paket: Erweiterte ${keyword}-Features + Service (35-45 Wörter)",
  "price_3": "Premium-Paket: Alle ${keyword}-Features + exklusiver Service (40-50 Wörter)",
  "faq_1": "Häufigste ECHTE ${keyword}-Frage von ${audience} (spezifisch, nicht generisch)",
  "faq_answer_1": "Detaillierte, hilfreiche Antwort zur ersten ${keyword}-Frage (50-70 Wörter)",
  "faq_2": "Zweithäufigste ${keyword}-Frage (Fokus: Umsetzung/Kosten/Prozess)",
  "faq_answer_2": "Praktische Antwort mit konkreten ${keyword}-Informationen (50-70 Wörter)",
  "faq_3": "Wichtige Detail-/Experten-Frage zu ${keyword}",
  "faq_answer_3": "Fachlich fundierte ${keyword}-Antwort mit Mehrwert (50-70 Wörter)",
  "contact_info": "Kontakt-Information mit spezifischem ${keyword}-Bezug und Kommunikationsweg",
  "footer_cta": "Motivierender Schluss-CTA: ${keyword} + Zeitkomponente + Emotion",
  "trust_signals": "Konkrete ${keyword}-Vertrauenselemente: Zertifikate, Erfahrung, Referenzen",
  "guarantee_text": "Spezifische ${keyword}-Garantie mit klaren Bedingungen und Zeitrahmen"
}

Erstelle jetzt einzigartigen, hochwertigen Content für "${keyword}" im ${context}-Kontext:`;
}

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
    console.log('📋 Request Body:', req.body);

    // === BASIC VALIDATION ===
    const { prompt, keyword, intent = 'informational' } = req.body;
    
    if (!prompt || !keyword) {
      console.log('❌ Fehlende Daten');
      return res.status(400).json({ 
        error: 'Prompt und Keyword sind erforderlich.',
        received: { prompt: !!prompt, keyword: !!keyword }
      });
    }

    console.log('✅ Validation passed für:', keyword, '(' + intent + ')');

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
            temperature: 0.85, // Höher für kreativeren Content
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8000,
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

    // === SMART PROMPT CREATION ===
    console.log('📝 Erstelle keyword-spezifischen Prompt...');
    const smartPrompt = createSmartPrompt(keyword, intent);
    
    console.log('📤 Sende Anfrage an KI für:', keyword);

    // === CONTENT GENERATION ===
    let result;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      result = await model.generateContent(smartPrompt);
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
      const startIndex = responseText.indexOf('{');
      const endIndex = responseText.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Kein JSON gefunden');
      }

      let jsonString = responseText.substring(startIndex, endIndex + 1);
      
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
      
      // QUALITÄTS-CHECK
      const filledFields = Object.keys(jsonData).filter(key => 
        jsonData[key] && jsonData[key] !== null && jsonData[key] !== ''
      ).length;
      
      console.log('📊 Gefüllte Felder:', filledFields, 'von erwartet 23+');
      
    } catch (parseError) {
      console.warn('⚠️ JSON-Parse-Fehler, verwende intelligenten Fallback');
      
      // INTELLIGENTER, KEYWORD-SPEZIFISCHER FALLBACK
      const lowerKeyword = keyword.toLowerCase();
      let fallbackContent = {};
      
      if (lowerKeyword.includes('hund') || lowerKeyword.includes('tier')) {
        fallbackContent = {
          post_title: `${keyword} - Sicherheitstipps für entspannte Ausflüge`,
          hero_text: `Entdecken Sie die schönsten ${keyword}-Erlebnisse! Wir zeigen Ihnen, wie Sie und Ihr Vierbeiner gemeinsam unvergessliche Momente erleben können. Mit unseren erprobten Sicherheitstipps und praktischen Ratschlägen wird jeder ${keyword}-Ausflug zum entspannten Erlebnis für die ganze Familie.`,
          benefits_list: `<ul><li>Umfassende Sicherheits-Checkliste für ${keyword}-Ausflüge</li><li>Artgerechte Beschäftigung und Abkühlung für Ihren Hund</li><li>Erste-Hilfe-Tipps speziell für ${keyword}-Situationen</li><li>Wettergerechte Ausrüstung und Vorbereitung</li><li>Stressfreie Anreise und entspannte Rückkehr</li></ul>`,
          faq_1: `Welche Hunderassen sind für ${keyword}-Aktivitäten besonders geeignet?`,
          faq_answer_1: `Wasserliebende Rassen wie Golden Retriever, Labrador oder Neufundländer eignen sich besonders für ${keyword}-Ausflüge. Wichtig ist jedoch, jeden Hund individuell einzuschätzen.`,
          primary_cta: intent === 'commercial' ? `${keyword} Guide kaufen` : `${keyword} Tipps erhalten`
        };
      } else if (lowerKeyword.includes('wordpress') || lowerKeyword.includes('plugin')) {
        fallbackContent = {
          post_title: `${keyword} - Entwickler-Guide für optimale Performance`,
          hero_text: `Optimieren Sie Ihre WordPress-Website mit ${keyword}! Unsere bewährten Strategien und Code-Lösungen helfen Ihnen dabei, Performance, Sicherheit und Benutzerfreundlichkeit zu maximieren. Von der Installation bis zur Optimierung begleiten wir Sie durch alle Schritte.`,
          benefits_list: `<ul><li>Schnelle ${keyword}-Integration ohne komplexe Konfiguration</li><li>Performance-Optimierung für bessere Ladezeiten</li><li>Sicherheits-Features zum Schutz vor Angriffen</li><li>SEO-freundliche Implementierung für bessere Rankings</li><li>Mobile-optimierte Darstellung auf allen Geräten</li></ul>`,
          faq_1: `Wie installiere ich das ${keyword} richtig?`,
          faq_answer_1: `Die ${keyword}-Installation erfolgt über das WordPress-Dashboard unter Plugins > Neu hinzufügen. Nach der Aktivierung führt Sie ein Setup-Assistent durch die Grundkonfiguration.`,
          primary_cta: intent === 'commercial' ? `${keyword} jetzt kaufen` : `${keyword} testen`
        };
      } else {
        fallbackContent = {
          post_title: `${keyword} - Ihre Lösung für optimale Ergebnisse`,
          hero_text: `Entdecken Sie die Möglichkeiten von ${keyword}! Wir bieten Ihnen umfassende Lösungen, die genau auf Ihre Bedürfnisse zugeschnitten sind. Mit bewährten Methoden und innovativen Ansätzen erreichen Sie Ihre Ziele schneller und effizienter.`,
          benefits_list: `<ul><li>Individuelle ${keyword}-Lösungen für Ihre spezifischen Anforderungen</li><li>Bewährte Strategien mit nachweisbaren Erfolgen</li><li>Persönliche Betreuung durch erfahrene Experten</li><li>Flexible Anpassung an veränderte Bedingungen</li><li>Langfristige Partnerschaft für nachhaltigen Erfolg</li></ul>`,
          faq_1: `Wie funktioniert ${keyword} in der Praxis?`,
          faq_answer_1: `${keyword} wird individuell an Ihre Bedürfnisse angepasst. Nach einer ausführlichen Analyse entwickeln wir eine maßgeschneiderte Strategie für optimale Ergebnisse.`,
          primary_cta: intent === 'commercial' ? `${keyword} jetzt starten` : `${keyword} Beratung`
        };
      }
      
      // VOLLSTÄNDIGER FALLBACK
      jsonData = {
        post_title: fallbackContent.post_title,
        post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        meta_title: fallbackContent.post_title,
        meta_description: fallbackContent.hero_text.substring(0, 140) + "... Jetzt informieren!",
        h1: fallbackContent.post_title,
        h2_1: `Warum ${keyword} für Sie wichtig ist`,
        h2_2: `Unsere ${keyword} Expertise`,
        h2_3: `${keyword} Vorteile und Features`,
        h2_4: `Ihr ${keyword} Expertenteam`,
        primary_cta: fallbackContent.primary_cta,
        secondary_cta: `Mehr über ${keyword} erfahren`,
        hero_text: fallbackContent.hero_text,
        hero_subtext: `Vertrauen Sie auf unsere ${keyword} Kompetenz`,
        benefits_list: fallbackContent.benefits_list,
        features_list: `<ul><li>${keyword} Beratung und Support</li><li>Individuelle Lösungsentwicklung</li><li>Qualitätskontrolle und Testing</li><li>Dokumentation und Schulung</li><li>Langfristige Betreuung</li></ul>`,
        social_proof: `Von zahlreichen zufriedenen ${keyword}-Kunden empfohlen`,
        testimonial_1: `"Hervorragende ${keyword} Beratung! Genau das, was wir gesucht haben." - Sarah Mueller, Projektmanagerin`,
        testimonial_2: `"Kompetent und zuverlässig. Unsere ${keyword}-Ziele wurden übertroffen." - Marcus Weber, Geschäftsführer`,
        pricing_title: `${keyword} Service-Pakete`,
        price_1: `${keyword} Basic - Grundlegende Features für den Einstieg`,
        price_2: `${keyword} Professional - Erweiterte Funktionen für Fortgeschrittene`, 
        price_3: `${keyword} Enterprise - Premium Service mit allen Features`,
        faq_1: fallbackContent.faq_1,
        faq_answer_1: fallbackContent.faq_answer_1,
        faq_2: `Was kostet ${keyword}?`,
        faq_answer_2: `Die ${keyword} Kosten richten sich nach Ihren spezifischen Anforderungen. Wir erstellen Ihnen gerne ein individuelles Angebot.`,
        faq_3: `Wie lange dauert die ${keyword} Umsetzung?`,
        faq_answer_3: `Die ${keyword} Umsetzungsdauer hängt vom Projektumfang ab. Typisch sind 1-4 Wochen für die vollständige Implementierung.`,
        contact_info: `${keyword} Fragen? Kontaktieren Sie unsere Experten für eine kostenlose Erstberatung.`,
        footer_cta: `Starten Sie jetzt Ihr ${keyword} Projekt`,
        trust_signals: `${keyword} Experten • Zertifiziert • Garantiert`,
        guarantee_text: `30-Tage-Zufriedenheitsgarantie auf alle ${keyword} Services`,
        _fallback_used: true,
        _parse_error: parseError.message
      };
    }

    // === FINAL RESPONSE ===
    jsonData.keyword = keyword;
    jsonData.intent = intent;
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
    
    res.status(500).json({ 
      error: 'Interner Server-Fehler',
      details: 'Ein unerwarteter Fehler ist aufgetreten',
      timestamp: new Date().toISOString(),
      error_type: error.name || 'UnknownError'
    });
  }
};
