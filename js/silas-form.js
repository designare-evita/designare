// js/silas-form.js - FINALE, VOLLSTÄNDIGE VERSION MIT ALLEN FUNKTIONEN UND KORREKTUREN

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) {
        return; // Stellt sicher, dass das Skript nur auf der richtigen Seite läuft
    }

    // =================================================================================
    // VARIABLEN & KONSTANTEN
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

    let keywordList = [];
    let allGeneratedData = []; 
    let isMasterMode = false;

    // =================================================================================
    // UI, LIMITIERUNGEN & BADGES
    // =================================================================================
    
    function updateKeywordDisplay() {
        keywordDisplayList.innerHTML = '';
        if (keywordList.length === 0) {
            keywordDisplayList.innerHTML = '<li class="empty-list-info">Füge Keywords hinzu, um Content-Themen zu erstellen.</li>';
        } else {
            keywordList.forEach((keyword, index) => {
                const li = document.createElement('li');
                li.setAttribute('data-keyword', keyword);
                li.innerHTML = `<span>${keyword}</span><div class="status">Bereit</div><button class="remove-btn" data-index="${index}">&times;</button>`;
                keywordDisplayList.appendChild(li);
            });
        }
        startGenerationBtn.disabled = keywordList.length === 0;
        clearListBtn.disabled = keywordList.length === 0;
    }

    function addKeywords() {
        const limits = isMasterMode ? MASTER_LIMITS : DEMO_LIMITS;
        const keywords = keywordInput.value.split(',')
            .map(kw => kw.trim())
            .filter(kw => kw.length > 0 && !keywordList.includes(kw));

        if (keywordList.length + keywords.length > limits.maxKeywordsPerSession) {
            alert(`Limit erreicht: Du kannst maximal ${limits.maxKeywordsPerSession} Keywords pro Sitzung hinzufügen.`);
            return;
        }

        keywordList.push(...keywords);
        keywordInput.value = '';
        updateKeywordDisplay();
    }
    
    function getTrackingData() {
        try {
            const data = localStorage.getItem('silasDemoTracking');
            return data ? JSON.parse(data) : { lastReset: Date.now(), generations: [] };
        } catch (e) {
            return { lastReset: Date.now(), generations: [] };
        }
    }

    function setTrackingData(data) {
        localStorage.setItem('silasDemoTracking', JSON.stringify(data));
    }

    function checkLimits() {
        try {
            if (isMasterMode) {
                return { allowed: true };
            }

            let trackingData = getTrackingData();
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            const oneDay = 24 * oneHour;

            if (now - trackingData.lastReset > oneDay) {
                trackingData = { lastReset: now, generations: [] };
                setTrackingData(trackingData);
            }

            const generationsLastHour = trackingData.generations.filter(ts => now - ts < oneHour).length;
            const generationsLastDay = trackingData.generations.length;

            if (generationsLastDay >= DEMO_LIMITS.maxGenerationsPerDay) {
                return { allowed: false, reason: "Tageslimit erreicht." };
            }
            if (generationsLastHour >= DEMO_LIMITS.maxGenerationsPerHour) {
                return { allowed: false, reason: "Stundenlimit erreicht." };
            }
            if (keywordList.length > DEMO_LIMITS.maxKeywordsPerSession) {
                return { allowed: false, reason: "Maximale Keywords pro Sitzung überschritten." };
            }
            
            const lastGenerationTime = trackingData.generations[trackingData.generations.length - 1];
            if (lastGenerationTime && (now - lastGenerationTime < DEMO_LIMITS.cooldownBetweenRequests)) {
                 return { allowed: false, reason: `Bitte warte einen Moment vor der nächsten Anfrage.` };
            }

            return { allowed: true };
        } catch (error) {
            console.error("Fehler in checkLimits:", error);
            return { allowed: false, reason: "Interner Fehler bei der Limit-Prüfung." };
        }
    }
    
    function initDemoTracking() {
        if (!localStorage.getItem('silasDemoTracking')) {
            setTrackingData({ lastReset: Date.now(), generations: [] });
        }
    }
    
    function showDemoStatus() {
        if (isMasterMode) {
            const statusDiv = document.getElementById('demo-status');
            if(statusDiv) statusDiv.innerHTML = '<p class="master-mode-active">⚡ Master-Modus Aktiv</p>';
            return;
        }
        let trackingData = getTrackingData();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const generationsLastHour = trackingData.generations.filter(ts => now - ts < oneHour).length;
        const generationsLastDay = trackingData.generations.length;

        const statusDiv = document.getElementById('demo-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <p><strong>Demo-Status:</strong></p>
                <ul>
                    <li>Stunde: ${generationsLastHour}/${DEMO_LIMITS.maxGenerationsPerHour}</li>
                    <li>Tag: ${generationsLastDay}/${DEMO_LIMITS.maxGenerationsPerDay}</li>
                </ul>
            `;
        }
    }

    function createMasterPasswordUI() {
        const container = document.querySelector('.ai-container');
        if (!container) return;

        // Verhindert, dass das Passwortfeld mehrfach hinzugefügt wird
        if (document.getElementById('master-password-input')) return;

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'master-password-input';
        passwordInput.placeholder = 'Master-Passwort (optional)';
        passwordInput.style.marginTop = '10px';
        passwordInput.classList.add('silas-extra-input');
        
        passwordInput.addEventListener('input', (e) => {
            if (e.target.value === MASTER_PASSWORD) {
                isMasterMode = true;
                DEMO_LIMITS = MASTER_LIMITS;
                console.log("Master-Modus aktiviert!");
                passwordInput.style.borderColor = 'lime';
                showDemoStatus();
            } else {
                if(isMasterMode) {
                    isMasterMode = false;
                    DEMO_LIMITS = { maxKeywordsPerSession: 3, maxGenerationsPerHour: 5, maxGenerationsPerDay: 10, cooldownBetweenRequests: 30000 };
                    passwordInput.style.borderColor = '';
                    console.log("Master-Modus deaktiviert.");
                    showDemoStatus();
                }
            }
        });
        
        container.insertBefore(passwordInput, container.querySelector('#silas-form'));
    }

    // WIEDER HINZUGEFÜGT: Die Funktion zur Erstellung der Badges
    function createInputBadges() {
        const inputsWithBadges = [
            { id: 'text-domain-input', label: 'Domain' },
            { id: 'text-brand-input', label: 'Brand' },
            { id: 'text-email-input', label: 'E-Mail' },
            { id: 'text-phone-input', label: 'Telefon' },
            { id: 'text-zielgruppe-input', label: 'Zielgruppe' },
            { id: 'text-tonalitaet-input', label: 'Tonalität' },
            { id: 'text-usp-input', label: 'USP' }
        ];

        inputsWithBadges.forEach(config => {
            const inputElement = document.getElementById(config.id);
            if (inputElement) {
                const container = inputElement.parentElement;
                
                let badgeContainer = container.querySelector('.badge-container');
                if (!badgeContainer) {
                    badgeContainer = document.createElement('div');
                    badgeContainer.className = 'badge-container';
                    inputElement.insertAdjacentElement('afterend', badgeContainer);
                }

                inputElement.addEventListener('input', () => {
                    badgeContainer.innerHTML = ''; 
                    if (inputElement.value.trim() !== '') {
                        const badge = document.createElement('span');
                        badge.className = 'input-badge';
                        badge.textContent = config.label;
                        badgeContainer.appendChild(badge);
                    }
                });
            }
        });
    }

    // =================================================================================
    // KERNFUNKTION: CONTENT-GENERIERUNG
    // =================================================================================

    async function handleKeywordGeneration() {
        const limitCheck = checkLimits();
        if (!limitCheck.allowed) {
            silasStatus.textContent = `❌ Limit erreicht: ${limitCheck.reason}`;
            return;
        }

        startGenerationBtn.disabled = true;
        clearListBtn.disabled = true;
        silasStatus.textContent = '🔮 Silas zaubert... bitte warten.';
        
        const keywords = [...keywordList];
        const options = {
            intent: document.getElementById('text-intent-select').value,
            zielgruppe: document.getElementById('text-zielgruppe-input').value,
            tonalitaet: document.getElementById('text-tonalitaet-input').value,
            usp: document.getElementById('text-usp-input').value,
            domain: document.getElementById('text-domain-input').value,
            email: document.getElementById('text-email-input').value,
            phone: document.getElementById('text-phone-input').value,
            brand: document.getElementById('text-brand-input').value,
            isMasterRequest: isMasterMode
        };

        silasResponseContainer.style.display = 'block';
        silasResponseContainer.innerHTML = '';
        allGeneratedData = [];

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords, ...options })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Serverfehler: ${errorData.message || response.statusText}`);
            }

            const results = await response.json();
            
            results.forEach(result => {
                allGeneratedData.push(result);
                displaySingleResult(result.keyword, result);
            });

            silasStatus.textContent = `✅ ${keywords.length} Content-Themen erfolgreich erstellt.`;
            createDownloadButton();

            if (!isMasterMode) {
                const trackingData = getTrackingData();
                keywords.forEach(() => trackingData.generations.push(Date.now()));
                setTrackingData(trackingData);
                showDemoStatus();
            }

        } catch (error) {
            console.error('Fehler bei der Content-Generierung:', error);
            silasStatus.textContent = `💥 Fehler: ${error.message}`;
        } finally {
            startGenerationBtn.disabled = keywordList.length === 0;
            clearListBtn.disabled = keywordList.length === 0;
        }
    }

    // =================================================================================
    // UI-DARSTELLUNG DER ERGEBNISSE
    // =================================================================================
    
    function displaySingleResult(keyword, result) {
        const keywordStatusElement = document.querySelector(`li[data-keyword="${keyword}"] .status`);

        if (result.error || (result.correctedContent && result.correctedContent._parse_error)) {
            if (keywordStatusElement) {
                keywordStatusElement.textContent = '❌ Fehler';
                keywordStatusElement.className = 'status error';
            }
            const errorElement = document.createElement('div');
            errorElement.className = 'result-item';
            errorElement.innerHTML = `<h4>Fehler bei: "${keyword}"</h4><p class="error-message">${result.error || (result.correctedContent ? result.correctedContent.meta_description : 'Unbekannter Fehler')}</p>`;
            silasResponseContainer.appendChild(errorElement);
            return;
        }

        if (keywordStatusElement) {
            keywordStatusElement.textContent = '✅ Fertig';
            keywordStatusElement.className = 'status success';
        }

        const resultElement = document.createElement('div');
        resultElement.className = 'result-item';
        resultElement.innerHTML = `
            <h4>Ergebnis für: "${keyword}"</h4>
            <div class="fact-check-summary">
                <span class="confidence-score score-${getScoreColor(result.confidenceScore)}">
                    Vertrauens-Score: ${result.confidenceScore}/100
                </span>
                <span class="corrections-count">
                    Korrekturen: ${result.corrections.length}
                </span>
            </div>
            ${result.corrections.length > 0 ? createCorrectionsList(result.corrections) : '<p class="no-corrections">Keine automatischen Korrekturen notwendig.</p>'}
            <button class="cta-button preview-button" data-keyword="${keyword}">Vorschau anzeigen</button>
        `;
        silasResponseContainer.appendChild(resultElement);
    }
    
    function getScoreColor(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }

    function createCorrectionsList(corrections) {
        let listHtml = '<ul class="corrections-list">';
        const correctionsToShow = corrections.slice(0, 3);
        correctionsToShow.forEach(corr => {
            listHtml += `<li><strong>[${corr.field}]</strong> "${escapeHtml(corr.from)}" wurde zu "${escapeHtml(corr.to)}" geändert.</li>`;
        });
        if (corrections.length > 3) {
            listHtml += `<li>... und ${corrections.length - 3} weitere.</li>`;
        }
        listHtml += '</ul>';
        return listHtml;
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // =================================================================================
    // VORSCHAU & CSV-EXPORT
    // =================================================================================

    function showPreviewModal(data) {
        if (!data) return;
        let contentHtml = '<h2>Vorschau: ' + escapeHtml(data.post_title) + '</h2>';
        for (const [key, value] of Object.entries(data)) {
            if (key !== 'keyword' && !key.startsWith('_')) {
                let displayValue = escapeHtml(value);
                if (typeof value === 'string' && value.trim().startsWith('<ul>')) {
                    displayValue = value;
                }
                contentHtml += `
                    <div class="preview-field">
                        <strong>${escapeHtml(key)}:</strong>
                        <div>${displayValue}</div>
                    </div>
                `;
            }
        }
        previewContentArea.innerHTML = contentHtml;
        previewModal.style.display = 'flex';
    }

    function closePreviewModal() {
        previewModal.style.display = 'none';
    }

    function createDownloadButton() {
        const oldButton = document.getElementById('download-csv-btn');
        if (oldButton) oldButton.remove();
        
        const downloadButton = document.createElement('button');
        downloadButton.id = 'download-csv-btn';
        downloadButton.className = 'cta-button';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Alle als CSV herunterladen';
        downloadButton.onclick = downloadCSV;
        silasResponseContainer.appendChild(downloadButton);
    }
    
    function convertToCSV(dataArray) {
        if (!dataArray || dataArray.length === 0) return '';
        const firstValidItem = dataArray.find(item => item && item.correctedContent);
        if (!firstValidItem) return '';

        const headers = Object.keys(firstValidItem.correctedContent);
        const csvRows = [headers.join(';')];
        
        for (const item of dataArray) {
            if(!item || !item.correctedContent || item.error) continue;

            const row = item.correctedContent;
            const values = headers.map(header => {
                const escaped = ('' + (row[header] || '')).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(';'));
        }
        return csvRows.join('\n');
    }

    function downloadCSV() {
        const csvContent = convertToCSV(allGeneratedData);
        if(!csvContent) {
            alert("Keine gültigen Daten zum Herunterladen vorhanden.");
            return;
        }
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
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
    
    // =================================================================================
    // EVENT LISTENERS
    // =================================================================================
    
    silasForm.addEventListener('submit', function(e) { e.preventDefault(); addKeywords(); });
    keywordInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); addKeywords(); } });
    
    keywordDisplayList.addEventListener('click', function(e) {
        if (e.target.matches('.remove-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            keywordList.splice(index, 1);
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

    startGenerationBtn.addEventListener('click', handleKeywordGeneration);

    silasResponseContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('preview-button')) {
            const keyword = event.target.getAttribute('data-keyword');
            const dataToShow = allGeneratedData.find(d => d.keyword === keyword);
            if (dataToShow) {
                showPreviewModal(dataToShow.correctedContent);
            }
        }
    });

    if (closePreviewModalBtn) closePreviewModalBtn.addEventListener('click', closePreviewModal);
    if (previewModal) previewModal.addEventListener('click', function(e) { if (e.target === previewModal) closePreviewModal(); });
    
    // INITIALISIERUNG
    updateKeywordDisplay();
    initDemoTracking();
    showDemoStatus();
    createMasterPasswordUI();
    // WIEDER HINZUGEFÜGT: Der Aufruf, um die Badges zu erstellen
    createInputBadges();
}

