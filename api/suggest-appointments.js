// api/suggest-appointments.js - FINALE VERSION MIT FEIERTAGEN

import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
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
            appointmentDuration: 60,
            preferredTimes: [9, 10, 11, 14, 15, 16],
            excludeWeekends: true,
            calendarId: 'designare.design@gmail.com',
            searchDaysLimit: 30
        };

        // ===================================================================
        // FEIERTAGE DEFINIEREN (Österreich 2025) - NEU
        // ===================================================================
        const holidays2025 = [
            '2025-01-01', '2025-01-06', '2025-04-21', '2025-05-01', 
            '2025-05-29', '2025-06-09', '2025-06-19', '2025-08-15', 
            '2025-10-26', '2025-11-01', '2025-12-08', '2025-12-25', '2025-12-26'
        ];

        // ===================================================================
        // HELFERFUNKTIONEN
        // ===================================================================
        const isPreferredTime = (date) => CONFIG.preferredTimes.includes(date.getHours());

        // ===================================================================
        // DATUM UND ZEITBERECHNUNGEN
        // ===================================================================
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + CONFIG.searchDaysLimit);

        const eventsResponse = await calendar.events.list({
            calendarId: CONFIG.calendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const existingEvents = eventsResponse.data.items;
        const busySlots = new Set(existingEvents.map(event => new Date(event.start.dateTime).getTime()));

        // ===================================================================
        // VERFÜGBARE SLOTS FINDEN (MIT FEIERTAGS-CHECK)
        // ===================================================================
        const availableSlots = [];
        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1); // Starte ab morgen

        while (availableSlots.length < 10 && currentDate <= endDate) {
            const isWeekend = CONFIG.excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6);
            
            // NEU: Prüfe, ob der aktuelle Tag ein Feiertag ist
            const dateAsYYYYMMDD = currentDate.toISOString().split('T')[0];
            const isHoliday = holidays2025.includes(dateAsYYYYMMDD);

            if (isWeekend || isHoliday) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue; // Überspringe Wochenenden und Feiertage
            }

            for (let hour = CONFIG.workingHours.start; hour < CONFIG.workingHours.end; hour++) {
                const slotTime = new Date(currentDate);
                slotTime.setHours(hour, 0, 0, 0);

                if (slotTime.getTime() > new Date().getTime() && !busySlots.has(slotTime.getTime())) {
                    const endTime = new Date(slotTime.getTime() + CONFIG.appointmentDuration * 60000);
                    availableSlots.push({
                        start: { dateTime: slotTime.toISOString(), timeZone: 'Europe/Vienna' },
                        end: { dateTime: endTime.toISOString(), timeZone: 'Europe/Vienna' },
                    });
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        availableSlots.sort((a, b) => {
            const aDate = new Date(a.start.dateTime);
            const bDate = new Date(b.start.dateTime);
            const aIsPreferred = isPreferredTime(aDate);
            const bIsPreferred = isPreferredTime(bDate);
            if (aIsPreferred && !bIsPreferred) return -1;
            if (!aIsPreferred && bIsPreferred) return 1;
            return aDate - bDate;
        });
        
        const nextThreeSlots = availableSlots.slice(0, 3);

        // ===================================================================
        // KORREKTE FORMATIERUNG DER SLOTS
        // ===================================================================
        const formattedSlots = nextThreeSlots.map((slot, index) => {
            const date = new Date(slot.start.dateTime);

            const formattedDatePart = date.toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            const formattedTimePart = date.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const finalFormattedString = `${formattedDatePart} um ${formattedTimePart}`;

            return {
                slot: index + 1,
                fullDateTime: slot.start.dateTime,
                isPreferredTime: isPreferredTime(date),
                formattedString: finalFormattedString
            };
        });

        // ===================================================================
        // ANTWORT SENDEN
        // ===================================================================
        if (formattedSlots.length < 3) {
            console.warn("Warnung: Weniger als 3 Termine gefunden.");
        }

        res.status(200).json({
            success: true,
            message: `Hier sind die nächsten ${formattedSlots.length} verfügbaren Termine:`,
            suggestions: formattedSlots,
        });

    } catch (error) {
        console.error('Fehler bei Terminvorschlägen:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Terminvorschläge.',
            error: error.message
        });
    }
}
