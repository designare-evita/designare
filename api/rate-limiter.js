// api/rate-limiter.js – Gemeinsames Rate Limiting via Upstash Redis
// Verwendet von: ai-visibility-check.js, generate.js
// Gleiche Redis-Instanz wie feedback.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

/**
 * Prüft ob die IP noch Anfragen machen darf
 * @param {string} ip - Client-IP
 * @param {string} scope - 'visibility' oder 'silas'
 * @param {number} dailyLimit - Max. Anfragen pro Tag
 * @returns {{ allowed: boolean, remaining: number, total: number }}
 */
export async function checkRateLimit(ip, scope, dailyLimit) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `rl:${scope}:${ip}:${today}`;

    const count = parseInt(await redis.get(key)) || 0;

    return {
      allowed: count < dailyLimit,
      remaining: Math.max(0, dailyLimit - count),
      total: count
    };
  } catch (error) {
    console.error(`⚠️ Redis checkRateLimit (${scope}):`, error.message);
    // Fail-open: bei Redis-Fehler durchlassen
    return { allowed: true, remaining: dailyLimit, total: 0 };
  }
}

/**
 * Zähler nach erfolgreicher Verarbeitung hochzählen
 */
export async function incrementRateLimit(ip, scope) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `rl:${scope}:${ip}:${today}`;

    const newCount = await redis.incr(key);

    // TTL nur beim ersten Aufruf setzen (25h → läuft sicher nach Mitternacht ab)
    if (newCount === 1) {
      await redis.expire(key, 90000);
    }

    return newCount;
  } catch (error) {
    console.error(`⚠️ Redis incrementRateLimit (${scope}):`, error.message);
  }
}

/**
 * IP aus Request-Headers extrahieren
 */
export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] ||
         'unknown';
}
