// js/analytics-proxy.js
const Analytics = {
  // Startzeit für Engagement-Berechnung speichern
  startTime: Date.now(),

  // 1. Client ID: Identifiziert den Browser eindeutig
  getClientId() {
    let id = localStorage.getItem('designare_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('designare_id', id);
    }
    return id;
  },

  // 2. Session ID: Verwaltet Sitzungen (30 Min Timeout)
  getSessionId() {
    const now = Date.now();
    let sessionId = localStorage.getItem('designare_session_id');
    let lastActive = localStorage.getItem('designare_last_active');
    const SESSION_TIMEOUT = 1800000; // 30 Minuten

    // Neue Session starten?
    if (!sessionId || !lastActive || (now - lastActive) > SESSION_TIMEOUT) {
      sessionId = now.toString();
      localStorage.setItem('designare_session_id', sessionId);
      // Flag setzen, dass diese Session noch nicht als "gestartet" gemeldet wurde
      localStorage.removeItem('designare_session_started');
    }

    localStorage.setItem('designare_last_active', now); 
    return sessionId;
  },

  // 3. Track-Funktion: Sendet Daten an den Proxy
  async track(eventName, params = {}) {
    try {
      const sessionId = this.getSessionId();
      const clientId = this.getClientId();
      
      // Berechne echte Verweildauer in Millisekunden
      const timeSinceLoad = Date.now() - this.startTime;

      // Session Start Logik für GA4
      if (!localStorage.getItem('designare_session_started')) {
        params.session_start = 1;
        localStorage.setItem('designare_session_started', 'true');
      }

      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          events: [{
            name: eventName,
            params: {
              ...params,
              // Standard Parameter
              ga_session_id: sessionId,
              // Wir senden echte Zeit (min. 1 Sekunde für Pageview, sonst echte Dauer)
              engagement_time_msec: eventName === 'page_view' ? 1000 : timeSinceLoad,
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

// === AUTOMATISCHE TRIGGER ===

// 1. Page View beim Laden
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    Analytics.track('page_view');
  }, 200);
});

// 2. Engagement beim Verlassen der Seite speichern
window.addEventListener('beforeunload', () => {
  // Senden via navigator.sendBeacon wäre besser, aber wir nutzen den Proxy.
  // Wir feuern 'user_engagement' mit der finalen Zeit.
  Analytics.track('user_engagement', {
     engagement_time_msec: Date.now() - Analytics.startTime
  });
});

// 3. Klick-Tracking (Downloads, Kontakt, Externe Links)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const url = link.href;
  const hostname = link.hostname;

  // A) Datei-Downloads
  if (url.match(/\.(pdf|zip|docx|xlsx|pptx|mp3|txt|csv)$/i)) {
    Analytics.track('file_download', {
      file_name: link.innerText.trim() || url.split('/').pop(),
      file_extension: url.split('.').pop(),
      link_url: url
    });
    return;
  }

  // B) Kontakt-Links (Mailto / Tel)
  if (url.startsWith('mailto:') || url.startsWith('tel:')) {
    Analytics.track('contact_click', {
      method: url.startsWith('mailto:') ? 'email' : 'phone',
      link_url: url
    });
    return;
  }

  // C) Externe Links (Outbound)
  if (hostname && hostname !== window.location.hostname) {
    Analytics.track('click', { 
      link_url: url, 
      link_domain: hostname,
      outbound: true
    });
  }
});

// 4. Formular-Tracking
document.addEventListener('submit', (e) => {
  const form = e.target;
  const formName = form.id || form.getAttribute('name') || 'unknown_form';
  
  Analytics.track('form_submit', {
    form_id: formName,
    page_location: window.location.href
  });
});

// Export für manuelle Nutzung (z.B. im Chat)
window.Analytics = Analytics;
