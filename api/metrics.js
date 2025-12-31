// api/metrics.js – Version 2.0
// Unterstützt jetzt auch sendBeacon (text/plain Content-Type)

export default async function handler(req, res) {
  // Nur POST erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // sendBeacon sendet als text/plain, normales fetch als application/json
    let body = req.body;
    
    // Falls sendBeacon (kommt als String)
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse beacon body:', e);
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const { client_id, events } = body;
    
    if (!client_id || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Missing client_id or events' });
    }

    // Konfiguration
    const GA_ID = process.env.GA_MEASUREMENT_ID;
    const API_SECRET = process.env.GA_API_SECRET;

    if (!GA_ID || !API_SECRET) {
      console.error('GA4 Configuration missing');
      return res.status(500).json({ error: 'Configuration Error' });
    }

    // ─────────────────────────────────────────────
    // GEO & USER DATA (von Vercel)
    // ─────────────────────────────────────────────
    
    const city = req.headers['x-vercel-ip-city'] 
      ? decodeURIComponent(req.headers['x-vercel-ip-city']) 
      : undefined;
    const country = req.headers['x-vercel-ip-country'] || undefined;
    const region = req.headers['x-vercel-ip-country-region'] || undefined;
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';
    const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // ─────────────────────────────────────────────
    // EVENTS ANREICHERN
    // ─────────────────────────────────────────────

    const enrichedEvents = events.map(event => {
      const params = { ...(event.params || {}) };
      
      // Geo-Daten
      if (city) params.geo_city = city;
      if (country) params.geo_country = country;
      if (region) params.geo_region = region;
      
      // Debug
      params._client_ip = userIp;

      // Engagement Time validieren (GA4 braucht das!)
      if (!params.engagement_time_msec || params.engagement_time_msec < 1) {
        params.engagement_time_msec = 1;
      }

      return {
        name: event.name,
        params: params
      };
    });

    // ─────────────────────────────────────────────
    // AN GOOGLE SENDEN
    // ─────────────────────────────────────────────

    const gaPayload = {
      client_id: client_id,
      events: enrichedEvents,
      // Diese Parameter helfen GA4 bei der Zuordnung
      user_properties: {
        client_type: { value: 'web' }
      }
    };

    // Debug-Modus: Erst validieren
    const debugMode = process.env.GA_DEBUG === 'true';
    const endpoint = debugMode
      ? `https://www.google-analytics.com/debug/mp/collect`
      : `https://www.google-analytics.com/mp/collect`;

    const response = await fetch(
      `${endpoint}?measurement_id=${GA_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gaPayload)
      }
    );

    // Debug-Modus: Antwort loggen
    if (debugMode) {
      const debugResponse = await response.json();
      console.log('GA4 Debug Response:', JSON.stringify(debugResponse, null, 2));
      
      if (debugResponse.validationMessages?.length > 0) {
        console.warn('GA4 Validation Issues:', debugResponse.validationMessages);
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Analytics Proxy Error:', error);
    // Immer 200 zurückgeben, um Client nicht zu blockieren
    return res.status(200).json({ success: false, error: error.message });
  }
}
