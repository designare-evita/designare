// /api/test-calendar.js
const { google } = require('googleapis');

export default async function handler(req, res) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // NEUE STRATEGIE: Wir fragen nicht mehr die Liste aller Kalender ab,
        // sondern versuchen direkt, Termine aus dem primären Kalender zu lesen.
        console.log("Versuche, Termine vom primären Kalender abzurufen...");

        const response = await calendar.events.list({
            calendarId: 'primary', // 'primary' ist ein spezielles Kürzel für den Hauptkalender
            timeMin: (new Date()).toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;
        if (events && events.length > 0) {
            const eventSummaries = events.map(event => event.summary);
            res.status(200).json({
                success: true,
                message: "Verbindung und Lesezugriff auf den Hauptkalender erfolgreich!",
                next_events: eventSummaries
            });
        } else {
            // Dies ist jetzt der erwartete Erfolg, wenn Sie keine Termine in der Zukunft haben!
            res.status(200).json({
                success: true,
                message: "Verbindung erfolgreich, aber keine bevorstehenden Termine im Hauptkalender gefunden."
            });
        }

    } catch (error) {
        console.error("Fehler beim direkten Zugriff auf den primären Kalender:", error);
        res.status(500).json({
            success: false,
            message: "Der direkte Zugriff auf den Kalender ist fehlgeschlagen.",
            // Wir geben jetzt mehr Details zum Fehler aus
            error_details: error.response ? error.response.data : error.message
        });
    }
}
