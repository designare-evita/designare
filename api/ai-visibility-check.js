// api/ai-visibility-check.js - KI-Sichtbarkeits-Check mit Grounding + Formatierung
// Version 8: KORRIGIERTE Sentiment-Logik
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =================================================================
// RATE LIMITING
// =================================================================
const DAILY_LIMIT = 3;
const rateLimitMap = new Map();

// =================================================================
// DOMAIN VALIDATION
// =================================================================

function validateAndCleanDomain(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, domain: null, error: 'Domain ist erforderlich' };
  }

  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^[a-z]+:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.replace(/\/.*$/, '');
  domain = domain.replace(/:\d+$/, '');

  if (/\s/.test(domain)) {
    return { valid: false, domain: null, error: 'Domain darf keine Leerzeichen enthalten' };
  }

  const dangerousPatterns = [
    /[<>'"`;]/,
    /--/,
    /\/\*/,
    /\.\./,
    /\x00/,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(domain)) {
      return { valid: false, domain: null, error: 'Ungültige Zeichen in der Domain' };
    }
  }

  if (domain.length > 253 || domain.length < 4) {
    return { valid: false, domain: null, error: 'Ungültige Domain-Länge' };
  }

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return { valid: false, domain: null, error: 'Ungültiges Domain-Format' };
  }

  const invalidTLDs = ['localhost', 'local', 'test', 'invalid', 'example'];
  if (invalidTLDs.includes(domain.split('.').pop())) {
    return { valid: false, domain: null, error: 'Test-Domains nicht erlaubt' };
  }

  return { valid: true, domain: domain, error: null };
}

// =================================================================
// TRACKING
// =================================================================

async function trackVisibilityCheck(data) {
  console.log('[VISIBILITY]', JSON.stringify({
    timestamp: new Date().toISOString(),
    domain: data.domain,
    industry: data.industry || null,
    score: data.score,
    scoreLabel: data.scoreLabel,
    mentionCount: data.mentionCount,
    totalTests: data.totalTests,
    hasSchema: data.hasSchema,
    country: data.country || 'unknown'
  }));
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
  
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.date !== today) rateLimitMap.delete(key);
  }
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] ||
         'unknown';
}

// =================================================================
// HELPER: Langweilige Einleitungen entfernen
// =================================================================
function removeBoringIntros(text) {
  const patterns = [
    /^okay[,.\s]*/i,
    /^ok[,.\s]+/i,
    /^ich werde[^.]*\.\s*/i,
    /^ich habe[^.]*gesucht[^.]*\.\s*/i,
    /^hier (sind|ist)[^:]*:\s*/i,
    /^basierend auf[^:]*:\s*/i,
    /^laut[^:]*suchergebnissen?[^:]*:\s*/i,
    /^gerne[,!.\s]*/i,
    /^natürlich[,!.\s]*/i,
    /^selbstverständlich[,!.\s]*/i,
  ];

  let cleaned = text;
  for (let i = 0; i < 3; i++) {
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
  }
  return cleaned.trim();
}

// =================================================================
// HELPER: Text formatieren (Absätze statt Listen)
// =================================================================
function formatResponseText(text) {
  let formatted = removeBoringIntros(text);
  
  // Markdown Fett → HTML
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Zeilenumbrüche normalisieren
  formatted = formatted.replace(/\r\n/g, '\n');
  formatted = formatted.replace(/\r/g, '\n');
  
  // Nummerierte Listen → Absätze
  formatted = formatted.replace(/\n\s*\d+\.\s+/g, '\n\n');
  formatted = formatted.replace(/^\s*\d+\.\s+/g, '');
  
  // Bullet Points → Absätze
  formatted = formatted.replace(/\n\s*[•\-\*]\s+/g, '\n\n');
  formatted = formatted.replace(/^\s*[•\-\*]\s+/g, '');
  
  // Doppelte Zeilenumbrüche → <br><br>
  formatted = formatted.replace(/\n{2,}/g, '<br><br>');
  
  // Einzelne Zeilenumbrüche → Leerzeichen
  formatted = formatted.replace(/\n/g, ' ');
  
  // Cleanup
  formatted = formatted.replace(/^(<br>\s*)+/gi, '');
  formatted = formatted.replace(/(<br>\s*){3,}/gi, '<br><br>');
  formatted = formatted.replace(/\s{2,}/g, ' ');
  formatted = formatted.replace(/\s+([.!?,:;])/g, '$1');
  formatted = formatted.replace(/\s*<br>\s*/gi, '<br>');
  formatted = formatted.replace(/Zu\s+<strong>/gi, 'Zu <strong>');
  
  return formatted.trim();
}

