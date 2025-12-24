// js/analytics-proxy.js
const Analytics = {
  // 1. Client ID: Identifiziert den Browser eindeutig (First-Party Cookie Ersatz)
  getClientId() {
    let id = localStorage.getItem('designare_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('designare_id', id);
    }
    return id;
  },

  // 2. Session ID: Verwaltet Sitzungen (wichtig für "Sitzungsdauer" & "Absprungrate")
  getSessionId() {
    const now = Date.now();
    let sessionId = localStorage.getItem('designare_session_id');
    let lastActive = localStorage.getItem('designare_last_active');
    
    // Sitzungstimeout: 30 Minuten (1.800.000 ms)
    const SESSION_TIMEOUT = 1800000; 

    // Neue Session starten, wenn keine existiert oder Timeout abgelaufen ist
    if (!sessionId || !lastActive || (now - lastActive) > SESSION_TIMEOUT) {
      sessionId = now.toString(); // GA4 nutzt oft den Zeitstempel als Session-ID
      localStorage.setItem('designare_session_id', sessionId);
      
      // Optional: Hier könnte man loggen, dass eine neue Session beginnt
    }

    // Zeitstempel der letzten Aktivität aktualisieren
    localStorage.setItem('designare_last_active', now); 
    return sessionId;
  },

  // 3. Track-Funktion: Sendet Daten an deinen Proxy
  async track(eventName, params = {}) {
    try {
      // Session-Logik vor jedem Event prüfen/aktualisieren
      const sessionId = this.getSessionId();
      const clientId = this.getClientId();

      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          events: [{
            name: eventName,
            params: {
              ...params,
              // Standard GA4 Parameter, die bei serverseitigem Tracking fehlen würden
              ga_session_id: sessionId,
              engagement_time_msec: 100, // Standardwert, damit User als "aktiv" gelten
              page_location: window.location.href,
              page_title: document.title,
              language: navigator.language || 'de-DE',
              screen_resolution: `${window.screen.width}x${window.screen.height}`
            }
          }]
        })
      });
    } catch (e) {
      console.warn('Analytics blocked or failed', e);
    }
  }
};

// Automatischer Page-View beim Laden der Seite
window.addEventListener('DOMContentLoaded', () => {
  // Kleiner Timeout, damit Titel und URL sicher initialisiert sind
  setTimeout(() => {
    Analytics.track('page_view');
  }, 200);
});

// Klicks auf externe Links tracken (Optional, aber empfohlen)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.hostname !== window.location.hostname && link.hostname) {
    Analytics.track('click', { 
      link_url: link.href, 
      link_domain: link.hostname 
    });
  }
});
