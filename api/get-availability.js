// /api/get-availability.js
import { google } from 'googleapis';

export default async function handler(req, res) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // --- HIER IST DIE LOGIK ZUR TERMINFINDUNG ---

        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);

        // 1. Alle Termine der nächsten 14 Tage abrufen
        const result = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: twoWeeksFromNow.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const busySlots = result.data.items.map(event => ({
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
        }));

        // 2. Freie Termine finden (z.B. Mo-Fr, 9-17 Uhr)
        const availableSlots = [];
        let currentDate = new Date(now);

        for (let i = 0; i < 14; i++) {
            // Nur Werktage (Montag=1, Freitag=5)
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek > 0 && dayOfWeek < 6) {
                // Prüfe stündliche Slots von 9 bis 17 Uhr
                for (let hour = 9; hour < 17; hour++) {
                    const potentialSlot = new Date(currentDate.setHours(hour, 0, 0, 0));
                    
                    // Ist der Slot in der Zukunft?
                    if (potentialSlot > now) {
                        let isSlotBusy = false;
                        for (const busySlot of busySlots) {
                            if (potentialSlot >= busySlot.start && potentialSlot < busySlot.end) {
                                isSlotBusy = true;
                                break;
                            }
                        }

                        if (!isSlotBusy) {
                            availableSlots.push(potentialSlot.toLocaleString('de-DE', { dateStyle: 'full', timeStyle: 'short' }));
                        }
                    }
                }
            }

            if (availableSlots.length >= 5) break; // Stoppen, wenn wir 5 freie Termine haben
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.status(200).json({ success: true, slots: availableSlots });

    } catch (error) {
        console.error("Fehler in get-availability:", error);
        res.status(500).json({ success: false, message: "Fehler beim Abrufen der Verfügbarkeit." });
    }
}
