// js/silas-form.js - FINALE, VOLLSTÄNDIGE & KORRIGIERTE VERSION

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) {
        return; // Funktion beenden, wenn das Formular nicht auf der Seite ist
    }

    // =================================================================================
    // 1. KONSTANTEN, VARIABLEN & DOM-ELEMENTE
    // =================================================================================

    const MASTER_PASSWORD = "SilasUnlimited2024!";
    const DEMO_LIMITS = { maxKeywordsPerSession: 3, maxGenerationsPerHour: 5, maxGenerationsPerDay: 10, cooldownBetweenRequests: 30000 };
    const MASTER_LIMITS = { maxKeywordsPerSession: 50, maxGenerationsPerHour: 100, maxGenerationsPerDay: 500, cooldownBetweenRequests: 1000 };
    
    let currentLimits = { ...DEMO_LIMITS };
    let keywordList = [];
    let allGeneratedData = [];

    // --- DOM-Elemente ---
    const keywordInput = document.getElementById('silas-keyword-input');
    const keywordDisplayList = document.getElementById('keyword-display-list');
    const startGenerationBtn = document.getElementById('start-generation-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    const statusDisplay = document.getElementById('silas-status');
    const responseContainer = document.getElementById('silas-response-container');
    const textIntentSelect = document.getElementById('text-intent-select');

    // --- Modal-Elemente ---
    const previewModal = document.getElementById('silas-preview-modal');
    const closePreviewModalBtn = document.getElementById('close-preview-modal');
    const previewContentArea = document.getElementById('preview-content-area');


    // =================================================================================
    // 2. MASTER-PASSWORT & LIMIT-SYSTEM (aus deinem Skript übernommen)
    // =================================================================================
    
    function isMasterModeActive() {
        const masterMode = sessionStorage.getItem('silas_master_mode');
        const timestamp = parseInt(sessionStorage.getItem('silas_master_timestamp') || '0');
        if (masterMode === 'true' && (Date.now() - timestamp) < (8 * 60 * 60 * 1000)) {
            return true;
        }
        if (masterMode === 'true') { // remove expired session
            sessionStorage.removeItem('silas_master_mode');
            sessionStorage.removeItem('silas_master_timestamp');
        }
        return false;
    }

    function activateMasterMode() {
        sessionStorage.setItem('silas_master_mode', 'true');
        sessionStorage.setItem('silas_master_timestamp', Date.now().toString());
        localStorage.removeItem('silas_daily');
        localStorage.removeItem('silas_hourly');
        localStorage.removeItem('silas_last_request');
        showNotification('🔓 Master Mode aktiviert! Alle Beschränkungen aufgehoben.', 'success');
        initialize(); // UI und Status neu laden
    }

    window.deactivateMasterMode = function() {
        if (confirm('Master Mode deaktivieren? Die Seite wird neu geladen.')) {
            sessionStorage.removeItem('silas_master_mode');
            sessionStorage.removeItem('silas_master_timestamp');
            location.reload();
        }
    };
    
    function checkRateLimit() {
        if (isMasterModeActive()) return true;
        
        const now = Date.now();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        const lastRequest = parseInt(localStorage.getItem('silas_last_request') || '0');

        if (now - lastRequest < currentLimits.cooldownBetweenRequests) throw new Error(`⏱️ Bitte warte noch ${Math.ceil((currentLimits.cooldownBetweenRequests - (now - lastRequest)) / 1000)}s.`);
        if (dailyData.count >= currentLimits.maxGenerationsPerDay) throw new Error('📅 Tägliches Demo-Limit erreicht.');
        if (hourlyData.count >= currentLimits.maxGenerationsPerHour) throw new Error('⏰ Stündliches Demo-Limit erreicht.');
        
        return true;
    }
    
    function updateUsageCounters() {
        if (isMasterModeActive()) return;
        const now = Date.now();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{"count":0}');
        dailyData.count++;
        localStorage.setItem('silas_daily', JSON.stringify({ ...dailyData, date: new Date().toDateString() }));
        
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{"count":0}');
        hourlyData.count++;
        localStorage.setItem('silas_hourly', JSON.stringify({ ...hourlyData, hour: Math.floor(now / 3600000) }));
        
        localStorage.setItem('silas_last_request', now.toString());
        updateLimitStatusDisplay();
    }


    // =================================================================================
    // 3. PROMPT-ERSTELLUNG (Dein Kernstück, 1:1 übernommen)
    // =================================================================================

    function createSilasPrompt(keyword, intent) {
        const roleAndTask = intent === 'commercial' 
            ? 'Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet. Erstelle einen kommerziell ausgerichteten Text.'
            : 'Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich. Erstelle einen informationsorientierten Text.';

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

    // =================================================================================
    // 4. UI-HELFERFUNKTIONEN (Anzeige, Benachrichtigungen, etc.)
    // =================================================================================

    function updateKeywordDisplay() {
        keywordDisplayList.innerHTML = '';
        keywordList.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.style.borderLeftColor = item.intent === 'commercial' ? '#28a745' : '#17a2b8';
            listItem.innerHTML = `
                <div class="content-wrapper">
                    <span class="keyword-text">${item.keyword}</span>
                    <span class="intent-badge" style="background-color: ${item.intent === 'commercial' ? '#28a745' : '#17a2b8'};">${item.intent === 'commercial' ? 'Kommerziell' : 'Informativ'}</span>
                </div>
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            keywordDisplayList.appendChild(listItem);
        });
        clearListBtn.style.display = keywordList.length > 0 ? 'inline-block' : 'none';
    }

    function showStatusMessage(message, type = 'info') {
        statusDisplay.textContent = message;
        statusDisplay.className = `status-${type}`;
        if (type === 'error' || type === 'success') {
            setTimeout(() => {
                statusDisplay.textContent = 'Bereit zur Generierung.';
                statusDisplay.className = 'status-info';
            }, 5000);
        }
    }

    function toggleUI(enabled) {
        startGenerationBtn.disabled = !enabled;
        clearListBtn.disabled = !enabled;
        keywordInput.disabled = !enabled;
        textIntentSelect.disabled = !enabled;
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    function updateLimitStatusDisplay() {
        let container = document.getElementById('silas-demo-status');
        if (!container) {
            container = document.createElement('div');
            container.id = 'silas-demo-status';
            silasForm.parentNode.insertBefore(container, silasForm);
        }
        
        if (isMasterModeActive()) {
            container.innerHTML = `<div class="status-box master"><strong>🔓 MASTER MODE AKTIV</strong><br><small>Alle Beschränkungen sind aufgehoben.</small></div>`;
        } else {
            const daily = JSON.parse(localStorage.getItem('silas_daily') || '{}');
            const hourly = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
            const dailyRem = currentLimits.maxGenerationsPerDay - (daily.count || 0);
            const hourlyRem = currentLimits.maxGenerationsPerHour - (hourly.count || 0);
            container.innerHTML = `<div class="status-box demo"><strong>🎯 Demo-Modus:</strong> ${dailyRem} Generierungen heute / ${hourlyRem} diese Stunde.</div>`;
        }
    }
    
    function showPreviewModal(index) {
        const data = allGeneratedData[index];
        if (!data || data.error) return;

        // ** Dein detaillierter HTML-Code für die Vorschau - 1:1 übernommen **
        let previewHtml = `
            <div class="preview-landingpage">
                <header>
                    <h1>${data.h1 || 'Keine H1 verfügbar'}</h1>
                    <p>${data.hero_text || 'Kein Hero-Text verfügbar'}</p>
                    <p><small>${data.hero_subtext || ''}</small></p>
                    <div>
                        <button class="primary-cta">${data.primary_cta || 'Jetzt anfragen'}</button>
                        <button class="secondary-cta">${data.secondary_cta || 'Mehr erfahren'}</button>
                    </div>
                </header>
                <main>
                    <section><h2 style="color: #ff6b6b;">${data.h2_1 || 'Problemstellung'}</h2></section>
                    <section><h2 style="color: #28a745;">${data.h2_2 || 'Unsere Lösung'}</h2></section>
                    <section class="grid-2">
                        <div><h3>${data.h2_3 || 'Features'}</h3><div>${data.features_list || ''}</div></div>
                        <div><h3>Vorteile</h3><div>${data.benefits_list || ''}</div></div>
                    </section>
                    <section><h2 style="color: #17a2b8;">${data.h2_4 || 'Vertrauen & Qualität'}</h2><p>${data.social_proof || ''}</p></section>
                    <section class="grid-2">
                        <div><blockquote>${data.testimonial_1 || ''}</blockquote></div>
                        <div><blockquote>${data.testimonial_2 || ''}</blockquote></div>
                    </section>
                    <section>
                        <h3>${data.pricing_title || 'Unsere Pakete'}</h3>
                        <div class="grid-3">
                            <div><h4>Starter</h4><p>${data.price_1 || ''}</p></div>
                            <div class="highlight"><h4>Professional</h4><p>${data.price_2 || ''}</p></div>
                            <div><h4>Enterprise</h4><p>${data.price_3 || ''}</p></div>
                        </div>
                    </section>
                    <section>
                        <h3>Häufige Fragen</h3>
                        <details><summary>${data.faq_1 || ''}</summary><p>${data.faq_answer_1 || ''}</p></details>
                        <details><summary>${data.faq_2 || ''}</summary><p>${data.faq_answer_2 || ''}</p></details>
                        <details><summary>${data.faq_3 || ''}</summary><p>${data.faq_answer_3 || ''}</p></details>
                    </section>
                    <section class="final-cta">
                        <h3>${data.guarantee_text || 'Unsere Garantie'}</h3>
                        <p>${data.contact_info || ''}</p>
                        <button class="primary-cta">${data.footer_cta || 'Jetzt starten'}</button>
                    </section>
                </main>
                <aside class="seo-info">
                    <h3>📊 SEO & Meta-Informationen</h3>
                    <p><strong>SEO Titel:</strong> ${data.meta_title || data.post_title || 'N/A'}</p>
                    <p><strong>URL Slug:</strong> <code>${data.post_name || 'n-a'}</code></p>
                    <p><strong>Meta Description:</strong> ${data.meta_description || 'N/A'}</p>
                </aside>
            </div>
        `;
        previewContentArea.innerHTML = previewHtml;
        previewModal.classList.add('visible');
    }

    // =================================================================================
    // 5. KERNLOGIK (Keyword-Handling, Generierung, Download)
    // =================================================================================

    function addKeywordsFromInput() {
        try {
            const newKeywords = keywordInput.value.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);
            if (newKeywords.length === 0) return;

            if (!isMasterModeActive() && (keywordList.length + newKeywords.length) > currentLimits.maxKeywordsPerSession) {
                throw new Error(`🎯 Demo-Limit: Maximal ${currentLimits.maxKeywordsPerSession} Keywords erlaubt.`);
            }

            newKeywords.forEach(keyword => {
                if (!keywordList.some(item => item.keyword === keyword)) {
                    keywordList.push({ keyword: keyword, intent: textIntentSelect.value });
                }
            });
            
            updateKeywordDisplay();
            keywordInput.value = '';
            showStatusMessage(`✅ ${newKeywords.length} Keyword(s) hinzugefügt.`, 'success');
        } catch (error) {
            showStatusMessage(error.message, 'error');
        }
    }

    async function startGeneration() {
        if (keywordList.length === 0) return showStatusMessage('Bitte füge zuerst Keywords hinzu.', 'error');
        try { checkRateLimit(); } catch (e) { return showStatusMessage(e.message, 'error'); }

        toggleUI(false);
        allGeneratedData = [];
        responseContainer.style.display = 'block';
        responseContainer.innerHTML = '<h3>Erstellung läuft...</h3><div id="silas-response-content"></div>';
        const responseContent = document.getElementById('silas-response-content');

        for (let i = 0; i < keywordList.length; i++) {
            const item = keywordList[i];
            showStatusMessage(`Generiere für "${item.keyword}" (${i + 1}/${keywordList.length})...`);
            
            try {
                const prompt = createSilasPrompt(item.keyword, item.intent);
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(isMasterModeActive() && { 'X-Silas-Master': MASTER_PASSWORD })
                    },
                    body: JSON.stringify({ prompt, keyword: item.keyword })
                });

                if (!response.ok) throw new Error(`Server-Fehler: ${await response.text()}`);

                const data = await response.json();
                data.keyword = item.keyword;
                data.intent = item.intent;
                allGeneratedData.push(data);
                displayResultCard(data, i, responseContent);

            } catch (error) {
                const errorData = { keyword: item.keyword, intent: item.intent, error: error.message };
                allGeneratedData.push(errorData);
                displayResultCard(errorData, i, responseContent);
            }
        }
        
        responseContainer.querySelector('h3').textContent = 'Erstellung abgeschlossen!';
        if (allGeneratedData.some(d => !d.error)) {
            const downloadButton = document.createElement('button');
            downloadButton.className = 'cta-button';
            downloadButton.innerHTML = '<i class="fas fa-download"></i> CSV Herunterladen';
            downloadButton.onclick = downloadCsv;
            responseContainer.appendChild(downloadButton);
        }
        updateUsageCounters();
        toggleUI(true);
    }
    
    function displayResultCard(data, index, container) {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.style.borderLeftColor = data.intent === 'commercial' ? '#28a745' : '#17a2b8';
        
        if (data.error) {
            resultCard.innerHTML = `<h4 style="color: #ff6b6b;">${data.keyword}</h4><p class="error-message">Fehler: ${data.error}</p>`;
        } else {
            resultCard.innerHTML = `
                <div class="result-header">
                    <h4>${data.keyword}</h4>
                    <span class="intent-badge">${data.intent === 'commercial' ? 'Kommerziell' : 'Informativ'}</span>
                </div>
                <p><strong>Titel:</strong> ${data.post_title || 'N/A'}</p>
                <button class="preview-btn" data-index="${index}">Vorschau anzeigen</button>
            `;
        }
        container.appendChild(resultCard);
    }

    function downloadCsv() {
        // Diese Funktion bleibt identisch zu deiner Vorlage.
        if (allGeneratedData.length === 0) return alert('Keine Daten zum Download verfügbar.');
        const headers = ["keyword", "post_title", "post_name", "meta_title", "meta_description", "h1", "h2_1", "h2_2", "h2_3", "h2_4", "primary_cta", "secondary_cta", "hero_text", "hero_subtext", "benefits_list", "features_list", "social_proof", "testimonial_1", "testimonial_2", "pricing_title", "price_1", "price_2", "price_3", "faq_1", "faq_answer_1", "faq_2", "faq_answer_2", "faq_3", "faq_answer_3", "contact_info", "footer_cta", "trust_signals", "guarantee_text"];
        let csvContent = headers.join(",") + "\n";
        allGeneratedData.forEach(rowData => {
            if (rowData.error) return;
            const values = headers.map(header => `"${String(rowData[header] || '').replace(/"/g, '""')}"`);
            csvContent += values.join(",") + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "silas_generated_content.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // =================================================================================
    // 6. INITIALISIERUNG & EVENT LISTENERS
    // =================================================================================

    function initialize() {
        if (isMasterModeActive()) {
            currentLimits = { ...MASTER_LIMITS };
            const btn = document.getElementById('master-unlock-btn');
            if (btn) btn.remove();
        } else {
            currentLimits = { ...DEMO_LIMITS };
            if (!document.getElementById('master-unlock-btn')) {
                const unlockBtn = document.createElement('button');
                unlockBtn.id = 'master-unlock-btn';
                unlockBtn.innerHTML = '🔓';
                unlockBtn.title = 'Master Access';
                unlockBtn.onclick = () => {
                    const password = prompt('🔓 Master-Passwort eingeben:');
                    if (password === MASTER_PASSWORD) activateMasterMode();
                    else if (password) alert('❌ Falsches Passwort!');
                };
                document.body.appendChild(unlockBtn);
            }
        }
        updateLimitStatusDisplay();
        updateKeywordDisplay();
        showStatusMessage('Bereit zur Generierung.');
    }

    // --- Event Listeners ---
    silasForm.addEventListener('submit', (e) => { e.preventDefault(); addKeywordsFromInput(); });
    startGenerationBtn.addEventListener('click', startGeneration);
    clearListBtn.addEventListener('click', () => {
        keywordList = [];
        allGeneratedData = [];
        updateKeywordDisplay();
        responseContainer.style.display = 'none';
        responseContainer.innerHTML = '';
        showStatusMessage('Liste geleert.');
    });

    keywordDisplayList.addEventListener('click', (e) => {
        if (e.target.matches('.remove-btn')) {
            keywordList.splice(e.target.dataset.index, 1);
            updateKeywordDisplay();
        }
    });

    responseContainer.addEventListener('click', (e) => {
        if (e.target.matches('.preview-btn')) {
            showPreviewModal(e.target.dataset.index);
        }
    });
    
    closePreviewModalBtn?.addEventListener('click', () => previewModal.classList.remove('visible'));
    previewModal?.addEventListener('click', (e) => {
        if (e.target === previewModal) previewModal.classList.remove('visible');
    });

    // Erste Initialisierung
    initialize();
}
