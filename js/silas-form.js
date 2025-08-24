// silas-form.js - SAUBERE VERSION MIT MASTER-PASSWORT

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    
    if (!silasForm) {
        return;
    }

    // === MASTER PASSWORD SYSTEM ===
    const MASTER_PASSWORD = "SilasUnlimited2024!";
    
    // Master Mode Check
    function isMasterModeActive() {
        const masterMode = sessionStorage.getItem('silas_master_mode');
        const timestamp = parseInt(sessionStorage.getItem('silas_master_timestamp') || '0');
        const now = Date.now();
        
        if (masterMode === 'true' && (now - timestamp) < (8 * 60 * 60 * 1000)) {
            return true;
        }
        
        if (masterMode === 'true') {
            sessionStorage.removeItem('silas_master_mode');
            sessionStorage.removeItem('silas_master_timestamp');
        }
        
        return false;
    }

    // Demo Limits
    let DEMO_LIMITS = {
        maxKeywordsPerSession: 3,
        maxGenerationsPerHour: 5,
        maxGenerationsPerDay: 10,
        cooldownBetweenRequests: 30000
    };

    const MASTER_LIMITS = {
        maxKeywordsPerSession: 50,
        maxGenerationsPerHour: 100,
        maxGenerationsPerDay: 500,
        cooldownBetweenRequests: 1000
    };

    // Aktuelle Limits setzen
    if (isMasterModeActive()) {
        DEMO_LIMITS = Object.assign({}, MASTER_LIMITS);
        console.log('🔓 Master Mode bereits aktiv');
    }

    // Master Password UI
    function createMasterPasswordUI() {
        if (!isMasterModeActive() && !document.getElementById('master-unlock-btn')) {
            const unlockBtn = document.createElement('button');
            unlockBtn.id = 'master-unlock-btn';
            unlockBtn.innerHTML = '🔓';
            unlockBtn.title = 'Master Access';
            unlockBtn.style.cssText = 'position: fixed; bottom: 40px; right: 20px; background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); border: 2px solid #e0a800; color: #1a1a1a; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); transition: all 0.3s ease; z-index: 1000;';
            unlockBtn.onclick = function() {
                showPasswordPrompt();
            };
            document.body.appendChild(unlockBtn);
        }

        if (isMasterModeActive()) {
            showMasterModeIndicator();
        }
    }

    function showPasswordPrompt() {
        const password = prompt('🔓 Master-Passwort eingeben:');
        if (password === MASTER_PASSWORD) {
            activateMasterMode();
        } else if (password !== null) {
            alert('❌ Falsches Passwort!');
        }
    }

    function activateMasterMode() {
        sessionStorage.setItem('silas_master_mode', 'true');
        sessionStorage.setItem('silas_master_timestamp', Date.now().toString());
        
        DEMO_LIMITS = Object.assign({}, MASTER_LIMITS);
        
        localStorage.removeItem('silas_daily');
        localStorage.removeItem('silas_hourly');
        localStorage.removeItem('silas_last_request');
        
        showMasterModeIndicator();
        hideUnlockButton();
        showDemoStatus();
        
        showNotification('🔓 Master Mode aktiviert! Alle Beschränkungen aufgehoben.', '#28a745');
        
        console.log('🔓 Silas Master Mode aktiviert');
    }

    function showMasterModeIndicator() {
        const existing = document.getElementById('master-mode-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'master-mode-indicator';
        indicator.style.cssText = 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 20px; text-align: center; font-weight: bold; border-radius: 8px; margin: 15px 0; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); border: 2px solid #155724; position: relative;';
        indicator.innerHTML = '🔓 <strong>MASTER MODE AKTIV</strong> 🔓<br><small style="opacity: 0.9;">Unlimited Keywords • No Rate Limits • Full Access</small><button onclick="deactivateMasterMode()" style="position: absolute; top: 8px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;" title="Master Mode deaktivieren">×</button>';
        
        silasForm.parentNode.insertBefore(indicator, silasForm);
        
        window.deactivateMasterMode = function() {
            if (confirm('Master Mode deaktivieren? Die Seite wird neu geladen.')) {
                sessionStorage.removeItem('silas_master_mode');
                sessionStorage.removeItem('silas_master_timestamp');
                location.reload();
            }
        };
    }

    function hideUnlockButton() {
        const btn = document.getElementById('master-unlock-btn');
        if (btn) btn.style.display = 'none';
    }

    function showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: ' + (color || '#ffc107') + '; color: white; padding: 15px 25px; border-radius: 8px; font-weight: bold; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(function() {
            notification.remove();
        }, 4000);
    }

    // Rate Limit Functions
    function initDemoTracking() {
        const now = Date.now();
        const today = new Date().toDateString();
        
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        if (dailyData.date !== today) {
            localStorage.setItem('silas_daily', JSON.stringify({ date: today, count: 0 }));
        }
        
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        const currentHour = Math.floor(now / (1000 * 60 * 60));
        if (hourlyData.hour !== currentHour) {
            localStorage.setItem('silas_hourly', JSON.stringify({ hour: currentHour, count: 0 }));
        }
    }

    function checkRateLimit() {
        if (isMasterModeActive()) {
            console.log('🔓 Rate limit bypassed - Master Mode');
            return true;
        }
        
        const now = Date.now();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        const lastRequest = parseInt(localStorage.getItem('silas_last_request') || '0');
        
        if (now - lastRequest < DEMO_LIMITS.cooldownBetweenRequests) {
            const remainingSeconds = Math.ceil((DEMO_LIMITS.cooldownBetweenRequests - (now - lastRequest)) / 1000);
            throw new Error('⏱️ Bitte warte noch ' + remainingSeconds + ' Sekunden vor der nächsten Anfrage.');
        }
        
        if (dailyData.count >= DEMO_LIMITS.maxGenerationsPerDay) {
            throw new Error('📅 Tägliches Demo-Limit erreicht (' + DEMO_LIMITS.maxGenerationsPerDay + ' Generierungen). Versuche es morgen wieder.');
        }
        
        if (hourlyData.count >= DEMO_LIMITS.maxGenerationsPerHour) {
            throw new Error('⏰ Stündliches Demo-Limit erreicht (' + DEMO_LIMITS.maxGenerationsPerHour + ' Generierungen). Versuche es in einer Stunde wieder.');
        }
        
        return true;
    }

    function updateUsageCounters() {
        const now = Date.now();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        dailyData.count = (dailyData.count || 0) + 1;
        localStorage.setItem('silas_daily', JSON.stringify(dailyData));
        
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        hourlyData.count = (hourlyData.count || 0) + 1;
        localStorage.setItem('silas_hourly', JSON.stringify(hourlyData));
        
        localStorage.setItem('silas_last_request', now.toString());
        showDemoStatus();
    }

    function validateKeyword(keyword) {
        if (isMasterModeActive()) {
            if (keyword.length > 100) {
                throw new Error('📏 Keyword zu lang (max. 100 Zeichen im Master Mode).');
            }
            console.log('🔓 Keyword validation relaxed - Master Mode');
            return true;
        }
        
        const forbidden = ['adult', 'porn', 'sex', 'drugs', 'illegal', 'hack', 'crack', 'bitcoin', 'crypto', 'gambling', 'casino', 'pharma'];
        const lowerKeyword = keyword.toLowerCase();
        
        for (let i = 0; i < forbidden.length; i++) {
            if (lowerKeyword.indexOf(forbidden[i]) !== -1) {
                throw new Error('🚫 Das Keyword "' + keyword + '" ist für die Demo nicht erlaubt.');
            }
        }
        
        if (keyword.length > 50) {
            throw new Error('📏 Keywords dürfen maximal 50 Zeichen lang sein.');
        }
        
        if (!/^[a-zA-ZäöüÄÖÜß\s\-_0-9]+$/.test(keyword)) {
            throw new Error('✏️ Keywords dürfen nur Buchstaben, Zahlen, Leerzeichen und Bindestriche enthalten.');
        }
        
        return true;
    }

    function showDemoStatus() {
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        
        const dailyRemaining = DEMO_LIMITS.maxGenerationsPerDay - (dailyData.count || 0);
        const hourlyRemaining = DEMO_LIMITS.maxGenerationsPerHour - (hourlyData.count || 0);
        
        let demoStatusContainer = document.getElementById('silas-demo-status');
        if (!demoStatusContainer) {
            demoStatusContainer = document.createElement('div');
            demoStatusContainer.id = 'silas-demo-status';
            silasForm.parentNode.insertBefore(demoStatusContainer, silasForm);
        }
        
        if (isMasterModeActive()) {
            demoStatusContainer.innerHTML = '<div style="background: linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(32,201,151,0.1) 100%); border: 1px solid #28a745; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #28a745;"><strong>🔓 UNLIMITED MODE:</strong> Keine Beschränkungen aktiv | Keywords: <strong>Unlimited</strong> | Generierungen: <strong>Unlimited</strong><br><small style="color: #20c997; margin-top: 5px; display: block;">Master Access gewährt</small></div>';
        } else {
            demoStatusContainer.innerHTML = '<div style="background: linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%); border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #ffc107;"><strong>🎯 Demo-Modus:</strong> Heute noch <strong>' + dailyRemaining + '</strong> Generierungen | Diese Stunde noch <strong>' + hourlyRemaining + '</strong> Generierungen<br><small style="color: #ccc; margin-top: 5px; display: block;">Silas dient nur zu Demonstrationszwecken</small></div>';
        }
    }

    // Initialize
    initDemoTracking();
    showDemoStatus();
    createMasterPasswordUI();

    // DOM Elemente
    const keywordInput = document.getElementById('silas-keyword-input');
    const keywordDisplayList = document.getElementById('keyword-display-list');
    const startGenerationBtn = document.getElementById('start-generation-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    const silasStatus = document.getElementById('silas-status');
    const silasResponseContainer = document.getElementById('silas-response-container');
    const downloadCsvButton = document.getElementById('download-csv');
    const previewModal = document.getElementById('silas-preview-modal');
    const closePreviewModalBtn = document.getElementById('close-preview-modal');
    const previewContentArea = document.getElementById('preview-content-area');
    const textIntentSelect = document.getElementById('text-intent-select');

    let keywordList = [];
    let allGeneratedData = [];

    // Keywords hinzufügen
    function addKeywords() {
        try {
            const newKeywords = keywordInput.value.split(',').map(function(kw) {
                return kw.trim();
            }).filter(function(kw) {
                return kw.length > 0;
            });
            
            const currentIntent = textIntentSelect.value;
            
            // Keywords validieren
            for (let i = 0; i < newKeywords.length; i++) {
                validateKeyword(newKeywords[i]);
            }
            
            // Session-Limit prüfen (außer im Master Mode)
            if (!isMasterModeActive() && keywordList.length + newKeywords.length > DEMO_LIMITS.maxKeywordsPerSession) {
                throw new Error('🎯 Demo-Limit: Maximal ' + DEMO_LIMITS.maxKeywordsPerSession + ' Keywords pro Session erlaubt.');
            }
            
            newKeywords.forEach(function(keyword) {
                const existingIndex = keywordList.findIndex(function(item) {
                    return item.keyword === keyword;
                });
                
                if (existingIndex === -1) {
                    keywordList.push({
                        keyword: keyword,
                        intent: currentIntent
                    });
                } else {
                    keywordList[existingIndex].intent = currentIntent;
                }
            });
            
            if (newKeywords.length > 0) {
                updateKeywordDisplay();
                keywordInput.value = '';
                silasStatus.textContent = '✅ ' + newKeywords.length + ' Keyword(s) hinzugefügt.';
                setTimeout(function() {
                    silasStatus.textContent = 'Bereit zur Generierung.';
                }, 2000);
            }
            
        } catch (error) {
            silasStatus.textContent = error.message;
            silasStatus.style.color = '#ff6b6b';
            setTimeout(function() {
                silasStatus.textContent = 'Bereit zur Generierung.';
                silasStatus.style.color = '#ffc107';
            }, 4000);
        }
    }

   function updateKeywordDisplay() {
    keywordDisplayList.innerHTML = '';
    
    keywordList.forEach(function(item, index) {
        const listItem = document.createElement('li');
        
        // Intent Badge
        const intentBadge = document.createElement('span');
        intentBadge.textContent = item.intent === 'commercial' ? 'Kommerziell' : 'Informativ';
        
        // KORREKTE STIL-DEFINITION FÜR DAS BADGE (inkl. kleiner Schriftgröße)
        intentBadge.style.cssText = 'background-color: ' + (item.intent === 'commercial' ? '#28a745' : '#17a2b8') + '; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-top: 8px; display: inline-block;';
        
        // Keyword Text
        const keywordSpan = document.createElement('span');
        keywordSpan.textContent = item.keyword;
        keywordSpan.style.cssText = 'font-weight: 500; color: #fff; word-break: break-word; line-height: 1.4;';
        
        // Content Container
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'display: flex; flex-direction: column; flex-grow: 1; gap: 5px; min-width: 0;';
        contentDiv.appendChild(keywordSpan);
        contentDiv.appendChild(intentBadge);
        
        // Remove Button
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.style.cssText = 'background-color: #ff6b6b; color: white; border: none; border-radius: 6px; min-width: 36px; height: 36px; cursor: pointer; font-size: 18px; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 10px;';
        removeBtn.onclick = function() {
            keywordList.splice(index, 1);
            updateKeywordDisplay();
        };
        
        // List Item
        listItem.style.cssText = 'background-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px; padding: 15px; border-radius: 8px; display: flex; align-items: flex-start; justify-content: space-between; font-size: 0.95rem; color: #fff; border-left: 4px solid ' + (item.intent === 'commercial' ? '#28a745' : '#17a2b8') + '; min-height: 50px; gap: 10px;';
        
        listItem.appendChild(contentDiv);
        listItem.appendChild(removeBtn);
        keywordDisplayList.appendChild(listItem);
    });
    
    clearListBtn.style.display = keywordList.length > 0 ? 'inline-block' : 'none';
}
    // Event Listeners
    silasForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addKeywords();
    });
    
    keywordInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addKeywords();
        }
    });
    
    clearListBtn.addEventListener('click', function() {
        keywordList = [];
        allGeneratedData = [];
        updateKeywordDisplay();
        silasResponseContainer.innerHTML = '';
        silasResponseContainer.style.display = 'none';
        silasStatus.textContent = 'Bereit zur Generierung.';
    });

    // Hauptfunktion: Textgenerierung
    startGenerationBtn.addEventListener('click', async function() {
        try {
            if (keywordList.length === 0) {
                silasStatus.textContent = 'Bitte füge zuerst Keywords hinzu.';
                return;
            }

            // Rate Limit prüfen
            checkRateLimit();

            startGenerationBtn.disabled = true;
            allGeneratedData = [];
            
            silasResponseContainer.innerHTML = '<h3>Erstellung läuft...</h3><div id="silas-response-content"></div>';
            silasResponseContainer.style.display = 'block';
            
            const responseContent = document.getElementById('silas-response-content');

            for (let i = 0; i < keywordList.length; i++) {
                const item = keywordList[i];
                const keyword = item.keyword;
                const intent = item.intent;
                
                silasStatus.textContent = 'Generiere Text für "' + keyword + '" (' + (intent === 'commercial' ? 'Kommerziell' : 'Informativ') + ') (' + (i + 1) + '/' + keywordList.length + ')...';
                
                const userPrompt = createSilasPrompt(keyword, intent);

                try {
                    const response = await fetch('/api/generate', {
                        method: 'POST',
                        headers: Object.assign(
                            { 'Content-Type': 'application/json' },
                            isMasterModeActive() ? { 'X-Silas-Master': 'SilasUnlimited2024!' } : {}
                        ),
                        body: JSON.stringify({ prompt: userPrompt, keyword: keyword })
                    });

                    if (!response.ok) {
                        throw new Error('Server-Fehler: ' + await response.text());
                    }

                    const data = await response.json();
                    data.keyword = keyword;
                    data.intent = intent;
                    allGeneratedData.push(data);
                    displayResult(data, i, responseContent);

                } catch (error) {
                    console.error('Fehler bei der Textgenerierung:', error);
                    const errorData = {
                        keyword: keyword,
                        intent: intent,
                        error: error.message
                    };
                    allGeneratedData.push(errorData);
                    displayResult(errorData, i, responseContent);
                }
            }

            // Usage Counter aktualisieren
            updateUsageCounters();

            silasStatus.textContent = '✅ Alle ' + keywordList.length + ' Texte wurden generiert.';
            startGenerationBtn.disabled = false;
silasResponseContainer.querySelector('h3').textContent = 'Erstellung abgeschlossen!';
            
            // Download-Button hinzufügen
            if (!document.getElementById('download-csv-dynamic')) {
                const downloadButton = document.createElement('button');
                downloadButton.id = 'download-csv-dynamic';
                downloadButton.className = 'cta-button';
                downloadButton.innerHTML = '<i class="fas fa-download"></i> CSV Herunterladen';
                downloadButton.style.marginTop = '1rem';
                downloadButton.addEventListener('click', downloadCsv);
                silasResponseContainer.appendChild(downloadButton);
            }

        } catch (error) {
            silasStatus.textContent = error.message;
            silasStatus.style.color = '#ff6b6b';
            startGenerationBtn.disabled = false;
            
            setTimeout(function() {
                silasStatus.textContent = 'Bereit zur Generierung.';
                silasStatus.style.color = '#ffc107';
            }, 5000);
        }
    });

    // Prompt erstellen - UMFANGREICHE VERSION
    function createSilasPrompt(keyword, intent) {
        let roleAndTask = '';
        if (intent === 'commercial') {
            roleAndTask = 'Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet. Erstelle einen kommerziell ausgerichteten Text.';
        } else {
            roleAndTask = 'Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich. Erstelle einen informationsorientierten Text.';
        }

        return `
Du bist ein erstklassiger SEO-Content-Strategist. Erstelle vollständigen Landingpage-Content für das Thema "${keyword}".

ROLLE: ${roleAndTask}

WICHTIG: Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }. Gib keine Markdown-Formatierung oder andere Texte aus.

Das JSON-Objekt muss ALLE folgenden Felder enthalten und mit umfangreichem, hochwertigem Content füllen:

{
  "post_title": "SEO-optimierter Titel (50-60 Zeichen) für ${keyword}",
  "post_name": "seo-freundlicher-url-slug-fuer-${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "meta_title": "Alternativer SEO-Titel (50-60 Zeichen) für ${keyword}",
  "meta_description": "Fesselnde Meta-Beschreibung (150-160 Zeichen) mit CTA für ${keyword}",
  "h1": "Kraftvolle H1-Überschrift für ${keyword}, die den Hauptnutzen kommuniziert",
  "h2_1": "Erste H2-Überschrift (Problemorientiert) für ${keyword}",
  "h2_2": "Zweite H2-Überschrift (Lösungsorientiert) für ${keyword}",
  "h2_3": "Dritte H2-Überschrift (Feature-/Nutzen-orientiert) für ${keyword}",
  "h2_4": "Vierte H2-Überschrift (Vertrauensbildend) für ${keyword}",
  "primary_cta": "Kurzer, starker Call-to-Action Text (z.B. 'Jetzt ${keyword} anfragen')",
  "secondary_cta": "Alternativer, sanfterer Call-to-Action (z.B. 'Mehr über ${keyword} erfahren')",
  "hero_text": "Fesselnder Einleitungstext für den Hero-Bereich (50-80 Wörter) über ${keyword}",
  "hero_subtext": "Unterstützende Unterüberschrift für den Hero-Bereich (20-30 Wörter) zu ${keyword}",
  "benefits_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 überzeugenden Vorteilen von ${keyword}",
  "features_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 konkreten Merkmalen/Features von ${keyword}",
  "social_proof": "Kurzer Satz über soziale Bewährtheit (z.B. 'Von über 1.000 zufriedenen ${keyword}-Kunden genutzt')",
  "testimonial_1": "Glaubwürdiges, fiktives Kunden-Testimonial mit Name und Aussage zu ${keyword}",
  "testimonial_2": "Zweites, andersartiges Kunden-Testimonial mit Name und Aussage zu ${keyword}",
  "pricing_title": "Überschrift für den Preisbereich (z.B. 'Wählen Sie Ihren ${keyword}-Plan')",
  "price_1": "Beschreibung für das erste ${keyword}-Preispaket (Starter/Basic)",
  "price_2": "Beschreibung für das zweite ${keyword}-Preispaket (Professional)",
  "price_3": "Beschreibung für das dritte ${keyword}-Preispaket (Enterprise/Premium)",
  "faq_1": "Erste häufig gestellte Frage zu ${keyword}",
  "faq_answer_1": "Ausführliche Antwort auf die erste ${keyword}-Frage (30-50 Wörter)",
  "faq_2": "Zweite häufig gestellte Frage zu ${keyword}",
  "faq_answer_2": "Ausführliche Antwort auf die zweite ${keyword}-Frage (30-50 Wörter)",
  "faq_3": "Dritte häufig gestellte Frage zu ${keyword}",
  "faq_answer_3": "Ausführliche Antwort auf die dritte ${keyword}-Frage (30-50 Wörter)",
  "contact_info": "Kurze Kontaktinformation oder Hinweis für ${keyword} (z.B. 'Fragen zu ${keyword}? Rufen Sie uns an: ...')",
  "footer_cta": "Letzter Call-to-Action für den Footer (z.B. 'Starten Sie noch heute Ihr ${keyword}-Projekt')",
  "trust_signals": "Kurzer Text mit Vertrauenssignalen für ${keyword} (z.B. 'Zertifiziert • Sicher • ${keyword}-Experten')",
  "guarantee_text": "Satz über Garantie für ${keyword} (z.B. '30-Tage-Geld-zurück-Garantie für alle ${keyword}-Services')"
}

QUALITÄTS-ANFORDERUNGEN:
- Jedes Textfeld muss mindestens 10-15 Wörter enthalten (außer CTAs)
- Hero-Text: 50-80 Wörter
- FAQ-Antworten: 30-50 Wörter
- Benefits/Features: Jeweils 4-6 Listenelemente mit ausführlichen Beschreibungen
- Testimonials: Vollständige Zitate mit Namen und Firma
- Alle Texte müssen spezifisch auf "${keyword}" bezogen sein
- Professioneller, überzeugender Ton
- SEO-optimiert aber natürlich lesbar
- Verwende deutsche Sprache
- Alle Listen müssen vollständige HTML-Markup enthalten

Erstelle jetzt das vollständige JSON-Objekt mit umfangreichem Content für "${keyword}":
        `;
    }

    // Ergebnis anzeigen
    function displayResult(data, index, container) {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.style.cssText = 'background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ' + (data.intent === 'commercial' ? '#28a745' : '#17a2b8') + ';';
        
        if (data.error) {
            resultCard.innerHTML = '<h4 style="color: #ff6b6b; margin: 0 0 10px 0;">' + data.keyword + '</h4><span style="background-color: ' + (data.intent === 'commercial' ? '#28a745' : '#17a2b8') + '; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-bottom: 10px; display: inline-block;">' + (data.intent === 'commercial' ? 'Kommerziell' : 'Informativ') + '</span><p style="color: #ff6b6b; margin: 0;">Fehler: ' + data.error + '</p>';
        } else {
            resultCard.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;"><h4 style="color: #fff; margin: 0; flex-grow: 1;">' + data.keyword + '</h4><span style="background-color: ' + (data.intent === 'commercial' ? '#28a745' : '#17a2b8') + '; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">' + (data.intent === 'commercial' ? 'Kommerziell' : 'Informativ') + '</span></div><p style="margin: 5px 0; color: #ccc;"><strong>Titel:</strong> ' + (data.post_title || 'N/A') + '</p><p style="margin: 5px 0; color: #ccc;"><strong>Meta:</strong> ' + (data.meta_description || 'N/A') + '</p><button class="preview-btn" data-index="' + index + '" style="background-color: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Vorschau anzeigen</button>';
        }
        container.appendChild(resultCard);
    }

    // Modal Funktionen
    const openPreviewModal = function() {
        if (previewModal) {
            previewModal.classList.add('visible');
        }
    };
    
    const closePreviewModal = function() {
        if (previewModal) {
            previewModal.classList.remove('visible');
        }
    };

    if (closePreviewModalBtn) {
        closePreviewModalBtn.addEventListener('click', closePreviewModal);
    }
    
    if (previewModal) {
        previewModal.addEventListener('click', function(e) {
            if (e.target === previewModal) closePreviewModal();
        });
    }

    // Vorschau Event Delegation - VOLLSTÄNDIGE VORSCHAU
    silasResponseContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('preview-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const data = allGeneratedData[index];
            
            if (data && !data.error && previewContentArea) {
                // Vollständige Landingpage-Vorschau mit allen Daten
                let previewHtml = `
                    <div class="preview-landingpage" style="color: #f0f0f0; line-height: 1.6; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 20px; border-radius: 10px;">
                        <!-- Header/Hero Section -->
                        <header style="text-align: center; margin-bottom: 40px; padding: 30px 0; border-bottom: 2px solid #ffc107;">
                            <h1 style="color: #ffc107; font-size: 2.5rem; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${data.h1 || 'Keine H1 verfügbar'}</h1>
                            <p style="font-size: 1.2rem; color: #ccc; margin-bottom: 15px; max-width: 800px; margin-left: auto; margin-right: auto;">${data.hero_text || 'Kein Hero-Text verfügbar'}</p>
                            <p style="font-size: 1rem; color: #aaa; margin-bottom: 25px;">${data.hero_subtext || ''}</p>
                            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                                <button style="background: #ffc107; color: #1a1a1a; border: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; cursor: pointer;">${data.primary_cta || 'Jetzt anfragen'}</button>
                                <button style="background: transparent; color: #ffc107; border: 2px solid #ffc107; padding: 12px 25px; border-radius: 5px; font-weight: bold; cursor: pointer;">${data.secondary_cta || 'Mehr erfahren'}</button>
                            </div>
                        </header>

                        <!-- Content Sections -->
                        <main style="max-width: 1000px; margin: 0 auto;">
                            <!-- Problem Section -->
                            <section style="margin-bottom: 40px; padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #ff6b6b;">
                                <h2 style="color: #ff6b6b; margin-bottom: 15px; font-size: 1.8rem;">${data.h2_1 || 'Problemstellung'}</h2>
                                <p style="color: #ccc; margin-bottom: 20px;">Verstehen Sie die Herausforderungen in diesem Bereich und warum eine professionelle Lösung wichtig ist.</p>
                            </section>

                            <!-- Solution Section -->
                            <section style="margin-bottom: 40px; padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #28a745;">
                                <h2 style="color: #28a745; margin-bottom: 15px; font-size: 1.8rem;">${data.h2_2 || 'Unsere Lösung'}</h2>
                                <p style="color: #ccc; margin-bottom: 20px;">So bieten wir Ihnen die optimale Lösung für Ihre spezifischen Anforderungen.</p>
                            </section>

                            <!-- Features & Benefits -->
                            <section style="margin-bottom: 40px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                                    <div style="padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px;">
                                        <h3 style="color: #ffc107; margin-bottom: 15px; font-size: 1.5rem;">${data.h2_3 || 'Features'}</h3>
                                        <div style="color: #ccc;">${data.features_list || '<ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul>'}</div>
                                    </div>
                                    <div style="padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px;">
                                        <h3 style="color: #ffc107; margin-bottom: 15px; font-size: 1.5rem;">Vorteile</h3>
                                        <div style="color: #ccc;">${data.benefits_list || '<ul><li>Vorteil 1</li><li>Vorteil 2</li><li>Vorteil 3</li></ul>'}</div>
                                    </div>
                                </div>
                            </section>

                            <!-- Trust Section -->
                            <section style="margin-bottom: 40px; padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #17a2b8;">
                                <h2 style="color: #17a2b8; margin-bottom: 15px; font-size: 1.8rem;">${data.h2_4 || 'Vertrauen & Qualität'}</h2>
                                <p style="color: #ffc107; font-weight: bold; text-align: center; margin-bottom: 20px;">${data.social_proof || 'Vertrauenssignale'}</p>
                                <p style="color: #aaa; text-align: center;">${data.trust_signals || 'Zertifiziert • Sicher • Garantiert'}</p>
                            </section>

                            <!-- Testimonials -->
                            <section style="margin-bottom: 40px;">
                                <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.8rem;">Kundenstimmen</h3>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div style="padding: 20px; background-color: rgba(255,193,7,0.1); border-radius: 8px; border-left: 4px solid #ffc107;">
                                        <p style="color: #ccc; font-style: italic; margin-bottom: 10px;">${data.testimonial_1 || 'Ausgezeichneter Service und professionelle Betreuung!'}</p>
                                    </div>
                                    <div style="padding: 20px; background-color: rgba(255,193,7,0.1); border-radius: 8px; border-left: 4px solid #ffc107;">
                                        <p style="color: #ccc; font-style: italic; margin-bottom: 10px;">${data.testimonial_2 || 'Kann ich nur weiterempfehlen!'}</p>
                                    </div>
                                </div>
                            </section>

                            <!-- Pricing -->
                            <section style="margin-bottom: 40px;">
                                <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.8rem;">${data.pricing_title || 'Unsere Pakete'}</h3>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                                    <div style="padding: 20px; background-color: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                                        <h4 style="color: #ffc107; margin-bottom: 10px;">Starter</h4>
                                        <p style="color: #ccc; font-size: 0.9rem;">${data.price_1 || 'Grundpaket für den Einstieg'}</p>
                                    </div>
                                    <div style="padding: 20px; background-color: rgba(255,193,7,0.1); border: 2px solid #ffc107; border-radius: 8px; text-align: center;">
                                        <h4 style="color: #ffc107; margin-bottom: 10px;">Professional</h4>
                                        <p style="color: #ccc; font-size: 0.9rem;">${data.price_2 || 'Erweiterte Funktionen'}</p>
                                    </div>
                                    <div style="padding: 20px; background-color: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                                        <h4 style="color: #ffc107; margin-bottom: 10px;">Enterprise</h4>
                                        <p style="color: #ccc; font-size: 0.9rem;">${data.price_3 || 'Vollständige Lösung'}</p>
                                    </div>
                                </div>
                            </section>

                            <!-- FAQ -->
                            <section style="margin-bottom: 40px;">
                                <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.8rem;">Häufige Fragen</h3>
                                <div style="space-y: 15px;">
                                    <details style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                                        <summary style="color: #ffc107; font-weight: bold; cursor: pointer; margin-bottom: 10px;">${data.faq_1 || 'Wie funktioniert der Service?'}</summary>
                                        <p style="color: #ccc; margin-top: 10px;">${data.faq_answer_1 || 'Detaillierte Antwort auf die erste Frage.'}</p>
                                    </details>
                                    <details style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                                        <summary style="color: #ffc107; font-weight: bold; cursor: pointer; margin-bottom: 10px;">${data.faq_2 || 'Was sind die Kosten?'}</summary>
                                        <p style="color: #ccc; margin-top: 10px;">${data.faq_answer_2 || 'Detaillierte Antwort auf die zweite Frage.'}</p>
                                    </details>
                                    <details style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                                        <summary style="color: #ffc107; font-weight: bold; cursor: pointer; margin-bottom: 10px;">${data.faq_3 || 'Wie ist der Support?'}</summary>
                                        <p style="color: #ccc; margin-top: 10px;">${data.faq_answer_3 || 'Detaillierte Antwort auf die dritte Frage.'}</p>
                                    </details>
                                </div>
                            </section>

                            <!-- Guarantee -->
                            <section style="text-align: center; padding: 30px; background: linear-gradient(45deg, rgba(255,193,7,0.1), rgba(255,193,7,0.2)); border-radius: 10px; border: 2px solid #ffc107;">
                                <h3 style="color: #ffc107; margin-bottom: 15px;">${data.guarantee_text || 'Unsere Garantie'}</h3>
                                <p style="color: #ccc; margin-bottom: 25px;">${data.contact_info || 'Kontaktieren Sie uns für weitere Informationen.'}</p>
                                <button style="background: #ffc107; color: #1a1a1a; border: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 1.1rem;">${data.footer_cta || 'Jetzt starten'}</button>
                            </section>
                        </main>

                        <!-- SEO Meta Info - KOMPLETT GETRENNT -->
                        <div style="margin-top: 50px; padding: 0; clear: both;"></div>
                        
                        <section style="margin-top: 30px; padding: 25px; background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(45,45,45,0.7) 100%); border-radius: 12px; border: 2px solid #444;">
                            <h3 style="color: #ffc107; margin: 0 0 25px 0; text-align: center; font-size: 1.5rem; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">📊 SEO & Meta-Informationen</h3>
                            
                            <div style="display: flex; flex-direction: column; gap: 20px; max-width: 100%;">
                                <div style="padding: 15px; background: linear-gradient(90deg, rgba(40,167,69,0.1) 0%, rgba(40,167,69,0.05) 100%); border-radius: 8px; border-left: 4px solid #28a745;">
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <strong style="color: #28a745; font-size: 1rem;">🎯 SEO Titel:</strong>
                                        <span style="color: #e9e9e9; font-size: 0.95rem; line-height: 1.4; word-wrap: break-word;">${data.meta_title || data.post_title || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div style="padding: 15px; background: linear-gradient(90deg, rgba(23,162,184,0.1) 0%, rgba(23,162,184,0.05) 100%); border-radius: 8px; border-left: 4px solid #17a2b8;">
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <strong style="color: #17a2b8; font-size: 1rem;">🔗 URL Slug:</strong>
                                        <span style="color: #e9e9e9; font-size: 0.95rem; line-height: 1.4; word-wrap: break-word; font-family: monospace; background-color: rgba(0,0,0,0.3); padding: 5px 8px; border-radius: 4px;">${data.post_name || 'n-a'}</span>
                                    </div>
                                </div>
                                
                                <div style="padding: 15px; background: linear-gradient(90deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%); border-radius: 8px; border-left: 4px solid #ffc107;">
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <strong style="color: #ffc107; font-size: 1rem;">📝 Meta Description:</strong>
                                        <span style="color: #e9e9e9; font-size: 0.95rem; line-height: 1.4; word-wrap: break-word;">${data.meta_description || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                `;
                previewContentArea.innerHTML = previewHtml;
                openPreviewModal();
            }
        }
    });

    // CSV Download
    function downloadCsv() {
        if (allGeneratedData.length === 0) {
            alert('Keine Daten zum Download verfügbar.');
            return;
        }

        const headers = [
            "keyword", "post_title", "post_name", "meta_title", "meta_description", "h1",
            "h2_1", "h2_2", "h2_3", "h2_4", "primary_cta", "secondary_cta", "hero_text",
            "hero_subtext", "benefits_list", "features_list", "social_proof", "testimonial_1",
            "testimonial_2", "pricing_title", "price_1", "price_2", "price_3", "faq_1",
            "faq_answer_1", "faq_2", "faq_answer_2", "faq_3", "faq_answer_3", "contact_info",
            "footer_cta", "trust_signals", "guarantee_text"
        ];

        let csvContent = headers.join(",") + "\n";
        
        allGeneratedData.forEach(function(rowData) {
            if (rowData.error) return;
            
            const values = headers.map(function(header) {
                const value = String(rowData[header] || '');
                return '"' + value.replace(/"/g, '""') + '"';
            });
            csvContent += values.join(",") + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "silas_generated_content.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    if (downloadCsvButton) {
        downloadCsvButton.addEventListener('click', downloadCsv);
    }
}
