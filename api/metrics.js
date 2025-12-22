// api/metrics.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { client_id, events } = req.body;
    
    const GA_ID = process.env.GA_MEASUREMENT_ID;
    const API_SECRET = process.env.GA_API_SECRET;

    // Weiterleitung an Google Measurement Protocol
    // Die IP des Nutzers wird hier nicht mitgesendet!
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: client_id,
          events: events,
        }),
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
