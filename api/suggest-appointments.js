// api/suggest-appointments.js - NEUE API für intelligente Terminvorschläge
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
            appointmentDuration: 60, // 60 Minuten
            preferredTimes: [9, 10, 11, 14, 15, 16], // Bevorzugte Startzeiten
            excludeWeekends: true,
            calendarId: 'designare.design@gmail.com'
        };

        // ===================================================================
        // FEIERTAGE DEFINIEREN (Österreich 2025)
        // ===================================================================
        const holidays2025 = [
            '2025-01-01', // Neujahr
            '2025-01-06', // Heilige Drei Könige
            '2025-04-21', // Ostermontag
            '2025-05-01', // Staatsfeiertag
            '2025-05-29', // Christi Himmelfahrt
            '2025-06-09', // Pfingstmontag
            '2025-06-19', // Fronleichnam
            '2025-08-15', // Mariä Himmelfahrt
            '2025-10-26', // Nationalfeiertag
            '2025-11-01', // Allerheiligen
            '2025-12-08', // Mariä Empfängnis
            '2025-12-25', // Christtag
            '2025-12-26'  // Stefanitag
        ];

        // ===================================================================
        // HILFSFUNKTIONEN
        // ===================================================================
        
        function isWorkingDay(date) {
            const dayOfWeek = date.getDay(); // 0 = Sonntag, 6 = Samstag
            const dateString = date.toISOString().split('T')[0];
            
            // Prüfe Wochenenden
            if (CONFIG.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                return false;
            }
            
            // Prüfe Feiertage
            if (holidays2025.includes(dateString)) {
                return false;
            }
            
            return true;
        }

        function getNext3WorkingDays() {
            const workingDays = [];
            const today = new Date();
            let currentDate = new Date(today);
            currentDate.setDate(currentDate.getDate() + 1); // Start ab morgen
            
            while (workingDays.length < 3) {
                if (isWorkingDay(currentDate)) {
                    workingDays.push(new Date(currentDate));
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return workingDays;
        }

        async function getExistingEvents(startDate, endDate) {
            try {
                const response = await calendar.events.list({
                    calendarId: CONFIG.calendarId,
                    timeMin: startDate.toISOString(),
                    timeMax: endDate.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                });

                return response.data.items.map(event => ({
                    start: new Date(event.start.dateTime || event.start.date),
                    end: new Date(event.end.dateTime || event.end.date),
                    summary: event.summary
                }));
            } catch (error) {
                console.error('Fehler beim Abrufen der Kalender-Events:', error);
                return [];
            }
        }

        function findBestTimeSlot(date, existingEvents) {
            console.log(`Suche besten Slot für ${date.toLocaleDateString('de-DE')}`);
            
            // Prüfe bevorzugte Zeiten zuerst
            for (const hour of CONFIG.preferredTimes) {
                const slotStart = new Date(date);
                slotStart.setHours(hour, 0, 0, 0);
                
                const slotEnd = new Date(slotStart.getTime() + CONFIG.appointmentDuration * 60000);
                
                // Prüfe auf Konflikte
                const hasConflict = existingEvents.some(event => {
                    return slotStart < event.end && slotEnd > event.start;
                });
                
                if (!hasConflict) {
                    console.log(`✅ Freier Slot gefunden: ${slotStart.toLocaleString('de-DE')}`);
                    return slotStart;
                }
            }
            
            // Falls keine bevorzugte Zeit frei ist, suche andere Slots
            for (let hour = CONFIG.workingHours.start; hour < CONFIG.workingHours.end; hour++) {
                if (CONFIG.preferredTimes.includes(hour)) continue; // Bereits geprüft
                
                const slotStart = new Date(date);
                slotStart.setHours(hour, 0, 0, 0);
                
                const slotEnd = new Date(slotStart.getTime() + CONFIG.appointmentDuration * 60000);
                
                const hasConflict = existingEvents.some(event => {
                    return slotStart < event.end && slotEnd > event.start;
                });
                
                if (!hasConflict) {
                    console.log(`✅ Alternativer Slot gefunden: ${slotStart.toLocaleString('de-DE')}`);
                    return slotStart;
                }
            }
            
            console.log(`❌ Kein freier Slot für ${date.toLocaleDateString('de-DE')}`);
            return null;
        }

        // ===================================================================
        // HAUPTLOGIK
        // ===================================================================
        
        console.log('🔍 Suche intelligente Terminvorschläge...');
        
        const workingDays = getNext3WorkingDays();
        console.log('📅 Arbeitstage gefunden:', workingDays.map(d => d.toLocaleDateString('de-DE')));
        
        // Hole Events für alle 3 Tage
        const startDate = workingDays[0];
        const endDate = new Date(workingDays[2]);
        endDate.setHours(23, 59, 59, 999);
        
        const existingEvents = await getExistingEvents(startDate, endDate);
        console.log(`📋 ${existingEvents.length} bestehende Termine gefunden`);
        
        // Finde beste Slots für jeden Tag
        const suggestions = [];
        
        for (let i = 0; i < workingDays.length; i++) {
            const day = workingDays[i];
            const dayEvents = existingEvents.filter(event => {
                const eventDate = event.start.toDateString();
                const dayDate = day.toDateString();
                return eventDate === dayDate;
            });
            
            const bestSlot = findBestTimeSlot(day, dayEvents);
            
            if (bestSlot) {
                suggestions.push({
                    slot: i + 1,
                    date: bestSlot.toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }),
                    time: bestSlot.toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    fullDateTime: bestSlot.toISOString(),
                    dayName: bestSlot.toLocaleDateString('de-DE', { weekday: 'long' }),
                    dayNumber: bestSlot.getDate(),
                    month: bestSlot.toLocaleDateString('de-DE', { month: 'long' }),
                    isPreferredTime: CONFIG.preferredTimes.includes(bestSlot.getHours()),
                    formattedString: `${bestSlot.toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                    })} um ${bestSlot.toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}`
                });
            }
        }

        // ===================================================================
        // ANTWORT ZUSAMMENSTELLEN
        // ===================================================================
        
        if (suggestions.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'Leider sind in den nächsten 3 Arbeitstagen keine freien Termine verfügbar. Bitte kontaktiere Michael direkt für alternative Termine.',
                suggestions: []
            });
        }

        console.log(`✅ ${suggestions.length} Terminvorschläge generiert`);

        res.status(200).json({
            success: true,
            message: `Hier sind 3 verfügbare Termine in Michaels Kalender:`,
            suggestions: suggestions,
            totalFound: suggestions.length,
            searchPeriod: {
                from: startDate.toLocaleDateString('de-DE'),
                to: endDate.toLocaleDateString('de-DE')
            },
            debug: {
                workingDaysChecked: workingDays.length,
                existingEventsFound: existingEvents.length,
                suggestionsGenerated: suggestions.length
            }
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
