// api/metrics.js
export default async function handler(req, res) {
  // Nur POST-Requests erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { client_id, events } = req.body;
    
    // IDs aus Umgebungsvariablen laden
    const GA_ID = process.env.GA_MEASUREMENT_ID;
    const API_SECRET = process.env.GA_API_SECRET;

    if (!GA_ID || !API_SECRET) {
      console.error('GA4 Configuration missing');
      return res.status(500).json({ error: 'Configuration Error' });
    }

    // 1. GEO-DATEN & USER-INFO VON VERCEL HOLEN
    // Vercel liefert diese Header automatisch im Live-Betrieb
    const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : undefined;
    const country = req.headers['x-vercel-ip-country'] || undefined;
    
    // User-Agent des echten Nutzers durchschleifen
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0 (Generic Client)';
    
    // IP-Adresse für Debugging (wird von Google oft maskiert)
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 2. EVENTS ANREICHERN
    // Wir fügen jedem Event die Geo-Daten hinzu, da GA4 diese im Server-Modus oft ignoriert
    const enrichedEvents = events.map(event => {
      // Bestehende Params kopieren
      const params = event.params || {};
      
      // Geo-Daten als Custom Parameters hinzufügen
      if (city) params.geo_city = city;
      if (country) params.geo_country = country;
      
      // Debugging: IP mitsenden (optional)
      params._client_ip = userIp;

      return {
        ...event,
        params: params
      };
    });

    // 3. ANFRAGE AN GOOGLE SENDEN
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: client_id,
          // user_id: '...', // Optional: Hier User-ID setzen, falls eingeloggt
          events: enrichedEvents,
          // user_data hilft GA4 manchmal bei der Zuordnung
          user_data: {
            ip_address: userIp,
            user_agent: userAgent
          }
        }),
      }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('GA4 Error Response:', errorText);
    }

    // Frontend immer Success melden
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Analytics Proxy Error:', error);
    return res.status(200).json({ success: false }); 
  }
}
