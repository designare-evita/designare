// js/silas-form.js - FINALE VERSION (Mit Style-Transfer & Template-Support)

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) {
        return;
    }

    // KONFIGURATION & LIMITS
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
    
    // Modal & Preview Elemente
    const previewModal = document.getElementById('silas-preview-modal');
    const closePreviewModalBtn = document.getElementById('close-preview-modal');
    const previewContentArea = document.getElementById('preview-content-area');
    
    // Formular-Inputs (Optionale Felder)
    const textIntentSelect = document.getElementById('text-intent-select');
    const zielgruppeInput = document.getElementById('text-zielgruppe-input');
    const tonalitaetInput = document.getElementById('text-tonalitaet-input');
    const uspInput = document.getElementById('text-usp-input');
    const domainInput = document.getElementById('text-domain-input');
    const brandInput = document.getElementById('text-brand-input');
    const emailInput = document.getElementById('text-email-input');
    const phoneInput = document.getElementById('text-phone-input');
    const addressInput = document.getElementById('text-adress-input'); 
    const grammaticalPersonSelect = document.getElementById('grammatical-person-select');
    
    // NEU: Style-Transfer Elemente
    const customStyleInput = document.getElementById('custom-style-input');
    const templateSelector = document.getElementById('template-selector');

    let keywordList = [];
    let allGeneratedData = [];

    // === 1. MASTER MODE & LIMIT LOGIK ===

    function isMasterModeActive() {
        const masterMode = sessionStorage.getItem('silas_master_mode');
        const timestamp = parseInt(sessionStorage.getItem('silas_master_timestamp') || '0');
        const now = Date.now();
        // Master Mode läuft nach 8 Stunden ab
        if (masterMode === 'true' && (now - timestamp) < (8 * 60 * 60 * 1000)) {
            return true;
        }
        // Auto-Logout wenn abgelaufen
        if (masterMode === 'true') {
            sessionStorage.removeItem('silas_master_mode');
            sessionStorage.removeItem('silas_master_timestamp');
        }
        return false;
    }

    // Limits aktualisieren falls Master Mode aktiv
    if (isMasterModeActive()) {
        DEMO_LIMITS = Object.assign({}, MASTER_LIMITS);
    }

    function createMasterPasswordUI() {
        if (!isMasterModeActive() && !document.getElementById('master-unlock-btn')) {
            const unlockBtn = document.createElement('button');
            unlockBtn.id = 'master-unlock-btn';
            unlockBtn.innerHTML = '🔓';
            unlockBtn.title = 'Master Access';
            unlockBtn.style.cssText = 'position: fixed; bottom: 40px; right: 20px; background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); border: 2px solid #e0a800; color: #1a1a1a; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); transition: all 0.3s ease; z-index: 1000;';
            unlockBtn.onclick = () => showPasswordPrompt();
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
        ['silas_daily', 'silas_hourly', 'silas_last_request'].forEach(item => localStorage.removeItem(item));
        showMasterModeIndicator();
        hideUnlockButton();
        showDemoStatus();
        showNotification('🔓 Master Mode aktiviert! Alle Beschränkungen aufgehoben.', '#28a745');
    }

    function showMasterModeIndicator() {
        const existing = document.getElementById('master-mode-indicator');
        if (existing) existing.remove();
        const indicator = document.createElement('div');
        indicator.id = 'master-mode-indicator';
        indicator.style.cssText = 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 20px; text-align: center; font-weight: bold; border-radius: 8px; margin: 15px 0; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); border: 2px solid #155724; position: relative;';
        indicator.innerHTML = '🔓 <strong>MASTER MODE AKTIV</strong> 🔓<br><small style="opacity: 0.9;">Unlimited Keywords • No Rate Limits • Full Access</small><button onclick="deactivateMasterMode()" style="position: absolute; top: 8px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;" title="Master Mode deaktivieren">×</button>';
        silasForm.parentNode.insertBefore(indicator, silasForm);
        window.deactivateMasterMode = () => {
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
        notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${color || '#ffc107'}; color: white; padding: 15px 25px; border-radius: 8px; font-weight: bold; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);`;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    // === 2. TRACKING & LIMITS ===

    function initDemoTracking() {
        const now = Date.now();
        const today = new Date().toDateString();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        if (dailyData.date !== today) {
            localStorage.setItem('silas_daily', JSON.stringify({ date: today, count: 0 }));
        }
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        const currentHour = Math.floor(now / 3600000);
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
        
        if (now - lastRequest < DEMO_LIMITS.cooldownBetweenRequests) throw new Error(`⏱️ Bitte warte noch ${Math.ceil((DEMO_LIMITS.cooldownBetweenRequests - (now - lastRequest)) / 1000)} Sekunden.`);
        if (dailyData.count >= DEMO_LIMITS.maxGenerationsPerDay) throw new Error(`📅 Tägliches Demo-Limit erreicht (${DEMO_LIMITS.maxGenerationsPerDay}).`);
        if (hourlyData.count >= DEMO_LIMITS.maxGenerationsPerHour) throw new Error(`⏰ Stündliches Demo-Limit erreicht (${DEMO_LIMITS.maxGenerationsPerHour}).`);
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
            demoStatusContainer.innerHTML = `<div style="background: linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%); border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #ffc107;"><strong>🎯 Demo-Modus:</strong> Heute noch <strong>${dailyRemaining}</strong> | Diese Stunde noch <strong>${hourlyRemaining}</strong> Generierungen</div>`;
        }
    }

    function validateKeyword(keyword) {
        if (isMasterModeActive()) {
            if (keyword.length > 100) throw new Error('📏 Keyword zu lang (max. 100 Zeichen).');
            return true;
        }
        const forbidden = ['adult', 'porn', 'sex', 'drugs', 'illegal', 'hack', 'crack', 'bitcoin', 'crypto', 'gambling', 'casino', 'pharma'];
        if (forbidden.some(term => keyword.toLowerCase().includes(term))) throw new Error(`🚫 Das Keyword "${keyword}" ist nicht erlaubt.`);
        if (keyword.length > 50) throw new Error('📏 Keywords dürfen maximal 50 Zeichen lang sein.');
        if (!/^[a-zA-ZäöüÄÖÜß\s\-_0-9]+$/.test(keyword)) throw new Error('✏️ Keywords dürfen nur Buchstaben, Zahlen, Leerzeichen und Bindestriche enthalten.');
        return true;
    }

    // === 3. KEYWORD MANAGEMENT ===
    
    function addKeywords() {
        try {
            const newKeywords = keywordInput.value.split(',').map(kw => kw.trim()).filter(Boolean);
            if (newKeywords.length === 0) return;

            // Erfasse alle Formularwerte INKLUSIVE Style-Transfer
            const formValues = {
                zielgruppe: zielgruppeInput ? zielgruppeInput.value.trim() : '',
                tonalitaet: tonalitaetInput ? tonalitaetInput.value.trim() : '',
                usp: uspInput ? uspInput.value.trim() : '',
                intent: textIntentSelect ? textIntentSelect.value : 'informational',
                domain: domainInput ? domainInput.value.trim() : '',
                brand: brandInput ? brandInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : '',
                address: addressInput ? addressInput.value.trim() : '', 
                grammaticalPerson: grammaticalPersonSelect ? grammaticalPersonSelect.value : 'singular',
                // NEU: Style-Transfer Feld
                customStyle: customStyleInput ? customStyleInput.value.trim() : ''
            };

            newKeywords.forEach(validateKeyword);

            if (!isMasterModeActive() && (keywordList.length + newKeywords.length) > DEMO_LIMITS.maxKeywordsPerSession) {
                throw new Error(`🎯 Demo-Limit: Maximal ${DEMO_LIMITS.maxKeywordsPerSession} Keywords pro Session.`);
            }

            newKeywords.forEach(keyword => {
                const existingIndex = keywordList.findIndex(item => item.keyword === keyword);
                // Merge keyword mit den aktuellen Formular-Settings
                const keywordData = { keyword, ...formValues };
                
                if (existingIndex === -1) {
                    keywordList.push(keywordData);
                } else {
                    // Update existierendes Keyword mit neuen Settings
                    keywordList[existingIndex] = keywordData;
                }
            });

            updateKeywordDisplay();
            keywordInput.value = '';
            silasStatus.textContent = `✅ ${newKeywords.length} Keyword(s) hinzugefügt.`;
            setTimeout(() => { silasStatus.textContent = 'Bereit zur Generierung.'; }, 2000);
        } catch (error) {
            silasStatus.textContent = error.message;
            silasStatus.style.color = '#ff6b6b';
            setTimeout(() => { silasStatus.textContent = 'Bereit zur Generierung.'; silasStatus.style.color = '#ffc107'; }, 4000);
        }
    }

    function updateKeywordDisplay() {
        keywordDisplayList.innerHTML = '';
        keywordList.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.style.cssText = `background-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px; padding: 15px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 0.95rem; color: #fff; border-left: 4px solid ${item.intent === 'commercial' ? '#28a745' : '#17a2b8'}; min-height: 50px; gap: 10px;`;
            
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = 'display: flex; flex-direction: row; flex-grow: 1; gap: 8px; min-width: 0; align-items: flex-start;';

            const keywordSpan = document.createElement('span');
            keywordSpan.textContent = item.keyword;
            keywordSpan.style.cssText = 'font-weight: 500; color: #fff; word-break: break-word; line-height: 1.4;';
            contentDiv.appendChild(keywordSpan);
            
            const badgesContainer = document.createElement('div');
            badgesContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
            
            const createBadge = (text, bgColor) => {
                if (!text) return null;
                const badge = document.createElement('span');
                badge.textContent = text;
                badge.style.cssText = `background-color: ${bgColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: normal;`;
                return badge;
            };

            const badges = [
                createBadge(item.intent === 'commercial' ? 'Kommerziell' : 'Informativ', item.intent === 'commercial' ? '#28a745' : '#17a2b8'),
                createBadge(item.customStyle ? '🎨 Custom Style' : null, '#9c27b0'), // Lila Badge für Custom Style
                createBadge(item.domain ? `Domain: ${item.domain}`: '', '#4CAF50'),
                createBadge(item.brand ? `Brand: ${item.brand}`: '', '#fd7e14'),
                createBadge(item.zielgruppe ? `Für: ${item.zielgruppe}`: '', '#6c757d')
            ].filter(Boolean);
            
            badges.forEach(badge => badgesContainer.appendChild(badge));
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

    // === 4. TEMPLATE & MUSTERTEXT LOGIK (NEU) ===
    
    // Templates definieren
    const STYLE_TEMPLATES = {
        'emotional': "Stell dir vor, du wachst morgens auf und fühlst dich endlich ausgeschlafen. Genau dieses Gefühl möchten wir dir mit [PRODUKT] zurückgeben. Es ist nicht einfach nur eine Matratze – es ist dein täglicher Rückzugsort, der dich sanft in den Schlaf begleitet.",
        'hard-facts': "Mit [PRODUKT] steigern Sie Ihre Effizienz nachweislich um 20%. Unsere Lösung basiert auf patentierter Technologie, die Prozesse automatisiert und Fehlerquellen minimiert. Die Amortisationszeit beträgt durchschnittlich weniger als 6 Monate.",
        'du-ansprache': "Hey! Hast du auch keine Lust mehr auf komplizierte Lösungen? Wir machen es dir einfach. Hol dir jetzt [PRODUKT] und starte direkt durch – ohne Fachchinesisch und ohne versteckte Kosten. Einfach machen!",
        'serioes': "Die [UNTERNEHMEN] steht seit über 25 Jahren für Exzellenz und Zuverlässigkeit. Wir begleiten unsere Mandanten mit fundierter Expertise und diskreter Beratung. Unser Anspruch ist es, nachhaltige Werte zu schaffen und langfristige Partnerschaften zu pflegen."
    };

    // Event Listener für Template-Selector
    if (templateSelector && customStyleInput) {
        templateSelector.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            if (STYLE_TEMPLATES[selectedType]) {
                // Füge Template ein und animiere kurz den Fokus
                customStyleInput.value = STYLE_TEMPLATES[selectedType];
                customStyleInput.focus();
                // Optional: Visuelles Feedback
                customStyleInput.style.borderColor = '#ffc107';
                setTimeout(() => customStyleInput.style.borderColor = '', 500);
            } else if (selectedType === '') {
                customStyleInput.value = '';
            }
        });
    }

    // === 5. GENERIERUNG STARTEN ===

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
                const downloadContainer = document.createElement('div');
                downloadContainer.style.cssText = 'margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem; align-items: center;';

                const createButton = (id, text, icon, clickHandler) => {
                    const button = document.createElement('button');
                    button.id = id;
                    button.className = 'cta-button';
                    button.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
                    button.style.cssText = 'max-width: 400px; width: 100%;';
                    button.addEventListener('click', clickHandler);
                    return button;
                };
                
                downloadContainer.appendChild(createButton('download-csv-dynamic', 'CSV Herunterladen', 'fa-download', downloadCsv));
                downloadContainer.appendChild(createButton('download-txt-dynamic', 'TXT Herunterladen', 'fa-file-alt', downloadTxt));
                
                silasResponseContainer.appendChild(downloadContainer);
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

    // === 6. ANZEIGE & PREVIEW FUNKTIONEN ===

    function displayResult(data, index, container) {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.style.cssText = `background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ${data.intent === 'commercial' ? '#28a745' : '#17a2b8'};`;
        
        if (data.error) {
            resultCard.innerHTML = `<h4 style="color: #ff6b6b; margin: 0 0 10px 0;">${data.keyword}</h4><p style="color: #ff6b6b; margin: 0;">Fehler: ${data.error}</p>`;
        } else {
            let factCheckHtml = '';
            if (data._factCheck && typeof data._factCheck.confidenceScore !== 'undefined') {
                const score = data._factCheck.confidenceScore;
                const color = score >= 80 ? '#28a745' : (score >= 60 ? '#ffc107' : '#ff6b6b');
                const icon = score >= 80 ? 'fa-check-circle' : 'fa-exclamation-triangle';
                factCheckHtml = `
                    <div class="fact-check-score" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444; text-align: left;">
                        <strong style="color: ${color}; font-size: 0.9rem;">
                            <i class="fas ${icon}"></i> E-E-A-T Qualitäts-Check: 
                            <span style="background-color: ${color}; color: #1a1a1a; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem;">${score}% Vertrauen</span>
                        </strong>
                        ${data._factCheck.flaggedClaims.length > 0 ? `<br><small style="color: #ccc; font-size: 0.8rem;">(${data._factCheck.flaggedClaims.length} übertriebene Aussage(n) automatisch korrigiert)</small>` : ''}
                    </div>`;
            }
            resultCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <h4 style="color: #fff; margin: 0; flex-grow: 1;">${data.keyword}</h4>
                </div>
                <p style="margin: 5px 0; color: #ccc;"><strong>Titel:</strong> ${data.post_title || 'N/A'}</p>
                <p style="margin: 5px 0; color: #ccc;"><strong>Meta:</strong> ${data.meta_description || 'N/A'}</p>
                <div class="result-card-actions" style="margin-top: 10px;">
                    <button class="preview-btn" data-index="${index}" style="background-color: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Vorschau anzeigen</button>
                    <button class="download-html-btn" data-index="${index}" style="background-color: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                        <i class="fas fa-file-code"></i> HTML herunterladen
                    </button>
                </div>
                ${factCheckHtml}`;
        }
        container.appendChild(resultCard);
    }

    function openPreviewModal() { if (previewModal) previewModal.classList.add('visible'); }
    function closePreviewModal() { if (previewModal) previewModal.classList.remove('visible'); }

    silasResponseContainer.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const index = parseInt(button.getAttribute('data-index'));
        const data = allGeneratedData[index];

        if (button.classList.contains('preview-btn') && data && !data.error && previewContentArea) {
            previewContentArea.innerHTML = generateLandingpageHtml(data);
            openPreviewModal();
        } else if (button.classList.contains('download-html-btn')) {
            downloadHtml(index);
        }
    });

   // Hilfsfunktion für HTML-Vorschau
   function generateLandingpageHtml(data) {
    const createFaqEntry = (question, answer) => {
        if (!question || !answer) return '';
        return `<details style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <summary style="color: #ffc107; font-weight: bold; cursor: pointer; margin-bottom: 10px;">${question}</summary>
                    <p style="color: #ccc; margin-top: 10px;">${answer}</p>
                </details>`;
    };

    return `
        <div class="preview-landingpage" style="color: #f0f0f0; line-height: 1.6; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 20px; border-radius: 10px;">
            <header style="text-align: center; margin-bottom: 40px; padding: 30px 0; border-bottom: 2px solid #ffc107;">
                <h1 style="color: #ffc107; font-size: 2.3rem; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${data.h1 || 'N/A'}</h1>
                <p style="font-size: 1.2rem; color: #ccc; margin-bottom: 15px; max-width: 800px; margin-left: auto; margin-right: auto;">${data.hero_text || 'N/A'}</p>
                <p style="font-size: 1rem; color: #aaa; margin-bottom: 25px;">${data.hero_subtext || ''}</p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button style="background: #ffc107; color: #1a1a1a; border: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; cursor: pointer;">${data.primary_cta || 'N/A'}</button>
                    <button style="background: transparent; color: #ffc107; border: 2px solid #ffc107; padding: 12px 25px; border-radius: 5px; font-weight: bold; cursor: pointer;">${data.secondary_cta || 'N/A'}</button>
                </div>
            </header>
            
            <main style="max-width: 1000px; margin: 0 auto;">
                <section style="margin-bottom: 40px; padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #ff6b6b;">
                    <h2 style="color: #ff6b6b; margin-bottom: 15px; font-size: 1.8rem;">${data.h2_1 || 'N/A'}</h2>
                    <p style="color: #ccc; font-size: 1rem; line-height: 1.7; margin-top: 15px;">${data.h2_1_text || ''}</p>
                </section>
                
                <section style="margin-bottom: 40px; padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #28a745;">
                    <h2 style="color: #28a745; margin-bottom: 15px; font-size: 1.8rem;">${data.h2_2 || 'N/A'}</h2>
                    <p style="color: #ccc; font-size: 1rem; line-height: 1.7; margin-top: 15px;">${data.h2_2_text || ''}</p>
                </section>
                
                <section style="margin-bottom: 40px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                        <div style="padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px;">
                            <h3 style="color: #ffc107; margin-bottom: 15px; font-size: 1.5rem;">${data.h2_3 || 'Features'}</h3>
                            <p style="color: #ccc; font-size: 1rem; line-height: 1.7; margin-bottom: 15px;">${data.h2_3_text || ''}</p>
                            <div style="color: #ccc;">${data.features_list || ''}</div>
                            <p style="color: #ccc; margin-top: 15px; border-top: 1px solid #444; padding-top: 15px;">${data.features_list_fließtext || ''}</p>
                        </div>
                        <div style="padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px;">
                            <h3 style="color: #ffc107; margin-bottom: 15px; font-size: 1.5rem;">Vorteile</h3>
                            <div style="color: #ccc;">${data.benefits_list || ''}</div>
                            <p style="color: #ccc; margin-top: 15px; border-top: 1px solid #444; padding-top: 15px;">${data.benefits_list_fließtext || ''}</p>
                        </div>
                    </div>
                </section>
                
                <section style="margin-bottom: 40px; padding: 25px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #17a2b8;">
                    <h2 style="color: #17a2b8; margin-bottom: 15px; font-size: 1.8rem;">${data.h2_4 || 'Vertrauen & Qualität'}</h2>
                    <p style="color: #ccc; font-size: 1rem; line-height: 1.7; margin-bottom: 20px;">${data.h2_4_text || ''}</p>
                    <p style="color: #ffc107; font-weight: bold; text-align: center; margin-bottom: 20px;">${data.social_proof || ''}</p>
                    <p style="color: #aaa; text-align: center;">${data.trust_signals || ''}</p>
                </section>
                
                <section style="margin-bottom: 40px;">
                    <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.8rem;">Kundenstimmen</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="padding: 20px; background-color: rgba(255,193,7,0.1); border-radius: 8px; border-left: 4px solid #ffc107;">
                            <p style="color: #ccc; font-style: italic; margin-bottom: 10px;">${data.testimonial_1 || ''}</p>
                        </div>
                        <div style="padding: 20px; background-color: rgba(255,193,7,0.1); border-radius: 8px; border-left: 4px solid #ffc107;">
                            <p style="color: #ccc; font-style: italic; margin-bottom: 10px;">${data.testimonial_2 || ''}</p>
                        </div>
                    </div>
                </section>
                
                <section style="margin-bottom: 40px;">
                    <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.8rem;">${data.pricing_title || 'Unsere Pakete'}</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                        <div style="padding: 20px; background-color: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                            <h4 style="color: #ffc107; margin-bottom: 10px;">Starter</h4>
                            <p style="color: #ccc; font-size: 0.9rem;">${data.price_1 || ''}</p>
                        </div>
                        <div style="padding: 20px; background-color: rgba(255,193,7,0.1); border: 2px solid #ffc107; border-radius: 8px; text-align: center;">
                            <h4 style="color: #ffc107; margin-bottom: 10px;">Professional</h4>
                            <p style="color: #ccc; font-size: 0.9rem;">${data.price_2 || ''}</p>
                        </div>
                        <div style="padding: 20px; background-color: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                            <h4 style="color: #ffc107; margin-bottom: 10px;">Enterprise</h4>
                            <p style="color: #ccc; font-size: 0.9rem;">${data.price_3 || ''}</p>
                        </div>
                    </div>
                </section>
                
                <section style="margin-bottom: 40px;">
                    <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.8rem;">Häufige Fragen</h3>
                    <div>
                        ${createFaqEntry(data.faq_1, data.faq_answer_1)}
                        ${createFaqEntry(data.faq_2, data.faq_answer_2)}
                        ${createFaqEntry(data.faq_3, data.faq_answer_3)}
                        ${createFaqEntry(data.faq_4, data.faq_answer_4)}
                        ${createFaqEntry(data.faq_5, data.faq_answer_5)}
                    </div>
                </section>
                
                <section style="text-align: center; padding: 30px; background: linear-gradient(45deg, rgba(255,193,7,0.1), rgba(255,193,7,0.2)); border-radius: 10px; border: 2px solid #ffc107;">
                    <h3 style="color: #ffc107; margin-bottom: 15px;">${data.guarantee_text || 'N/A'}</h3>
                    <p style="color: #ccc; margin-bottom: 25px;">${data.contact_info || ''}</p>
                    <button style="background: #ffc107; color: #1a1a1a; border: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 1.1rem;">${data.footer_cta || 'N/A'}</button>
                </section>
            </main>
            
            <aside style="margin-top: 50px; padding: 25px; background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(45,45,45,0.7) 100%); border-radius: 12px; border: 2px solid #444;">
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
            </aside>
        </div>
    `;
    }

    // === 7. DOWNLOAD FUNKTIONEN ===

    function downloadHtml(index) {
        const data = allGeneratedData[index];
        if (!data || data.error) return alert('Fehler: Daten für den HTML-Download nicht verfügbar.');

        const landingpageContent = generateLandingpageHtml(data);
        const fullHtml = `
            <!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${data.meta_title || data.post_title || 'Landingpage'}</title>
                <style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #121212; color: #e0e0e0; line-height: 1.6; margin: 0; padding: 20px; }</style>
            </head><body>${landingpageContent}</body></html>`;

        downloadFile(fullHtml, (data.post_name || data.keyword.trim().replace(/\s+/g, '-').toLowerCase()) + '.html', 'text/html;charset=utf-8;');
    }
    
    function downloadFile(content, fileName, mimeType) {
        if (allGeneratedData.length === 0 && !content) return alert('Keine Daten zum Download verfügbar.');
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function downloadTxt() {
        const headers = ["keyword", "brand", "domain", "email", "phone", "address", 
        "post_title", "post_name", "meta_title", "meta_description", 
        "h1", 
        "h2_1", "h2_1_text",
        "h2_2", "h2_2_text", 
        "h2_3", "h2_3_text",
        "h2_4", "h2_4_text",
        "primary_cta", "secondary_cta", 
        "hero_text", "hero_subtext", 
        "benefits_list", "features_list", 
        "benefits_list_fließtext", "features_list_fließtext", 
        "social_proof", 
        "testimonial_1", "testimonial_2", 
        "pricing_title", "price_1", "price_2", "price_3", 
        "faq_1", "faq_answer_1", 
        "faq_2", "faq_answer_2", 
        "faq_3", "faq_answer_3", 
        "faq_4", "faq_answer_4", 
        "faq_5", "faq_answer_5", 
        "contact_info", "footer_cta", "trust_signals", "guarantee_text"];
        let txtContent = '';
        allGeneratedData.forEach((rowData, index) => {
            if (rowData.error) return;
            txtContent += `==================================================\n`;
            txtContent += `            INHALT FÜR: ${rowData.keyword}\n`;
            txtContent += `==================================================\n\n`;
            headers.forEach(header => {
                const value = String(rowData[header] || '').replace(/<[^>]*>/g, ''); 
                if (value) {
                    const formattedHeader = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    txtContent += `${formattedHeader}:\n${value}\n\n`;
                }
            });
            if (index < allGeneratedData.length - 1) txtContent += `\n\n---\n\n\n`;
        });
        downloadFile(txtContent, 'silas_generated_content.txt', 'text/plain;charset=utf-8;');
    }

    function downloadCsv() {
        const headers = ["keyword", "brand", "domain", "email", "phone", "address", 
        "post_title", "post_name", "meta_title", "meta_description", 
        "h1", 
        "h2_1", "h2_1_text",
        "h2_2", "h2_2_text", 
        "h2_3", "h2_3_text",
        "h2_4", "h2_4_text",
        "primary_cta", "secondary_cta", 
        "hero_text", "hero_subtext", 
        "benefits_list", "features_list", 
        "benefits_list_fließtext", "features_list_fließtext", 
        "social_proof", 
        "testimonial_1", "testimonial_2", 
        "pricing_title", "price_1", "price_2", "price_3", 
        "faq_1", "faq_answer_1", 
        "faq_2", "faq_answer_2", 
        "faq_3", "faq_answer_3", 
        "faq_4", "faq_answer_4", 
        "faq_5", "faq_answer_5", 
        "contact_info", "footer_cta", "trust_signals", "guarantee_text"];
        let csvContent = headers.join(",") + "\n";
        allGeneratedData.forEach(rowData => {
            if (rowData.error) return;
            const values = headers.map(header => `"${String(rowData[header] || '').replace(/"/g, '""')}"`);
            csvContent += values.join(",") + "\n";
        });
        downloadFile(csvContent, 'silas_generated_content.csv', 'text/csv;charset=utf-8;');
    }
    
    // === 8. EVENT LISTENER & INITIALISIERUNG ===

    silasForm.addEventListener('submit', e => { e.preventDefault(); addKeywords(); });
    keywordInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addKeywords(); } });
    keywordDisplayList.addEventListener('click', e => {
        if (e.target.matches('.remove-btn')) {
            keywordList.splice(e.target.dataset.index, 1);
            updateKeywordDisplay();
        }
    });
    clearListBtn.addEventListener('click', () => {
        keywordList = [];
        allGeneratedData = [];
        updateKeywordDisplay();
        silasResponseContainer.innerHTML = '';
        silasResponseContainer.style.display = 'none';
        silasStatus.textContent = 'Bereit zur Generierung.';
    });

    if (closePreviewModalBtn) closePreviewModalBtn.addEventListener('click', closePreviewModal);
    if (previewModal) previewModal.addEventListener('click', e => { if (e.target === previewModal) closePreviewModal(); });
    
    initDemoTracking();
    showDemoStatus();
    createMasterPasswordUI();
}
