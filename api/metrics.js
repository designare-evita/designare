// api/metrics.js
export default async function handler(req, res) {
  // Nur POST-Requests erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { client_id, events } = req.body;
    
    // KONFIGURATION: IDs aus Umgebungsvariablen laden
    const GA_ID = process.env.GA_MEASUREMENT_ID;
    const API_SECRET = process.env.GA_API_SECRET;

    if (!GA_ID || !API_SECRET) {
      console.error('GA4 Configuration missing');
      return res.status(500).json({ error: 'Configuration Error' });
    }

    // WICHTIG: User-Agent und IP des echten Nutzers extrahieren
    // Der Browser sendet den User-Agent automatisch an Vercel.
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0 (Generic Client)';
    
    // IP-Adresse extrahieren (x-forwarded-for ist bei Vercel Standard)
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Anfrage an Google Measurement Protocol
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // HIER IST DER FIX: Wir geben uns als der Browser des Nutzers aus!
          'User-Agent': userAgent
        },
        body: JSON.stringify({
          client_id: client_id,
          // user_id: '...', // Optional: Falls User eingeloggt sind, hier ID übergeben
          events: events,
          // Versuch, IP-basierte Geo-Daten zu verbessern (funktioniert nicht immer garantiert im MP)
          user_properties: {
             // Benutzerdefinierte Eigenschaft, falls du Debuggen willst
             _client_ip: { value: userIp } 
          }
        }),
      }
    );

    // Google sendet oft keinen JSON-Body zurück, sondern nur 204 No Content bei Erfolg
    if (!response.ok) {
        const errorText = await response.text();
        console.error('GA4 Error Response:', errorText);
    }

    // Wir antworten dem Frontend immer mit Success, damit der Client nicht blockiert
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Analytics Proxy Error:', error);
    // Auch bei Server-Fehler 200 senden, um Frontend-Console sauber zu halten
    return res.status(200).json({ success: false }); 
  }
}
