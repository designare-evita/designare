// js/silas-form.js - FINALE, VOLLSTÄNDIGE VERSION MIT ALLEN FUNKTIONEN UND KORREKTUREN

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) {
        return;
    }

    // =================================================================================
    // DEIN ORIGINAL: ALLE VARIABLEN & KONSTANTEN
    // =================================================================================
    const MASTER_PASSWORD = "SilasUnlimited2024!";
    let DEMO_LIMITS = { maxKeywordsPerSession: 3, maxGenerationsPerHour: 5, maxGenerationsPerDay: 10, cooldownBetweenRequests: 30000 };
    const MASTER_LIMITS = { maxKeywordsPerSession: 50, maxGenerationsPerHour: 100, maxGenerationsPerDay: 500, cooldownBetweenRequests: 1000 };
    
    // DOM-ELEMENTE
    const keywordInput = document.getElementById('silas-keyword-input');
    const keywordDisplayList = document.getElementById('keyword-display-list');
    const startGenerationBtn = document.getElementById('start-generation-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    const silasStatus = document.getElementById('silas-status');
    const silasResponseContainer = document.getElementById('silas-response-container');
    const previewModal = document.getElementById('silas-preview-modal');
    const closePreviewModalBtn = document.getElementById('close-preview-modal');
    const previewContentArea = document.getElementById('preview-content-area');
    const textIntentSelect = document.getElementById('text-intent-select');

    // NEU: DOM-Elemente für die neuen Felder
    const zielgruppeInput = document.getElementById('text-zielgruppe-input');
    const tonalitaetInput = document.getElementById('text-tonalitaet-input');
    const uspInput = document.getElementById('text-usp-input');

    let keywordList = [];
    let allGeneratedData = [];

    // =================================================================================
    // DEIN ORIGINAL: DAS GESAMTE PASSWORT- UND LIMIT-SYSTEM BLEIBT UNVERÄNDERT
    // =================================================================================
    
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

    if (isMasterModeActive()) {
        DEMO_LIMITS = Object.assign({}, MASTER_LIMITS);
        console.log('🔓 Master Mode bereits aktiv');
    }

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
        if (isMasterModeActive()) return true;
        const now = Date.now();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        const lastRequest = parseInt(localStorage.getItem('silas_last_request') || '0');
        if (now - lastRequest < DEMO_LIMITS.cooldownBetweenRequests) throw new Error('⏱️ Bitte warte noch ' + Math.ceil((DEMO_LIMITS.cooldownBetweenRequests - (now - lastRequest)) / 1000) + ' Sekunden.');
        if (dailyData.count >= DEMO_LIMITS.maxGenerationsPerDay) throw new Error('📅 Tägliches Demo-Limit erreicht (' + DEMO_LIMITS.maxGenerationsPerDay + ').');
        if (hourlyData.count >= DEMO_LIMITS.maxGenerationsPerHour) throw new Error('⏰ Stündliches Demo-Limit erreicht (' + DEMO_LIMITS.maxGenerationsPerHour + ').');
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
            if (keyword.length > 100) throw new Error('📏 Keyword zu lang (max. 100 Zeichen).');
            return true;
        }
        const forbidden = ['adult', 'porn', 'sex', 'drugs', 'illegal', 'hack', 'crack', 'bitcoin', 'crypto', 'gambling', 'casino', 'pharma'];
        const lowerKeyword = keyword.toLowerCase();
        for (let i = 0; i < forbidden.length; i++) {
            if (lowerKeyword.indexOf(forbidden[i]) !== -1) throw new Error('🚫 Das Keyword "' + keyword + '" ist nicht erlaubt.');
        }
        if (keyword.length > 50) throw new Error('📏 Keywords dürfen maximal 50 Zeichen lang sein.');
        if (!/^[a-zA-ZäöüÄÖÜß\s\-_0-9]+$/.test(keyword)) throw new Error('✏️ Keywords dürfen nur Buchstaben, Zahlen, Leerzeichen und Bindestriche enthalten.');
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
            demoStatusContainer.innerHTML = '<div style="background: linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(32,201,151,0.1) 100%); border: 1px solid #28a745; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #28a745;"><strong>🔓 UNLIMITED MODE:</strong> Keine Beschränkungen aktiv</div>';
        } else {
            demoStatusContainer.innerHTML = '<div style="background: linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%); border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #ffc107;"><strong>🎯 Demo-Modus:</strong> Heute noch <strong>' + dailyRemaining + '</strong> | Diese Stunde noch <strong>' + hourlyRemaining + '</strong> Generierungen</div>';
        }
    }
    
    // =================================================================================
    // KERNÄNDERUNG 1: `addKeywords`-Funktion liest die neuen Felder aus
    // =================================================================================
    function addKeywords() {
        try {
            const newKeywords = keywordInput.value.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);
            
            const zielgruppe = zielgruppeInput.value.trim();
            const tonalitaet = tonalitaetInput.value.trim();
            const usp = uspInput.value.trim();
            const currentIntent = textIntentSelect.value;

            for (let i = 0; i < newKeywords.length; i++) {
                validateKeyword(newKeywords[i]);
            }
            if (!isMasterModeActive() && keywordList.length + newKeywords.length > DEMO_LIMITS.maxKeywordsPerSession) {
                throw new Error('🎯 Demo-Limit: Maximal ' + DEMO_LIMITS.maxKeywordsPerSession + ' Keywords pro Session.');
            }

            newKeywords.forEach(keyword => {
                const existingIndex = keywordList.findIndex(item => item.keyword === keyword);
                if (existingIndex === -1) {
                    keywordList.push({ 
                        keyword: keyword, 
                        intent: currentIntent,
                        zielgruppe: zielgruppe,
                        tonalitaet: tonalitaet,
                        usp: usp
                    });
                } else {
                    keywordList[existingIndex].intent = currentIntent;
                    keywordList[existingIndex].zielgruppe = zielgruppe;
                    keywordList[existingIndex].tonalitaet = tonalitaet;
                    keywordList[existingIndex].usp = usp;
                }
            });

            if (newKeywords.length > 0) {
                updateKeywordDisplay();
                keywordInput.value = '';
                silasStatus.textContent = '✅ ' + newKeywords.length + ' Keyword(s) hinzugefügt.';
                setTimeout(() => { silasStatus.textContent = 'Bereit zur Generierung.'; }, 2000);
            }
        } catch (error) {
            silasStatus.textContent = error.message;
            silasStatus.style.color = '#ff6b6b';
            setTimeout(() => { silasStatus.textContent = 'Bereit zur Generierung.'; silasStatus.style.color = '#ffc107'; }, 4000);
        }
    }

    // =================================================================================
    // KERNÄNDERUNG 2: `updateKeywordDisplay` zeigt neue Infos an
    // =================================================================================
    function updateKeywordDisplay() {
        keywordDisplayList.innerHTML = '';
        keywordList.forEach(function(item, index) {
            const listItem = document.createElement('li');
            listItem.style.cssText = `background-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px; padding: 15px; border-radius: 8px; display: flex; align-items: flex-start; justify-content: space-between; font-size: 0.95rem; color: #fff; border-left: 4px solid ${item.intent === 'commercial' ? '#28a745' : '#17a2b8'}; min-height: 50px; gap: 10px;`;
            
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = 'display: flex; flex-direction: column; flex-grow: 1; gap: 8px; min-width: 0; align-items: flex-start;';

            const keywordSpan = document.createElement('span');
            keywordSpan.textContent = item.keyword;
            keywordSpan.style.cssText = 'font-weight: 500; color: #fff; word-break: break-word; line-height: 1.4;';
            contentDiv.appendChild(keywordSpan);
            
            const badgesContainer = document.createElement('div');
            badgesContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
            
            const intentBadge = document.createElement('span');
            intentBadge.textContent = item.intent === 'commercial' ? 'Kommerziell' : 'Informativ';
            intentBadge.style.cssText = `background-color: ${item.intent === 'commercial' ? '#28a745' : '#17a2b8'}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;`;
            badgesContainer.appendChild(intentBadge);

            if (item.zielgruppe) {
                const zielgruppeBadge = document.createElement('span');
                zielgruppeBadge.textContent = `Für: ${item.zielgruppe}`;
                zielgruppeBadge.style.cssText = `background-color: #6c757d; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;`;
                badgesContainer.appendChild(zielgruppeBadge);
            }
            if (item.tonalitaet) {
                const tonalitaetBadge = document.createElement('span');
                tonalitaetBadge.textContent = `Ton: ${item.tonalitaet}`;
                tonalitaetBadge.style.cssText = `background-color: #6c757d; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;`;
                badgesContainer.appendChild(tonalitaetBadge);
            }
            if (item.usp) {
                const uspBadge = document.createElement('span');
                uspBadge.textContent = `USP: ${item.usp}`;
                uspBadge.style.cssText = `background-color: #6c757d; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;`;
                badgesContainer.appendChild(uspBadge);
            }

            contentDiv.appendChild(badgesContainer);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.dataset.index = index;
            removeBtn.className = 'remove-btn';
            removeBtn.style.cssText = 'background-color: #ff6b6b; color: white; border: none; border-radius: 6px; min-width: 36px; height: 36px; cursor: pointer; font-size: 18px; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 10px;';
            
            listItem.appendChild(contentDiv);
            listItem.appendChild(removeBtn);
            keywordDisplayList.appendChild(listItem);
        });
        clearListBtn.style.display = keywordList.length > 0 ? 'inline-block' : 'none';
    }

    // =================================================================================
    // DEINE SCHNELLE GENERIERUNGS-FUNKTION
    // =================================================================================
    startGenerationBtn.addEventListener('click', async function() {
        try {
            if (keywordList.length === 0) {
                silasStatus.textContent = 'Bitte füge zuerst Keywords hinzu.';
                return;
            }
            checkRateLimit();
            startGenerationBtn.disabled = true;
            clearListBtn.disabled = true;
            allGeneratedData = [];
            silasResponseContainer.innerHTML = '<h3><i class="fas fa-spinner fa-spin"></i> Erstellung läuft...</h3><div id="silas-response-content"></div>';
            silasResponseContainer.style.display = 'block';
            silasStatus.textContent = `Sende ${keywordList.length} Keywords an Silas...`;
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(isMasterModeActive() && { 'X-Silas-Master': MASTER_PASSWORD })
                },
                body: JSON.stringify({ keywords: keywordList })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server-Fehler: ${response.statusText}`);
            }

            const results = await response.json();
            allGeneratedData = results;

            silasResponseContainer.querySelector('h3').textContent = 'Erstellung abgeschlossen!';
            const responseContent = document.getElementById('silas-response-content');
            responseContent.innerHTML = '';

            results.forEach((data, index) => {
                displayResult(data, index, responseContent);
            });
            
            updateUsageCounters();
            silasStatus.textContent = `✅ Alle ${keywordList.length} Texte wurden verarbeitet.`;
            
            if (allGeneratedData.some(d => !d.error && !d._fallback_used)) {
                const downloadButton = document.createElement('button');
                downloadButton.id = 'download-csv-dynamic';
                downloadButton.className = 'cta-button';
                downloadButton.innerHTML = '<i class="fas fa-download"></i> CSV Herunterladen';
                downloadButton.style.marginTop = '1rem';
                downloadButton.addEventListener('click', downloadCsv);
                silasResponseContainer.appendChild(downloadButton);
            }
        } catch (error) {
            silasStatus.textContent = `Fehler: ${error.message}`;
            silasStatus.style.color = '#ff6b6b';
            if (silasResponseContainer.querySelector('h3')) {
                silasResponseContainer.querySelector('h3').textContent = 'Fehler bei der Erstellung';
            }
        } finally {
            startGenerationBtn.disabled = false;
            clearListBtn.disabled = false;
        }
    });

    // =================================================================================
    // DEIN ORIGINAL: Alle restlichen Funktionen bleiben 1:1 erhalten
    // =================================================================================
    function displayResult(data, index, container) {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.style.cssText = 'background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ' + (data.intent === 'commercial' ? '#28a745' : '#17a2b8') + ';';
        if (data.error) {
            resultCard.innerHTML = `<h4 style="color: #ff6b6b; margin: 0 0 10px 0;">${data.keyword}</h4><p style="color: #ff6b6b; margin: 0;">Fehler: ${data.error}</p>`;
        } else {
            resultCard.innerHTML = `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;"><h4 style="color: #fff; margin: 0; flex-grow: 1;">${data.keyword}</h4></div><p style="margin: 5px 0; color: #ccc;"><strong>Titel:</strong> ${data.post_title || 'N/A'}</p><p style="margin: 5px 0; color: #ccc;"><strong>Meta:</strong> ${data.meta_description || 'N/A'}</p><button class="preview-btn" data-index="${index}" style="background-color: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Vorschau anzeigen</button>`;
        }
        container.appendChild(resultCard);
    }

    function openPreviewModal() { if (previewModal) previewModal.classList.add('visible'); }
    function closePreviewModal() { if (previewModal) previewModal.classList.remove('visible'); }

 silasResponseContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('preview-btn')) {
        const index = parseInt(e.target.getAttribute('data-index'));
        const data = allGeneratedData[index];
        
        if (data && !data.error && previewContentArea) {
            // Strukturiertere und besser formatierte Vorschau
            let previewHtml = `
                <div class="preview-container" style="max-height: 80vh; overflow-y: auto; padding: 20px;">
                    <h2 style="color: #ffc107; margin-bottom: 30px; text-align: center; font-size: 1.8rem;">
                        Vorschau: ${data.keyword}
                    </h2>
                    
                    <!-- Hauptinhalt -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">📝 Haupttitel & Hero-Bereich</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>H1:</strong> ${data.h1 || 'N/A'}</p>
                            <p><strong>Hero-Text:</strong> ${data.hero_text || 'N/A'}</p>
                            <p><strong>Hero-Subtext:</strong> ${data.hero_subtext || 'N/A'}</p>
                            <p><strong>Primärer CTA:</strong> ${data.primary_cta || 'N/A'}</p>
                            <p><strong>Sekundärer CTA:</strong> ${data.secondary_cta || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <!-- Überschriften -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">📌 Hauptüberschriften</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>H2 #1:</strong> ${data.h2_1 || 'N/A'}</p>
                            <p><strong>H2 #2:</strong> ${data.h2_2 || 'N/A'}</p>
                            <p><strong>H2 #3:</strong> ${data.h2_3 || 'N/A'}</p>
                            <p><strong>H2 #4:</strong> ${data.h2_4 || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <!-- Features & Benefits -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">✨ Features & Vorteile</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>Features:</strong></p>
                            <div style="padding-left: 20px; color: #ccc;">${data.features_list || 'N/A'}</div>
                            <p><strong>Benefits:</strong></p>
                            <div style="padding-left: 20px; color: #ccc;">${data.benefits_list || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <!-- Social Proof -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">⭐ Vertrauenselemente</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>Social Proof:</strong> ${data.social_proof || 'N/A'}</p>
                            <p><strong>Trust Signals:</strong> ${data.trust_signals || 'N/A'}</p>
                            <p><strong>Garantie:</strong> ${data.guarantee_text || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <!-- Testimonials -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">💬 Kundenstimmen</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>Testimonial 1:</strong><br><em>${data.testimonial_1 || 'N/A'}</em></p>
                            <p><strong>Testimonial 2:</strong><br><em>${data.testimonial_2 || 'N/A'}</em></p>
                        </div>
                    </div>
                    
                    <!-- Pricing -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">💰 Preise</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>Titel:</strong> ${data.pricing_title || 'N/A'}</p>
                            <p><strong>Preis 1:</strong> ${data.price_1 || 'N/A'}</p>
                            <p><strong>Preis 2:</strong> ${data.price_2 || 'N/A'}</p>
                            <p><strong>Preis 3:</strong> ${data.price_3 || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <!-- FAQ -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">❓ Häufige Fragen</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>Frage 1:</strong> ${data.faq_1 || 'N/A'}<br>
                            <em>Antwort:</em> ${data.faq_answer_1 || 'N/A'}</p>
                            <p><strong>Frage 2:</strong> ${data.faq_2 || 'N/A'}<br>
                            <em>Antwort:</em> ${data.faq_answer_2 || 'N/A'}</p>
                            <p><strong>Frage 3:</strong> ${data.faq_3 || 'N/A'}<br>
                            <em>Antwort:</em> ${data.faq_answer_3 || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <!-- Footer & Contact -->
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #ffc107; margin-bottom: 15px;">📞 Kontakt & Abschluss</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>Kontakt-Info:</strong> ${data.contact_info || 'N/A'}</p>
                            <p><strong>Footer CTA:</strong> ${data.footer_cta || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <!-- SEO Meta -->
                    <div style="background: linear-gradient(135deg, rgba(40,167,69,0.1), rgba(40,167,69,0.2)); padding: 20px; border-radius: 8px; border: 2px solid #28a745;">
                        <h3 style="color: #28a745; margin-bottom: 15px;">🔍 SEO-Metadaten</h3>
                        <div style="padding-left: 20px;">
                            <p><strong>Post Title:</strong> ${data.post_title || 'N/A'}</p>
                            <p><strong>URL Slug:</strong> <code style="background: rgba(0,0,0,0.3); padding: 2px 5px; border-radius: 3px;">${data.post_name || 'N/A'}</code></p>
                            <p><strong>Meta Title:</strong> ${data.meta_title || 'N/A'}</p>
                            <p><strong>Meta Description:</strong> ${data.meta_description || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            `;
            
            previewContentArea.innerHTML = previewHtml;
            openPreviewModal();
        }
    }
});

    function downloadCsv() {
        if (allGeneratedData.length === 0) {
            alert('Keine Daten zum Download verfügbar.');
            return;
        }
        const headers = ["keyword", "post_title", "post_name", "meta_title", "meta_description", "h1", "h2_1", "h2_2", "h2_3", "h2_4", "primary_cta", "secondary_cta", "hero_text", "hero_subtext", "benefits_list", "features_list", "social_proof", "testimonial_1", "testimonial_2", "pricing_title", "price_1", "price_2", "price_3", "faq_1", "faq_answer_1", "faq_2", "faq_answer_2", "faq_3", "faq_answer_3", "contact_info", "footer_cta", "trust_signals", "guarantee_text"];
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
    
    // DEINE ORIGINAL EVENT LISTENERS
    silasForm.addEventListener('submit', function(e) { e.preventDefault(); addKeywords(); });
    keywordInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); addKeywords(); } });
    keywordDisplayList.addEventListener('click', function(e) {
        if (e.target.matches('.remove-btn')) {
            keywordList.splice(e.target.dataset.index, 1);
            updateKeywordDisplay();
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
    if (closePreviewModalBtn) closePreviewModalBtn.addEventListener('click', closePreviewModal);
    if (previewModal) previewModal.addEventListener('click', function(e) { if (e.target === previewModal) closePreviewModal(); });
    
    // DEINE ORIGINAL: Initialisierung
    initDemoTracking();
    showDemoStatus();
    createMasterPasswordUI();
}
