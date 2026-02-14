// api/evita-track.js - Tracking-Helper für das Evita-Dashboard
// Wird von ask-gemini.js und ai-visibility-check.js importiert
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ===================================================================
// KEYS nach Schema: evita:stats:{category}:{YYYY-MM-DD}
// ===================================================================
function todayKey() {
  return new Date().toISOString().split('T')[0]; // z.B. "2026-02-14"
}

function hourKey() {
  const now = new Date();
  return `${now.getDay()}-${now.getHours()}`; // z.B. "6-14" (Samstag, 14 Uhr)
}

// ===================================================================
// EVITA CHAT TRACKING
// ===================================================================
export async function trackChatMessage({ sessionId, userMessage, isReturningUser, usedFallback, modelUsed, bookingIntent, bookingCompleted }) {
  const day = todayKey();
  const hour = hourKey();

  try {
    const pipeline = redis.pipeline();

    // Daily Counters
    pipeline.hincrby(`evita:stats:daily:${day}`, 'total_messages', 1);
    
    if (usedFallback) {
      pipeline.hincrby(`evita:stats:daily:${day}`, 'fallback_count', 1);
    }

    if (bookingIntent) {
      pipeline.hincrby(`evita:stats:daily:${day}`, 'booking_intents', 1);
    }

    if (bookingCompleted) {
      pipeline.hincrby(`evita:stats:daily:${day}`, 'booking_completions', 1);
    }

    // Modell-Tracking
    if (modelUsed) {
      pipeline.hincrby(`evita:stats:models:${day}`, modelUsed, 1);
    }

    // Heatmap: Wochentag + Stunde
    pipeline.hincrby(`evita:stats:heatmap`, hour, 1);

    // Unique Sessions (HyperLogLog für Unique Visitors)
    if (sessionId) {
      pipeline.pfadd(`evita:stats:unique:${day}`, sessionId);
      
      if (isReturningUser) {
        pipeline.hincrby(`evita:stats:daily:${day}`, 'returning_users', 1);
      } else {
        pipeline.hincrby(`evita:stats:daily:${day}`, 'new_users', 1);
      }
    }

    // TTL: 90 Tage für tägliche Stats
    pipeline.expire(`evita:stats:daily:${day}`, 60 * 60 * 24 * 90);
    pipeline.expire(`evita:stats:models:${day}`, 60 * 60 * 24 * 90);
    pipeline.expire(`evita:stats:unique:${day}`, 60 * 60 * 24 * 90);

    await pipeline.exec();
  } catch (error) {
    console.error('📊 Tracking-Fehler (Chat):', error.message);
  }
}

// ===================================================================
// NEUE CHAT-SESSION TRACKEN
// ===================================================================
export async function trackChatSession(sessionId) {
  const day = todayKey();
  try {
    await redis.hincrby(`evita:stats:daily:${day}`, 'total_chats', 1);
  } catch (error) {
    console.error('📊 Tracking-Fehler (Session):', error.message);
  }
}

// ===================================================================
// TOP-FRAGEN TRACKEN (Sorted Set, Score = Häufigkeit)
// ===================================================================
export async function trackQuestion(question) {
  try {
    // Normalisiere die Frage (Lowercase, trimmen, max 150 Zeichen)
    const normalized = question.toLowerCase().trim().substring(0, 150);
    if (normalized.length < 5) return; // Zu kurz → ignorieren
    
    await redis.zincrby('evita:stats:top_questions', 1, normalized);
  } catch (error) {
    console.error('📊 Tracking-Fehler (Question):', error.message);
  }
}

// ===================================================================
// FALLBACK-NACHRICHTEN SPEICHERN (für Analyse wo Evita versagt)
// ===================================================================
export async function trackFallback(userMessage) {
  try {
    const entry = JSON.stringify({
      message: userMessage.substring(0, 200),
      timestamp: new Date().toISOString()
    });
    
    await redis.lpush('evita:stats:fallbacks', entry);
    await redis.ltrim('evita:stats:fallbacks', 0, 199); // Max 200 Einträge
  } catch (error) {
    console.error('📊 Tracking-Fehler (Fallback):', error.message);
  }
}

// ===================================================================
// THEMEN TRACKEN (tägliche Aggregation)
// ===================================================================
export async function trackTopics(topics) {
  if (!topics || topics.length === 0) return;
  const day = todayKey();
  
  try {
    const pipeline = redis.pipeline();
    topics.forEach(topic => {
      pipeline.hincrby(`evita:stats:topics:${day}`, topic, 1);
    });
    pipeline.expire(`evita:stats:topics:${day}`, 60 * 60 * 24 * 90);
    await pipeline.exec();
  } catch (error) {
    console.error('📊 Tracking-Fehler (Topics):', error.message);
  }
}

// ===================================================================
// VISIBILITY-CHECK TRACKEN
// ===================================================================
export async function trackVisibilityCheckStats({ domain, score, scoreLabel, mentionCount, totalTests, hasSchema, industry }) {
  const day = todayKey();
  
  try {
    const pipeline = redis.pipeline();
    
    // Zähler
    pipeline.hincrby(`evita:stats:daily:${day}`, 'visibility_checks', 1);
    
    // Check-Details als Liste speichern
    const entry = JSON.stringify({
      domain,
      score,
      scoreLabel,
      mentionCount,
      totalTests,
      hasSchema,
      industry: industry || null,
      timestamp: new Date().toISOString()
    });
    
    pipeline.lpush('evita:stats:visibility_checks', entry);
    pipeline.ltrim('evita:stats:visibility_checks', 0, 499); // Max 500 Einträge
    
    // Score-Verteilung (für Histogramm)
    const bucket = score >= 65 ? 'hoch' : score >= 35 ? 'mittel' : 'niedrig';
    pipeline.hincrby('evita:stats:visibility_scores', bucket, 1);
    
    await pipeline.exec();
  } catch (error) {
    console.error('📊 Tracking-Fehler (Visibility):', error.message);
  }
}
