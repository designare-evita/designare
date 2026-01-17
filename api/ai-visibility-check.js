// api/ai-visibility-check.js - KI-Sichtbarkeits-Check Tool
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { domain, industry } = req.body;
    
    if (!domain) {
      return res.status(400).json({ message: 'Domain ist erforderlich' });
    }

    console.log(`🔍 AI Visibility Check für: ${domain} (Branche: ${industry || 'nicht angegeben'})`);

    // --- MODELL-KONFIGURATION (wie in ask-gemini.js) ---
    const commonConfig = { temperature: 0.3 }; // Niedriger für konsistentere Ergebnisse
    
    const modelPrimary = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: commonConfig 
    });
    const modelFallback = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: commonConfig 
    });

    async function generateContentSafe(inputText) {
      try { 
        return await modelPrimary.generateContent(inputText); 
      } catch (error) { 
        console.log("Primary model failed, trying Fallback:", error.message);
        return await modelFallback.generateContent(inputText);
      }
    }

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
      const urlToFetch = domain.startsWith('http') ? domain : `https://${domain}`;
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
      const htmlLower = html.toLowerCase();
      domainAnalysis.hasAboutPage = /href=["'][^"']*(?:about|über-uns|ueber-uns|team)["']/i.test(html);
      domainAnalysis.hasContactPage = /href=["'][^"']*(?:contact|kontakt|impressum)["']/i.test(html);
      domainAnalysis.hasAuthorInfo = /(?:author|autor|verfasser|geschrieben von)/i.test(html);
      
      // Title & Description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      domainAnalysis.title = titleMatch ? titleMatch[1].trim() : '';
      
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      domainAnalysis.description = descMatch ? descMatch[1].trim() : '';
      
    } catch (error) {
      console.log('Crawl-Fehler:', error.message);
      domainAnalysis.crawlError = error.message;
    }

    // =================================================================
    // PHASE 2: Gemini Live-Tests
    // =================================================================
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    const testQueries = [
      {
        id: 'knowledge',
        query: `Was weißt du über ${cleanDomain}? Ist dir diese Website bekannt?`,
        description: 'Bekanntheit'
      },
      {
        id: 'recommendation',
        query: industry 
          ? `Welche Anbieter oder Webseiten kannst du für "${industry}" in Österreich empfehlen?`
          : `Welche Webseiten für Webentwicklung und SEO in Österreich kannst du empfehlen?`,
        description: 'Empfehlungen'
      },
      {
        id: 'trust',
        query: `Ist ${cleanDomain} eine vertrauenswürdige Quelle? Was weißt du über die Qualität dieser Website?`,
        description: 'Vertrauen'
      },
      {
        id: 'comparison',
        query: industry
          ? `Nenne mir die besten deutschsprachigen Webseiten und Experten für ${industry}.`
          : `Nenne mir die besten deutschsprachigen Webseiten für Webentwicklung und KI-Integration.`,
        description: 'Vergleich'
      }
    ];

    const testResults = [];
    
    for (const test of testQueries) {
      try {
        const result = await generateContentSafe(test.query);
        const response = await result.response;
        const text = response.text();
        
        // Prüfen ob Domain erwähnt wird
        const domainMentioned = text.toLowerCase().includes(cleanDomain.toLowerCase()) ||
                               text.toLowerCase().includes(cleanDomain.replace(/\.[^.]+$/, '').toLowerCase());
        
        // Sentiment analysieren
        let sentiment = 'neutral';
        const positiveWords = ['empfehlenswert', 'qualität', 'vertrauenswürdig', 'professionell', 'experte', 'gut', 'ausgezeichnet', 'hilfreich'];
        const negativeWords = ['nicht bekannt', 'keine information', 'unsicher', 'vorsicht', 'nicht empfehlenswert'];
        
        const textLower = text.toLowerCase();
        const hasPositive = positiveWords.some(w => textLower.includes(w));
        const hasNegative = negativeWords.some(w => textLower.includes(w));
        
        if (domainMentioned && hasPositive) sentiment = 'positiv';
        else if (hasNegative) sentiment = 'negativ';
        
        // Konkurrenten extrahieren (andere .at oder .de Domains)
        const competitorMatches = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:at|de|com|ch))/gi) || [];
        const competitors = [...new Set(competitorMatches)]
          .filter(c => !c.toLowerCase().includes(cleanDomain.toLowerCase()))
          .slice(0, 5);
        
        testResults.push({
          id: test.id,
          description: test.description,
          query: test.query,
          mentioned: domainMentioned,
          sentiment,
          competitors,
          response: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        });
        
      } catch (error) {
        console.log(`Test ${test.id} fehlgeschlagen:`, error.message);
        testResults.push({
          id: test.id,
          description: test.description,
          query: test.query,
          mentioned: false,
          sentiment: 'fehler',
          competitors: [],
          response: 'Test fehlgeschlagen: ' + error.message
        });
      }
    }

    // =================================================================
    // PHASE 3: Score-Berechnung
    // =================================================================
    let score = 0;
    const scoreBreakdown = [];
    
    // 1. Erwähnungsrate (max 50 Punkte)
    const mentionCount = testResults.filter(t => t.mentioned).length;
    const mentionScore = Math.round((mentionCount / testResults.length) * 50);
    score += mentionScore;
    scoreBreakdown.push({
      category: 'KI-Erwähnungen',
      points: mentionScore,
      maxPoints: 50,
      detail: `${mentionCount} von ${testResults.length} Tests erwähnen die Domain`
    });
    
    // 2. Technische Authority (max 30 Punkte)
    let techScore = 0;
    if (domainAnalysis.hasSchema) techScore += 10;
    if (domainAnalysis.schemaTypes.length >= 3) techScore += 5;
    if (domainAnalysis.hasAboutPage) techScore += 5;
    if (domainAnalysis.hasContactPage) techScore += 5;
    if (domainAnalysis.hasAuthorInfo) techScore += 5;
    score += techScore;
    scoreBreakdown.push({
      category: 'Technische Authority',
      points: techScore,
      maxPoints: 30,
      detail: `Schema: ${domainAnalysis.hasSchema ? '✓' : '✗'}, About: ${domainAnalysis.hasAboutPage ? '✓' : '✗'}, Kontakt: ${domainAnalysis.hasContactPage ? '✓' : '✗'}, Autor: ${domainAnalysis.hasAuthorInfo ? '✓' : '✗'}`
    });
    
    // 3. Sentiment Bonus (max 20 Punkte)
    const positiveCount = testResults.filter(t => t.sentiment === 'positiv').length;
    const sentimentScore = Math.round((positiveCount / testResults.length) * 20);
    score += sentimentScore;
    scoreBreakdown.push({
      category: 'Sentiment',
      points: sentimentScore,
      maxPoints: 20,
      detail: `${positiveCount} positive Erwähnungen`
    });

    // Score-Kategorie bestimmen
    let scoreCategory = 'niedrig';
    let scoreCategoryLabel = 'Nicht sichtbar';
    let scoreCategoryColor = '#ef4444';
    
    if (score >= 70) {
      scoreCategory = 'hoch';
      scoreCategoryLabel = 'Gut sichtbar';
      scoreCategoryColor = '#22c55e';
    } else if (score >= 40) {
      scoreCategory = 'mittel';
      scoreCategoryLabel = 'Ausbaufähig';
      scoreCategoryColor = '#f59e0b';
    }

    // =================================================================
    // PHASE 4: Empfehlungen generieren
    // =================================================================
    const recommendations = [];
    
    if (!domainAnalysis.hasSchema) {
      recommendations.push({
        priority: 'hoch',
        title: 'Schema.org Markup hinzufügen',
        description: 'Strukturierte Daten (JSON-LD) helfen KI-Systemen, deine Inhalte besser zu verstehen.',
        link: '/schema-org-meta-description'
      });
    }
    
    if (mentionCount === 0) {
      recommendations.push({
        priority: 'hoch',
        title: 'Markenbekanntheit aufbauen',
        description: 'Deine Domain wird von Gemini nicht erkannt. Fokussiere auf E-E-A-T und Content-Marketing.',
        link: '/geo-seo'
      });
    }
    
    if (!domainAnalysis.hasAboutPage) {
      recommendations.push({
        priority: 'mittel',
        title: 'Über-uns Seite erstellen',
        description: 'Eine klare Über-uns Seite stärkt das Vertrauen und die E-E-A-T Signale.',
        link: null
      });
    }
    
    if (!domainAnalysis.hasAuthorInfo) {
      recommendations.push({
        priority: 'mittel',
        title: 'Autoren-Informationen hinzufügen',
        description: 'Zeige, wer hinter den Inhalten steht. Das verbessert die Expertise-Bewertung.',
        link: null
      });
    }
    
    if (domainAnalysis.schemaTypes.length < 3) {
      recommendations.push({
        priority: 'mittel',
        title: 'Mehr Schema-Typen nutzen',
        description: `Aktuell: ${domainAnalysis.schemaTypes.length > 0 ? domainAnalysis.schemaTypes.join(', ') : 'Keine'}. Füge FAQPage, HowTo oder Article hinzu.`,
        link: '/schema-org-meta-description'
      });
    }

    // Alle Konkurrenten sammeln
    const allCompetitors = [...new Set(testResults.flatMap(t => t.competitors))].slice(0, 10);

    // =================================================================
    // RESPONSE
    // =================================================================
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
      recommendations
    });

  } catch (error) {
    console.error("AI Visibility Check Error:", error);
    return res.status(500).json({ 
      success: false,
      message: 'Fehler bei der Analyse: ' + error.message 
    });
  }
}
