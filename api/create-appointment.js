// api/create-appointment.js (KORRIGIERTE VERSION ohne attendees)
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Erlaubt nur POST-Anfragen
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Holt sich die Daten (Termin-Slot, Name, E-Mail) vom Frontend
    const { slot, name, email } = req.body;

    console.log('Received appointment data:', { slot, name, email });

    // Überprüft, ob alle nötigen Infos da sind
    if (!slot || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Fehlende Informationen. Slot, Name und E-Mail sind erforderlich.' 
      });
    }

    // Authentifiziert sich bei Google mit den sicheren Vercel-Credentials
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      // Wichtig: 'calendar.events' gibt die Berechtigung zum Schreiben von Terminen
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // ===================================================================
    // DEUTSCHE DATUM-PARSING FUNKTION
    // ===================================================================
    function parseGermanDate(slotString) {
      console.log('Parsing German date:', slotString);
      
      // Entferne "um" falls vorhanden und normalisiere
      let cleanedSlot = slotString.replace(/\s+um\s+/, ' ').trim();
      
      // Deutsche Wochentage mapping
      const germanDays = {
        'montag': 'monday',
        'dienstag': 'tuesday', 
        'mittwoch': 'wednesday',
        'donnerstag': 'thursday',
        'freitag': 'friday',
        'samstag': 'saturday',
        'sonntag': 'sunday'
      };
      
      // Deutsche Monate mapping
      const germanMonths = {
        'januar': 'january',
        'februar': 'february',
        'märz': 'march',
        'april': 'april',
        'mai': 'may',
        'juni': 'june',
        'juli': 'july',
        'august': 'august',
        'september': 'september',
        'oktober': 'october',
        'november': 'november',
        'dezember': 'december'
      };
      
      // Ersetze deutsche Begriffe durch englische
      let englishSlot = cleanedSlot.toLowerCase();
      
      Object.keys(germanDays).forEach(german => {
        englishSlot = englishSlot.replace(german, germanDays[german]);
      });
      
      Object.keys(germanMonths).forEach(german => {
        englishSlot = englishSlot.replace(german, germanMonths[german]);
      });
      
      console.log('Converted to English:', englishSlot);
      
      // Versuche verschiedene Parsing-Methoden
      
      // Methode 1: Versuche direktes Date.parse mit dem englischen String
      let parsedDate = new Date(Date.parse(englishSlot));
      if (!isNaN(parsedDate.getTime())) {
        console.log('Method 1 success:', parsedDate);
        return parsedDate;
      }
      
      // Methode 2: Regex für "Wochentag, DD. Monat YYYY HH:MM" Format
      const regex1 = /(\w+),?\s*(\d{1,2})\.\s*(\w+)\s*(\d{4}),?\s*(\d{1,2}):(\d{2})/i;
      const match1 = englishSlot.match(regex1);
      
      if (match1) {
        const [, dayName, day, month, year, hour, minute] = match1;
        const dateString = `${month} ${day}, ${year} ${hour}:${minute}:00`;
        console.log('Method 2 dateString:', dateString);
        
        parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          console.log('Method 2 success:', parsedDate);
          return parsedDate;
        }
      }
      
      // Methode 3: Regex für "DD. Monat YYYY HH:MM" Format (ohne Wochentag)
      const regex2 = /(\d{1,2})\.\s*(\w+)\s*(\d{4}),?\s*(\d{1,2}):(\d{2})/i;
      const match2 = englishSlot.match(regex2);
      
      if (match2) {
        const [, day, month, year, hour, minute] = match2;
        const dateString = `${month} ${day}, ${year} ${hour}:${minute}:00`;
        console.log('Method 3 dateString:', dateString);
        
        parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          console.log('Method 3 success:', parsedDate);
          return parsedDate;
        }
      }
      
      // Methode 4: ISO-ähnliches Format falls vorhanden
      const regex3 = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/;
      const match3 = cleanedSlot.match(regex3);
      
      if (match3) {
        const [, year, month, day, hour, minute] = match3;
        parsedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
        if (!isNaN(parsedDate.getTime())) {
          console.log('Method 4 success:', parsedDate);
          return parsedDate;
        }
      }
      
      // Fallback: Versuche den ursprünglichen String
      console.log('Trying original string as fallback:', slotString);
      parsedDate = new Date(Date.parse(slotString));
      if (!isNaN(parsedDate.getTime())) {
        console.log('Fallback success:', parsedDate);
        return parsedDate;
      }
      
      throw new Error(`Konnte Datum nicht parsen: ${slotString}`);
    }

    // Parse das Datum mit der neuen Funktion
    let startTime;
    try {
      startTime = parseGermanDate(slot);
      console.log('Successfully parsed date:', startTime);
    } catch (parseError) {
      console.error('Date parsing error:', parseError);
      return res.status(400).json({ 
        success: false, 
        message: `Das Datumsformat konnte nicht verarbeitet werden: ${slot}` 
      });
    }

    // Wir setzen die Termindauer auf 30 Minuten
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    console.log('Event times:', {
      start: startTime.toISOString(),
      end: endTime.toISOString()
    });

    // Das ist das Termin-Objekt, das an Google gesendet wird
    // WICHTIG: Keine attendees mehr, da das Domain-Wide Delegation erfordern würde
    const event = {
      summary: `Beratungsgespräch: ${name}`,
      description: `Termin gebucht über Evita auf designare.at.\n\nKontaktdaten:\nName: ${name}\nE-Mail: ${email}\n\nUrsprünglicher Slot: ${slot}\n\nHinweis: Bitte kontaktiere den Kunden per E-Mail für weitere Details.`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Vienna',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Vienna',
      },
      // ENTFERNT: attendees - verursachte den "Domain-Wide Delegation" Fehler
      // Nutzt die Standard-Benachrichtigungen des Kalenders
      reminders: { 'useDefault': true },
    };

    console.log('Creating calendar event:', event);

    // Sendet den Termin an die Google Calendar API
    const result = await calendar.events.insert({
      calendarId: 'designare.design@gmail.com',
      resource: event,
      sendNotifications: false, // Auf false gesetzt, da keine attendees
    });

    console.log('Calendar event created successfully:', result.data.id);

    res.status(200).json({ 
      success: true, 
      message: `Dein Termin wurde erfolgreich gebucht! Der Termin für ${name} (${email}) am ${slot} wurde in den Kalender eingetragen. Michael wird sich in Kürze per E-Mail bei Dir melden.`,
      eventId: result.data.id,
      customerInfo: { name, email, slot }
    });

  } catch (error) {
    console.error("Fehler in create-appointment:", error);
    
    // Spezifische Fehlerbehandlung für bekannte Google API Fehler
    let errorMessage = 'Ups, da ist etwas schiefgelaufen. Die Terminbuchung konnte nicht abgeschlossen werden.';
    
    if (error.message && error.message.includes('Domain-Wide Delegation')) {
      errorMessage = 'Kalender-Konfigurationsproblem. Bitte kontaktieren Sie Michael direkt.';
    } else if (error.message && error.message.includes('parse')) {
      errorMessage = 'Das Datumsformat konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: error.message
    });
  }
}
