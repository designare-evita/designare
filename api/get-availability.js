// /api/get-availability.js (STARK VERBESSERTE VERSION FÜR TAGESAUSWAHL)
import { google } from 'googleapis';

export default async function handler(req, res) {
    try {
        // Der gewünschte Wochentag aus der URL (z.B. /api/get-availability?day=mittwoch)
        const { day: targetDay } = req.query;

        if (!targetDay) {
            return res.status(400).json({ success: false, message: "Ein Wochentag ist erforderlich (z.B. ?day=montag)." });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // ===================================================================
        // KONFIGURATION
        // ===================================================================
        const CONFIG = {
            workingHours: { start: 9, end: 17 },
            appointmentDuration: 60, // Dauer in Minuten
            workingDays: ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'],
            dayMapping: { 'sonntag': 0, 'montag': 1, 'dienstag': 2, 'mittwoch': 3, 'donnerstag': 4, 'freitag': 5, 'samstag': 6 }
        };

        // ===================================================================
        // DATUM DES NÄCHSTEN GEWÜNSCHTEN WOCHENTAGS FINDEN
        // ===================================================================
        const targetDayNumber = CONFIG.dayMapping[targetDay.toLowerCase()];
        if (targetDayNumber === undefined) {
            return res.status(400).json({ success: false, message: `Ungültiger Wochentag: ${targetDay}` });
        }

        const nextTargetDate = new Date();
        nextTargetDate.setHours(0, 0, 0, 0); // Auf Mitternacht setzen für saubere Vergleiche
        const todayNumber = nextTargetDate.getDay();
        let dayDifference = targetDayNumber - todayNumber;
        if (dayDifference < 0) { // Wenn Tag in dieser Woche schon vorbei war -> nächste Woche
            dayDifference += 7;
        }
        nextTargetDate.setDate(nextTargetDate.getDate() + dayDifference);

        // ===================================================================
        // TERMINE FÜR DIESEN TAG AUS GOOGLE CALENDAR ABRUFEN
        // ===================================================================
        const timeMin = new Date(nextTargetDate);
        timeMin.setHours(0, 0, 1, 0); // Start des Tages

        const timeMax = new Date(nextTargetDate);
        timeMax.setHours(23, 59, 59, 0); // Ende des Tages

        const result = await calendar.events.list({
            calendarId: 'designare.design@gmail.com',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const busySlots = result.data.items.map(event => ({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime),
        }));

        // ===================================================================
        // VERFÜGBARE SLOTS FÜR DIESEN TAG GENERIEREN UND PRÜFEN
        // ===================================================================
        const availableSlots = [];
        const now = new Date();

        for (let hour = CONFIG.workingHours.start; hour < CONFIG.workingHours.end; hour++) {
            for (let minute = 0; minute < 60; minute += CONFIG.appointmentDuration) {
                const potentialSlotStart = new Date(nextTargetDate);
                potentialSlotStart.setHours(hour, minute, 0, 0);

                const potentialSlotEnd = new Date(potentialSlotStart.getTime() + CONFIG.appointmentDuration * 60000);

                // Slot muss in der Zukunft liegen
                if (potentialSlotStart <= now) {
                    continue; // Diesen Slot überspringen
                }

                // Prüfen, ob der Slot mit einem gebuchten Termin kollidiert
                let isBooked = false;
                for (const busy of busySlots) {
                    if (potentialSlotStart < busy.end && potentialSlotEnd > busy.start) {
                        isBooked = true;
                        break;
                    }
                }

                if (!isBooked) {
                    availableSlots.push(formatSlotForDisplay(potentialSlotStart));
                }
            }
        }

        res.status(200).json({
            success: true,
            day: targetDay,
            date: nextTargetDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
            slots: availableSlots,
        });

    } catch (error) {
        console.error("Fehler in get-availability:", error);
        res.status(500).json({ success: false, message: "Fehler beim Abrufen der Verfügbarkeit." });
    }
}

function formatSlotForDisplay(slotDate) {
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = slotDate.toLocaleDateString('de-DE', optionsDate);
    const timeStr = slotDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return {
        fullString: `${dateStr} um ${timeStr}`,
        time: timeStr
    };
}
