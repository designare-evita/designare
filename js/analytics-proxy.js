// js/analytics-proxy.js – Version 2.0
// Erweitert für vollständiges GA4-Tracking

const Analytics = {
  startTime: Date.now(),
  scrollMilestones: [25, 50, 75, 90],
  scrollTracked: new Set(),
  maxScrollDepth: 0,
  isEngaged: false,

  // ─────────────────────────────────────────────
  // CORE: IDs & Session Management
  // ─────────────────────────────────────────────

  getClientId() {
    let id = localStorage.getItem('designare_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('designare_id', id);
    }
    return id;
  },

  getSessionId() {
    const now = Date.now();
    let sessionId = localStorage.getItem('designare_session_id');
    let lastActive = localStorage.getItem('designare_last_active');
    const SESSION_TIMEOUT = 1800000; // 30 Min

    if (!sessionId || !lastActive || (now - lastActive) > SESSION_TIMEOUT) {
      sessionId = now.toString();
      localStorage.setItem('designare_session_id', sessionId);
      localStorage.removeItem('designare_session_started');
    }

    localStorage.setItem('designare_last_active', now);
    return sessionId;
  },

  // ─────────────────────────────────────────────
  // TRACKING: Events senden
  // ─────────────────────────────────────────────

  async track(eventName, params = {}) {
    try {
      const sessionId = this.getSessionId();
      const clientId = this.getClientId();
      const timeSinceLoad = Date.now() - this.startTime;

      // Session Start Flag
      if (!localStorage.getItem('designare_session_started')) {
        params.session_start = 1;
        localStorage.setItem('designare_session_started', 'true');
      }

      const payload = {
        client_id: clientId,
        events: [{
          name: eventName,
          params: {
            ...params,
            ga_session_id: sessionId,
            engagement_time_msec: Math.max(1000, timeSinceLoad),
            page_location: window.location.href,
            page_title: document.title,
            page_path: window.location.pathname,
            language: navigator.language || 'de-DE',
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            // Referrer für Traffic-Quellen
            page_referrer: document.referrer || '(direct)'
          }
        }]
      };

      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    } catch (e) {
      console.warn('Analytics blocked or failed:', e);
    }
  },

  // sendBeacon für zuverlässiges Tracking beim Verlassen
  trackBeacon(eventName, params = {}) {
    try {
      const sessionId = this.getSessionId();
      const clientId = this.getClientId();
      const timeSinceLoad = Date.now() - this.startTime;

      const payload = {
        client_id: clientId,
        events: [{
          name: eventName,
          params: {
            ...params,
            ga_session_id: sessionId,
            engagement_time_msec: timeSinceLoad,
            page_location: window.location.href,
            page_title: document.title,
            page_path: window.location.pathname
          }
        }]
      };

      // sendBeacon ist zuverlässiger als fetch bei beforeunload
      navigator.sendBeacon('/api/metrics', JSON.stringify(payload));

    } catch (e) {
      console.warn('Beacon failed:', e);
    }
  },

  // ─────────────────────────────────────────────
  // SCROLL TRACKING
  // ─────────────────────────────────────────────

  getScrollPercentage() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const viewHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    if (docHeight <= viewHeight) return 100;
    return Math.round((scrollTop / (docHeight - viewHeight)) * 100);
  },

  checkScrollMilestones() {
    const percentage = this.getScrollPercentage();
    
    // Maximale Scroll-Tiefe speichern
    if (percentage > this.maxScrollDepth) {
      this.maxScrollDepth = percentage;
    }

    // Milestone-Events feuern
    this.scrollMilestones.forEach(milestone => {
      if (percentage >= milestone && !this.scrollTracked.has(milestone)) {
        this.scrollTracked.add(milestone);
        this.track('scroll', {
          percent_scrolled: milestone,
          // GA4 Standard-Parameter
          engagement_type: 'scroll'
        });
        
        // Ab 50% Scroll als "engaged" markieren
        if (milestone >= 50) {
          this.isEngaged = true;
        }
      }
    });
  },

  // ─────────────────────────────────────────────
  // ENGAGEMENT TRACKING
  // ─────────────────────────────────────────────

  // Wird alle 15 Sekunden aufgerufen für "aktive" Zeit
  heartbeat() {
    // Nur senden wenn Tab aktiv ist
    if (document.visibilityState === 'visible') {
      this.track('user_engagement', {
        engagement_type: 'heartbeat',
        time_on_page_sec: Math.round((Date.now() - this.startTime) / 1000)
      });
    }
  },

  // ─────────────────────────────────────────────
  // CONVERSION TRACKING (manuell aufrufbar)
  // ─────────────────────────────────────────────

  // Für Kontaktformular, Anfragen etc.
  trackConversion(conversionType, value = null) {
    const params = {
      conversion_type: conversionType
    };
    
    if (value !== null) {
      params.value = value;
      params.currency = 'EUR';
    }

    this.track('conversion', params);
    
    // Auch als generate_lead für GA4 Standard-Reports
    if (conversionType === 'contact' || conversionType === 'inquiry') {
      this.track('generate_lead', params);
    }
  },

  // ─────────────────────────────────────────────
  // INITIALISIERUNG
  // ─────────────────────────────────────────────

  init() {
    // 1. Page View
    this.track('page_view');

    // 2. Scroll-Listener (throttled)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        this.checkScrollMilestones();
        scrollTimeout = null;
      }, 150);
    }, { passive: true });

    // 3. Heartbeat alle 15 Sekunden für Verweildauer
    setInterval(() => this.heartbeat(), 15000);

    // 4. Engagement beim Verlassen (zuverlässig via Beacon)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackBeacon('user_engagement', {
          engagement_type: 'page_exit',
          time_on_page_sec: Math.round((Date.now() - this.startTime) / 1000),
          max_scroll_depth: this.maxScrollDepth,
          was_engaged: this.isEngaged
        });
      }
    });

    // Fallback für ältere Browser
    window.addEventListener('beforeunload', () => {
      this.trackBeacon('user_engagement', {
        engagement_type: 'page_exit',
        time_on_page_sec: Math.round((Date.now() - this.startTime) / 1000),
        max_scroll_depth: this.maxScrollDepth
      });
    });

    // 5. Klick-Tracking
    document.addEventListener('click', (e) => this.handleClick(e));

    // 6. Formular-Tracking
    document.addEventListener('submit', (e) => this.handleFormSubmit(e));

    console.log('📊 Analytics v2.0 initialized');
  },

  // ─────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────

  handleClick(e) {
    const link = e.target.closest('a');
    const button = e.target.closest('button');
    
    // CTA-Buttons tracken (NEU!)
    if (button) {
      const buttonText = button.innerText.trim();
      const buttonId = button.id || button.className || 'unknown';
      
      // Bestimmte CTAs als Conversion werten
      const conversionKeywords = ['anfragen', 'kontakt', 'buchen', 'kaufen', 'bestellen', 'senden'];
      const isConversionCTA = conversionKeywords.some(kw => 
        buttonText.toLowerCase().includes(kw)
      );

      this.track('cta_click', {
        button_text: buttonText,
        button_id: buttonId,
        is_conversion_cta: isConversionCTA
      });

      // Interaktion markieren
      this.isEngaged = true;
      return;
    }

    if (!link) return;

    const url = link.href;
    const hostname = link.hostname;

    // Datei-Downloads
    if (url.match(/\.(pdf|zip|docx|xlsx|pptx|mp3|txt|csv)$/i)) {
      this.track('file_download', {
        file_name: link.innerText.trim() || url.split('/').pop(),
        file_extension: url.split('.').pop().toLowerCase(),
        link_url: url
      });
      this.isEngaged = true;
      return;
    }

    // Kontakt-Links
    if (url.startsWith('mailto:')) {
      this.track('contact_click', { method: 'email', link_url: url });
      this.trackConversion('contact_email');
      this.isEngaged = true;
      return;
    }

    if (url.startsWith('tel:')) {
      this.track('contact_click', { method: 'phone', link_url: url });
      this.trackConversion('contact_phone');
      this.isEngaged = true;
      return;
    }

    // Externe Links
    if (hostname && hostname !== window.location.hostname) {
      this.track('click', {
        link_url: url,
        link_domain: hostname,
        outbound: true,
        link_text: link.innerText.trim().substring(0, 50)
      });
    }
  },

  handleFormSubmit(e) {
    const form = e.target;
    const formName = form.id || form.getAttribute('name') || 'unknown_form';
    
    this.track('form_submit', {
      form_id: formName,
      form_destination: form.action || window.location.href
    });

    // Formulare sind Conversions!
    this.trackConversion('form_submission');
    this.isEngaged = true;
  }
};

// ─────────────────────────────────────────────
// AUTO-START
// ─────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
  // DOM bereits geladen
  Analytics.init();
}

// Export für manuelle Nutzung
window.Analytics = Analytics;

// Beispiel-Nutzung für manuelle Conversions:
// Analytics.trackConversion('inquiry', 500);  // Mit Wert
// Analytics.trackConversion('newsletter');     // Ohne Wert