// =================================================================
// HELPER: Industry sanitizen
// =================================================================
function sanitizeIndustry(input) {
  if (!input || typeof input !== 'string') return null;
  let industry = input.trim().substring(0, 100);
  industry = industry.replace(/[<>'"`;\\]/g, '');
  return industry.length > 0 ? industry : null;
}

// =================================================================
// NEU: VERBESSERTE SENTIMENT-ANALYSE
// =================================================================
function analyzeSentiment(text, testType, domainMentioned) {
  const textLower = text.toLowerCase();
  
  // ============================================================
  // NEGATIVE INDIKATOREN (universell)
  // ============================================================
  const notFoundIndicators = [
    'keine informationen',
    'nicht gefunden',
    'keine ergebnisse',
    'nicht bekannt',
    'konnte ich keine',
    'wurden keine',
    'nichts gefunden',
    'nicht zu finden',
    'keine daten',
    'nicht auffindbar'
  ];
  
  const hasNotFound = notFoundIndicators.some(indicator => textLower.includes(indicator));
  
  // ============================================================
  // TEST-SPEZIFISCHE LOGIK
  // ============================================================
  
  // --- TEST 1: BEKANNTHEIT ---
  if (testType === 'knowledge') {
    if (!domainMentioned || hasNotFound) {
      return 'negativ';
    }
    
    // Prüfe ob substantielle Informationen gefunden wurden
    const hasSubstantialInfo = 
      textLower.includes('bietet') ||
      textLower.includes('anbieter') ||
      textLower.includes('dienstleistung') ||
      textLower.includes('produkt') ||
      textLower.includes('unternehmen') ||
      textLower.includes('firma') ||
      textLower.includes('standort') ||
      textLower.includes('spezialisiert') ||
      textLower.includes('tätig') ||
      textLower.includes('gegründet') ||
      textLower.includes('seit') ||
      textLower.includes('agentur') ||
      textLower.includes('service');
    
    if (hasSubstantialInfo) {
      return 'positiv';  // Domain bekannt UND beschrieben = positiv!
    }
    
    return 'neutral';  // Domain erwähnt aber kaum Info
  }
  
  // --- TEST 2: EMPFEHLUNGEN ---
  if (testType === 'recommendation') {
    if (!domainMentioned) {
      return 'negativ';  // Nicht in Empfehlungen = schlecht
    }
    
    const positiveRecommendation = [
      'empfehlenswert',
      'erfolgreich',
      'erfahren',
      'spezialist',
      'experte',
      'führend',
      'renommiert',
      'etabliert',
      'professionell',
      'hochwertig',
      'umfangreich',
      'bekannt'
    ];
    
    const hasPositive = positiveRecommendation.some(word => textLower.includes(word));
    return hasPositive ? 'positiv' : 'neutral';
  }
  
  // --- TEST 3: REPUTATION / BEWERTUNGEN ---
  if (testType === 'reviews') {
    // Keine Bewertungen gefunden
    const noBewertungen = [
      'keine bewertungen',
      'keine rezensionen',
      'keine online-bewertungen',
      'wurden keine bewertungen',
      'nicht gefunden'
    ];
    
    if (noBewertungen.some(phrase => textLower.includes(phrase))) {
      return 'negativ';
    }
    
    // KRITISCH: Prüfe auf NIEDRIGE Bewertungen (1-2 Sterne)
    const lowRatingPatterns = [
      /\b[1-2][.,]\d?\s*(sterne|stars|von\s*5)/i,
      /\b1\s*von\s*5/i,
      /\b2\s*von\s*5/i,
      /bewertung[:\s]+1/i,
      /1\.0\s*(sterne|von)/i,
      /2\.0\s*(sterne|von)/i
    ];
    
    const hasLowRating = lowRatingPatterns.some(pattern => pattern.test(text));
    
    if (hasLowRating) {
      return 'negativ';  // Schlechte Bewertung = negativ!
    }
    
    // Prüfe auf HOHE Bewertungen (4-5 Sterne)
    const highRatingPatterns = [
      /\b[4-5][.,]\d?\s*(sterne|stars|von\s*5)/i,
      /\b4\s*von\s*5/i,
      /\b5\s*von\s*5/i,
      /4\.5/,
      /4\.[5-9]/,
      /5\.0/
    ];
    
    const hasHighRating = highRatingPatterns.some(pattern => pattern.test(text));
    
    // Prüfe auf positive Wörter
    const positiveReviewWords = [
      'zufrieden',
      'empfehlen',
      'positiv',
      'gut',
      'sehr gut',
      'hervorragend',
      'ausgezeichnet',
      'top',
      'super'
    ];
    
    const hasPositiveWords = positiveReviewWords.some(word => textLower.includes(word));
    
    // Prüfe auf mittlere Bewertungen (3 Sterne)
    const midRatingPatterns = [
      /\b3[.,]\d?\s*(sterne|stars|von\s*5)/i,
      /\b3\s*von\s*5/i
    ];
    
    const hasMidRating = midRatingPatterns.some(pattern => pattern.test(text));
    
    if (hasHighRating || hasPositiveWords) {
      return 'positiv';
    } else if (hasMidRating) {
      return 'neutral';
    }
    
    // Nur eine Bewertung = eher negativ (nicht repräsentativ)
    if (/nur\s*(eine|1)\s*bewertung/i.test(text) || /1\s*bewertung/i.test(text)) {
      // Wenn die eine Bewertung schlecht ist, definitiv negativ
      if (hasLowRating) return 'negativ';
      return 'neutral';  // Zu wenig Daten
    }
    
    return 'neutral';
  }
  
  // --- TEST 4: EXTERNE ERWÄHNUNGEN ---
  if (testType === 'mentions') {
    if (hasNotFound || !domainMentioned) {
      return 'negativ';
    }
    
    // Zähle Erwähnungsquellen (mehr = besser)
    const sourceIndicators = [
      'herold', 'wko', 'gelbe seiten', 'facebook', 'instagram', 
      'linkedin', 'twitter', 'xing', 'trustpilot', 'provenexpert',
      'branchenverzeichnis', 'artikel', 'blog', 'presse', 'erwähnung'
    ];
    
    const sourceCount = sourceIndicators.filter(source => textLower.includes(source)).length;
    
    if (sourceCount >= 4) {
      return 'positiv';  // Viele externe Erwähnungen = gut
    }
    
    return 'neutral';  // Einige Erwähnungen
  }
  
  // Fallback
  return 'neutral';
}

// =================================================================
// MAIN HANDLER
// =================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);
  const rateCheck = checkRateLimit(clientIP);
  
  if (!rateCheck.allowed) {
    return res.status(429).json({ 
      success: false,
      message: 'Tageslimit erreicht (3 Checks pro Tag). Bitte morgen wieder versuchen.',
      remaining: 0
    });
  }

  try {
    const { domain, industry } = req.body;
    
    const domainValidation = validateAndCleanDomain(domain);
    if (!domainValidation.valid) {
      return res.status(400).json({ success: false, message: domainValidation.error });
    }

    const cleanDomain = domainValidation.domain;
    const cleanIndustry = sanitizeIndustry(industry);
    
    console.log(`🔍 AI Visibility Check: ${cleanDomain} (Branche: ${cleanIndustry || 'auto'})`);
    incrementRateLimit(clientIP);

    const modelWithSearch = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://${cleanDomain}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIVisibilityBot/1.0)' }
      });
      clearTimeout(timeout);
      
      const html = await response.text();
      
      const schemaMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (schemaMatches) {
        domainAnalysis.hasSchema = true;
        schemaMatches.forEach(match => {
          try {
            const parsed = JSON.parse(match.replace(/<script[^>]*>|<\/script>/gi, ''));
            const extractTypes = (obj) => {
              if (obj['@type']) {
                const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
                domainAnalysis.schemaTypes.push(...types);
              }
              if (obj['@graph']) obj['@graph'].forEach(extractTypes);
            };
            extractTypes(parsed);
          } catch (e) {}
        });
      }
      
      domainAnalysis.hasAboutPage = /href=["'][^"']*(?:about|über-uns|ueber-uns|team|wir)["']/i.test(html);
      domainAnalysis.hasContactPage = /href=["'][^"']*(?:contact|kontakt|impressum)["']/i.test(html);
      domainAnalysis.hasAuthorInfo = /(?:author|autor|verfasser|geschrieben von|inhaber|geschäftsführer)/i.test(html);
      
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      domainAnalysis.title = titleMatch ? titleMatch[1].trim() : '';
      
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      domainAnalysis.description = descMatch ? descMatch[1].trim() : '';
      
    } catch (error) {
      domainAnalysis.crawlError = error.message;
    }

    // =================================================================
    // PHASE 2: Gemini Tests (Sequentiell für Branchenerkennung)
    // =================================================================
    
    const testResults = [];
    let detectedIndustry = cleanIndustry;

    // ==================== TEST 1: BEKANNTHEIT ====================
    console.log(`🧪 Test 1: Bekanntheit im Web...`);
    
    let knowledgeResponse = '';
    try {
      const knowledgePrompt = `Suche nach **${cleanDomain}** und beschreibe kurz:
- Was bietet dieses Unternehmen an? (Produkte/Dienstleistungen)
- In welcher Branche ist es tätig?
- Wo ist der Standort?

Antworte in 3-5 Sätzen. Schreibe Firmennamen **fett**. 
Falls nichts gefunden: "Zu **${cleanDomain}** wurden keine Informationen gefunden."

WICHTIG: Beginne DIREKT mit dem Inhalt, keine Einleitung.`;

      const result = await modelWithSearch.generateContent({
        contents: [{ role: "user", parts: [{ text: knowledgePrompt }] }],
        tools: [{ googleSearch: {} }]
      });
      
      knowledgeResponse = result.response.text();
      const formattedKnowledge = formatResponseText(knowledgeResponse);
      
      const domainBase = cleanDomain.replace(/\.[^.]+$/, '');
      const mentioned = formattedKnowledge.toLowerCase().includes(cleanDomain) ||
                        formattedKnowledge.toLowerCase().includes(domainBase);
      
      // NEU: Verbesserte Sentiment-Analyse
      const sentiment = analyzeSentiment(formattedKnowledge, 'knowledge', mentioned);
      
      testResults.push({
        id: 'knowledge',
        description: 'Bekanntheit im Web',
        mentioned,
        sentiment,
        competitors: [],
        response: formattedKnowledge,
        groundingUsed: true
      });
      
      console.log(`   → ${mentioned ? '✅ Erwähnt' : '❌ Nicht erwähnt'} | Sentiment: ${sentiment}`);
      
      // Branche aus der Antwort extrahieren, falls nicht angegeben
      if (!cleanIndustry && mentioned) {
        detectedIndustry = await detectIndustryFromResponse(modelWithSearch, knowledgeResponse, cleanDomain);
        console.log(`   → Branche erkannt: ${detectedIndustry || 'unbekannt'}`);
      }
      
    } catch (error) {
      testResults.push({
        id: 'knowledge',
        description: 'Bekanntheit im Web',
        mentioned: false,
        sentiment: 'fehler',
        competitors: [],
        response: '❌ Test fehlgeschlagen: ' + error.message,
        groundingUsed: true
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // ==================== TEST 2: EMPFEHLUNGEN ====================
    console.log(`🧪 Test 2: Empfehlungen in der Branche (${detectedIndustry || 'auto'})...`);
    
    try {
      const recommendationPrompt = detectedIndustry
        ? `Suche nach den besten Anbietern für "${detectedIndustry}" in Österreich.

Nenne 5-8 empfehlenswerte Unternehmen. Für jedes Unternehmen schreibe einen kurzen Absatz:
**Firmenname** – Was sie anbieten und was sie auszeichnet.

Prüfe auch: Wird **${cleanDomain}** in diesem Bereich erwähnt oder empfohlen?

WICHTIG: 
- Beginne DIREKT mit dem ersten Unternehmen
- KEINE Nummerierung (1., 2., etc.)
- Jedes Unternehmen als eigener Absatz
- Firmennamen immer **fett**`

        : `Suche zuerst, was **${cleanDomain}** anbietet.
Dann finde 5-8 ähnliche Unternehmen/Konkurrenten, die DIESELBEN oder ähnliche Produkte/Dienstleistungen anbieten.

Für jedes Unternehmen schreibe einen kurzen Absatz:
**Firmenname** – Was sie anbieten und warum sie relevant sind.

WICHTIG:
- Beginne DIREKT mit dem ersten Unternehmen
- KEINE Nummerierung (1., 2., etc.)
- Jedes Unternehmen als eigener Absatz
- Firmennamen immer **fett**
- Suche Konkurrenten in DERSELBEN Branche wie ${cleanDomain}`;

      const result = await modelWithSearch.generateContent({
        contents: [{ role: "user", parts: [{ text: recommendationPrompt }] }],
        tools: [{ googleSearch: {} }]
      });
      
      let text = formatResponseText(result.response.text());
      
      const domainBase = cleanDomain.replace(/\.[^.]+$/, '');
      const mentioned = text.toLowerCase().includes(cleanDomain) ||
                        text.toLowerCase().includes(domainBase);
      
      // NEU: Verbesserte Sentiment-Analyse
      const sentiment = analyzeSentiment(text, 'recommendation', mentioned);
      
      // Konkurrenten extrahieren
      const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
      const matches = text.match(domainRegex) || [];
      const competitors = [...new Set(matches)]
        .map(d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase())
        .filter(c => !c.includes(domainBase) && !c.includes('google') && !c.includes('schema.org'))
        .slice(0, 8);
      
      testResults.push({
        id: 'recommendation',
        description: 'Empfehlungen in der Branche',
        mentioned,
        sentiment,
        competitors,
        response: text.length > 1200 ? text.substring(0, 1200) + '...' : text,
        groundingUsed: true
      });
      
      console.log(`   → ${mentioned ? '✅ Erwähnt' : '❌ Nicht erwähnt'} | Sentiment: ${sentiment}`);
      
    } catch (error) {
      testResults.push({
        id: 'recommendation',
        description: 'Empfehlungen in der Branche',
        mentioned: false,
        sentiment: 'fehler',
        competitors: [],
        response: '❌ Test fehlgeschlagen: ' + error.message,
        groundingUsed: true
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // ==================== TEST 3: BEWERTUNGEN ====================
    console.log(`🧪 Test 3: Online-Reputation...`);
    
    try {
      const reviewsPrompt = `Suche nach Bewertungen und Rezensionen zu **${cleanDomain}**.

Prüfe: Google Reviews, Trustpilot, ProvenExpert, Kununu und ähnliche Plattformen.

Fasse zusammen:
- Bewertung (Sterne/Score)
- Was sagen Kunden?
- Wie viele Bewertungen gibt es?

Falls keine Bewertungen gefunden: "Zu **${cleanDomain}** wurden keine Online-Bewertungen gefunden."

WICHTIG: Beginne DIREKT mit dem Inhalt, keine Einleitung wie "Okay" oder "Ich werde".`;

      const result = await modelWithSearch.generateContent({
        contents: [{ role: "user", parts: [{ text: reviewsPrompt }] }],
        tools: [{ googleSearch: {} }]
      });
      
      let text = formatResponseText(result.response.text());
      
      const domainBase = cleanDomain.replace(/\.[^.]+$/, '');
      const mentioned = text.toLowerCase().includes(cleanDomain) ||
                        text.toLowerCase().includes(domainBase);
      
      // NEU: Verbesserte Sentiment-Analyse für Bewertungen
      const sentiment = analyzeSentiment(text, 'reviews', mentioned);
      
      testResults.push({
        id: 'reviews',
        description: 'Online-Reputation',
        mentioned,
        sentiment,
        competitors: [],
        response: text,
        groundingUsed: true
      });
      
      console.log(`   → ${mentioned ? '✅ Erwähnt' : '❌ Nicht erwähnt'} | Sentiment: ${sentiment}`);
      
    } catch (error) {
      testResults.push({
        id: 'reviews',
        description: 'Online-Reputation',
        mentioned: false,
        sentiment: 'fehler',
        competitors: [],
        response: '❌ Test fehlgeschlagen: ' + error.message,
        groundingUsed: true
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // ==================== TEST 4: EXTERNE ERWÄHNUNGEN ====================
    console.log(`🧪 Test 4: Externe Erwähnungen...`);
    
    try {
      const mentionsPrompt = `Suche nach externen Erwähnungen von **${cleanDomain}**:

Prüfe:
- Branchenverzeichnisse (Herold, WKO, Gelbe Seiten, etc.)
- Artikel und Blogs
- Social Media Profile
- Andere Websites, die auf ${cleanDomain} verlinken

Liste die gefundenen Erwähnungen auf. Schreibe Quellennamen **fett**.

Falls nichts gefunden: "Zu **${cleanDomain}** wurden keine externen Erwähnungen gefunden."

WICHTIG: Beginne DIREKT mit dem Inhalt, keine Einleitung.`;

      const result = await modelWithSearch.generateContent({
        contents: [{ role: "user", parts: [{ text: mentionsPrompt }] }],
        tools: [{ googleSearch: {} }]
      });
      
      let text = formatResponseText(result.response.text());
      
      const domainBase = cleanDomain.replace(/\.[^.]+$/, '');
      const mentioned = text.toLowerCase().includes(cleanDomain) ||
                        text.toLowerCase().includes(domainBase);
      
      // NEU: Verbesserte Sentiment-Analyse für Erwähnungen
      const sentiment = analyzeSentiment(text, 'mentions', mentioned);
      
      // Erwähnte Domains extrahieren
      const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
      const matches = text.match(domainRegex) || [];
      const mentionedDomains = [...new Set(matches)]
        .map(d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase())
        .filter(c => !c.includes(domainBase) && !c.includes('google') && !c.includes('schema.org'))
        .slice(0, 8);
      
      testResults.push({
        id: 'mentions',
        description: 'Externe Erwähnungen',
        mentioned,
        sentiment,
        competitors: mentionedDomains,
        response: text,
        groundingUsed: true
      });
      
      console.log(`   → ${mentioned ? '✅ Erwähnt' : '❌ Nicht erwähnt'} | Sentiment: ${sentiment}`);
      
    } catch (error) {
      testResults.push({
        id: 'mentions',
        description: 'Externe Erwähnungen',
        mentioned: false,
        sentiment: 'fehler',
        competitors: [],
        response: '❌ Test fehlgeschlagen: ' + error.message,
        groundingUsed: true
      });
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
      detail: `Schema: ${domainAnalysis.hasSchema ? '✓' : '✗'}, E-E-A-T: ${[domainAnalysis.hasAboutPage, domainAnalysis.hasContactPage, domainAnalysis.hasAuthorInfo].filter(Boolean).length}/3`
    });
    
    // 3. Sentiment & Reputation (max 25 Punkte)
    const positiveCount = testResults.filter(t => t.sentiment === 'positiv').length;
    const neutralCount = testResults.filter(t => t.sentiment === 'neutral').length;
    const negativeCount = testResults.filter(t => t.sentiment === 'negativ').length;
    
    // Positiv = volle Punkte, Neutral = halbe Punkte, Negativ = 0
    const sentimentScore = Math.round((positiveCount * 25 + neutralCount * 12.5) / testResults.length);
    score += sentimentScore;
    scoreBreakdown.push({
      category: 'Online-Reputation',
      points: sentimentScore,
      maxPoints: 25,
      detail: `${positiveCount} positiv, ${neutralCount} neutral, ${negativeCount} negativ`
    });

    // Score-Kategorie bestimmen
    let scoreCategory = 'niedrig', scoreCategoryLabel = 'Kaum sichtbar', scoreCategoryColor = '#ef4444';
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
        description: 'Deine Domain wird kaum gefunden. Fokussiere auf Google Business Profile und Branchenverzeichnisse.', 
        link: '/geo-seo' 
      });
    }
    
    if (!domainAnalysis.hasSchema) {
      recommendations.push({ 
        priority: 'hoch', 
        title: 'Schema.org Markup hinzufügen', 
        description: 'Strukturierte Daten helfen KI deine Inhalte zu verstehen.', 
        link: '/schema-org-meta-description' 
      });
    }
    
    // NEU: Empfehlung bei negativer Reputation
    if (negativeCount >= 2) {
      recommendations.push({ 
        priority: 'hoch', 
        title: 'Online-Reputation verbessern', 
        description: 'Mehrere Tests zeigen negative Signale. Aktiv Bewertungen sammeln und auf Kritik reagieren.', 
        link: null 
      });
    }
    
    if (positiveCount === 0 && mentionCount > 0) {
      recommendations.push({ 
        priority: 'hoch', 
        title: 'Bewertungen sammeln', 
        description: 'Du wirst gefunden, aber es fehlen positive Signale. Bitte zufriedene Kunden um Reviews.', 
        link: null 
      });
    }
    
    if (!domainAnalysis.hasAboutPage || !domainAnalysis.hasAuthorInfo) {
      recommendations.push({ 
        priority: 'mittel', 
        title: 'E-E-A-T Signale stärken', 
        description: 'Füge eine "Über uns" Seite mit Qualifikationen hinzu.', 
        link: null 
      });
    }

    const allCompetitors = [...new Set(testResults.flatMap(t => t.competitors))].slice(0, 12);

    await trackVisibilityCheck({
      domain: cleanDomain,
      industry: detectedIndustry || cleanIndustry,
      score,
      scoreLabel: scoreCategoryLabel,
      mentionCount,
      totalTests: testResults.length,
      hasSchema: domainAnalysis.hasSchema,
      country: req.headers['cf-ipcountry'] || null
    });

    console.log(`\n📊 Ergebnis für ${cleanDomain}: Score ${score}/100 (${scoreCategoryLabel})`);

    return res.status(200).json({
      success: true,
      domain: cleanDomain,
      industry: detectedIndustry || cleanIndustry || null,
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
        schema: { found: domainAnalysis.hasSchema, types: [...new Set(domainAnalysis.schemaTypes)] },
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
        testsWithGrounding: testResults.length, 
        totalTests: testResults.length, 
        remainingChecks: checkRateLimit(clientIP).remaining 
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ success: false, message: 'Fehler: ' + error.message });
  }
}

// =================================================================
// HELPER: Branche aus Antwort extrahieren
// =================================================================
async function detectIndustryFromResponse(model, knowledgeText, domain) {
  try {
    const extractPrompt = `Basierend auf diesem Text über ${domain}:

"${knowledgeText.substring(0, 500)}"

In welcher Branche ist dieses Unternehmen tätig? 
Antworte mit NUR 1-3 Wörtern (z.B. "Luftfracht Transport", "Webentwicklung", "Gastronomie", "E-Commerce").
Keine Erklärung, nur die Branche.`;

    const result = await model.generateContent(extractPrompt);
    const industry = result.response.text().trim();
    
    if (industry.length > 50 || industry.includes('.')) {
      return null;
    }
    
    return industry;
  } catch (e) {
    console.log('Branchenerkennung fehlgeschlagen:', e.message);
    return null;
  }
}
