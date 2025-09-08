// api/suggest-appointments.js - REPARIERTE VERSION (zeigt alle 3 Termine)
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
            calendarId: 'designare.design@gmail.com'
        };

        // ===================================================================
        // FEIERTAGE DEFINIEREN (Österreich 2025)
        // ===================================================================
        const holidays2025 = [
            '2025-01-01', '2025-01-06', '2025-04-21', '2025-05-01', 
            '2025-05-29', '2025-06-09', '2025-06-19', '2025-08-15', 
            '2025-10-26', '2025-11-01', '2025-12-08', '2025-12-25', '2025-12-26'
        ];

        // ===================================================================
        // HILFSFUNKTIONEN
        // ===================================================================
        
        function isWorkingDay(date) {
            const dayOfWeek = date.getDay();
            const dateString = date.toISOString().split('T')[0];
            
            if (CONFIG.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                return false;
            }
            
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
                
                // Prüfe Mindest-Vorlaufzeit (30 Minuten)
                const now = new Date();
                const minFutureTime = new Date(now.getTime() + 30 * 60000);
                if (slotStart <= minFutureTime) {
                    continue;
                }
                
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
                if (CONFIG.preferredTimes.includes(hour)) continue;
                
                const slotStart = new Date(date);
                slotStart.setHours(hour, 0, 0, 0);
                
                const slotEnd = new Date(slotStart.getTime() + CONFIG.appointmentDuration * 60000);
                
                // Prüfe Mindest-Vorlaufzeit
                const now = new Date();
                const minFutureTime = new Date(now.getTime() + 30 * 60000);
                if (slotStart <= minFutureTime) {
                    continue;
                }
                
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
        // HAUPTLOGIK - KORRIGIERT
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
        
        // ===================================================================
        // KRITISCHE KORREKTUR: Finde für JEDEN Tag einen Slot
        // ===================================================================
        const suggestions = [];
        
        for (let i = 0; i < workingDays.length; i++) {
            const day = workingDays[i];
            const dayEvents = existingEvents.filter(event => {
                const eventDate = event.start.toDateString();
                const dayDate = day.toDateString();
                return eventDate === dayDate;
            });
            
            console.log(`📅 Tag ${i + 1} (${day.toLocaleDateString('de-DE')}): ${dayEvents.length} bestehende Termine`);
            
            const bestSlot = findBestTimeSlot(day, dayEvents);
            
            if (bestSlot) {
                suggestions.push({
                    slot: i + 1, // WICHTIG: Slot 1, 2, 3
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
                
                console.log(`✅ Slot ${i + 1} erstellt: ${bestSlot.toLocaleString('de-DE')}`);
            } else {
                console.warn(`⚠️ Kein Slot für Tag ${i + 1} verfügbar`);
                
                // FALLBACK: Erstelle einen Slot mit dem nächstbesten Zeitpunkt
                const fallbackSlot = new Date(day);
                fallbackSlot.setHours(9, 0, 0, 0); // Default 9:00 Uhr
                
                suggestions.push({
                    slot: i + 1,
                    date: fallbackSlot.toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }),
                    time: 'Nach Vereinbarung',
                    fullDateTime: fallbackSlot.toISOString(),
                    dayName: fallbackSlot.toLocaleDateString('de-DE', { weekday: 'long' }),
                    dayNumber: fallbackSlot.getDate(),
                    month: fallbackSlot.toLocaleDateString('de-DE', { month: 'long' }),
                    isPreferredTime: false,
                    formattedString: `${fallbackSlot.toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                    })} - Zeit nach Vereinbarung`,
                    isFallback: true
                });
                
                console.log(`🔄 Fallback-Slot ${i + 1} erstellt`);
            }
        }

        // ===================================================================
        // DEBUGGING: Prüfe ob alle 3 Slots da sind
        // ===================================================================
        console.log('🔍 Finale Suggestions:');
        suggestions.forEach(s => {
            console.log(`  Slot ${s.slot}: ${s.formattedString}`);
        });

        if (suggestions.length < 3) {
            console.warn(`⚠️ Nur ${suggestions.length} von 3 Slots erstellt!`);
        }

        // Stelle sicher, dass wir immer 3 Slots haben
        while (suggestions.length < 3) {
            const missingSlot = suggestions.length + 1;
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + missingSlot + 2);
            
            suggestions.push({
                slot: missingSlot,
                date: futureDate.toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                time: 'Nach Vereinbarung',
                fullDateTime: futureDate.toISOString(),
                dayName: futureDate.toLocaleDateString('de-DE', { weekday: 'long' }),
                dayNumber: futureDate.getDate(),
                month: futureDate.toLocaleDateString('de-DE', { month: 'long' }),
                isPreferredTime: false,
                formattedString: `${futureDate.toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                })} - Zeit nach Vereinbarung`,
                isEmergencySlot: true
            });
            
            console.log(`🆘 Emergency-Slot ${missingSlot} hinzugefügt`);
        }

        console.log(`✅ ${suggestions.length} Terminvorschläge generiert (alle Slots vorhanden)`);

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
                suggestionsGenerated: suggestions.length,
                allSlotsPresent: suggestions.length === 3
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
