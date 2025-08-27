// api/generate.js - DEINE STABILE VERSION, SORGFÄLTIG FÜR BULK PROCESSING UMGEBAUT

const { GoogleGenerativeAI } = require("@google/generative-ai");

// KORRIGIERTE PROMPT-FUNKTION

function createSilasPrompt(keyword, intent, zielgruppe, tonalitaet, usp) {
    const roleAndTask = intent === 'commercial' 
        ? 'Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet.'
        : 'Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich.';

    // Ein dynamischer Kontext-Block wird erstellt
    let kontext = "";
    if (zielgruppe) kontext += `- ZIELGRUPPE: ${zielgruppe}\n`;
    if (tonalitaet) kontext += `- TONALITÄT: ${tonalitaet}\n`;
    if (usp) kontext += `- ALLEINSTELLUNGSMERKMAL (USP): ${usp}\n`;

    // Der Prompt-Text wird um den neuen Kontext-Block erweitert
    return `
        Du bist ein erstklassiger SEO-Content-Strategist. Erstelle vollständigen Landingpage-Content für das Thema "${keyword}".

        ${kontext ? `ZUSÄTZLICHER KONTEXT, DER UNBEDINGT ZU BEACHTEN IST:\n${kontext}` : ''}

        ROLLE: ${roleAndTask}
        
        WICHTIG: Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }. Gib keine Markdown-Formatierung oder andere Texte aus.
        
        Das JSON-Objekt muss ALLE folgenden Felder enthalten und mit umfangreichem, hochwertigem Content füllen, der zum ZUSÄTZLICHEN KONTEXT passt:
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
        - Benefits/Features: Jeweils 4-6 Listenelemente mit ausführlichen Beschreibungen
        - Testimonials: Vollständige Zitate mit Namen und Firma
        - Alle Texte müssen spezifisch auf "${keyword}" bezogen sein und den ZUSÄTZLICHEN KONTEXT berücksichtigen.
        - Professioneller, überzeugender Ton, der zur angegebenen TONALITÄT passt.
        - SEO-optimiert aber natürlich lesbar
        - Verwende deutsche Sprache
        - Alle Listen müssen vollständige HTML-Markup enthalten
        Erstelle jetzt das vollständige JSON-Objekt mit umfangreichem Content für "${keyword}":
    `;
}


// Handler-Funktion, die von Vercel aufgerufen wird
module.exports = async (req, res) => {
  // DEIN ORIGINAL: Start-Log und CORS-Header
  console.log('🚀 Silas API gestartet (Bulk Mode)');
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
    // DEIN ORIGINAL: Logging von Body und Headern
    console.log('📝 Request Body:', req.body);
    console.log('🔑 Headers:', req.headers);

    // NEU: Die Validierung wird an die "Bulk"-Struktur angepasst.
    // Statt "prompt" und "keyword" erwarten wir jetzt ein "keywords"-Array.
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      console.log('❌ Fehlende Daten: "keywords" Array nicht gefunden.');
      return res.status(400).json({ error: 'Ein "keywords" Array im Body ist erforderlich.' });
    }
    console.log(`✅ Validation passed für ${keywords.length} Keywords.`);

    // DEIN ORIGINAL: Master-Mode-Check und API-Key-Check bleiben 1:1 erhalten
    const isMasterRequest = req.headers['x-silas-master'] === 'SilasUnlimited2024!';
    if (isMasterRequest) console.log('🔓 Master Mode Request erkannt');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY nicht gesetzt');
      return res.status(500).json({ error: 'Server-Konfigurationsfehler', details: 'API-Schlüssel nicht verfügbar' });
    }
    console.log('✅ API Key verfügbar');
    
    // DEIN ORIGINAL: Google AI Initialisierung
    console.log('🤖 Initialisiere Google AI');
    const genAI = new GoogleGenerativeAI(apiKey);

