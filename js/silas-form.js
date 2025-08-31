// js/silas-form.js - KORRIGIERTE VORSCHAU-FUNKTIONALITÄT

export function initSilasForm() {
    // Prüfe erst, ob wir auf der richtigen Seite sind
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) {
        console.log('Silas Form nicht gefunden - überspringe Initialisierung');
        return;
    }

    console.log('🎯 Initialisiere Silas Form...');

    // =================================================================================
    // KONSTANTEN & VARIABLEN
    // =================================================================================
    const MASTER_PASSWORD = "SilasUnlimited2024!";
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
    
    // DOM-ELEMENTE SICHER ABRUFEN
    const keywordInput = document.getElementById('silas-keyword-input');
    const keywordDisplayList = document.getElementById('keyword-display-list');
    const startGenerationBtn = document.getElementById('start-generation-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    const silasStatus = document.getElementById('silas-status');
    const silasResponseContainer = document.getElementById('silas-response-container');

    // Prüfe kritische Elemente
    if (!keywordInput || !keywordDisplayList || !startGenerationBtn || !silasStatus) {
        console.error('❌ Kritische Silas-Elemente fehlen im DOM');
        return;
    }

    let keywordList = [];
    let allGeneratedData = [];
    let isMasterMode = false;

    // =================================================================================
    // VERBESSERTE MODAL-FUNKTIONALITÄT
    // =================================================================================
    
    function createPreviewModal() {
        // Prüfe ob Modal bereits existiert
        let existingModal = document.getElementById('silas-preview-modal');
        if (existingModal) {
            return existingModal;
        }

        // Erstelle das Modal dynamisch
        const modalHTML = `
            <div id="silas-preview-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content preview-modal-content">
                    <button id="close-preview-modal" class="close-button">&times;</button>
                    <div id="preview-content-area">
                        <!-- Content wird hier eingefügt -->
                    </div>
                </div>
            </div>
        `;

        // Füge Modal zum Body hinzu
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('silas-preview-modal');
        const closeBtn = document.getElementById('close-preview-modal');
        
        // Event-Listener für Schließen
        if (closeBtn) {
            closeBtn.addEventListener('click', closePreviewModal);
        }
        
        // Event-Listener für Klick außerhalb des Modals
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closePreviewModal();
                }
            });
        }

        console.log('✅ Vorschau-Modal dynamisch erstellt');
        return modal;
    }

    function showPreviewModal(data) {
        console.log('🔍 Zeige Vorschau für:', data);
        
        if (!data) {
            console.error('Keine Daten für Vorschau verfügbar');
            return;
        }

        // Stelle sicher, dass Modal existiert
        const modal = createPreviewModal();
        const previewContentArea = document.getElementById('preview-content-area');
        
        if (!previewContentArea) {
            console.error('Vorschau-Content-Bereich nicht gefunden');
            return;
        }
        
        // Erstelle HTML-Content
        let contentHtml = `<h2>Vorschau: ${escapeHtml(data.post_title || 'Unbekannt')}</h2>`;
        
        const fieldsOrder = [
            'post_title', 'meta_title', 'meta_description', 'h1', 
            'h2_1', 'h2_2', 'h2_3', 'h2_4',
            'hero_text', 'hero_subtext', 
            'benefits_list', 'features_list',
            'primary_cta', 'secondary_cta',
            'testimonial_1', 'testimonial_2',
            'social_proof', 'trust_signals'
        ];

        // Zeige Felder in sinnvoller Reihenfolge
        fieldsOrder.forEach(key => {
            if (data[key] && data[key].toString().trim()) {
                const value = data[key];
                let displayValue;
                
                // Behandle HTML-Listen anders
                if (typeof value === 'string' && (value.includes('<ul>') || value.includes('<ol>'))) {
                    displayValue = value; // HTML-Listen direkt anzeigen
                } else {
                    displayValue = escapeHtml(String(value));
                }
                
                contentHtml += `
                    <div class="preview-field">
                        <strong>${formatFieldName(key)}:</strong>
                        <div class="preview-field-content">${displayValue}</div>
                    </div>
                `;
            }
        });

        // Zeige restliche Felder
        Object.keys(data).forEach(key => {
            if (!fieldsOrder.includes(key) && !key.startsWith('_') && data[key] && data[key].toString().trim()) {
                const value = data[key];
                let displayValue = typeof value === 'string' && value.includes('<') ? value : escapeHtml(String(value));
                
                contentHtml += `
                    <div class="preview-field">
                        <strong>${formatFieldName(key)}:</strong>
                        <div class="preview-field-content">${displayValue}</div>
                    </div>
                `;
            }
        });

        previewContentArea.innerHTML = contentHtml;
        
        // Zeige Modal mit verschiedenen Fallbacks
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.classList.add('visible');
        
        // Verhindere Scrollen im Hintergrund
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Vorschau-Modal angezeigt');
    }

    function closePreviewModal() {
        const modal = document.getElementById('silas-preview-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.classList.remove('visible');
        }
        
        // Scrollen wieder aktivieren
        document.body.style.overflow = '';
        
        console.log('✅ Vorschau-Modal geschlossen');
    }

    function formatFieldName(fieldName) {
        // Mache Feldnamen benutzerfreundlicher
        const fieldNameMap = {
            'post_title': 'Seitentitel',
            'meta_title': 'SEO-Titel',
            'meta_description': 'Meta-Beschreibung',
            'h1': 'Hauptüberschrift (H1)',
            'h2_1': 'Überschrift 1 (H2)',
            'h2_2': 'Überschrift 2 (H2)',
            'h2_3': 'Überschrift 3 (H2)',
            'h2_4': 'Überschrift 4 (H2)',
            'hero_text': 'Hero-Text',
            'hero_subtext': 'Hero-Untertext',
            'benefits_list': 'Vorteile',
            'features_list': 'Features',
            'primary_cta': 'Haupt-Call-to-Action',
            'secondary_cta': 'Zweiter Call-to-Action',
            'testimonial_1': 'Testimonial 1',
            'testimonial_2': 'Testimonial 2',
            'social_proof': 'Soziale Bewährtheit',
            'trust_signals': 'Vertrauenssignale'
        };
        
        return fieldNameMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // =================================================================================
    // HILFSFUNKTIONEN (wie zuvor)
    // =================================================================================
    
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function updateKeywordDisplay() {
        if (!keywordDisplayList) return;
        
        keywordDisplayList.innerHTML = '';
        if (keywordList.length === 0) {
            keywordDisplayList.innerHTML = '<li class="empty-list-info">Füge Keywords hinzu, um Content-Themen zu erstellen.</li>';
        } else {
            keywordList.forEach((keyword, index) => {
                const li = document.createElement('li');
                li.setAttribute('data-keyword', keyword);
                li.innerHTML = `
                    <span>${escapeHtml(keyword)}</span>
                    <div class="status">Bereit</div>
                    <button class="remove-btn" data-index="${index}">&times;</button>
                `;
                keywordDisplayList.appendChild(li);
            });
        }
        
        if (startGenerationBtn) startGenerationBtn.disabled = keywordList.length === 0;
        if (clearListBtn) clearListBtn.disabled = keywordList.length === 0;
    }

    function addKeywords() {
        if (!keywordInput) return;
        
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

    // =================================================================================
    // WEITERE FUNKTIONEN (Tracking, Limits, etc. wie zuvor)
    // =================================================================================
    
    function getTrackingData() {
        try {
            const data = localStorage.getItem('silasDemoTracking');
            return data ? JSON.parse(data) : { lastReset: Date.now(), generations: [] };
        } catch (e) {
            return { lastReset: Date.now(), generations: [] };
        }
    }

    function setTrackingData(data) {
        try {
            localStorage.setItem('silasDemoTracking', JSON.stringify(data));
        } catch (e) {
            console.error('Fehler beim Speichern der Tracking-Daten:', e);
        }
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

    function showDemoStatus() {
        const statusDiv = document.getElementById('demo-status');
        if (!statusDiv) return;
        
        if (isMasterMode) {
            statusDiv.innerHTML = '<p class="master-mode-active">⚡ Master-Modus Aktiv</p>';
            return;
        }
        
        try {
            let trackingData = getTrackingData();
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            const generationsLastHour = trackingData.generations.filter(ts => now - ts < oneHour).length;
            const generationsLastDay = trackingData.generations.length;

            statusDiv.innerHTML = `
                <p><strong>Demo-Status:</strong></p>
                <ul>
                    <li>Stunde: ${generationsLastHour}/${DEMO_LIMITS.maxGenerationsPerHour}</li>
                    <li>Tag: ${generationsLastDay}/${DEMO_LIMITS.maxGenerationsPerDay}</li>
                </ul>
            `;
        } catch (error) {
            console.error('Fehler beim Anzeigen des Demo-Status:', error);
        }
    }

    function createMasterPasswordUI() {
        const container = document.querySelector('.ai-container');
        if (!container) return;

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
                console.log("🚀 Master-Modus aktiviert!");
                passwordInput.style.borderColor = 'lime';
                showDemoStatus();
            } else {
                if(isMasterMode) {
                    isMasterMode = false;
                    DEMO_LIMITS = { 
                        maxKeywordsPerSession: 3, 
                        maxGenerationsPerHour: 5, 
                        maxGenerationsPerDay: 10, 
                        cooldownBetweenRequests: 30000 
                    };
                    passwordInput.style.borderColor = '';
                    console.log("Master-Modus deaktiviert.");
                    showDemoStatus();
                }
            }
        });
        
        const formElement = container.querySelector('#silas-form');
        if (formElement) {
            container.insertBefore(passwordInput, formElement);
        } else {
            container.appendChild(passwordInput);
        }
    }

    // =================================================================================
    // CONTENT-GENERIERUNG
    // =================================================================================

    async function handleKeywordGeneration() {
        if (!startGenerationBtn || !silasStatus || !silasResponseContainer) {
            console.error('Kritische UI-Elemente für Generierung fehlen');
            return;
        }

        const limitCheck = checkLimits();
        if (!limitCheck || !limitCheck.allowed) {
            silasStatus.textContent = `❌ Limit erreicht: ${limitCheck.reason || 'Unbekannter Grund'}`;
            return;
        }

        startGenerationBtn.disabled = true;
        if (clearListBtn) clearListBtn.disabled = true;
        silasStatus.textContent = '🔮 Silas zaubert... bitte warten.';
        
        const keywords = [...keywordList];
        const options = {
            intent: getInputValue('text-intent-select') || 'informational',
            zielgruppe: getInputValue('text-zielgruppe-input'),
            tonalitaet: getInputValue('text-tonalitaet-input'),
            usp: getInputValue('text-usp-input'),
            domain: getInputValue('text-domain-input'),
            email: getInputValue('text-email-input'),
            phone: getInputValue('text-phone-input'),
            brand: getInputValue('text-brand-input'),
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
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Serverfehler: ${errorData.message || response.statusText}`);
            }

            const results = await response.json();
            
            results.forEach(result => {
                allGeneratedData.push(result);
                displaySingleResult(result.keyword, result);
            });

            silasStatus.textContent = `✅ ${keywords.length} Content-Themen erfolgreich erstellt.`;
            createDownloadButton();

            const trackingData = getTrackingData();
            keywords.forEach(() => trackingData.generations.push(Date.now()));
            setTrackingData(trackingData);
            showDemoStatus();

        } catch (error) {
            console.error('Fehler bei der Content-Generierung:', error);
            silasStatus.textContent = `💥 Fehler: ${error.message}`;
        } finally {
            startGenerationBtn.disabled = keywordList.length === 0;
            if (clearListBtn) clearListBtn.disabled = keywordList.length === 0;
        }
    }

    function getInputValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value.trim() : '';
    }

    // =================================================================================
    // UI-DARSTELLUNG DER ERGEBNISSE
    // =================================================================================
    
    function displaySingleResult(keyword, result) {
        if (!silasResponseContainer) return;

        const keywordStatusElement = document.querySelector(`li[data-keyword="${keyword}"] .status`);

        if (result.error || (result.correctedContent && result.correctedContent._parse_error)) {
            if (keywordStatusElement) {
                keywordStatusElement.textContent = '❌ Fehler';
                keywordStatusElement.className = 'status error';
            }
            const errorElement = document.createElement('div');
            errorElement.className = 'result-item';
            errorElement.innerHTML = `
                <h4>Fehler bei: "${escapeHtml(keyword)}"</h4>
                <p class="error-message">${escapeHtml(result.error || 'Unbekannter Fehler')}</p>
            `;
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
            <h4>Ergebnis für: "${escapeHtml(keyword)}"</h4>
            <div class="fact-check-summary">
                <span class="confidence-score score-${getScoreColor(result.confidenceScore || 85)}">
                    Vertrauens-Score: ${result.confidenceScore || 85}/100
                </span>
                <span class="corrections-count">
                    Korrekturen: ${result.corrections ? result.corrections.length : 0}
                </span>
            </div>
            ${result.corrections && result.corrections.length > 0 ? createCorrectionsList(result.corrections) : '<p class="no-corrections">Keine automatischen Korrekturen notwendig.</p>'}
            <button class="cta-button preview-button" data-keyword="${keyword}" onclick="window.showSilasPreview('${keyword}')">
                🔍 Vorschau anzeigen
            </button>
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
            listHtml += `<li><strong>[${escapeHtml(corr.field)}]</strong> "${escapeHtml(corr.from)}" wurde zu "${escapeHtml(corr.to)}" geändert.</li>`;
        });
        if (corrections.length > 3) {
            listHtml += `<li>... und ${corrections.length - 3} weitere.</li>`;
        }
        listHtml += '</ul>';
        return listHtml;
    }

    // =================================================================================
    // CSV-EXPORT
    // =================================================================================

    function createDownloadButton() {
        if (!silasResponseContainer) return;
        
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
        
        try {
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
        } catch (error) {
            console.error('Fehler beim CSV-Download:', error);
            alert('Fehler beim Herunterladen der CSV-Datei.');
        }
    }
    
    // =================================================================================
    // GLOBALE FUNKTION FÜR VORSCHAU-BUTTONS
    // =================================================================================
    
    // Mache die Vorschau-Funktion global verfügbar
    window.showSilasPreview = function(keyword) {
        console.log('🔍 Vorschau angefordert für:', keyword);
        const dataToShow = allGeneratedData.find(d => d.keyword === keyword);
        if (dataToShow && dataToShow.correctedContent) {
            showPreviewModal(dataToShow.correctedContent);
        } else {
            console.error('Keine Daten für Keyword gefunden:', keyword);
            alert('Keine Vorschau-Daten verfügbar für: ' + keyword);
        }
    };

    // =================================================================================
    // EVENT LISTENERS
    // =================================================================================
    
    // Formular-Submit
    if (silasForm) {
        silasForm.addEventListener('submit', function(e) { 
            e.preventDefault(); 
            addKeywords(); 
        });
    }

    // Enter-Taste im Input
    if (keywordInput) {
        keywordInput.addEventListener('keydown', function(e) { 
            if (e.key === 'Enter') { 
                e.preventDefault(); 
                addKeywords(); 
            } 
        });
    }
    
    // Keywords entfernen
    if (keywordDisplayList) {
        keywordDisplayList.addEventListener('click', function(e) {
            if (e.target.matches('.remove-btn')) {
                const index = parseInt(e.target.dataset.index, 10);
                if (!isNaN(index) && index >= 0 && index < keywordList.length) {
                    keywordList.splice(index, 1);
                    updateKeywordDisplay();
                }
            }
        });
    }

    // Liste leeren
    if (clearListBtn) {
        clearListBtn.addEventListener('click', function() {
            keywordList = [];
            allGeneratedData = [];
            updateKeywordDisplay();
            if (silasResponseContainer) {
                silasResponseContainer.innerHTML = '';
                silasResponseContainer.style.display = 'none';
            }
            if (silasStatus) silasStatus.textContent = 'Bereit zur Generierung.';
        });
    }

    // Generierung starten
    if (startGenerationBtn) {
        startGenerationBtn.addEventListener('click', handleKeywordGeneration);
    }

    // =================================================================================
    // INITIALISIERUNG
    // =================================================================================
    
    function initializeTracking() {
        try {
            if (!localStorage.getItem('silasDemoTracking')) {
                setTrackingData({ lastReset: Date.now(), generations: [] });
            }
        } catch (error) {
            console.error('Fehler bei der Tracking-Initialisierung:', error);
        }
    }

    // Alles initialisieren
    updateKeywordDisplay();
    initializeTracking();
    showDemoStatus();
    createMasterPasswordUI();
    
    console.log('✅ Silas Form erfolgreich initialisiert');
}
