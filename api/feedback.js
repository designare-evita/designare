// api/feedback.js
import Redis from 'ioredis';

// Verbindung zur klassischen Redis-Datenbank (REDIS_URL)
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error("KRITISCHER FEHLER: REDIS_URL fehlt!");
}

// Client erstellen (Singleton Pattern)
let redis;
try {
    if (process.env.NODE_ENV === 'production') {
        redis = new Redis(redisUrl);
    } else {
        if (!global.redis) {
            global.redis = new Redis(redisUrl);
        }
        redis = global.redis;
    }
} catch (e) {
    console.error("Redis Fehler:", e);
}

export default async function handler(req, res) {
    // CORS Settings
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!redis) {
        return res.status(500).json({ error: 'Datenbank-Fehler', details: 'Keine Verbindung zu Redis' });
    }

    const slug = req.query.slug || req.body?.slug;
    if (!slug) return res.status(400).json({ error: 'Slug fehlt' });

    const kvKey = `feedback:${slug}`;

    try {
        // === GET ===
        if (req.method === 'GET') {
            const dataString = await redis.get(kvKey);
            const stats = dataString ? JSON.parse(dataString) : { positive: 0, neutral: 0, negative: 0 };
            const total = (stats.positive || 0) + (stats.neutral || 0) + (stats.negative || 0);
            
            return res.status(200).json({
                success: true,
                stats,
                total,
                percentages: {
                    positive: total > 0 ? Math.round((stats.positive / total) * 100) : 0,
                    neutral: total > 0 ? Math.round((stats.neutral / total) * 100) : 0,
                    negative: total > 0 ? Math.round((stats.negative / total) * 100) : 0
                }
            });
        }

        // === POST ===
        if (req.method === 'POST') {
            const { vote } = req.body;
            if (!['positive', 'neutral', 'negative'].includes(vote)) {
                return res.status(400).json({ error: 'Ungültiger Vote' });
            }

            const dataString = await redis.get(kvKey);
            let data = dataString ? JSON.parse(dataString) : { positive: 0, neutral: 0, negative: 0 };

            data[vote] = (data[vote] || 0) + 1;
            await redis.set(kvKey, JSON.stringify(data));

            const total = data.positive + data.neutral + data.negative;
            
            return res.status(200).json({
                success: true,
                stats: data,
                total,
                percentages: {
                    positive: total > 0 ? Math.round((data.positive / total) * 100) : 0,
                    neutral: total > 0 ? Math.round((data.neutral / total) * 100) : 0,
                    negative: total > 0 ? Math.round((data.negative / total) * 100) : 0
                }
            });
        }

        return res.status(405).json({ error: 'Methode nicht erlaubt' });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
