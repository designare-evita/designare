// api/feedback.js
import Redis from 'ioredis';

// Verbindung zur klassischen Redis-Datenbank
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error("KRITISCHER FEHLER: REDIS_URL fehlt!");
}

// Client erstellen (Singleton Pattern)
let redis;

// Konfiguration für stabile Verbindungen auf Vercel
const redisOptions = {
    family: 4,           // WICHTIG: Erzwingt IPv4 (löst das ETIMEDOUT Problem oft)
    connectTimeout: 10000, // 10 Sekunden warten statt sofort aufgeben
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        // Wenn Verbindung weg ist: Langsam wieder versuchen (max 2 Sekunden warten)
        return Math.min(times * 50, 2000);
    }
};

try {
    if (process.env.NODE_ENV === 'production') {
        redis = new Redis(redisUrl, redisOptions);
    } else {
        if (!global.redis) {
            global.redis = new Redis(redisUrl, redisOptions);
        }
        redis = global.redis;
    }

    // WICHTIG: Fehler-Listener hinzufügen
    // Das verhindert den Absturz "Unhandled error event"
    redis.on('error', (err) => {
        console.error('Redis Verbindungsproblem (Hintergrund):', err.message);
    });

} catch (e) {
    console.error("Fehler beim Initialisieren von Redis:", e);
}

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!redis) {
        return res.status(500).json({ error: 'Datenbank-Fehler', details: 'Client konnte nicht initiiert werden' });
    }

    const slug = req.query.slug || req.body?.slug;
    
    // Kleiner Schutz: Ohne Slug nichts tun
    if (!slug) return res.status(400).json({ error: 'Slug fehlt' });

    const kvKey = `feedback:${slug}`;

    try {
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

        if (req.method === 'POST') {
            const { vote } = req.body;
            if (!['positive', 'neutral', 'negative'].includes(vote)) {
                return res.status(400).json({ error: 'Ungültiger Vote' });
            }

            // Daten holen
            const dataString = await redis.get(kvKey);
            let data = dataString ? JSON.parse(dataString) : { positive: 0, neutral: 0, negative: 0 };

            // Zählen
            data[vote] = (data[vote] || 0) + 1;
            
            // Speichern
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
