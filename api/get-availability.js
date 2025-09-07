// /api/get-availability.js (ERWEITERTE VERSION)
import { google } from 'googleapis';

export default async function handler(req, res) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // ===================================================================
        // KONFIGURATION: Hier kannst du deine Verfügbarkeiten anpassen
        // ===================================================================
        
        const AVAILABILITY_CONFIG = {
            // Arbeitszeiten
            workingHours: {
                start: 9,    // 9:00 Uhr
                end: 17,     // 17:00 Uhr
                interval: 60 // Termine alle 60 Minuten
            },
            
            // Arbeitstage (0 = Sonntag, 1 = Montag, ..., 6 = Samstag)
            workingDays: [1, 3, 4, 5], // Montag bis Freitag
            
            // Maximale Tage in die Zukunft
            maxDaysAhead: 14,
            
            // Maximale Anzahl angezeigter Termine
            maxSlots: 6,
            
            // Spezielle Verfügbarkeiten (überschreibt Standard-Arbeitszeiten)
            customSlots: [
                // Beispiele für spezielle Termine:
                // { date: '2025-09-10', time: '18:00', duration: 30, note: 'Abendtermin' },
                // { date: '2025-09-14', time: '08:00', duration: 60, note: 'Früher Termin' }
            ],
            
            // Gesperrte Zeiten (zusätzlich zu Kalenderterminen)
            blockedSlots: [
                // Beispiele:
                // { date: '2025-09-09', timeStart: '12:00', timeEnd: '13:00', reason: 'Mittagspause' },
                // { date: '2025-09-11', timeStart: '15:00', timeEnd: '16:00', reason: 'Interner Termin' }
            ],
            
            // Termin-Infos die dem Kunden angezeigt werden
            appointmentInfo: {
                duration: 30, // Standard-Dauer in Minuten
                type: 'Beratungsgespräch',
                location: 'Online (Link wird zugesendet)',
                preparation: 'Bitte bereiten Sie Ihre Fragen vor',
                notes: 'Bei Fragen kontaktieren Sie michael@designare.at'
            }
        };

        // ===================================================================
        // TERMINE AUS GOOGLE CALENDAR ABRUFEN
        // ===================================================================
        
        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(now.getDate() + AVAILABILITY_CONFIG.maxDaysAhead);

        const result = await calendar.events.list({
            calendarId: 'designare.design@gmail.com', // Deine Kalender-ID
            timeMin: now.toISOString(),
            timeMax: maxDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const busySlots = result.data.items.map(event => ({
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
        }));

        // ===================================================================
        // VERFÜGBARE TERMINE GENERIEREN
        // ===================================================================
        
        const availableSlots = [];
        let currentDate = new Date(now);

        for (let i = 0; i < AVAILABILITY_CONFIG.maxDaysAhead; i++) {
            // Nur Arbeitstage prüfen
            const dayOfWeek = currentDate.getDay();
            if (AVAILABILITY_CONFIG.workingDays.includes(dayOfWeek)) {
                
                // Standard-Arbeitszeiten durchgehen
                for (let hour = AVAILABILITY_CONFIG.workingHours.start; 
                     hour < AVAILABILITY_CONFIG.workingHours.end; 
                     hour += AVAILABILITY_CONFIG.workingHours.interval / 60) {
                    
                    const potentialSlot = new Date(currentDate);
                    potentialSlot.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
                    
                    // Ist der Slot in der Zukunft?
                    if (potentialSlot > now) {
                        // Prüfe ob der Slot frei ist
                        if (isSlotAvailable(potentialSlot, busySlots, AVAILABILITY_CONFIG)) {
                            const formattedSlot = formatSlotForDisplay(potentialSlot);
                            availableSlots.push(formattedSlot);
                        }
                    }
                }
            }

            // Nächster Tag
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Stoppe wenn genug Termine gefunden
            if (availableSlots.length >= AVAILABILITY_CONFIG.maxSlots) break;
        }

        // Füge custom Slots hinzu
        AVAILABILITY_CONFIG.customSlots.forEach(customSlot => {
            const slotDate = new Date(`${customSlot.date}T${customSlot.time}:00`);
            if (slotDate > now && isSlotAvailable(slotDate, busySlots, AVAILABILITY_CONFIG)) {
                const formattedSlot = formatSlotForDisplay(slotDate, customSlot.note);
                availableSlots.push(formattedSlot);
            }
        });

        // Sortiere chronologisch
        availableSlots.sort();

        res.status(200).json({ 
            success: true, 
            slots: availableSlots.slice(0, AVAILABILITY_CONFIG.maxSlots),
            appointmentInfo: AVAILABILITY_CONFIG.appointmentInfo 
        });

    } catch (error) {
        console.error("Fehler in get-availability:", error);
        res.status(500).json({ 
            success: false, 
            message: "Fehler beim Abrufen der Verfügbarkeit.",
            error: error.message 
        });
    }
}

// ===================================================================
// HILFSFUNKTIONEN
// ===================================================================

function isSlotAvailable(potentialSlot, busySlots, config) {
    const slotEnd = new Date(potentialSlot.getTime() + (config.appointmentInfo.duration * 60000));
    
    // Prüfe gegen bestehende Termine
    for (const busySlot of busySlots) {
        if (potentialSlot < busySlot.end && slotEnd > busySlot.start) {
            return false;
        }
    }
    
    // Prüfe gegen gesperrte Zeiten
    for (const blocked of config.blockedSlots) {
        const blockedDate = blocked.date;
        const slotDate = potentialSlot.toISOString().split('T')[0];
        
        if (slotDate === blockedDate) {
            const blockedStart = new Date(`${blockedDate}T${blocked.timeStart}:00`);
            const blockedEnd = new Date(`${blockedDate}T${blocked.timeEnd}:00`);
            
            if (potentialSlot < blockedEnd && slotEnd > blockedStart) {
                return false;
            }
        }
    }
    
    return true;
}

function formatSlotForDisplay(slotDate, note = '') {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Europe/Vienna'
    };
    
    const dateStr = slotDate.toLocaleDateString('de-DE', options);
    const timeStr = slotDate.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/Vienna'
    });
    
    let formatted = `${dateStr} um ${timeStr}`;
    if (note) {
        formatted += ` (${note})`;
    }
    
    return formatted;
}
