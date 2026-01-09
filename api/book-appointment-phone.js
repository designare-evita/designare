// api/book-appointment-phone.js - MIT QR-CODE ICS FEATURE
import { google } from 'googleapis';
import QRCode from 'qrcode';

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
                    { method: 'popup', minutes: 60 },
                    { method: 'popup', minutes: 15 },
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
            
            colorId: '2'
        };

        console.log('Creating calendar event for phone booking...');

        const result = await calendar.events.insert({
            calendarId: 'designare.design@gmail.com',
            resource: event,
            sendNotifications: false,
        });

        console.log('✅ Phone booking event created:', result.data.id);

        // ===================================================================
        // QR-CODE MIT ICS GENERIEREN
        // ===================================================================
        
        // ICS-Datetime Format: YYYYMMDDTHHMMSS
        const formatICSDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };
        
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//designare.at//Evita Booking//DE
BEGIN:VEVENT
UID:${result.data.id}@designare.at
DTSTART:${formatICSDate(startTime)}
DTEND:${formatICSDate(endTime)}
SUMMARY:Rückruf von Michael Kanda
DESCRIPTION:Telefonat mit designare.at${topic ? ' - ' + topic : ''}
LOCATION:Telefonat
END:VEVENT
END:VCALENDAR`;

        // QR-Code als Data-URL generieren
        let qrCodeDataUrl = null;
        try {
            qrCodeDataUrl = await QRCode.toDataURL(icsContent, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#c4a35a',  // Gold (Accent Color)
                    light: '#0a0a0a'  // Dunkel (Background)
                }
            });
            console.log('✅ QR-Code generiert');
        } catch (qrError) {
            console.error('QR-Code Fehler:', qrError);
            // Kein Abbruch - Buchung war erfolgreich
        }

        // ===================================================================
        // RESPONSE
        // ===================================================================
        
        res.status(200).json({ 
            success: true, 
            eventId: result.data.id,
            eventLink: result.data.htmlLink,
            qrCode: qrCodeDataUrl,
            icsContent: icsContent,
            appointmentDetails: {
                name: name,
                phone: phone,
                topic: topic || null,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                formattedDate: startTime.toLocaleDateString('de-AT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                formattedTime: startTime.toLocaleTimeString('de-AT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
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
