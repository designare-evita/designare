// /api/test-calendar.js
const { google } = require('googleapis');

export default async function handler(req, res) {
    try {
        // Schritt 1: Authentifizierung (genau wie später in der echten Funktion)
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // Schritt 2: API-Anfrage -> "Liste mir alle meine Kalender auf"
        const response = await calendar.calendarList.list();
        
        const calendars = response.data.items;

        if (calendars && calendars.length > 0) {
            // Schritt 3: Erfolgreiche Antwort senden
            const calendarNames = calendars.map(cal => cal.summary);
            res.status(200).json({ 
                success: true, 
                message: "Verbindung erfolgreich! Gefundene Kalender:",
                calendars: calendarNames 
            });
        } else {
            res.status(404).json({ success: false, message: "Verbindung erfolgreich, aber keine Kalender gefunden." });
        }

    } catch (error) {
        // Schritt 3 (Alternativ): Fehlermeldung senden
        console.error("Fehler bei der Verbindung zur Google Calendar API:", error);
        res.status(500).json({ 
            success: false, 
            message: "Verbindung fehlgeschlagen.",
            error: error.message 
        });
    }
}
