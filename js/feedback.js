// api/feedback.js
// Vercel Serverless Function für Feedback-System mit KV Storage

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight Request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Seiten-Slug aus Query oder Body holen
    const slug = req.query.slug || req.body?.slug;
    
    if (!slug) {
        return res.status(400).json({ error: 'Slug parameter fehlt' });
    }

    // KV Key für diese Seite
    const kvKey = `feedback:${slug}`;

    try {
        // === GET: Aktuelle Statistiken abrufen ===
        if (req.method === 'GET') {
            const data = await kv.get(kvKey);
            
            // Standardwerte wenn noch keine Daten existieren
            const stats = data || {
                positive: 0,
                neutral: 0,
                negative: 0,
                total: 0
            };

            // Prozentsätze berechnen
            const total = stats.positive + stats.neutral + stats.negative;
            const percentages = {
                positive: total > 0 ? Math.round((stats.positive / total) * 100) : 0,
                neutral: total > 0 ? Math.round((stats.neutral / total) * 100) : 0,
                negative: total > 0 ? Math.round((stats.negative / total) * 100) : 0
            };

            return res.status(200).json({
                success: true,
                stats: stats,
                percentages: percentages,
                total: total
            });
        }

        // === POST: Neue Bewertung speichern ===
        if (req.method === 'POST') {
            const { vote } = req.body;

            // Validierung
            if (!vote || !['positive', 'neutral', 'negative'].includes(vote)) {
                return res.status(400).json({ error: 'Ungültiger Vote-Typ' });
            }

            // Aktuelle Daten holen
            let data = await kv.get(kvKey);
            
            if (!data) {
                data = {
                    positive: 0,
                    neutral: 0,
                    negative: 0
                };
            }

            // Vote hinzufügen
            data[vote] = (data[vote] || 0) + 1;

            // Speichern
            await kv.set(kvKey, data);

            // Neue Statistiken berechnen
            const total = data.positive + data.neutral + data.negative;
            const percentages = {
                positive: total > 0 ? Math.round((data.positive / total) * 100) : 0,
                neutral: total > 0 ? Math.round((data.neutral / total) * 100) : 0,
                negative: total > 0 ? Math.round((data.negative / total) * 100) : 0
            };

            return res.status(200).json({
                success: true,
                message: 'Feedback gespeichert',
                stats: data,
                percentages: percentages,
                total: total
            });
        }

        // Andere Methoden nicht erlaubt
        return res.status(405).json({ error: 'Methode nicht erlaubt' });

    } catch (error) {
        console.error('Feedback API Error:', error);
        return res.status(500).json({ 
            error: 'Interner Server-Fehler',
            details: error.message 
        });
    }
}
