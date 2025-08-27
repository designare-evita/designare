// js/silas-form.js - KORRIGIERTE VERSION

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) {
        return;
    }

    // =================================================================================
    // VARIABLEN & KONSTANTEN
    // =================================================================================
    const MASTER_PASSWORD = "SilasUnlimited2024!";
    let CURRENT_LIMITS = { maxKeywordsPerSession: 3, maxGenerationsPerHour: 5, maxGenerationsPerDay: 10, cooldownBetweenRequests: 30000 };
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
    const zielgruppeInput = document.getElementById('text-zielgruppe-input');
    const tonalitaetInput = document.getElementById('text-tonalitaet-input');
    const uspInput = document.getElementById('text-usp-input');

    let keywordList = [];
    let allGeneratedData = [];

    // =================================================================================
    // PASSWORT- UND LIMIT-SYSTEM
    // =================================================================================
    
    function isMasterModeActive() {
        const masterMode = sessionStorage.getItem('silas_master_mode');
        const timestamp = parseInt(sessionStorage.getItem('silas_master_timestamp') || '0');
        const now = Date.now();
        // Master-Modus ist für 8 Stunden gültig
        if (masterMode === 'true' && (now - timestamp) < (8 * 60 * 60 * 1000)) {
            return true;
        }
        if (masterMode === 'true') { // Wenn Zeit abgelaufen ist, Modus zurücksetzen
            sessionStorage.removeItem('silas_master_mode');
            sessionStorage.removeItem('silas_master_timestamp');
        }
        return false;
    }

    // Initial-Check beim Laden der Seite
    if (isMasterModeActive()) {
        CURRENT_LIMITS = { ...MASTER_LIMITS };
        console.log('🔓 Master Mode bereits aktiv');
    }

    function createMasterPasswordUI() {
        if (document.getElementById('master-unlock-btn')) return; // Button nicht doppelt erstellen

        if (!isMasterModeActive()) {
            const unlockBtn = document.createElement('button');
            unlockBtn.id = 'master-unlock-btn';
            unlockBtn.innerHTML = '🔓';
            unlockBtn.title = 'Master Access';
            unlockBtn.style.cssText = 'position: fixed; bottom: 40px; right: 20px; background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); border: 2px solid #e0a800; color: #1a1a1a; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); transition: all 0.3s ease; z-index: 1000;';
            unlockBtn.onclick = showPasswordPrompt;
            document.body.appendChild(unlockBtn);
        } else {
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
        CURRENT_LIMITS = { ...MASTER_LIMITS };
        // Alle Tracking-Daten löschen, um sofortigen Zugriff zu gewähren
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
        indicator.innerHTML = `
            🔓 <strong>MASTER MODE AKTIV</strong> 🔓<br>
            <small style="opacity: 0.9;">Unlimited Keywords • No Rate Limits • Full Access</small>
            <button id="deactivate-master-mode-btn" style="position: absolute; top: 8px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;" title="Master Mode deaktivieren">×</button>
        `;
        silasForm.parentNode.insertBefore(indicator, silasForm);

        document.getElementById('deactivate-master-mode-btn').addEventListener('click', () => {
             if (confirm('Master Mode deaktivieren? Die Seite wird neu geladen.')) {
                sessionStorage.removeItem('silas_master_mode');
                sessionStorage.removeItem('silas_master_timestamp');
                location.reload();
            }
        });
    }

    function hideUnlockButton() {
        const btn = document.getElementById('master-unlock-btn');
        if (btn) btn.style.display = 'none';
    }

    function showNotification(message, color = '#ffc107') {
        const notification = document.createElement('div');
        notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${color}; color: white; padding: 15px 25px; border-radius: 8px; font-weight: bold; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);`;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    function initDemoTracking() {
        const today = new Date().toDateString();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily') || '{}');
        if (dailyData.date !== today) {
            localStorage.setItem('silas_daily', JSON.stringify({ date: today, count: 0 }));
        }

        const currentHour = new Date().getHours();
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly') || '{}');
        if (hourlyData.hour !== currentHour) {
             localStorage.setItem('silas_hourly', JSON.stringify({ hour: currentHour, count: 0 }));
        }
    }
    
    function checkRateLimit() {
        if (isMasterModeActive()) return true;
        const now = Date.now();
        const dailyData = JSON.parse(localStorage.getItem('silas_daily'));
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly'));
        const lastRequest = parseInt(localStorage.getItem('silas_last_request') || '0');

        if (now - lastRequest < CURRENT_LIMITS.cooldownBetweenRequests) {
            throw new Error(`⏱️ Bitte warte noch ${Math.ceil((CURRENT_LIMITS.cooldownBetweenRequests - (now - lastRequest)) / 1000)} Sekunden.`);
        }
        if (dailyData.count >= CURRENT_LIMITS.maxGenerationsPerDay) {
            throw new Error(`📅 Tägliches Demo-Limit erreicht (${CURRENT_LIMITS.maxGenerationsPerDay}).`);
        }
        if (hourlyData.count >= CURRENT_LIMITS.maxGenerationsPerHour) {
            throw new Error(`⏰ Stündliches Demo-Limit erreicht (${CURRENT_LIMITS.maxGenerationsPerHour}).`);
        }
        return true;
    }
    
    function updateUsageCounters() {
        if (isMasterModeActive()) return;
        const now = Date.now();
        
        const dailyData = JSON.parse(localStorage.getItem('silas_daily'));
        dailyData.count++;
        localStorage.setItem('silas_daily', JSON.stringify(dailyData));
        
        const hourlyData = JSON.parse(localStorage.getItem('silas_hourly'));
        hourlyData.count++;
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
        if (forbidden.some(term => keyword.toLowerCase().includes(term))) {
            throw new Error(`🚫 Das Keyword "${keyword}" ist nicht erlaubt.`);
        }
        if (keyword.length > 50) throw new Error('📏 Keywords dürfen maximal 50 Zeichen lang sein.');
        if (!/^[a-zA-ZäöüÄÖÜß\s\-_0-9]+$/.test(keyword)) throw new Error('✏️ Keywords dürfen nur Buchstaben, Zahlen, Leerzeichen und Bindestriche enthalten.');
        return true;
    }

    function showDemoStatus() {
        let demoStatusContainer = document.getElementById('silas-demo-status');
        if (!demoStatusContainer) {
            demoStatusContainer = document.createElement('div');
            demoStatusContainer.id = 'silas-demo-status';
            silasForm.parentNode.insertBefore(demoStatusContainer, silasForm.nextSibling); // Besser nach dem Formular einfügen
        }

        if (isMasterModeActive()) {
            demoStatusContainer.innerHTML = `<div style="background: linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(32,201,151,0.1) 100%); border: 1px solid #28a745; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #28a745;"><strong>🔓 UNLIMITED MODE:</strong> Keine Beschränkungen aktiv</div>`;
        } else {
            const dailyData = JSON.parse(localStorage.getItem('silas_daily'));
            const hourlyData = JSON.parse(localStorage.getItem('silas_hourly'));
            const dailyRemaining = CURRENT_LIMITS.maxGenerationsPerDay - (dailyData.count || 0);
            const hourlyRemaining = CURRENT_LIMITS.maxGenerationsPerHour - (hourlyData.count || 0);
            demoStatusContainer.innerHTML = `<div style="background: linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%); border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #ffc107;"><strong>🎯 Demo-Modus:</strong> Heute noch <strong>${dailyRemaining}</strong> | Diese Stunde noch <strong>${hourlyRemaining}</strong> Generierungen</div>`;
        }
    }
    
    // =================================================================================
    // KERNFUNKTIONEN
    // =================================================================================
    
    function addKeywords() {
        try {
            const newKeywords = keywordInput.value.split(',').map(kw => kw.trim()).filter(Boolean);
            if (newKeywords.length === 0) return;

            if (!isMasterModeActive() && (keywordList.length + newKeywords.length > CURRENT_LIMITS.maxKeywordsPerSession)) {
                throw new Error(`🎯 Demo-Limit: Maximal ${CURRENT_LIMITS.maxKeywordsPerSession} Keywords pro Session.`);
            }

            // Validierung für alle Keywords, bevor sie hinzugefügt werden
            newKeywords.forEach(validateKeyword);

            const zielgruppe = zielgruppeInput.value.trim();
            const tonalitaet = tonalitaetInput.value.trim();
            const usp = uspInput.value.trim();
            const intent = textIntentSelect.value;

            newKeywords.forEach(keyword => {
                const item = { keyword, intent, zielgruppe, tonalitaet, usp };
                const existingIndex = keywordList.findIndex(k => k.keyword === keyword);
                if (existingIndex > -1) {
                    keywordList[existingIndex] = item; // Update
                } else {
                    keywordList.push(item); // Add
                }
            });

            updateKeywordDisplay();
            keywordInput.value = '';
            silasStatus.textContent = `✅ ${newKeywords.length} Keyword(s) hinzugefügt/aktualisiert.`;
            setTimeout(() => { silasStatus.textContent = 'Bereit zur Generierung.'; }, 2000);

        } catch (error) {
            silasStatus.textContent = error.message;
            silasStatus.style.color = '#ff6b6b';
            setTimeout(() => { 
                silasStatus.textContent = 'Bereit zur Generierung.'; 
                silasStatus.style.color = '#ffc107'; // Standardfarbe wiederherstellen
            }, 4000);
        }
    }

    function updateKeywordDisplay() {
        keywordDisplayList.innerHTML = '';
        keywordList.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'keyword-list-item'; // Klasse für einfacheres Styling
            listItem.style.borderLeftColor = item.intent === 'commercial' ? '#28a745' : '#17a2b8';

            let badgesHTML = `<span class="badge" style="background-color: ${item.intent === 'commercial' ? '#28a745' : '#17a2b8'};">${item.intent === 'commercial' ? 'Kommerziell' : 'Informativ'}</span>`;
            if (item.zielgruppe) badgesHTML += `<span class="badge">Für: ${item.zielgruppe}</span>`;
            if (item.tonalitaet) badgesHTML += `<span class="badge">Ton: ${item.tonalitaet}</span>`;
            if (item.usp) badgesHTML += `<span class="badge">USP: ${item.usp}</span>`;

            listItem.innerHTML = `
                <div class="keyword-content">
                    <span class="keyword-text">${item.keyword}</span>
                    <div class="keyword-badges">${badgesHTML}</div>
                </div>
                <button class="remove-btn" data-index="${index}" title="Keyword entfernen">×</button>
            `;
            keywordDisplayList.appendChild(listItem);
        });
        clearListBtn.style.display = keywordList.length > 0 ? 'inline-block' : 'none';
    }

    async function startGeneration() {
        if (keywordList.length === 0) {
            silasStatus.textContent = 'Bitte füge zuerst Keywords hinzu.';
            return;
        }

        try {
            checkRateLimit();
            startGenerationBtn.disabled = true;
            clearListBtn.disabled = true;
            allGeneratedData = [];
            silasResponseContainer.style.display = 'block';
            silasResponseContainer.innerHTML = '<h3><i class="fas fa-spinner fa-spin"></i> Erstellung läuft...</h3><div id="silas-response-content"></div>';
            silasStatus.textContent = `Sende ${keywordList.length} Keywords an Silas...`;
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(isMasterModeActive() && { 'X-Silas-Master': MASTER_PASSWORD })
                },
                body: JSON.stringify({ keywords: keywordList })
            });
            
            const results = await response.json();

            if (!response.ok) {
                throw new Error(results.error || `Server-Fehler: ${response.statusText}`);
            }

            allGeneratedData = results;

            silasResponseContainer.querySelector('h3').textContent = 'Erstellung abgeschlossen!';
            const responseContent = document.getElementById('silas-response-content');
            responseContent.innerHTML = '';
            results.forEach((data, index) => displayResult(data, index, responseContent));
            
            updateUsageCounters();
            silasStatus.textContent = `✅ Alle ${keywordList.length} Texte wurden verarbeitet.`;
            
            // CSV-Button nur hinzufügen, wenn es erfolgreiche Ergebnisse gibt
            if (allGeneratedData.some(d => !d.error)) {
                const downloadButton = document.createElement('button');
                downloadButton.id = 'download-csv-dynamic';
                downloadButton.className = 'cta-button';
                downloadButton.innerHTML = '<i class="fas fa-download"></i> CSV Herunterladen';
                downloadButton.style.marginTop = '1rem';
                downloadButton.onclick = downloadCsv;
                silasResponseContainer.appendChild(downloadButton);
            }
        } catch (error) {
            console.error('Fehler bei der Generierung:', error);
            silasStatus.textContent = `Fehler: ${error.message}`;
            silasStatus.style.color = '#ff6b6b';
            if (silasResponseContainer.querySelector('h3')) {
                silasResponseContainer.querySelector('h3').textContent = 'Fehler bei der Erstellung';
            }
        } finally {
            startGenerationBtn.disabled = false;
            clearListBtn.disabled = false;
        }
    }

    function displayResult(data, index, container) {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.style.borderLeftColor = data.intent === 'commercial' ? '#28a745' : '#17a2b8';

        if (data.error) {
            resultCard.innerHTML = `<h4 style="color: #ff6b6b;">${data.keyword}</h4><p style="color: #ff6b6b;">Fehler: ${data.error}</p>`;
        } else {
            resultCard.innerHTML = `
                <h4>${data.keyword}</h4>
                <p><strong>Titel:</strong> ${data.post_title || 'N/A'}</p>
                <p><strong>Meta:</strong> ${data.meta_description || 'N/A'}</p>
                <button class="preview-btn" data-index="${index}">Vorschau anzeigen</button>`;
        }
        container.appendChild(resultCard);
    }

    // =================================================================================
    // VORSCHAU MODAL
    // =================================================================================
   
    function openPreviewModal() { 
        if (previewModal) {
            document.body.classList.add('modal-open');
            previewModal.classList.add('visible');
        } else {
            console.error('ERROR: Preview modal element not found!');
        }
    }

    function closePreviewModal() { 
        if (previewModal) {
            document.body.classList.remove('modal-open');
            previewModal.classList.remove('visible');
        }
    }

    function showPreview(index) {
        const data = allGeneratedData[index];
        if (!data || data.error || !previewContentArea) return;

        // Hilfsfunktion, um leere Daten zu behandeln
        const val = (field) => data[field] || '<span style="color: #888;">N/A</span>';
        const listItems = (field) => {
            if (!data[field]) return val(field);
            // Nimmt an, dass die Liste durch Zeilenumbrüche getrennt ist
            return '<ul>' + data[field].split('\n').map(item => `<li>${item}</li>`).join('') + '</ul>';
        };

        const previewHtml = `
            <div class="preview-container">
                <h2>Vorschau: ${val('keyword')}</h2>
                
                <div class="preview-section">
                    <h3>📝 Haupttitel & Hero-Bereich</h3>
                    <p><strong>H1:</strong> ${val('h1')}</p>
                    <p><strong>Hero-Text:</strong> ${val('hero_text')}</p>
                    <p><strong>Hero-Subtext:</strong> ${val('hero_subtext')}</p>
                    <p><strong>Primärer CTA:</strong> ${val('primary_cta')}</p>
                    <p><strong>Sekundärer CTA:</strong> ${val('secondary_cta')}</p>
                </div>
                
                <div class="preview-section">
                    <h3>📌 Hauptüberschriften</h3>
                    <p><strong>H2 #1:</strong> ${val('h2_1')}</p>
                    <p><strong>H2 #2:</strong> ${val('h2_2')}</p>
                    <p><strong>H2 #3:</strong> ${val('h2_3')}</p>
                    <p><strong>H2 #4:</strong> ${val('h2_4')}</p>
                </div>

                <div class="preview-section">
                    <h3>✨ Features & Vorteile</h3>
                    <p><strong>Features:</strong></p>
                    ${listItems('features_list')}
                    <p><strong>Vorteile:</strong></p>
                    ${listItems('benefits_list')}
                </div>

                <div class="preview-section">
                    <h3>⭐ Vertrauenselemente</h3>
                    <p><strong>Social Proof:</strong> ${val('social_proof')}</p>
                    <p><strong>Trust Signals:</strong> ${val('trust_signals')}</p>
                    <p><strong>Garantie:</strong> ${val('guarantee_text')}</p>
                </div>
                
                <div class="preview-section seo-meta">
                    <h3>🔍 SEO-Metadaten</h3>
                    <p><strong>Post Title:</strong> ${val('post_title')}</p>
                    <p><strong>URL Slug:</strong> <code>${val('post_name')}</code></p>
                    <p><strong>Meta Title:</strong> ${val('meta_title')}</p>
                    <p><strong>Meta Description:</strong> ${val('meta_description')}</p>
                </div>
            </div>`;
                        
        previewContentArea.innerHTML = previewHtml;
        openPreviewModal();
    }

    // =================================================================================
    // CSV DOWNLOAD
    // =================================================================================

    function downloadCsv() {
        const dataToExport = allGeneratedData.filter(d => !d.error);
        if (dataToExport.length === 0) {
            alert('Keine erfolgreichen Daten zum Download verfügbar.');
            return;
        }

        const headers = ["keyword", "post_title", "post_name", "meta_title", "meta_description", "h1", "h2_1", "h2_2", "h2_3", "h2_4", "primary_cta", "secondary_cta", "hero_text", "hero_subtext", "benefits_list", "features_list", "social_proof", "testimonial_1", "testimonial_2", "pricing_title", "price_1", "price_2", "price_3", "faq_1", "faq_answer_1", "faq_2", "faq_answer_2", "faq_3", "faq_answer_3", "contact_info", "footer_cta", "trust_signals", "guarantee_text"];
        let csvContent = headers.join(",") + "\n";
        
        dataToExport.forEach(rowData => {
            const values = headers.map(header => {
                const value = String(rowData[header] || '').replace(/"/g, '""');
                return `"${value}"`;
            });
            csvContent += values.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "silas_generated_content.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
    
    // =================================================================================
    // EVENT LISTENERS
    // =================================================================================
    
    silasForm.addEventListener('submit', (e) => { 
        e.preventDefault(); 
        addKeywords(); 
    });

    keywordInput.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            addKeywords(); 
        } 
    });
    
    startGenerationBtn.addEventListener('click', startGeneration);

    keywordDisplayList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = e.target.dataset.index;
            keywordList.splice(index, 1);
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

    // Delegierter Event-Listener für Vorschau-Buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('preview-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            showPreview(index);
        }
    });

    if (closePreviewModalBtn) {
        closePreviewModalBtn.addEventListener('click', closePreviewModal);
    }
    
    if (previewModal) {
        previewModal.addEventListener('click', (e) => { 
            if (e.target === previewModal) { // Nur schliessen, wenn auf den Hintergrund geklickt wird
                closePreviewModal();
            }
        });
    }
    
    // =================================================================================
    // INITIALISIERUNG
    // =================================================================================
    initDemoTracking();
    showDemoStatus();
    createMasterPasswordUI();
}
