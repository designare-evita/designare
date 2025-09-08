// api/create-appointment.js (VERBESSERTE VERSION mit besserem Doppelbuchungsschutz)
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { slot, name, email } = req.body;

    console.log('Received appointment data:', { slot, name, email });

    if (!slot || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Fehlende Informationen. Slot, Name und E-Mail sind erforderlich.' 
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // ===================================================================
    // VERBESSERTE DEUTSCHE DATUM-PARSING FUNKTION
    // ===================================================================
    function parseGermanDate(slotString) {
      console.log('Parsing German date:', slotString);
      
      let cleanedSlot = slotString.replace(/\s+um\s+/, ' ').trim();
      
      const germanDays = {
        'montag': 'monday',
        'dienstag': 'tuesday', 
        'mittwoch': 'wednesday',
        'donnerstag': 'thursday',
        'freitag': 'friday',
        'samstag': 'saturday',
        'sonntag': 'sunday'
      };
      
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
      
      let englishSlot = cleanedSlot.toLowerCase();
      
      Object.keys(germanDays).forEach(german => {
        englishSlot = englishSlot.replace(german, germanDays[german]);
      });
      
      Object.keys(germanMonths).forEach(german => {
        englishSlot = englishSlot.replace(german, germanMonths[german]);
      });
      
      console.log('Converted to English:', englishSlot);
      
      // Regex für "Wochentag, DD. Monat YYYY HH:MM" Format
      const regex1 = /(\w+),?\s*(\d{1,2})\.\s*(\w+)\s*(\d{4}),?\s*(\d{1,2}):(\d{2})/i;
      const match1 = englishSlot.match(regex1);
      
      if (match1) {
        const [, dayName, day, month, year, hour, minute] = match1;
        const dateString = `${month} ${day}, ${year} ${hour}:${minute}:00`;
        console.log('Parsed dateString:', dateString);
        
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          console.log('Successfully parsed:', parsedDate.toISOString());
          return parsedDate;
        }
      }
      
      throw new Error(`Konnte Datum nicht parsen: ${slotString}`);
    }

    // Parse das Datum
    let startTime;
    try {
      startTime = parseGermanDate(slot);
      console.log('Successfully parsed appointment time:', startTime.toISOString());
    } catch (parseError) {
      console.error('Date parsing error:', parseError);
      return res.status(400).json({ 
        success: false, 
        message: `Das Datumsformat konnte nicht verarbeitet werden: ${slot}` 
      });
    }

    // Termindauer auf 60 Minuten setzen
    const endTime = new Date(startTime.getTime() + 60 * 60000);

    console.log('Event times:', {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      localStart: startTime.toLocaleString('de-DE'),
      localEnd: endTime.toLocaleString('de-DE')
    });

    // ===================================================================
    // ERWEITERTE DOPPELBUCHUNGS-PRÜFUNG
    // ===================================================================
    console.log('Checking for conflicts in extended time range...');
    
    // Prüfe einen größeren Zeitbereich um sicherzustellen, dass keine Überschneidungen auftreten
    const bufferMinutes = 15; // 15 Minuten Puffer vor und nach dem Termin
    const extendedStart = new Date(startTime.getTime() - bufferMinutes * 60000);
    const extendedEnd = new Date(endTime.getTime() + bufferMinutes * 60000);
    
    const conflictCheck = await calendar.events.list({
      calendarId: 'designare.design@gmail.com',
      timeMin: extendedStart.toISOString(),
      timeMax: extendedEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log(`Checking conflicts between ${extendedStart.toLocaleString('de-DE')} and ${extendedEnd.toLocaleString('de-DE')}`);
    console.log(`Found ${conflictCheck.data.items.length} existing events in extended range`);

    // Prüfe jedes gefundene Event auf tatsächliche Überschneidung
    const conflicts = conflictCheck.data.items.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      
      console.log(`Checking event: ${event.summary} | ${eventStart.toLocaleString('de-DE')} - ${eventEnd.toLocaleString('de-DE')}`);
      
      // Überschneidung: (Start1 < Ende2) UND (Ende1 > Start2)
      const hasOverlap = startTime < eventEnd && endTime > eventStart;
      
      if (hasOverlap) {
        console.log(`❌ CONFLICT DETECTED with event: ${event.summary}`);
      }
      
      return hasOverlap;
    });

    if (conflicts.length > 0) {
      console.warn('Appointment conflict detected:', conflicts.map(c => c.summary));
      return res.status(409).json({
        success: false,
        message: 'Dieser Termin ist leider bereits vergeben oder überlappt mit einem bestehenden Termin. Bitte wähle einen anderen Slot.',
        conflicts: conflicts.map(c => ({
          summary: c.summary,
          start: c.start.dateTime,
          end: c.end.dateTime
        }))
      });
    }
    
    console.log('✅ No conflicts found. Proceeding to create appointment.');

    // ===================================================================
    // TERMIN ERSTELLEN
    // ===================================================================
    const event = {
      summary: `Beratungsgespräch: ${name}`,
      description: `Termin gebucht über Evita auf designare.at.\n\nKontaktdaten:\nName: ${name}\nE-Mail: ${email}\n\nUrsprünglicher Slot: ${slot}\n\nGebucht am: ${new Date().toLocaleString('de-DE')}\n\nHinweis: Bitte kontaktiere den Kunden per E-Mail für weitere Details.`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Vienna',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Vienna',
      },
      reminders: { 'useDefault': true },
      // Zusätzliche Metadaten für bessere Nachverfolgung
      extendedProperties: {
        private: {
          'booked_via': 'evita_ai',
          'customer_email': email,
          'booking_timestamp': new Date().toISOString()
        }
      }
    };

    console.log('Creating calendar event:', JSON.stringify(event, null, 2));

    const result = await calendar.events.insert({
      calendarId: 'designare.design@gmail.com',
      resource: event,
      sendNotifications: false,
    });

    console.log('✅ Calendar event created successfully:', result.data.id);

    // FINALE VERIFIKATION: Prüfe ob der Termin wirklich erstellt wurde
    const verificationCheck = await calendar.events.get({
      calendarId: 'designare.design@gmail.com',
      eventId: result.data.id
    });

    if (verificationCheck.data) {
      console.log('✅ Appointment verified in calendar');
    }

    res.status(200).json({ 
      success: true, 
      message: `Dein Termin wurde erfolgreich gebucht! Der Termin für ${name} (${email}) am ${slot} wurde in den Kalender eingetragen. Michael wird sich in Kürze per E-Mail bei Dir melden.`,
      eventId: result.data.id,
      eventLink: result.data.htmlLink,
      customerInfo: { name, email, slot },
      appointmentDetails: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        localTime: `${startTime.toLocaleString('de-DE')} - ${endTime.toLocaleString('de-DE')}`
      }
    });

  } catch (error) {
    console.error("Fehler in create-appointment:", error);
    
    let errorMessage = 'Ups, da ist etwas schiefgelaufen. Die Terminbuchung konnte nicht abgeschlossen werden.';
    
    if (error.message && error.message.includes('Domain-Wide Delegation')) {
      errorMessage = 'Kalender-Konfigurationsproblem. Bitte kontaktiere Michael direkt.';
    } else if (error.message && error.message.includes('parse')) {
      errorMessage = 'Das Datumsformat konnte nicht verarbeitet werden. Bitte versuche es erneut.';
    } else if (error.code === 409) {
      errorMessage = 'Dieser Zeitslot ist bereits belegt. Bitte wähle einen anderen Termin.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
