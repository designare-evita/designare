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
            unlockBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); border: 2px solid #e0a800; color: #1a1a1a; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); transition: all 0.3s ease; z-index: 1000;';
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

    // Prompt erstellen
    function createSilasPrompt(keyword, intent) {
        const jsonFormatInstructions = JSON.stringify({
            "post_title": "SEO-optimierter Titel (50-60 Zeichen)",
            "post_name": "seo-freundlicher-url-slug",
            "meta_title": "Alternativer SEO-Titel (50-60 Zeichen)",
            "meta_description": "Fesselnde Meta-Beschreibung (150-160 Zeichen) mit CTA.",
            "h1": "Kraftvolle H1-Überschrift, die den Hauptnutzen kommuniziert.",
            "h2_1": "Erste H2-Überschrift (Problemorientiert)",
            "h2_2": "Zweite H2-Überschrift (Lösungsorientiert)",
            "h2_3": "Dritte H2-Überschrift (Feature-/Nutzen-orientiert)",
            "h2_4": "Vierte H2-Überschrift (Vertrauensbildend)",
            "primary_cta": "Ein kurzer, starker Call-to-Action Text",
            "secondary_cta": "Ein alternativer, sanfterer Call-to-Action",
            "hero_text": "Ein fesselnder Einleitungstext für den Hero-Bereich",
            "hero_subtext": "Eine unterstützende Unterüberschrift für den Hero-Bereich"
        }, null, 2);

        let roleAndTask = '';
        if (intent === 'commercial') {
            roleAndTask = 'Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet. Erstelle einen kommerziell ausgerichteten Text.';
        } else {
            roleAndTask = 'Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich. Erstelle einen informationsorientierten Text.';
        }

        return 'Erstelle den gesamten Textinhalt für eine professionelle Landingpage zum Thema "' + keyword + '". ' + roleAndTask + ' Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }. Das JSON-Objekt muss diese Struktur haben: ' + jsonFormatInstructions;
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

    // Vorschau Event Delegation
    silasResponseContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('preview-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const data = allGeneratedData[index];
            
            if (data && !data.error && previewContentArea) {
                let previewHtml = '<div style="color: #f0f0f0; line-height: 1.6;"><h1 style="color: #ffc107; margin-bottom: 20px;">' + (data.h1 || 'Keine H1 verfügbar') + '</h1><p style="margin-bottom: 20px;">' + (data.hero_text || 'Kein Hero-Text verfügbar') + '</p><h2 style="color: #eee; margin-top: 20px;">' + (data.h2_1 || 'Keine H2 verfügbar') + '</h2><h2 style="color: #eee; margin-top: 20px;">' + (data.h2_2 || 'Keine zweite H2 verfügbar') + '</h2></div>';
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
            "h2_1", "h2_2", "h2_3", "h2_4", "primary_cta", "secondary_cta", "hero_text", "hero_subtext"
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
