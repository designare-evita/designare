// api/book-appointment-phone.js - KORRIGIERTER DATEINAME (ohne Bindestrich am Ende!)
import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { slot, name, phone, topic } = req.body;

        console.log('Received phone booking data:', { slot, name, phone, topic });

        if (!slot || !name || !phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Fehlende Informationen. Slot, Name und Telefonnummer sind erforderlich.' 
            });
        }

        // Telefonnummer-Validierung
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return res.status(400).json({
                success: false,
                message: 'Bitte gib eine gültige Telefonnummer ein.'
            });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar.events'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // Slot-Parsing (ISO-Format erwarten)
        let startTime;
        try {
            startTime = new Date(slot);
            if (isNaN(startTime.getTime())) {
                throw new Error('Ungültiges Datumsformat');
            }
            console.log('Parsed appointment time:', startTime.toISOString());
        } catch (parseError) {
            console.error('Date parsing error:', parseError);
            return res.status(400).json({ 
                success: false, 
                message: `Das Datumsformat konnte nicht verarbeitet werden: ${slot}` 
            });
        }

        const endTime = new Date(startTime.getTime() + 60 * 60000); // 60 Minuten

        console.log('Event times:', {
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            localStart: startTime.toLocaleString('de-DE'),
            localEnd: endTime.toLocaleString('de-DE')
        });

        // Doppelbuchungs-Prüfung
        console.log('Checking for conflicts...');
        
        const conflictCheck = await calendar.events.list({
            calendarId: 'designare.design@gmail.com',
            timeMin: startTime.toISOString(),
            timeMax: endTime.toISOString(),
            singleEvents: true,
        });

        if (conflictCheck.data.items && conflictCheck.data.items.length > 0) {
            console.warn('Conflict detected:', conflictCheck.data.items[0].summary);
            return res.status(409).json({
                success: false,
                message: 'Dieser Termin ist leider bereits vergeben. Bitte wähle einen anderen Zeitpunkt.',
                conflict: conflictCheck.data.items[0].summary
            });
        }

        // Termin erstellen
        const event = {
            summary: `Rückruf: ${name}`,
            description: `Rückruf-Termin gebucht über Evita (Chat-Assistent) auf designare.at

KONTAKTDATEN:
Name: ${name}
Telefon: ${phone}
${topic ? `Anliegen: ${topic}` : ''}

BUCHUNGSDETAILS:
Gebucht am: ${new Date().toLocaleString('de-DE')}
Ursprünglicher Slot: ${startTime.toLocaleString('de-DE')}

NOTIZEN:
- Kunde wurde über Chat-System gebucht
- Bitte 5-10 Minuten vor dem Termin anrufen
- Bei Rückfragen: ${phone}

---
Automatisch erstellt durch Evita AI-Assistent`,
            
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Europe/Vienna',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Europe/Vienna',
            },
            
            // Erinnerungen
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 },  // 1 Stunde vorher
                    { method: 'popup', minutes: 15 },  // 15 Minuten vorher
                ]
            },
            
            // Zusätzliche Metadaten
            extendedProperties: {
                private: {
                    'booked_via': 'evita_chat',
                    'customer_phone': phone,
                    'booking_timestamp': new Date().toISOString(),
                    'booking_method': 'ai_chat_assistant'
                }
            },
            
            // Farbe für Chat-gebuchte Termine
            colorId: '2' // Grün für Chat-Buchungen
        };

        console.log('Creating calendar event for phone booking...');

        const result = await calendar.events.insert({
            calendarId: 'designare.design@gmail.com',
            resource: event,
            sendNotifications: false,
        });

        console.log('✅ Phone booking event created:', result.data.id);

        // Bestätigungs-Nachricht erstellen
        const confirmationMessage = `🎉 Perfekt! Dein Rückruf-Termin ist gebucht!

📅 **Termin-Details:**
Datum: ${startTime.toLocaleDateString('de-DE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
})}
Uhrzeit: ${startTime.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
})} - ${endTime.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
})}

👤 **Kontakt:** ${name}
📞 **Telefon:** ${phone}
${topic ? `💬 **Anliegen:** ${topic}` : ''}

**Was passiert als nächstes?**
✓ Michael hat den Termin in seinem Kalender
✓ Du erhältst ca. 5-10 Minuten vor dem Termin einen Anruf
✓ Bei Fragen oder Änderungen: michael@designare.at

**Termin-Erinnerung:** Bitte halte dich kurz vor dem Termin bereit!

Freue mich auf unser Gespräch! 😊`;

        res.status(200).json({ 
            success: true, 
            message: confirmationMessage,
            eventId: result.data.id,
            eventLink: result.data.htmlLink,
            appointmentDetails: {
                name: name,
                phone: phone,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                localTime: `${startTime.toLocaleString('de-DE')} - ${endTime.toLocaleString('de-DE')}`,
                duration: '60 Minuten'
            }
        });

    } catch (error) {
        console.error("Fehler bei Telefon-Terminbuchung:", error);
        
        let errorMessage = 'Ups, da ist etwas schiefgelaufen. Die Terminbuchung konnte nicht abgeschlossen werden.';
        
        if (error.code === 409) {
            errorMessage = 'Dieser Zeitslot ist bereits belegt. Bitte wähle einen anderen Termin.';
        } else if (error.message && error.message.includes('parse')) {
            errorMessage = 'Das Datumsformat konnte nicht verarbeitet werden. Bitte versuche es erneut.';
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            error: error.message
        });
    }
}
