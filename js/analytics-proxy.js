// js/analytics-proxy.js – Version 3.0
// Korrigiert für GA4 Measurement Protocol

const Analytics = {
  startTime: Date.now(),
  scrollMilestones: [25, 50, 75, 90],
  scrollTracked: new Set(),
  maxScrollDepth: 0,
  isEngaged: false,
  heartbeatInterval: null,
  debugMode: localStorage.getItem('analytics_debug') === 'true',

  // ─────────────────────────────────────────────
  // CORE: IDs & Session Management
  // ─────────────────────────────────────────────

  /**
   * Client ID im GA4-kompatiblen Format
   * Format: timestamp.random (z.B. "1234567890.987654321")
   */
  getClientId() {
    let id = localStorage.getItem('ga_client_id');
    if (!id) {
      const timestamp = Math.floor(Date.now() / 1000);
      const random = Math.floor(Math.random() * 1000000000);
      id = `${timestamp}.${random}`;
      localStorage.setItem('ga_client_id', id);
    }
    return id;
  },

  /**
   * Session Management
   * - Session ID muss eine Zahl sein (Unix Timestamp)
   * - Session Number zählt die Sessions pro Client
   * - Timeout: 30 Minuten Inaktivität
   */
  getSession() {
    const now = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 Minuten

    let sessionId = localStorage.getItem('ga_session_id');
    let sessionNumber = parseInt(localStorage.getItem('ga_session_number') || '0', 10);
    let lastActive = parseInt(localStorage.getItem('ga_last_active') || '0', 10);
    let isNewSession = false;

    // Neue Session wenn: keine existiert ODER Timeout überschritten
    if (!sessionId || (now - lastActive) > SESSION_TIMEOUT) {
      sessionId = Math.floor(now / 1000).toString();
      sessionNumber += 1;
      isNewSession = true;

      localStorage.setItem('ga_session_id', sessionId);
      localStorage.setItem('ga_session_number', sessionNumber.toString());
    }

    localStorage.setItem('ga_last_active', now.toString());

    return {
      id: parseInt(sessionId, 10),  // GA4 erwartet Number
      number: sessionNumber,
      isNew: isNewSession
    };
  },

  /**
   * Engagement Time berechnen
   * GA4 braucht mindestens 1ms, aber realistischere Werte sind besser
   */
  getEngagementTime() {
    const timeOnPage = Date.now() - this.startTime;
    return Math.max(100, timeOnPage); // Minimum 100ms
  },

  // ─────────────────────────────────────────────
  // TRACKING: Events senden
  // ─────────────────────────────────────────────

  /**
   * Haupt-Tracking-Methode
   * Sendet Events an den Proxy-Endpoint
   */
  async track(eventName, customParams = {}) {
    try {
      const session = this.getSession();
      const clientId = this.getClientId();

      // Basis-Parameter die GA4 erwartet
      const params = {
        // Session-Parameter (WICHTIG: als Zahlen!)
        ga_session_id: session.id,
        ga_session_number: session.number,
        
        // Engagement
        engagement_time_msec: this.getEngagementTime(),
        
        // Seiten-Infos
        page_location: window.location.href,
        page_title: document.title,
        page_path: window.location.pathname,
        page_referrer: document.referrer || '(direct)',
        
        // Browser/Device
        language: navigator.language || 'de-DE',
        screen_resolution: `${screen.width}x${screen.height}`,
        
        // Debug Mode – zeigt Events im GA4 DebugView
        debug_mode: this.debugMode,
        
        // Custom Parameters überschreiben/ergänzen
        ...customParams
      };

      // Session Start markieren (nur beim ersten Event einer neuen Session)
      if (session.isNew && !sessionStorage.getItem('session_start_sent')) {
        params.session_start = 1;
        sessionStorage.setItem('session_start_sent', 'true');
      }

      const payload = {
        client_id: clientId,
        events: [{
          name: eventName,
          params: params
        }]
      };

      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // Wichtig für beforeunload
      });

      if (!response.ok) {
        console.warn(`Analytics: HTTP ${response.status}`);
      }

    } catch (error) {
      // Silently fail – Analytics sollte nie die UX blockieren
      console.warn('Analytics error:', error.message);
    }
  },

  /**
   * Beacon-Tracking für Page Exit
   * sendBeacon ist zuverlässiger als fetch bei beforeunload/visibilitychange
   */
  trackBeacon(eventName, customParams = {}) {
    try {
      const session = this.getSession();
      const clientId = this.getClientId();

      const payload = {
        client_id: clientId,
        events: [{
          name: eventName,
          params: {
            ga_session_id: session.id,
            ga_session_number: session.number,
            engagement_time_msec: this.getEngagementTime(),
            page_location: window.location.href,
            page_title: document.title,
            page_path: window.location.pathname,
            ...customParams
          }
        }]
      };

      // sendBeacon sendet als text/plain – der Server muss das parsen können
      navigator.sendBeacon('/api/metrics', JSON.stringify(payload));

    } catch (error) {
      console.warn('Beacon error:', error.message);
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

    // Max Scroll Depth speichern
    if (percentage > this.maxScrollDepth) {
      this.maxScrollDepth = percentage;
    }

    // Milestone Events
    for (const milestone of this.scrollMilestones) {
      if (percentage >= milestone && !this.scrollTracked.has(milestone)) {
        this.scrollTracked.add(milestone);
        
        this.track('scroll', {
          percent_scrolled: milestone
        });

        // Ab 50% als engaged markieren
        if (milestone >= 50) {
          this.isEngaged = true;
        }
      }
    }
  },

  // ─────────────────────────────────────────────
  // ENGAGEMENT & HEARTBEAT
  // ─────────────────────────────────────────────

  /**
   * Heartbeat für aktive Verweildauer
   * Sendet nur wenn Tab sichtbar ist
   */
  sendHeartbeat() {
    if (document.visibilityState !== 'visible') return;

    this.track('heartbeat', {
      time_on_page_sec: Math.round((Date.now() - this.startTime) / 1000)
    });
  },

  /**
   * Page Exit Event
   * Wird bei visibilitychange und beforeunload gefeuert
   */
  sendExitEvent() {
    this.trackBeacon('page_exit', {
      time_on_page_sec: Math.round((Date.now() - this.startTime) / 1000),
      max_scroll_depth: this.maxScrollDepth,
      was_engaged: this.isEngaged
    });
  },

  // ─────────────────────────────────────────────
  // CONVERSION TRACKING
  // ─────────────────────────────────────────────

  /**
   * Conversion Event
   * Für Formulare, Kontakt-Klicks, etc.
   */
  trackConversion(type, value = null, currency = 'EUR') {
    const params = {
      conversion_type: type
    };

    if (value !== null) {
      params.value = value;
      params.currency = currency;
    }

    this.track('conversion', params);

    // Zusätzlich GA4 Standard-Events für bessere Reports
    if (type === 'contact' || type === 'inquiry' || type === 'form') {
      this.track('generate_lead', params);
    }
  },

  // ─────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────

  handleClick(event) {
    const target = event.target;
    
    // Button Clicks
    const button = target.closest('button, [role="button"], .btn');
    if (button) {
      const buttonText = (button.innerText || button.value || '').trim().substring(0, 100);
      const buttonId = button.id || button.name || button.className?.split(' ')[0] || 'unknown';

      // CTA-Keywords für Conversions
      const ctaKeywords = ['anfragen', 'kontakt', 'buchen', 'kaufen', 'bestellen', 'senden', 'submit', 'absenden'];
      const isConversionCTA = ctaKeywords.some(kw => buttonText.toLowerCase().includes(kw));

      this.track('cta_click', {
        button_text: buttonText,
        button_id: buttonId,
        is_conversion_cta: isConversionCTA
      });

      if (isConversionCTA) {
        this.trackConversion('cta_click');
      }

      this.isEngaged = true;
      return;
    }

    // Link Clicks
    const link = target.closest('a');
    if (!link || !link.href) return;

    const url = link.href;
    const linkText = (link.innerText || link.title || '').trim().substring(0, 100);

    // Downloads
    const downloadExtensions = /\.(pdf|zip|docx?|xlsx?|pptx?|mp3|mp4|txt|csv|rar|7z)$/i;
    if (downloadExtensions.test(url)) {
      const fileName = url.split('/').pop() || 'unknown';
      const fileExt = fileName.split('.').pop()?.toLowerCase() || 'unknown';

      this.track('file_download', {
        file_name: fileName,
        file_extension: fileExt,
        link_text: linkText,
        link_url: url
      });
      this.isEngaged = true;
      return;
    }

    // E-Mail Links
    if (url.startsWith('mailto:')) {
      const email = url.replace('mailto:', '').split('?')[0];
      this.track('contact_click', {
        method: 'email',
        contact_info: email
      });
      this.trackConversion('contact_email');
      this.isEngaged = true;
      return;
    }

    // Telefon Links
    if (url.startsWith('tel:')) {
      const phone = url.replace('tel:', '');
      this.track('contact_click', {
        method: 'phone',
        contact_info: phone
      });
      this.trackConversion('contact_phone');
      this.isEngaged = true;
      return;
    }

    // Externe Links (Outbound)
    try {
      const linkHost = new URL(url).hostname;
      if (linkHost && linkHost !== window.location.hostname) {
        this.track('outbound_click', {
          link_url: url,
          link_domain: linkHost,
          link_text: linkText
        });
      }
    } catch {
      // Invalid URL – ignorieren
    }
  },

  handleFormSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const formId = form.id || form.name || form.action || 'unknown_form';

    this.track('form_submit', {
      form_id: formId,
      form_destination: form.action || window.location.href,
      form_method: form.method || 'GET'
    });

    this.trackConversion('form_submission');
    this.isEngaged = true;
  },

  // ─────────────────────────────────────────────
  // INITIALISIERUNG
  // ─────────────────────────────────────────────

  init() {
    // Verhindere doppelte Initialisierung
    if (window.__analyticsInitialized) return;
    window.__analyticsInitialized = true;

    // 1. Page View
    this.track('page_view');

    // 2. Scroll Tracking (throttled)
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        this.checkScrollMilestones();
        scrollTimeout = null;
      }, 200);
    }, { passive: true });

    // 3. Heartbeat alle 30 Sekunden
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);

    // 4. Exit Tracking
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendExitEvent();
      }
    });

    // Fallback für ältere Browser / iOS Safari
    window.addEventListener('pagehide', () => this.sendExitEvent());

    // 5. Click Tracking
    document.addEventListener('click', (e) => this.handleClick(e), { capture: true });

    // 6. Form Tracking
    document.addEventListener('submit', (e) => this.handleFormSubmit(e), { capture: true });

    // Debug Info
    if (localStorage.getItem('analytics_debug') === 'true') {
      console.log('📊 Analytics v3.0 initialized', {
        clientId: this.getClientId(),
        session: this.getSession()
      });
    }
  },

  /**
   * Debug-Modus aktivieren
   * Aufruf: Analytics.enableDebug()
   */
  enableDebug() {
    localStorage.setItem('analytics_debug', 'true');
    this.debugMode = true;
    console.log('📊 Analytics Debug enabled. Events will appear in GA4 DebugView.');
  },

  /**
   * Debug-Modus deaktivieren
   */
  disableDebug() {
    localStorage.removeItem('analytics_debug');
    this.debugMode = false;
    console.log('📊 Analytics Debug disabled.');
  },

  /**
   * Manuelles Event senden
   * Aufruf: Analytics.event('custom_event', { key: 'value' })
   */
  event(name, params = {}) {
    return this.track(name, params);
  }
};

// ─────────────────────────────────────────────
// AUTO-START
// ─────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
  Analytics.init();
}

// Global verfügbar machen
window.Analytics = Analytics;

// ─────────────────────────────────────────────
// USAGE EXAMPLES
// ─────────────────────────────────────────────
//
// Automatisch getrackt:
// - page_view (beim Laden)
// - scroll (25%, 50%, 75%, 90%)
// - page_exit (beim Verlassen)
// - cta_click (Button-Klicks)
// - file_download (PDF, ZIP, etc.)
// - contact_click (mailto:, tel:)
// - outbound_click (externe Links)
// - form_submit (Formulare)
// - heartbeat (alle 30s)
//
// Manuell:
// Analytics.event('video_play', { video_id: 'xyz', video_title: 'Demo' });
// Analytics.trackConversion('purchase', 99.99);
// Analytics.trackConversion('newsletter_signup');
//
// Debug:
// Analytics.enableDebug();
// Analytics.disableDebug();