// KORRIGIERTER BLOCK FÜR DIE VERARBEITUNG
const generationPromises = keywords.map(async (item) => {
    // KORREKTUR 1: Alle Felder werden jetzt aus dem "item"-Objekt ausgelesen
    const { keyword, intent, zielgruppe, tonalitaet, usp } = item;
    try {
        // --- START: DEINE VOLLSTÄNDIGE LOGIK FÜR EIN EINZELNES KEYWORD ---

        // DEIN ORIGINAL: Keyword-Validierung für Demo-Modus
        if (!isMasterRequest && keyword.length > 50) {
          throw new Error('Keyword zu lang (max. 50 Zeichen).');
        }

        // DEIN ORIGINAL: Modellauswahl-Schleife
        const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
        let model = null;
        let usedModel = null;
        for (const modelName of modelNames) {
          try {
            model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8000 } });
            usedModel = modelName;
            console.log(`✅ Modell für '${keyword}' geladen:`, modelName);
            break;
          } catch (modelError) {
            console.warn(`⚠️ Modell für '${keyword}' nicht verfügbar:`, modelName, modelError.message);
            continue;
          }
        }
        if (!model) throw new Error(`Kein KI-Modell für '${keyword}' verfügbar.`);

        // KORREKTUR 2: Alle ausgelesenen Felder werden jetzt korrekt an die Prompt-Funktion übergeben
        const prompt = createSilasPrompt(keyword, intent, zielgruppe, tonalitaet, usp);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = await response.text();

        // Der Rest deiner Logik zur Verarbeitung der Antwort bleibt unverändert...
        let jsonData;
        let parseError = null;
        try {
            const cleanedText = rawText.replace(/^```json\s*|```\s*$/g, '').trim();
            if (!cleanedText) throw new Error("API hat leeren Inhalt zurückgegeben.");
            jsonData = JSON.parse(cleanedText);
        } catch (e) {
            parseError = e;
            console.error(`❌ JSON-Parse-Fehler für '${keyword}':`, e.message);
            // DEIN UMFANGREICHER FALLBACK-CONTENT
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
                benefits_list: "<ul><li>Fehler</li></ul>", features_list: "<ul><li>Fehler</li></ul>",
                social_proof: "N/A",
                testimonial_1: "Fehler", testimonial_2: "Fehler",
                pricing_title: "Keine Preisinformationen",
                price_1: "Fehler", price_2: "Fehler", price_3: "Fehler",
                faq_1: "Fehler", faq_answer_1: "Fehler",
                faq_2: "Fehler", faq_answer_2: "Fehler",
                faq_3: "Fehler", faq_answer_3: "Fehler",
                contact_info: "Fehler", footer_cta: "Fehler", trust_signals: "Fehler", guarantee_text: "Fehler",
                _fallback_used: true,
                _parse_error: e.message
            };
        }

        // DEIN ORIGINAL: Finale Antwort-Struktur
        jsonData.keyword = keyword;
        jsonData.intent = intent;
        jsonData._meta = { model_used: usedModel, generation_time: new Date().toISOString(), master_mode: isMasterRequest, success: !parseError };
        console.log(`✅ Antwort für '${keyword}' bereit.`);
        return jsonData;

        // --- ENDE: DEINE LOGIK FÜR EIN EINZELNES KEYWORD ---

      } catch (error) {
        // Fehlerbehandlung für ein einzelnes Keyword
        console.error(`💥 Fehler bei der Verarbeitung von '${keyword}':`, error);
        return { keyword, intent, error: error.message, _meta: { success: false, master_mode: isMasterRequest } };
      }
    });

    // Warten, bis alle Keywords verarbeitet sind, und die gesammelten Ergebnisse senden
    const results = await Promise.all(generationPromises);
    console.log('✅ Alle Antworten bereit, sende zum Client.');
    return res.status(200).json(results);

  } catch (error) {
    // DEIN ORIGINAL: Globale Fehlerbehandlung für den gesamten Request
    console.error('💥 Unerwarteter, kritischer Fehler im Handler:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Interner Server-Fehler',
      details: 'Ein unerwarteter Fehler ist aufgetreten.'
    });
  }
};
