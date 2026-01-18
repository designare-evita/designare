// api/ai-visibility-check.js - KI-Sichtbarkeits-Check mit Grounding + Formatierung
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =================================================================
// HELPER: Markdown zu HTML formatieren (wie Evita)
// =================================================================
function formatResponseText(text) {
  let formatted = text
    // Fett: **text** → <strong>text</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Kursiv: *text* → <em>text</em>
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Aufzählungen: - Item oder • Item → mit Bullet
    .replace(/^[-•]\s+(.+)$/gm, '• $1');
  
  // Zeilenumbrüche direkt nach </strong> entfernen (das Hauptproblem!)
  formatted = formatted.replace(/<\/strong>\s*\n+/g, '</strong> ');
  
  // Zeilenumbrüche direkt vor <strong> entfernen
  formatted = formatted.replace(/\n+\s*<strong>/g, ' <strong>');
  
  // Mehrfache Leerzeilen reduzieren
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Nur echte Absätze (doppelte Zeilenumbrüche) werden zu <br><br>
  formatted = formatted.replace(/\n\n/g, '<br><br>');
  
  // Einzelne Zeilenumbrüche nur bei Listen behalten
  formatted = formatted.replace(/\n(•)/g, '<br>$1');
  
  // Restliche einzelne Zeilenumbrüche zu Leerzeichen (fließender Text)
  formatted = formatted.replace(/\n/g, ' ');
  
  // Doppelte Leerzeichen entfernen
  formatted = formatted.replace(/\s{2,}/g, ' ');
  
  // Leerzeichen vor Satzzeichen entfernen
  formatted = formatted.replace(/\s+([.,!?:;])/g, '$1');
  
  return formatted.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { domain, industry } = req.body;
    
    if (!domain) {
      return res.status(400).json({ message: 'Domain ist erforderlich' });
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    console.log(`🔍 AI Visibility Check für: ${cleanDomain} (Branche: ${industry || 'nicht angegeben'})`);

    // --- MODELL MIT GOOGLE SEARCH GROUNDING ---
    const modelWithSearch = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { 
        temperature: 0.4,  // Etwas höher für natürlichere Antworten
        maxOutputTokens: 1500
      }
    });

    // =================================================================
    // PHASE 1: Domain-Analyse (Crawling)
    // =================================================================
    let domainAnalysis = {
      hasSchema: false,
      schemaTypes: [],
      hasAboutPage: false,
      hasContactPage: false,
      hasAuthorInfo: false,
      title: '',
      description: '',
      crawlError: null
    };

    try {
      const urlToFetch = `https://${cleanDomain}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(urlToFetch, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIVisibilityBot/1.0)'
        }
      });
      clearTimeout(timeout);
      
      const html = await response.text();
      
      // Schema.org JSON-LD extrahieren
      const schemaMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (schemaMatches) {
        domainAnalysis.hasSchema = true;
        schemaMatches.forEach(match => {
          try {
            const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
            const parsed = JSON.parse(jsonContent);
            const extractTypes = (obj) => {
              if (obj['@type']) {
                const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
                domainAnalysis.schemaTypes.push(...types);
              }
              if (obj['@graph']) {
                obj['@graph'].forEach(item => extractTypes(item));
              }
            };
            extractTypes(parsed);
          } catch (e) { /* Ignore parse errors */ }
        });
      }
      
      // E-E-A-T Signale prüfen
      domainAnalysis.hasAboutPage = /href=["'][^"']*(?:about|über-uns|ueber-uns|team|wir)["']/i.test(html);
      domainAnalysis.hasContactPage = /href=["'][^"']*(?:contact|kontakt|impressum)["']/i.test(html);
      domainAnalysis.hasAuthorInfo = /(?:author|autor|verfasser|geschrieben von|inhaber|geschäftsführer)/i.test(html);
      
      // Title & Description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      domainAnalysis.title = titleMatch ? titleMatch[1].trim() : '';
      
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
      domainAnalysis.description = descMatch ? descMatch[1].trim() : '';
      
      console.log('✅ Crawling erfolgreich:', domainAnalysis.title);
      
    } catch (error) {
      console.log('⚠️ Crawl-Fehler:', error.message);
      domainAnalysis.crawlError = error.message;
    }

    // =================================================================
    // PHASE 2: Gemini Tests MIT Google Search Grounding
    // =================================================================
    
    // Test-Definitionen mit Prompts die formatierte Antworten erzeugen
    const testQueries = [
      {
        id: 'knowledge',
        prompt: `Suche im Web nach der Website **${cleanDomain}** und beschreibe:

1. Was bietet dieses Unternehmen/diese Website an?
2. Wo ist der Standort (Stadt, Land)?
3. Welche konkreten Informationen findest du?

**Wichtig:** 
- Schreibe den Firmennamen/Domain immer **fett**
- Nutze kurze, klare Sätze
- Wenn du nichts findest, sage klar: "Zu **${cleanDomain}** konnte ich keine Informationen im Web finden."

Antworte auf Deutsch in 3-5 Sätzen.`,
        description: 'Bekanntheit im Web',
        useGrounding: true
      },
      {
        id: 'recommendation',
        prompt: industry 
          ? `Suche nach den **besten Anbietern für "${industry}"** in Österreich.

Nenne **5-8 empfehlenswerte Unternehmen/Websites**:
- **Firmenname** – Website – kurze Beschreibung

Prüfe auch: Wird **${cleanDomain}** in diesem Bereich erwähnt oder empfohlen?

Antworte auf Deutsch. Formatiere die Liste übersichtlich.`
          : `Suche nach empfehlenswerten **Webentwicklern und Digital-Agenturen** in Österreich.

Nenne **5-8 bekannte Anbieter**:
- **Firmenname** – Website – Spezialisierung

Antworte auf Deutsch.`,
        description: 'Empfehlungen in der Branche',
        useGrounding: true
      },
      {
        id: 'reviews',
        prompt: `Suche nach **Bewertungen und Rezensionen** zu **${cleanDomain}**.

Prüfe:
- Google Reviews / Google Maps
- Trustpilot, ProvenExpert oder ähnliche Plattformen
- Erwähnungen in Foren oder Artikeln

Fasse zusammen:
- **Bewertung:** (z.B. "4.5 Sterne bei Google")
- **Kundenmeinungen:** Was sagen Kunden?
- **Anzahl:** Wie viele Bewertungen gibt es?

Wenn keine Bewertungen vorhanden sind, sage: "Zu **${cleanDomain}** sind keine Online-Bewertungen zu finden."

Antworte auf Deutsch.`,
        description: 'Online-Reputation',
        useGrounding: true
      },
      {
        id: 'mentions',
        prompt: `Suche nach **externen Erwähnungen** von **${cleanDomain}**:

- Einträge in Branchenverzeichnissen (Herold, WKO, Gelbe Seiten, etc.)
- Links von anderen Websites
- Erwähnungen in Artikeln oder Blogs
- Social Media Profile (Facebook, Instagram, LinkedIn)

Liste gefundene Erwähnungen auf mit **fetten** Quellennamen.

Wenn nichts gefunden wird: "Zu **${cleanDomain}** wurden keine externen Erwähnungen gefunden."

Antworte auf Deutsch.`,
        description: 'Externe Erwähnungen',
        useGrounding: true
      }
    ];

    const testResults = [];
    
    for (const test of testQueries) {
      try {
        console.log(`🧪 Test: ${test.description}...`);
        
        let result;
        
        if (test.useGrounding) {
          // MIT Google Search Grounding
          result = await modelWithSearch.generateContent({
            contents: [{ role: "user", parts: [{ text: test.prompt }] }],
            tools: [{ googleSearch: {} }]  // Aktiviert Web-Suche!
          });
        } else {
          result = await modelWithSearch.generateContent(test.prompt);
        }
        
        const response = await result.response;
        let text = response.text();
        
        // Formatierung anwenden (Markdown → HTML-like)
        text = formatResponseText(text);
        
        // Prüfen ob Domain erwähnt wird (auch Teilmatch)
        const domainBase = cleanDomain.replace(/\.[^.]+$/, ''); // z.B. "stempel-lobenhofer"
        const domainMentioned = text.toLowerCase().includes(cleanDomain) ||
                               text.toLowerCase().includes(domainBase);
        
        // Sentiment analysieren (verbessert)
        let sentiment = 'neutral';
        const textLower = text.toLowerCase();
        
        const positiveIndicators = [
          'empfehlenswert', 'qualität', 'professionell', 'zuverlässig', 
          'gute bewertungen', 'positive', 'zufrieden', 'top', 'ausgezeichnet',
          'spezialist', 'experte', 'erfahren', 'hochwertig', 'vertrauenswürdig',
          'sterne', '4,', '4.', '5,', '5.', 'sehr gut', 'hervorragend'
        ];
        const negativeIndicators = [
          'keine informationen', 'nicht gefunden', 'keine ergebnisse', 
          'keine bewertungen', 'nicht bekannt', 'keine erwähnungen',
          'konnte ich keine', 'wurden keine', 'nichts gefunden', 'nicht zu finden'
        ];
        
        const positiveScore = positiveIndicators.filter(w => textLower.includes(w)).length;
        const negativeScore = negativeIndicators.filter(w => textLower.includes(w)).length;
        
        if (domainMentioned && positiveScore > negativeScore) {
          sentiment = 'positiv';
        } else if (negativeScore > positiveScore || !domainMentioned) {
          sentiment = 'negativ';
        }
        
        // Konkurrenten extrahieren (andere Domains in der Antwort)
        const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
        const matches = text.match(domainRegex) || [];
        const competitors = [...new Set(matches)]
          .map(d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase())
          .filter(c => !c.includes(domainBase) && !c.includes('google') && !c.includes('schema.org'))
          .slice(0, 8);
        
        testResults.push({
          id: test.id,
          description: test.description,
          query: test.prompt.split('\n')[0].substring(0, 80) + '...', // Kurze Version für Anzeige
          mentioned: domainMentioned,
          sentiment,
          competitors,
          response: text.length > 1000 ? text.substring(0, 1000) + '...' : text,
          groundingUsed: test.useGrounding
        });
        
        console.log(`   → ${domainMentioned ? '✅ Erwähnt' : '❌ Nicht erwähnt'} | Sentiment: ${sentiment}`);
        
      } catch (error) {
        console.log(`   → ❌ Test fehlgeschlagen:`, error.message);
        testResults.push({
          id: test.id,
          description: test.description,
          query: test.prompt.split('\n')[0].substring(0, 80),
          mentioned: false,
          sentiment: 'fehler',
          competitors: [],
          response: '❌ Test fehlgeschlagen: ' + error.message,
          groundingUsed: test.useGrounding
        });
      }
      
      // Kurze Pause zwischen Requests (Rate Limit)
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // =================================================================
    // PHASE 3: Score-Berechnung (angepasst)
    // =================================================================
    let score = 0;
    const scoreBreakdown = [];
    
    // 1. Erwähnungsrate (max 40 Punkte)
    const mentionCount = testResults.filter(t => t.mentioned).length;
    const mentionScore = Math.round((mentionCount / testResults.length) * 40);
    score += mentionScore;
    scoreBreakdown.push({
      category: 'Web-Präsenz (Grounding)',
      points: mentionScore,
      maxPoints: 40,
      detail: `${mentionCount} von ${testResults.length} Suchen finden die Domain`
    });
    
    // 2. Technische Authority (max 35 Punkte)
    let techScore = 0;
    if (domainAnalysis.hasSchema) techScore += 12;
    if (domainAnalysis.schemaTypes.length >= 3) techScore += 8;
    if (domainAnalysis.hasAboutPage) techScore += 5;
    if (domainAnalysis.hasContactPage) techScore += 5;
    if (domainAnalysis.hasAuthorInfo) techScore += 5;
    score += techScore;
    scoreBreakdown.push({
      category: 'Technische Authority',
      points: techScore,
      maxPoints: 35,
      detail: `Schema: ${domainAnalysis.hasSchema ? '✓' : '✗'} (${domainAnalysis.schemaTypes.length} Typen), E-E-A-T: ${[domainAnalysis.hasAboutPage, domainAnalysis.hasContactPage, domainAnalysis.hasAuthorInfo].filter(Boolean).length}/3`
    });
    
    // 3. Sentiment & Reputation (max 25 Punkte)
    const positiveCount = testResults.filter(t => t.sentiment === 'positiv').length;
    const neutralCount = testResults.filter(t => t.sentiment === 'neutral').length;
    const sentimentScore = Math.round((positiveCount * 25 + neutralCount * 10) / testResults.length);
    score += sentimentScore;
    scoreBreakdown.push({
      category: 'Online-Reputation',
      points: sentimentScore,
      maxPoints: 25,
      detail: `${positiveCount} positiv, ${neutralCount} neutral, ${testResults.filter(t => t.sentiment === 'negativ').length} negativ/unbekannt`
    });

    // Score-Kategorie bestimmen
    let scoreCategory = 'niedrig';
    let scoreCategoryLabel = 'Kaum sichtbar';
    let scoreCategoryColor = '#ef4444';
    
    if (score >= 65) {
      scoreCategory = 'hoch';
      scoreCategoryLabel = 'Gut sichtbar';
      scoreCategoryColor = '#22c55e';
    } else if (score >= 35) {
      scoreCategory = 'mittel';
      scoreCategoryLabel = 'Ausbaufähig';
      scoreCategoryColor = '#f59e0b';
    }

    // =================================================================
    // PHASE 4: Empfehlungen generieren
    // =================================================================
    const recommendations = [];
    
    if (mentionCount === 0) {
      recommendations.push({
        priority: 'hoch',
        title: 'Online-Präsenz aufbauen',
        description: 'Deine Domain wird in Websuchen kaum gefunden. Fokussiere auf Google Business Profile, Branchenverzeichnisse und Content-Marketing.',
        link: '/geo-seo'
      });
    }
    
    if (!domainAnalysis.hasSchema) {
      recommendations.push({
        priority: 'hoch',
        title: 'Schema.org Markup hinzufügen',
        description: 'Strukturierte Daten (JSON-LD) helfen Suchmaschinen und KI, deine Inhalte zu verstehen. LocalBusiness, Organization oder Product Schema sind ein Muss.',
        link: '/schema-org-meta-description'
      });
    }
    
    if (positiveCount === 0 && mentionCount > 0) {
      recommendations.push({
        priority: 'hoch',
        title: 'Bewertungen sammeln',
        description: 'Du wirst gefunden, aber es fehlen positive Signale. Bitte zufriedene Kunden aktiv um Google Reviews.',
        link: null
      });
    }
    
    if (!domainAnalysis.hasAboutPage || !domainAnalysis.hasAuthorInfo) {
      recommendations.push({
        priority: 'mittel',
        title: 'E-E-A-T Signale stärken',
        description: 'Füge eine "Über uns" Seite mit Fotos, Qualifikationen und Geschichte hinzu. Zeige wer hinter dem Unternehmen steht.',
        link: null
      });
    }
    
    if (domainAnalysis.schemaTypes.length < 2 && domainAnalysis.hasSchema) {
      recommendations.push({
        priority: 'mittel',
        title: 'Mehr Schema-Typen nutzen',
        description: `Aktuell: ${domainAnalysis.schemaTypes.join(', ') || 'Keine'}. Ergänze FAQPage, Product, Service oder Review Schemas.`,
        link: '/schema-org-meta-description'
      });
    }

    // Alle Konkurrenten sammeln
    const allCompetitors = [...new Set(testResults.flatMap(t => t.competitors))].slice(0, 12);

    // =================================================================
    // RESPONSE
    // =================================================================
    console.log(`\n📊 Ergebnis für ${cleanDomain}: Score ${score}/100 (${scoreCategoryLabel})`);
    
    return res.status(200).json({
      success: true,
      domain: cleanDomain,
      industry: industry || null,
      timestamp: new Date().toISOString(),
      
      score: {
        total: score,
        category: scoreCategory,
        label: scoreCategoryLabel,
        color: scoreCategoryColor,
        breakdown: scoreBreakdown
      },
      
      domainAnalysis: {
        title: domainAnalysis.title,
        description: domainAnalysis.description,
        schema: {
          found: domainAnalysis.hasSchema,
          types: [...new Set(domainAnalysis.schemaTypes)]
        },
        eeat: {
          aboutPage: domainAnalysis.hasAboutPage,
          contactPage: domainAnalysis.hasContactPage,
          authorInfo: domainAnalysis.hasAuthorInfo
        },
        crawlError: domainAnalysis.crawlError
      },
      
      aiTests: testResults,
      competitors: allCompetitors,
      recommendations,
      
      meta: {
        testsWithGrounding: testResults.filter(t => t.groundingUsed).length,
        totalTests: testResults.length
      }
    });

  } catch (error) {
    console.error("❌ AI Visibility Check Error:", error);
    return res.status(500).json({ 
      success: false,
      message: 'Fehler bei der Analyse: ' + error.message 
    });
  }
}
