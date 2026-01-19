// api/ai-visibility-check.js - KI-Sichtbarkeits-Check mit Grounding + Formatierung
// Version 2: Domain-Validierung + bereinigte Gemini-Antworten
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =================================================================
// RATE LIMITING - 3 Abfragen pro IP pro Tag (In-Memory für Vercel)
// =================================================================
const DAILY_LIMIT = 3;
const rateLimitMap = new Map(); // IP -> { date: 'YYYY-MM-DD', count: number }

// =================================================================
// DOMAIN VALIDATION - Schutz vor Injection & ungültigen Eingaben
// =================================================================

/**
 * Validiert und bereinigt eine Domain-Eingabe
 * @param {string} input - Rohe Benutzereingabe
 * @returns {{ valid: boolean, domain: string|null, error: string|null }}
 */
function validateAndCleanDomain(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, domain: null, error: 'Domain ist erforderlich' };
  }

  // Trimmen und Lowercase
  let domain = input.trim().toLowerCase();

  // Protokoll entfernen (http://, https://, ftp://, etc.)
  domain = domain.replace(/^[a-z]+:\/\//, '');

  // www. entfernen (optional, für Konsistenz)
  domain = domain.replace(/^www\./, '');

  // Trailing Slash und Pfade entfernen
  domain = domain.replace(/\/.*$/, '');

  // Port entfernen (z.B. :8080)
  domain = domain.replace(/:\d+$/, '');

  // Whitespace und gefährliche Zeichen prüfen
  if (/\s/.test(domain)) {
    return { valid: false, domain: null, error: 'Domain darf keine Leerzeichen enthalten' };
  }

  // SQL Injection / XSS Patterns blockieren
  const dangerousPatterns = [
    /[<>'"`;]/,           // HTML/SQL Sonderzeichen
    /--/,                  // SQL Comment
    /\/\*/,                // SQL Block Comment
    /\.\./,                // Path Traversal
    /\x00/,                // Null Byte
    /javascript:/i,        // JS Protocol
    /data:/i,              // Data URI
    /vbscript:/i,          // VBScript
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(domain)) {
      console.warn(`⚠️ Blocked dangerous input: ${input}`);
      return { valid: false, domain: null, error: 'Ungültige Zeichen in der Domain' };
    }
  }

  // Längenprüfung (max 253 Zeichen für DNS)
  if (domain.length > 253) {
    return { valid: false, domain: null, error: 'Domain ist zu lang (max. 253 Zeichen)' };
  }

  if (domain.length < 4) {
    return { valid: false, domain: null, error: 'Domain ist zu kurz' };
  }

  // Valides Domain-Format prüfen (RFC 1035 konform)
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  
  if (!domainRegex.test(domain)) {
    return { 
      valid: false, 
      domain: null, 
      error: 'Ungültiges Domain-Format. Beispiel: beispiel.at oder meine-firma.co.at' 
    };
  }

  // Bekannte ungültige TLDs blockieren
  const invalidTLDs = ['localhost', 'local', 'test', 'invalid', 'example'];
  const tld = domain.split('.').pop();
  if (invalidTLDs.includes(tld)) {
    return { valid: false, domain: null, error: 'Test-Domains sind nicht erlaubt' };
  }

  return { valid: true, domain: domain, error: null };
}

// =================================================================
// TRACKING - Alle Checks protokollieren
// =================================================================

async function trackVisibilityCheck(data) {
  const trackingData = {
    timestamp: new Date().toISOString(),
    domain: data.domain,
    industry: data.industry || null,
    score: data.score,
    scoreLabel: data.scoreLabel,
    mentionCount: data.mentionCount,
    totalTests: data.totalTests,
    hasSchema: data.hasSchema,
    schemaTypes: data.schemaTypes || [],
    country: data.country || 'unknown'
  };

  console.log('[VISIBILITY]', JSON.stringify(trackingData));
  return trackingData;
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function checkRateLimit(ip) {
  const today = getTodayString();
  const usage = rateLimitMap.get(ip);
  
  if (!usage || usage.date !== today) {
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  
  if (usage.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: DAILY_LIMIT - usage.count - 1 };
}

function incrementRateLimit(ip) {
  const today = getTodayString();
  const usage = rateLimitMap.get(ip);
  
  if (!usage || usage.date !== today) {
    rateLimitMap.set(ip, { date: today, count: 1 });
  } else {
    rateLimitMap.set(ip, { date: today, count: usage.count + 1 });
  }
  
  // Cleanup: Alte Einträge entfernen
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.date !== today) {
      rateLimitMap.delete(key);
    }
  }
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] ||
         req.socket?.remoteAddress ||
         'unknown';
}

