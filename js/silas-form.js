// js/silas-form.js - KORRIGIERTE UND ROBUSTE VERSION

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
    const previewModal = document.getElementById('silas-preview-modal');
    const closePreviewModalBtn = document.getElementById('close-preview-modal');
    const previewContentArea = document.getElementById('preview-content-area');

    // Prüfe kritische Elemente
    if (!keywordInput || !keywordDisplayList || !startGenerationBtn || !silasStatus) {
        console.error('❌ Kritische Silas-Elemente fehlen im DOM');
        return;
    }

    let keywordList = [];
    let allGeneratedData = [];
    let isMasterMode = false;

    // =================================================================================
    // HILFSFUNKTIONEN
    // =================================================================================
    
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

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
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
    // TRACKING & LIMITS
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

        // Prüfe, ob das Passwort-Input bereits existiert
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
