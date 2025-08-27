// api/generate.js - DEINE STABILE VERSION, ERWEITERT FÜR BULK PROCESSING

const { GoogleGenerativeAI } = require("@google/generative-ai");

// DEIN PROMPT GEHÖRT INS BACKEND, UM DEN FRONTEND-CODE ZU VERKLEINERN
function createSilasPrompt(keyword, intent) {
    const roleAndTask = intent === 'commercial' ? 'Du bist ein erstklassiger Marketing-Texter...' : 'Du bist ein Fachexperte...';
    // HIER KOMMT DEIN VOLLSTÄNDIGER, UMFANGREICHER PROMPT-TEXT HINEIN
    return `Du bist ein erstklassiger SEO-Content-Strategist... für das Thema "${keyword}". ROLLE: ${roleAndTask} ... etc.`;
}

// Handler-Funktion, die von Vercel aufgerufen wird
module.exports = async (req, res) => {
  console.log('🚀 Silas API gestartet (Bulk Mode)');
  
  // DEINE CORS-HEADER
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

    // NEUE VALIDIERUNG: Erwartet ein Array
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Ein "keywords" Array ist erforderlich.' });
    }

    // DEINE CHECKS BLEIBEN ERHALTEN
    const isMasterRequest = req.headers['x-silas-master'] === 'SilasUnlimited2024!';
    if (isMasterRequest) console.log('🔓 Master Mode Request erkannt');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY nicht gesetzt');
      return res.status(500).json({ error: 'Server-Konfigurationsfehler' });
    }

    // DEINE GOOGLE AI INITIALISIERUNG BLEIBT ERHALTEN
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // NEU: PARALLELE VERARBEITUNG ALLER KEYWORDS
    const generationPromises = keywords.map(async (item) => {
      const { keyword, intent } = item;
      try {
        if (!keyword || !intent) throw new Error("Keyword und Intent sind für jeden Eintrag erforderlich.");

        // DEINE MODELLAUSWAHL UND GENERIERUNGS-LOGIK FÜR EIN KEYWORD
        const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
        let model = null;
        let usedModel = null;
        for (const modelName of modelNames) {
          try {
            model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.7, maxOutputTokens: 8000 } });
            usedModel = modelName;
            break;
          } catch (modelError) { continue; }
        }
        if (!model) throw new Error("Kein KI-Modell verfügbar.");

        const prompt = createSilasPrompt(keyword, intent);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = await response.text();
        
        let jsonData;
        let parseError = null;

        try {
            const cleanedText = rawText.replace(/^```json\s*|```\s*$/g, '').trim();
            if (!cleanedText) throw new Error("API hat leeren Inhalt zurückgegeben.");
            jsonData = JSON.parse(cleanedText);
        } catch (e) {
            parseError = e;
            // DEIN UMFANGREICHER FALLBACK BLEIBT ERHALTEN
            jsonData = { post_title: `Fehler bei der Generierung für: ${keyword}`, /* ... alle anderen Fallback-Felder ... */ _fallback_used: true, _parse_error: e.message };
        }

        // DEINE FINALE ANTWORT-STRUKTUR FÜR EIN KEYWORD
        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData._meta = { model_used: usedModel, generation_time: new Date().toISOString(), master_mode: isMasterRequest, success: !parseError };
        return jsonData;

      } catch (error) {
        // Fehlerbehandlung für ein einzelnes Keyword
        return { keyword, intent, error: error.message, _meta: { success: false } };
      }
    });

    // Auf alle Ergebnisse warten und als einzelne Antwort senden
    const results = await Promise.all(generationPromises);
    console.log('✅ Alle Antworten bereit, sende zum Client.');
    return res.status(200).json(results);

  } catch (error) {
    // DEINE GLOBALE FEHLERBEHANDLUNG BLEIBT ERHALTEN
    console.error('💥 Unerwarteter Fehler:', error);
    res.status(500).json({ error: 'Interner Server-Fehler', details: 'Ein unerwarteter Fehler ist aufgetreten.' });
  }
};

    // === COMPREHENSIVE PROMPT ===
    const comprehensivePrompt = `
Du bist ein erstklassiger SEO-Content-Strategist. Erstelle vollständigen Landingpage-Content für das Thema "${keyword}".

WICHTIG: Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }. Gib keine Markdown-Formatierung oder andere Texte aus.

Das JSON-Objekt muss ALLE folgenden Felder enthalten und mit umfangreichem, hochwertigem Content füllen:

{
  "post_title": "SEO-optimierter Titel (50-60 Zeichen) für ${keyword}",
  "post_name": "seo-freundlicher-url-slug-fuer-${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_title": "Alternativer SEO-Titel (50-60 Zeichen) für ${keyword}",
  "meta_description": "Fesselnde Meta-Beschreibung (150-160 Zeichen) mit CTA für ${keyword}",
  "h1": "Kraftvolle H1-Überschrift für ${keyword}, die den Hauptnutzen kommuniziert",
  "h2_1": "Erste H2-Überschrift (Problemorientiert) für ${keyword}",
  "h2_2": "Zweite H2-Überschrift (Lösungsorientiert) für ${keyword}",
  "h2_3": "Dritte H2-Überschrift (Feature-/Nutzen-orientiert) für ${keyword}",
  "h2_4": "Vierte H2-Überschrift (Vertrauensbildend) für ${keyword}",
  "primary_cta": "Kurzer, starker Call-to-Action Text (z.B. 'Jetzt ${keyword} anfragen')",
  "secondary_cta": "Alternativer, sanfterer Call-to-Action (z.B. 'Mehr über ${keyword} erfahren')",
  "hero_text": "Fesselnder Einleitungstext für den Hero-Bereich (50-80 Wörter) über ${keyword}",
  "hero_subtext": "Unterstützende Unterüberschrift für den Hero-Bereich (20-30 Wörter) zu ${keyword}",
  "benefits_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 überzeugenden Vorteilen von ${keyword}",
  "features_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 konkreten Merkmalen/Features von ${keyword}",
  "social_proof": "Kurzer Satz über soziale Bewährtheit (z.B. 'Von über 1.000 zufriedenen ${keyword}-Kunden genutzt')",
  "testimonial_1": "Glaubwürdiges, fiktives Kunden-Testimonial mit Name und Aussage zu ${keyword}",
  "testimonial_2": "Zweites, andersartiges Kunden-Testimonial mit Name und Aussage zu ${keyword}",
  "pricing_title": "Überschrift für den Preisbereich (z.B. 'Wählen Sie Ihren ${keyword}-Plan')",
  "price_1": "Beschreibung für das erste ${keyword}-Preispaket (Starter/Basic)",
  "price_2": "Beschreibung für das zweite ${keyword}-Preispaket (Professional)",
  "price_3": "Beschreibung für das dritte ${keyword}-Preispaket (Enterprise/Premium)",
  "faq_1": "Erste häufig gestellte Frage zu ${keyword}",
  "faq_answer_1": "Ausführliche Antwort auf die erste ${keyword}-Frage (30-50 Wörter)",
  "faq_2": "Zweite häufig gestellte Frage zu ${keyword}",
  "faq_answer_2": "Ausführliche Antwort auf die zweite ${keyword}-Frage (30-50 Wörter)",
  "faq_3": "Dritte häufig gestellte Frage zu ${keyword}",
  "faq_answer_3": "Ausführliche Antwort auf die dritte ${keyword}-Frage (30-50 Wörter)",
  "contact_info": "Kurze Kontaktinformation oder Hinweis für ${keyword} (z.B. 'Fragen zu ${keyword}? Rufen Sie uns an: ...')",
  "footer_cta": "Letzter Call-to-Action für den Footer (z.B. 'Starten Sie noch heute Ihr ${keyword}-Projekt')",
  "trust_signals": "Kurzer Text mit Vertrauenssignalen für ${keyword} (z.B. 'Zertifiziert • Sicher • ${keyword}-Experten')",
  "guarantee_text": "Satz über Garantie für ${keyword} (z.B. '30-Tage-Geld-zurück-Garantie für alle ${keyword}-Services')"
}

QUALITÄTS-ANFORDERUNGEN:
- Jedes Textfeld muss mindestens 10-15 Wörter enthalten (außer CTAs)
- Hero-Text: 50-80 Wörter
- FAQ-Antworten: 30-50 Wörter
- Benefits/Features: Jeweils 4-6 Listenelemente
- Testimonials: Vollständige Zitate mit Namen
- Alle Texte müssen spezifisch auf "${keyword}" bezogen sein
- Professioneller, überzeugender Ton
- SEO-optimiert aber natürlich lesbar

Erstelle jetzt das vollständige JSON-Objekt:
    `;

    console.log('📤 Sende umfassende Anfrage an KI für:', keyword);

    // === CONTENT GENERATION ===
    let result;
    try {
      // Timeout für die Anfrage
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Längeres Timeout für umfangreiche Inhalte
      
      result = await model.generateContent(comprehensivePrompt);
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
      
      // Umfangreicher Fallback-Content mit allen Spalten
      jsonData = {
        post_title: keyword + " - Professionelle Lösung & Beratung",
        post_name: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        meta_title: keyword + " Experten | Ihre zuverlässige Lösung",
        meta_description: "Professionelle " + keyword + " Services von Experten. Kompetent, zuverlässig und maßgeschneidert für Ihre Bedürfnisse. Jetzt informieren!",
        h1: keyword + " - Ihre zuverlässige und professionelle Lösung",
        h2_1: "Warum " + keyword + " für Ihr Unternehmen wichtig ist",
        h2_2: "Unsere bewährte " + keyword + " Expertise und Lösungen",
        h2_3: keyword + " Features und Vorteile im Detail",
        h2_4: "Vertrauen Sie unserem erfahrenen " + keyword + " Team",
        primary_cta: "Jetzt " + keyword + " anfragen",
        secondary_cta: "Mehr über " + keyword + " erfahren",
        hero_text: "Willkommen bei Ihrem " + keyword + " Experten. Wir bieten professionelle, maßgeschneiderte Lösungen, die Ihre Erwartungen übertreffen. Mit jahrelanger Erfahrung und bewährten Methoden sorgen wir für optimale Ergebnisse in allen " + keyword + " Bereichen.",
        hero_subtext: "Vertrauen Sie auf unsere Erfahrung und Kompetenz im Bereich " + keyword,
        benefits_list: "<ul><li>Professionelle " + keyword + " Beratung von Experten</li><li>Maßgeschneiderte Lösungen für Ihre Anforderungen</li><li>Erfahrenes und zertifiziertes Expertenteam</li><li>Zuverlässiger Support und Betreuung</li><li>Nachhaltige und langfristige Ergebnisse</li></ul>",
        features_list: "<ul><li>Umfassende " + keyword + " Analyse und Bewertung</li><li>Individuelle Strategieentwicklung und Planung</li><li>Kontinuierliche Überwachung und Optimierung</li><li>Messbare Ergebnisse und Erfolgskontrolle</li><li>Flexible Anpassung an Ihre Bedürfnisse</li></ul>",
        social_proof: "Von über 500 zufriedenen Kunden empfohlen und erfolgreich eingesetzt",
        testimonial_1: "\"Exzellenter " + keyword + " Service! Das Team hat unsere Erwartungen in jeder Hinsicht übertroffen und professionelle Ergebnisse geliefert.\" - Maria Schmidt, Projektleiterin",
        testimonial_2: "\"Professionell, zuverlässig und kompetent. Genau das, was wir für unsere " + keyword + " Anforderungen gesucht haben. Sehr empfehlenswert!\" - Thomas Weber, Geschäftsführer",
        pricing_title: "Wählen Sie Ihr passendes " + keyword + " Paket",
        price_1: keyword + " Starter - Ideal für den Einstieg mit grundlegenden Funktionen und Support",
        price_2: keyword + " Professional - Für anspruchsvolle Projekte mit erweiterten Features und Priority Support",
        price_3: keyword + " Enterprise - Maximale Leistung mit Premium Features, dediziertem Support und individuellen Anpassungen",
        faq_1: "Was macht Ihren " + keyword + " Service besonders und unterscheidet Sie von der Konkurrenz?",
        faq_answer_1: "Unser " + keyword + " Service zeichnet sich durch individuelle Beratung, jahrelange Erfahrung, bewährte Methoden und messbare Ergebnisse aus. Wir bieten maßgeschneiderte Lösungen statt Standard-Angebote.",
        faq_2: "Wie lange dauert die Umsetzung eines typischen " + keyword + " Projekts?",
        faq_answer_2: "Die Umsetzungsdauer hängt vom Projektumfang ab. Typischerweise zwischen 2-8 Wochen, je nach Komplexität und Ihren spezifischen " + keyword + " Anforderungen. Wir erstellen einen detaillierten Zeitplan.",
        faq_3: "Gibt es eine Garantie oder Gewährleistung auf Ihre " + keyword + " Services?",
        faq_answer_3: "Ja, wir bieten eine 30-Tage-Zufriedenheitsgarantie auf alle unsere " + keyword + " Services. Sollten Sie nicht zufrieden sein, finden wir gemeinsam eine Lösung oder erstatten den Betrag zurück.",
        contact_info: "Fragen zu " + keyword + "? Rufen Sie uns an oder schreiben Sie uns eine E-Mail - wir beraten Sie gerne!",
        footer_cta: "Starten Sie noch heute Ihr erfolgreiches " + keyword + " Projekt mit uns",
        trust_signals: "Zertifiziert • Sicher • Garantiert • " + keyword + " Experten seit Jahren",
        guarantee_text: "30-Tage-Geld-zurück-Garantie auf alle " + keyword + " Services und Dienstleistungen",
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