// =================================================================
// HELPER: Langweilige Gemini-Einleitungen entfernen
// =================================================================
function removeBoringIntros(text) {
  // Patterns für typische KI-Einleitungen (Deutsch & Englisch)
  const boringPatterns = [
    // Deutsche Patterns
    /^okay[,.\s]*/i,
    /^ok[,.\s]+/i,
    /^ich werde[^.]*\.\s*/i,
    /^ich habe[^.]*gesucht[^.]*\.\s*/i,
    /^ich suche[^.]*\.\s*/i,
    /^hier (sind|ist)[^:]*:\s*/i,
    /^hier (sind|ist)[^.]*\.\s*/i,
    /^basierend auf[^:]*:\s*/i,
    /^basierend auf[^.]*[,.]\s*/i,
    /^laut (den |meinen |der )?suchergebnissen?[^:]*:\s*/i,
    /^laut (den |meinen |der )?suchergebnissen?[^.]*[,.]\s*/i,
    /^nach meiner suche[^:]*:\s*/i,
    /^die suche ergab[^:]*:\s*/i,
    /^meine suche[^.]*\.\s*/i,
    /^gerne[,!.\s]*/i,
    /^natürlich[,!.\s]*/i,
    /^selbstverständlich[,!.\s]*/i,
    /^klar[,!.\s]*/i,
    // Englische Patterns (falls Gemini manchmal Englisch antwortet)
    /^sure[,.\s]*/i,
    /^certainly[,.\s]*/i,
    /^of course[,.\s]*/i,
    /^i('ll| will)[^.]*\.\s*/i,
    /^here (are|is)[^:]*:\s*/i,
    /^based on[^:]*:\s*/i,
  ];

  let cleaned = text;
  
  // Mehrfach durchlaufen, falls mehrere Einleitungen hintereinander
  let iterations = 0;
  let previousLength;
  
  do {
    previousLength = cleaned.length;
    for (const pattern of boringPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    iterations++;
  } while (cleaned.length !== previousLength && iterations < 5);

  // Führende Leerzeichen/Zeilenumbrüche entfernen
  cleaned = cleaned.replace(/^[\s\n]+/, '');

  return cleaned;
}

// =================================================================
// HELPER: Markdown zu HTML formatieren
// =================================================================
function formatResponseText(text) {
  // Erst langweilige Einleitungen entfernen
  let formatted = removeBoringIntros(text);
  
  // Markdown-Formatierung
  formatted = formatted
    // Fett: **text** → <strong>text</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Kursiv: *text* → <em>text</em>
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Aufzählungen: - Item oder • Item → mit Bullet
    .replace(/^[-•]\s+(.+)$/gm, '• $1');
  
  // Zeilenumbrüche direkt nach </strong> entfernen
  formatted = formatted.replace(/<\/strong>\s*\n+/g, '</strong> ');
  
  // Zeilenumbrüche direkt vor <strong> entfernen
  formatted = formatted.replace(/\n+\s*<strong>/g, ' <strong>');
  
  // Mehrfache Leerzeilen reduzieren
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Nur echte Absätze werden zu <br><br>
  formatted = formatted.replace(/\n\n/g, '<br><br>');
  
  // Einzelne Zeilenumbrüche nur bei Listen behalten
  formatted = formatted.replace(/\n(•)/g, '<br>$1');
  
  // Restliche einzelne Zeilenumbrüche zu Leerzeichen
  formatted = formatted.replace(/\n/g, ' ');
  
  // Doppelte Leerzeichen entfernen
  formatted = formatted.replace(/\s{2,}/g, ' ');
  
  // Leerzeichen vor Satzzeichen entfernen
  formatted = formatted.replace(/\s+([.,!?:;])/g, '$1');
  
  return formatted.trim();
}

// =================================================================
// HELPER: Industry Input sanitizen
// =================================================================
function sanitizeIndustry(input) {
  if (!input || typeof input !== 'string') return null;
  
  let industry = input.trim().substring(0, 100);
  industry = industry.replace(/[<>'"`;\\]/g, '');
  
  return industry.length > 0 ? industry : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // =================================================================
  // RATE LIMIT CHECK
  // =================================================================
  const clientIP = getClientIP(req);
  const rateCheck = checkRateLimit(clientIP);
  
  if (!rateCheck.allowed) {
    console.log(`⛔ Rate Limit erreicht für IP: ${clientIP}`);
    return res.status(429).json({ 
      success: false,
      message: 'Tageslimit erreicht (3 Checks pro Tag). Bitte morgen wieder versuchen.',
      remaining: 0
    });
  }

  try {
    const { domain, industry } = req.body;
    
    // =================================================================
    // INPUT VALIDATION
    // =================================================================
    const domainValidation = validateAndCleanDomain(domain);
    
    if (!domainValidation.valid) {
      console.log(`⚠️ Invalid domain input: "${domain}" → ${domainValidation.error}`);
      return res.status(400).json({ 
        success: false,
        message: domainValidation.error 
      });
    }

    const cleanDomain = domainValidation.domain;
    const cleanIndustry = sanitizeIndustry(industry);
    
    console.log(`🔍 AI Visibility Check für: ${cleanDomain} (IP: ${clientIP}, Remaining: ${rateCheck.remaining})`);
    
    incrementRateLimit(clientIP);

    // --- MODELL MIT GOOGLE SEARCH GROUNDING ---
    const modelWithSearch = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { 
        temperature: 0.4,
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
    
    // Gemeinsame Formatierungsanweisung für alle Prompts
    const formatInstruction = `

**WICHTIGE FORMATIERUNG:**
- Beginne DIREKT mit den Fakten
- KEINE Einleitung wie "Okay", "Ich werde...", "Hier sind...", "Basierend auf..." oder ähnliches
- KEINE Meta-Kommentare über die Suche selbst
- Schreibe professionell und direkt`;

    const testQueries = [
      {
        id: 'knowledge',
        prompt: `Suche im Web nach der Website **${cleanDomain}** und beschreibe:

1. Was bietet dieses Unternehmen/diese Website an?
2. Wo ist der Standort (Stadt, Land)?
3. Welche konkreten Informationen findest du?

- Schreibe den Firmennamen/Domain immer **fett**
- Nutze kurze, klare Sätze
- Wenn du nichts findest, sage: "Zu **${cleanDomain}** wurden keine Informationen gefunden."
${formatInstruction}

Antworte auf Deutsch in 3-5 Sätzen.`,
        description: 'Bekanntheit im Web',
        useGrounding: true
      },
      {
        id: 'recommendation',
        prompt: cleanIndustry 
          ? `Suche nach den **besten Anbietern für "${cleanIndustry}"** in Österreich.

Nenne **5-8 empfehlenswerte Unternehmen/Websites**:
- **Firmenname** – Website – kurze Beschreibung

Prüfe auch: Wird **${cleanDomain}** in diesem Bereich erwähnt oder empfohlen?
${formatInstruction}

Antworte auf Deutsch. Formatiere die Liste übersichtlich.`
          : `Suche nach empfehlenswerten **Webentwicklern und Digital-Agenturen** in Österreich.

Nenne **5-8 bekannte Anbieter**:
- **Firmenname** – Website – Spezialisierung
${formatInstruction}

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

Wenn keine Bewertungen vorhanden: "Zu **${cleanDomain}** wurden keine Online-Bewertungen gefunden."
${formatInstruction}

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

Liste gefundene Erwähnungen mit **fetten** Quellennamen auf.

Wenn nichts gefunden: "Zu **${cleanDomain}** wurden keine externen Erwähnungen gefunden."
${formatInstruction}

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
          result = await modelWithSearch.generateContent({
            contents: [{ role: "user", parts: [{ text: test.prompt }] }],
            tools: [{ googleSearch: {} }]
          });
        } else {
          result = await modelWithSearch.generateContent(test.prompt);
        }
        
        const response = await result.response;
        let text = response.text();
        
        // Formatierung anwenden (inkl. Entfernung langweiliger Einleitungen)
        text = formatResponseText(text);
        
        // Prüfen ob Domain erwähnt wird
        const domainBase = cleanDomain.replace(/\.[^.]+$/, '');
        const domainMentioned = text.toLowerCase().includes(cleanDomain) ||
                               text.toLowerCase().includes(domainBase);
        
        // Sentiment analysieren
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
        
        // Konkurrenten extrahieren
        const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
        const matches = text.match(domainRegex) || [];
        const competitors = [...new Set(matches)]
          .map(d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase())
          .filter(c => !c.includes(domainBase) && !c.includes('google') && !c.includes('schema.org'))
          .slice(0, 8);
        
        testResults.push({
          id: test.id,
          description: test.description,
          query: test.prompt.split('\n')[0].substring(0, 80) + '...',
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
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // =================================================================
    // PHASE 3: Score-Berechnung
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

    // Score-Kategorie
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

    const allCompetitors = [...new Set(testResults.flatMap(t => t.competitors))].slice(0, 12);

    // =================================================================
    // TRACKING
    // =================================================================
    await trackVisibilityCheck({
      domain: cleanDomain,
      industry: cleanIndustry,
      score: score,
      scoreLabel: scoreCategoryLabel,
      mentionCount: mentionCount,
      totalTests: testResults.length,
      hasSchema: domainAnalysis.hasSchema,
      schemaTypes: domainAnalysis.schemaTypes,
      country: req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || null
    });

    // =================================================================
    // RESPONSE
    // =================================================================
    const remainingChecks = checkRateLimit(clientIP).remaining;
    console.log(`\n📊 Ergebnis für ${cleanDomain}: Score ${score}/100 (${scoreCategoryLabel}) | Remaining: ${remainingChecks}`);
    
    return res.status(200).json({
      success: true,
      domain: cleanDomain,
      industry: cleanIndustry || null,
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
        totalTests: testResults.length,
        remainingChecks: remainingChecks
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
