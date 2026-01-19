// api/ai-visibility-check.js - KI-Sichtbarkeits-Check mit Grounding + Formatierung
// Version 5: RADIKALER Listen-Fix - Alle Umbrüche weg, dann gezielt einfügen
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
  
  // Cleanup alte Einträge
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
// HELPER: Text formatieren (v5 - RADIKALER ANSATZ)
// =================================================================
function formatResponseText(text) {
  let formatted = removeBoringIntros(text);
  
  // ============================================================
  // SCHRITT 1: Markdown Fett → HTML
  // ============================================================
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // ============================================================
  // SCHRITT 2: ALLE Zeilenumbrüche zu Leerzeichen (RADIKAL!)
  // Das löst das Problem, dass Gemini überall Umbrüche einbaut
  // ============================================================
  formatted = formatted.replace(/\r\n/g, ' ');
  formatted = formatted.replace(/\r/g, ' ');
  formatted = formatted.replace(/\n/g, ' ');
  
  // ============================================================
  // SCHRITT 3: Mehrfache Leerzeichen reduzieren
  // ============================================================
  formatted = formatted.replace(/\s{2,}/g, ' ');
  
  // ============================================================
  // SCHRITT 4: Nummerierte Listen - Umbruch VOR der Nummer
  // Pattern: Satzende (. oder :) + Leerzeichen + Nummer + Punkt
  // NICHT am Textanfang, nur wenn davor ein Satz endet
  // ============================================================
  
  // Nach Satzzeichen + Nummer → Umbruch einfügen
  formatted = formatted.replace(/([.!?:])(\s+)(\d+)\.\s+/g, '$1<br><br><strong>$3.</strong> ');
  
  // Spezialfall: "– 2." oder "- 2." (Gedankenstrich vor Nummer)
  formatted = formatted.replace(/([–-])(\s+)(\d+)\.\s+/g, '$1<br><br><strong>$3.</strong> ');
  
  // ============================================================
  // SCHRITT 5: Erste Nummer am Textanfang (ohne <br> davor)
  // ============================================================
  formatted = formatted.replace(/^\s*(\d+)\.\s+/g, '<strong>$1.</strong> ');
  
  // ============================================================
  // SCHRITT 6: Bullet Points
  // ============================================================
  formatted = formatted.replace(/([.!?:])(\s+)[•\-]\s+/g, '$1<br>• ');
  formatted = formatted.replace(/^\s*[•\-]\s+/g, '• ');
  
  // ============================================================
  // SCHRITT 7: "Zu DOMAIN wurden keine..." Fix
  // Das "Zu" und die Domain sollen auf einer Zeile bleiben
  // ============================================================
  formatted = formatted.replace(/Zu\s+<strong>/gi, 'Zu <strong>');
  
  // ============================================================
  // SCHRITT 8: Cleanup
  // ============================================================
  
  // <br> am Anfang entfernen
  formatted = formatted.replace(/^(<br>\s*)+/gi, '');
  
  // Mehrfache <br> reduzieren
  formatted = formatted.replace(/(<br>\s*){3,}/gi, '<br><br>');
  
  // Leerzeichen vor Satzzeichen
  formatted = formatted.replace(/\s+([.!?,:;])/g, '$1');
  
  // Leerzeichen nach <br> normalisieren
  formatted = formatted.replace(/<br>\s+/gi, '<br>');
  
  // Doppelte Leerzeichen nochmal
  formatted = formatted.replace(/\s{2,}/g, ' ');
  
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
    
    console.log(`🔍 AI Visibility Check: ${cleanDomain}`);
    incrementRateLimit(clientIP);

    const modelWithSearch = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
    });

    // =================================================================
    // PHASE 1: Domain-Analyse
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
    // PHASE 2: Gemini Tests
    // =================================================================
    
    // Formatierungsanweisung - NOCH STRIKTER
    const formatInstruction = `

STRIKTE FORMATIERUNG:
- Beginne DIREKT mit Inhalt, KEINE Einleitung
- Schreibe ALLES als Fließtext OHNE Zeilenumbrüche
- Bei Listen: "1. Name – Beschreibung 2. Name – Beschreibung" (alles in einer Zeile)
- NIEMALS Zeilenumbrüche zwischen Nummer und Text`;

    const testQueries = [
      {
        id: 'knowledge',
        prompt: `Suche nach **${cleanDomain}** und beschreibe in 3-5 Sätzen: Was bietet das Unternehmen? Wo ist der Standort? Welche Infos findest du? Schreibe Firmennamen **fett**. Falls nichts gefunden: "Zu **${cleanDomain}** wurden keine Informationen gefunden."${formatInstruction}`,
        description: 'Bekanntheit im Web',
        useGrounding: true
      },
      {
        id: 'recommendation',
        prompt: cleanIndustry 
          ? `Suche die besten Anbieter für "${cleanIndustry}" in Österreich. Liste 5-8 Unternehmen als Fließtext: "1. **Name** – Beschreibung 2. **Name** – Beschreibung" usw. Prüfe ob **${cleanDomain}** erwähnt wird.${formatInstruction}`
          : `Suche empfehlenswerte Webentwickler/Digital-Agenturen in Österreich. Liste 5-8 als Fließtext: "1. **Name** – Beschreibung 2. **Name** – Beschreibung" usw.${formatInstruction}`,
        description: 'Empfehlungen in der Branche',
        useGrounding: true
      },
      {
        id: 'reviews',
        prompt: `Suche Bewertungen zu **${cleanDomain}** (Google Reviews, Trustpilot, etc.). Fasse zusammen: Bewertung (Sterne), Kundenmeinungen, Anzahl. Falls keine: "Zu **${cleanDomain}** wurden keine Online-Bewertungen gefunden."${formatInstruction}`,
        description: 'Online-Reputation',
        useGrounding: true
      },
      {
        id: 'mentions',
        prompt: `Suche externe Erwähnungen von **${cleanDomain}**: Branchenverzeichnisse (Herold, WKO), Links, Artikel, Social Media. Liste als Fließtext. Falls keine: "Zu **${cleanDomain}** wurden keine externen Erwähnungen gefunden."${formatInstruction}`,
        description: 'Externe Erwähnungen',
        useGrounding: true
      }
    ];

    const testResults = [];
    
    for (const test of testQueries) {
      try {
        console.log(`🧪 ${test.description}...`);
        
        const result = await modelWithSearch.generateContent({
          contents: [{ role: "user", parts: [{ text: test.prompt }] }],
          tools: [{ googleSearch: {} }]
        });
        
        let text = result.response.text();
        text = formatResponseText(text);
        
        const domainBase = cleanDomain.replace(/\.[^.]+$/, '');
        const domainMentioned = text.toLowerCase().includes(cleanDomain) ||
                               text.toLowerCase().includes(domainBase);
        
        const textLower = text.toLowerCase();
        const positiveIndicators = ['empfehlenswert', 'qualität', 'professionell', 'zuverlässig', 'gute bewertungen', 'zufrieden', 'top', 'ausgezeichnet', 'spezialist', 'experte', 'sterne', '4.', '4,', '5.', '5,'];
        const negativeIndicators = ['keine informationen', 'nicht gefunden', 'keine bewertungen', 'nicht bekannt', 'keine erwähnungen', 'wurden keine', 'nichts gefunden'];
        
        const posScore = positiveIndicators.filter(w => textLower.includes(w)).length;
        const negScore = negativeIndicators.filter(w => textLower.includes(w)).length;
        
        let sentiment = 'neutral';
        if (domainMentioned && posScore > negScore) sentiment = 'positiv';
        else if (negScore > posScore || !domainMentioned) sentiment = 'negativ';
        
        const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
        const matches = text.match(domainRegex) || [];
        const competitors = [...new Set(matches)]
          .map(d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase())
          .filter(c => !c.includes(domainBase) && !c.includes('google') && !c.includes('schema.org'))
          .slice(0, 8);
        
        testResults.push({
          id: test.id,
          description: test.description,
          mentioned: domainMentioned,
          sentiment,
          competitors,
          response: text.length > 1000 ? text.substring(0, 1000) + '...' : text,
          groundingUsed: true
        });
        
      } catch (error) {
        testResults.push({
          id: test.id,
          description: test.description,
          mentioned: false,
          sentiment: 'fehler',
          competitors: [],
          response: '❌ Test fehlgeschlagen: ' + error.message,
          groundingUsed: true
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // =================================================================
    // PHASE 3: Score
    // =================================================================
    let score = 0;
    const scoreBreakdown = [];
    
    const mentionCount = testResults.filter(t => t.mentioned).length;
    const mentionScore = Math.round((mentionCount / testResults.length) * 40);
    score += mentionScore;
    scoreBreakdown.push({
      category: 'Web-Präsenz (Grounding)',
      points: mentionScore,
      maxPoints: 40,
      detail: `${mentionCount} von ${testResults.length} Suchen finden die Domain`
    });
    
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
    
    const positiveCount = testResults.filter(t => t.sentiment === 'positiv').length;
    const neutralCount = testResults.filter(t => t.sentiment === 'neutral').length;
    const sentimentScore = Math.round((positiveCount * 25 + neutralCount * 10) / testResults.length);
    score += sentimentScore;
    scoreBreakdown.push({
      category: 'Online-Reputation',
      points: sentimentScore,
      maxPoints: 25,
      detail: `${positiveCount} positiv, ${neutralCount} neutral`
    });

    let scoreCategory = 'niedrig', scoreCategoryLabel = 'Kaum sichtbar', scoreCategoryColor = '#ef4444';
    if (score >= 65) { scoreCategory = 'hoch'; scoreCategoryLabel = 'Gut sichtbar'; scoreCategoryColor = '#22c55e'; }
    else if (score >= 35) { scoreCategory = 'mittel'; scoreCategoryLabel = 'Ausbaufähig'; scoreCategoryColor = '#f59e0b'; }

    // =================================================================
    // PHASE 4: Empfehlungen
    // =================================================================
    const recommendations = [];
    
    if (mentionCount === 0) {
      recommendations.push({ priority: 'hoch', title: 'Online-Präsenz aufbauen', description: 'Deine Domain wird kaum gefunden. Fokussiere auf Google Business Profile und Branchenverzeichnisse.', link: '/geo-seo' });
    }
    if (!domainAnalysis.hasSchema) {
      recommendations.push({ priority: 'hoch', title: 'Schema.org Markup hinzufügen', description: 'Strukturierte Daten helfen KI deine Inhalte zu verstehen.', link: '/schema-org-meta-description' });
    }
    if (positiveCount === 0 && mentionCount > 0) {
      recommendations.push({ priority: 'hoch', title: 'Bewertungen sammeln', description: 'Du wirst gefunden, aber es fehlen positive Signale.', link: null });
    }
    if (!domainAnalysis.hasAboutPage || !domainAnalysis.hasAuthorInfo) {
      recommendations.push({ priority: 'mittel', title: 'E-E-A-T Signale stärken', description: 'Füge eine "Über uns" Seite mit Qualifikationen hinzu.', link: null });
    }

    const allCompetitors = [...new Set(testResults.flatMap(t => t.competitors))].slice(0, 12);

    await trackVisibilityCheck({
      domain: cleanDomain,
      industry: cleanIndustry,
      score,
      scoreLabel: scoreCategoryLabel,
      mentionCount,
      totalTests: testResults.length,
      hasSchema: domainAnalysis.hasSchema,
      country: req.headers['cf-ipcountry'] || null
    });

    return res.status(200).json({
      success: true,
      domain: cleanDomain,
      industry: cleanIndustry || null,
      timestamp: new Date().toISOString(),
      score: { total: score, category: scoreCategory, label: scoreCategoryLabel, color: scoreCategoryColor, breakdown: scoreBreakdown },
      domainAnalysis: {
        title: domainAnalysis.title,
        description: domainAnalysis.description,
        schema: { found: domainAnalysis.hasSchema, types: [...new Set(domainAnalysis.schemaTypes)] },
        eeat: { aboutPage: domainAnalysis.hasAboutPage, contactPage: domainAnalysis.hasContactPage, authorInfo: domainAnalysis.hasAuthorInfo },
        crawlError: domainAnalysis.crawlError
      },
      aiTests: testResults,
      competitors: allCompetitors,
      recommendations,
      meta: { testsWithGrounding: testResults.length, totalTests: testResults.length, remainingChecks: checkRateLimit(clientIP).remaining }
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ success: false, message: 'Fehler: ' + error.message });
  }
}
