// api/create-appointment.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Erlaubt nur POST-Anfragen
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Holt sich die Daten (Termin-Slot, Name, E-Mail) vom Frontend
    const { slot, name, email } = req.body;

    // Überprüft, ob alle nötigen Infos da sind
    if (!slot || !name || !email) {
      return res.status(400).json({ success: false, message: 'Fehlende Informationen. Slot, Name und E-Mail sind erforderlich.' });
    }

    // Authentifiziert sich bei Google mit den sicheren Vercel-Credentials
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      // Wichtig: 'calendar.events' gibt die Berechtigung zum Schreiben von Terminen
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Der Slot-Text vom Frontend (z.B. "Dienstag, 10. September 2025, 10:00")
    // muss für die Google API in ein maschinenlesbares Format umgewandelt werden.
    // Dieser Teil ist komplex und muss ggf. an das exakte Datumsformat angepasst werden.
    // Wir nehmen an, das Format ist "DD.MM.YYYY, HH:mm"
    const dateParts = slot.match(/(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/);
    if (!dateParts) {
        // Fallback für ein anderes gängiges Format
        const parsedDate = new Date(Date.parse(slot));
        if (isNaN(parsedDate)) {
             return res.status(400).json({ success: false, message: 'Das Datumsformat konnte nicht verarbeitet werden.' });
        }
        var startTime = parsedDate;
    } else {
        // Format: 'YYYY-MM-DDTHH:mm:ss'
        var startTime = new Date(`${dateParts[3]}-${dateParts[2]}-${dateParts[1]}T${dateParts[4]}:${dateParts[5]}:00`);
    }

    // Wir setzen die Termindauer auf 30 Minuten
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    // Das ist das Termin-Objekt, das an Google gesendet wird
    const event = {
      summary: `Beratungsgespräch: ${name}`,
      description: `Termin gebucht über Evita auf designare.at. Kontakt: ${email}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Vienna',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Vienna',
      },
      // Fügt den Kunden als Gast zum Termin hinzu (er bekommt eine Einladung)
      attendees: [{ email: email }],
      // Nutzt die Standard-Benachrichtigungen des Kalenders (z.B. 10 Min vorher)
      reminders: { 'useDefault': true },
    };

    // Sendet den Termin an die Google Calendar API
    await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendNotifications: true, // Wichtig, damit der Gast eine E-Mail bekommt
    });

    res.status(200).json({ success: true, message: 'Ihr Termin wurde erfolgreich gebucht! Sie erhalten in Kürze eine Bestätigung per E-Mail.' });

  } catch (error) {
    console.error("Fehler in create-appointment:", error);
    res.status(500).json({ success: false, message: 'Ups, da ist etwas schiefgelaufen. Die Terminbuchung konnte nicht abgeschlossen werden.' });
  }
}
