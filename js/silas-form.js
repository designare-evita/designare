// silas-form.js - KORRIGIERTE VERSION

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    
    if (!silasForm) {
        console.error('Silas Form nicht gefunden');
        return;
    }

    // === MASTER PASSWORD SYSTEM ===
    const MASTER_PASSWORD = "SilasUnlimited2024!";
    
    // In-Memory Storage als Fallback für Browser Storage
    const memoryStorage = {
        data: {},
        setItem(key, value) {
            this.data[key] = value;
        },
        getItem(key) {
            return this.data[key] || null;
        },
        removeItem(key) {
            delete this.data[key];
        }
    };

    // Storage-Wrapper mit Fallback
    const storage = {
        session: typeof sessionStorage !== 'undefined' ? sessionStorage : memoryStorage,
        local: typeof localStorage !== 'undefined' ? localStorage : memoryStorage
    };
    
    function isMasterModeActive() {
        const masterMode = storage.session.getItem('silas_master_mode');
        const timestamp = parseInt(storage.session.getItem('silas_master_timestamp') || '0');
        const now = Date.now();
        
        if (masterMode === 'true' && (now - timestamp) < (8 * 60 * 60 * 1000)) {
            return true;
        }
        
        if (masterMode === 'true') {
            storage.session.removeItem('silas_master_mode');
            storage.session.removeItem('silas_master_timestamp');
        }
        
        return false;
    }

    // === KONTEXT-ANALYSE ===
    function analyzeKeywordContext(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        
        const contexts = {
            'tech': {
                terms: ['wordpress', 'plugin', 'software', 'app', 'digital', 'web', 'tool', 'system', 'online', 'code'],
                label: 'Technologie',
                icon: '💻',
                color: '#007cba',
                audience: 'Entwickler, Website-Betreiber'
            },
            'business': {
                terms: ['marketing', 'seo', 'beratung', 'consulting', 'strategie', 'erfolg', 'umsatz'],
                label: 'Business',
                icon: '📈',
                color: '#28a745',
                audience: 'Unternehmer, Marketing-Manager'
            },
            'pets': {
                terms: ['hund', 'tier', 'haustier', 'welpe', 'katze', 'training', 'futter'],
                label: 'Haustiere',
                icon: '🐕',
                color: '#ff6b6b',
                audience: 'Hundebesitzer, Tierliebhaber'
            },
            'gastro': {
                terms: ['cafe', 'restaurant', 'gastronomie', 'küche', 'essen', 'cafehaus'],
                label: 'Gastronomie',
                icon: '🍽️',
                color: '#ffc107',
                audience: 'Gastronomiebetreiber, Genießer'
            },
            'health': {
                terms: ['gesundheit', 'fitness', 'wellness', 'sport', 'ernährung'],
                label: 'Gesundheit',
                icon: '💪',
                color: '#17a2b8',
                audience: 'Gesundheitsbewusste, Sportler'
            }
        };
        
        for (const [contextName, contextData] of Object.entries(contexts)) {
            if (contextData.terms.some(term => lowerKeyword.includes(term))) {
                return { name: contextName, ...contextData };
            }
        }
        
        return {
            name: 'general',
            label: 'Allgemein',
            icon: '🎯',
            color: '#6c757d',
            audience: 'Allgemeine Zielgruppe'
        };
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

    if (isMasterModeActive()) {
        DEMO_LIMITS = Object.assign({}, MASTER_LIMITS);
    }

    // === UI FUNCTIONS ===
    function showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: ${color || '#ffc107'}; 
            color: white; 
            padding: 15px 25px; 
            border-radius: 8px; 
            font-weight: bold; 
            z-index: 9999; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(function() {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    function createMasterPasswordUI() {
        if (!isMasterModeActive() && !document.getElementById('master-unlock-btn')) {
            const unlockBtn = document.createElement('button');
            unlockBtn.id = 'master-unlock-btn';
            unlockBtn.innerHTML = '🔓';
            unlockBtn.title = 'Master Access';
            unlockBtn.style.cssText = `
                position: fixed; 
                bottom: 40px; 
                right: 20px; 
                background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); 
                border: 2px solid #e0a800; 
                color: #1a1a1a; 
                width: 50px; 
                height: 50px; 
                border-radius: 50%; 
                cursor: pointer; 
                font-size: 1.2rem; 
                box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); 
                z-index: 1000;
            `;
            unlockBtn.onclick = function() {
                const password = prompt('Master-Passwort eingeben:');
                if (password === MASTER_PASSWORD) {
                    activateMasterMode();
                } else if (password !== null) {
                    alert('Falsches Passwort!');
                }
            };
            document.body.appendChild(unlockBtn);
        }

        if (isMasterModeActive()) {
            showMasterModeIndicator();
        }
    }

    function activateMasterMode() {
        storage.session.setItem('silas_master_mode', 'true');
        storage.session.setItem('silas_master_timestamp', Date.now().toString());
        
        DEMO_LIMITS = Object.assign({}, MASTER_LIMITS);
        
        storage.local.removeItem('silas_daily');
        storage.local.removeItem('silas_hourly');
        storage.local.removeItem('silas_last_request');
        
        showMasterModeIndicator();
        hideUnlockButton();
        showDemoStatus();
        
        showNotification('Master Mode aktiviert!', '#28a745');
    }

    function showMasterModeIndicator() {
        const existing = document.getElementById('master-mode-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'master-mode-indicator';
        indicator.style.cssText = `
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
            color: white; 
            padding: 12px 20px; 
            text-align: center; 
            font-weight: bold; 
            border-radius: 8px; 
            margin: 15px 0; 
            position: relative;
        `;
        indicator.innerHTML = `
            <strong>MASTER MODE AKTIV</strong><br>
            <small style="opacity: 0.9;">Unlimited Keywords • No Rate Limits</small>
            <button onclick="window.deactivateMasterMode()" style="
                position: absolute; 
                top: 8px; 
                right: 12px; 
                background: rgba(255,255,255,0.2); 
                border: none; 
                color: white; 
                border-radius: 50%; 
                width: 24px; 
                height: 24px; 
                cursor: pointer;
            ">×</button>
        `;
        
        silasForm.parentNode.insertBefore(indicator, silasForm);
        
        window.deactivateMasterMode = function() {
            if (confirm('Master Mode deaktivieren?')) {
                storage.session.removeItem('silas_master_mode');
                storage.session.removeItem('silas_master_timestamp');
                location.reload();
            }
        };
    }

    function hideUnlockButton() {
        const btn = document.getElementById('master-unlock-btn');
        if (btn) btn.style.display = 'none';
    }

    // === RATE LIMITING ===
    function initDemoTracking() {
        const now = Date.now();
        const today = new Date().toDateString();
        
        const dailyData = JSON.parse(storage.local.getItem('silas_daily') || '{}');
        if (dailyData.date !== today) {
            storage.local.setItem('silas_daily', JSON.stringify({ date: today, count: 0 }));
        }
        
        const hourlyData = JSON.parse(storage.local.getItem('silas_hourly') || '{}');
        const currentHour = Math.floor(now / (1000 * 60 * 60));
        if (hourlyData.hour !== currentHour) {
            storage.local.setItem('silas_hourly', JSON.stringify({ hour: currentHour, count: 0 }));
        }
    }

    function checkRateLimit() {
        if (isMasterModeActive()) {
            return true;
        }
        
        const now = Date.now();
        const dailyData = JSON.parse(storage.local.getItem('silas_daily') || '{}');
        const hourlyData = JSON.parse(storage.local.getItem('silas_hourly') || '{}');
        const lastRequest = parseInt(storage.local.getItem('silas_last_request') || '0');
        
        if (now - lastRequest < DEMO_LIMITS.cooldownBetweenRequests) {
            const remainingSeconds = Math.ceil((DEMO_LIMITS.cooldownBetweenRequests - (now - lastRequest)) / 1000);
            throw new Error('Bitte warte noch ' + remainingSeconds + ' Sekunden.');
        }
        
        if (dailyData.count >= DEMO_LIMITS.maxGenerationsPerDay) {
            throw new Error('Tägliches Demo-Limit erreicht.');
        }
        
        if (hourlyData.count >= DEMO_LIMITS.maxGenerationsPerHour) {
            throw new Error('Stündliches Demo-Limit erreicht.');
        }
        
        return true;
    }

    function updateUsageCounters() {
        const now = Date.now();
        const dailyData = JSON.parse(storage.local.getItem('silas_daily') || '{}');
        dailyData.count = (dailyData.count || 0) + 1;
        storage.local.setItem('silas_daily', JSON.stringify(dailyData));
        
        const hourlyData = JSON.parse(storage.local.getItem('silas_hourly') || '{}');
        hourlyData.count = (hourlyData.count || 0) + 1;
        storage.local.setItem('silas_hourly', JSON.stringify(hourlyData));
        
        storage.local.setItem('silas_last_request', now.toString());
        showDemoStatus();
    }

    function validateKeyword(keyword) {
        if (isMasterModeActive()) {
            if (keyword.length > 100) {
                throw new Error('Keyword zu lang (max. 100 Zeichen im Master Mode).');
            }
            return true;
        }
        
        const forbidden = ['adult', 'porn', 'sex', 'drugs', 'illegal'];
        const lowerKeyword = keyword.toLowerCase();
        
        for (let i = 0; i < forbidden.length; i++) {
            if (lowerKeyword.indexOf(forbidden[i]) !== -1) {
                throw new Error('Das Keyword "' + keyword + '" ist für die Demo nicht erlaubt.');
            }
        }
        
        if (keyword.length > 50) {
            throw new Error('Keywords dürfen maximal 50 Zeichen lang sein.');
        }
        
        return true;
    }

    function showDemoStatus() {
        const dailyData = JSON.parse(storage.local.getItem('silas_daily') || '{}');
        const hourlyData = JSON.parse(storage.local.getItem('silas_hourly') || '{}');
        
        const dailyRemaining = DEMO_LIMITS.maxGenerationsPerDay - (dailyData.count || 0);
        const hourlyRemaining = DEMO_LIMITS.maxGenerationsPerHour - (hourlyData.count || 0);
        
        let demoStatusContainer = document.getElementById('silas-demo-status');
        if (!demoStatusContainer) {
            demoStatusContainer = document.createElement('div');
            demoStatusContainer.id = 'silas-demo-status';
            silasForm.parentNode.insertBefore(demoStatusContainer, silasForm);
        }
        
        if (isMasterModeActive()) {
            demoStatusContainer.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(32,201,151,0.1) 100%); 
                    border: 1px solid #28a745; 
                    border-radius: 8px; 
                    padding: 15px; 
                    margin: 15px 0; 
                    text-align: center; 
                    color: #28a745;
                ">
                    <strong>UNLIMITED MODE:</strong> Keine Beschränkungen aktiv
                </div>
            `;
        } else {
            demoStatusContainer.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%); 
                    border: 1px solid #ffc107; 
                    border-radius: 8px; 
                    padding: 15px; 
                    margin: 15px 0; 
                    text-align: center; 
                    color: #ffc107;
                ">
                    <strong>Demo-Modus:</strong> Heute noch <strong>${dailyRemaining}</strong> Generierungen | 
                    Diese Stunde noch <strong>${hourlyRemaining}</strong>
                </div>
            `;
        }
    }

    // === DOM ELEMENTS ===
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

    // === KEYWORD MANAGEMENT ===
    function addKeywords() {
        try {
            const newKeywords = keywordInput.value.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);
            const currentIntent = textIntentSelect ? textIntentSelect.value : 'informational';
            
            if (newKeywords.length === 0) {
                throw new Error('Bitte gib mindestens ein Keyword ein.');
            }
            
            // Keywords validieren
            newKeywords.forEach(validateKeyword);
            
            // Session-Limit prüfen
            if (!isMasterModeActive() && keywordList.length + newKeywords.length > DEMO_LIMITS.maxKeywordsPerSession) {
                throw new Error('Demo-Limit: Maximal ' + DEMO_LIMITS.maxKeywordsPerSession + ' Keywords pro Session.');
            }
            
            newKeywords.forEach(function(keyword) {
                const existingIndex = keywordList.findIndex(item => item.keyword === keyword);
                
                if (existingIndex === -1) {
                    keywordList.push({
                        keyword: keyword,
                        intent: currentIntent,
                        context: analyzeKeywordContext(keyword)
                    });
                } else {
                    keywordList[existingIndex].intent = currentIntent;
                    keywordList[existingIndex].context = analyzeKeywordContext(keyword);
                }
            });
            
            if (newKeywords.length > 0) {
                updateKeywordDisplay();
                showGenerationPreview();
                keywordInput.value = '';
                hideContextPreview();
                
                const lastKeyword = newKeywords[newKeywords.length - 1];
                const context = analyzeKeywordContext(lastKeyword);
                silasStatus.innerHTML = `Keyword "${lastKeyword}" hinzugefügt <span style="color: ${context.color};">(${context.label})</span>`;
                setTimeout(() => {
                    silasStatus.textContent = 'Bereit zur Generierung.';
                }, 3000);
            }
            
        } catch (error) {
            silasStatus.textContent = error.message;
            silasStatus.style.color = '#ff6b6b';
            setTimeout(() => {
                silasStatus.textContent = 'Bereit zur Generierung.';
                silasStatus.style.color = '#ffc107';
            }, 4000);
        }
    }

    function updateKeywordDisplay() {
        if (!keywordDisplayList) return;
        
        keywordDisplayList.innerHTML = '';
        
        keywordList.forEach(function(item, index) {
            const listItem = document.createElement('li');
            
            const intentBadge = document.createElement('span');
            intentBadge.textContent = item.intent === 'commercial' ? 'Kommerziell' : 'Informativ';
            intentBadge.style.cssText = `
                background-color: ${item.intent === 'commercial' ? '#28a745' : '#17a2b8'};
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: bold;
                margin-right: 8px;
            `;
            
            const contextBadge = document.createElement('span');
            contextBadge.innerHTML = `${item.context.icon} ${item.context.label}`;
            contextBadge.style.cssText = `
                background-color: ${item.context.color};
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: bold;
            `;
            
            const keywordSpan = document.createElement('span');
            keywordSpan.textContent = item.keyword;
            keywordSpan.style.cssText = `
                font-weight: 500;
                color: #fff;
                display: block;
                margin-bottom: 8px;
            `;
            
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = 'flex-grow: 1;';
            
            const badgeContainer = document.createElement('div');
            badgeContainer.style.cssText = 'display: flex; gap: 8px;';
            badgeContainer.appendChild(intentBadge);
            badgeContainer.appendChild(contextBadge);
            
            contentDiv.appendChild(keywordSpan);
            contentDiv.appendChild(badgeContainer);
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.style.cssText = `
                background-color: #ff6b6b;
                color: white;
                border: none;
                border-radius: 6px;
                min-width: 36px;
                height: 36px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                margin-left: 15px;
            `;
            removeBtn.onclick = function() {
                keywordList.splice(index, 1);
                updateKeywordDisplay();
                showGenerationPreview();
            };
            
            listItem.style.cssText = `
                background: linear-gradient(135deg, ${item.context.color}10 0%, ${item.context.color}05 100%);
                margin-bottom: 12px;
                padding: 15px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                color: #fff;
                border-left: 4px solid ${item.context.color};
                gap: 15px;
            `;
            
            listItem.appendChild(contentDiv);
            listItem.appendChild(removeBtn);
            keywordDisplayList.appendChild(listItem);
        });
        
        if (clearListBtn) {
            clearListBtn.style.display = keywordList.length > 0 ? 'inline-block' : 'none';
        }
    }

    function showGenerationPreview() {
        if (keywordList.length === 0) {
            hideGenerationPreview();
            return;
        }
        
        const uniqueContexts = [...new Set(keywordList.map(item => item.context.label))];
        const commercialCount = keywordList.filter(item => item.intent === 'commercial').length;
        
        let previewContainer = document.getElementById('generation-preview');
        
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'generation-preview';
            
            const startBtn = document.getElementById('start-generation-btn');
            if (startBtn && startBtn.parentNode) {
                startBtn.parentNode.insertBefore(previewContainer, startBtn);
            }
        }
        
        previewContainer.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,193,7,0.08) 100%);
                border: 1px solid #ffc107;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            ">
                <h4 style="color: #ffc107; margin: 0 0 20px 0; font-size: 1.2rem;">
                    Generierungs-Vorschau
                </h4>
                
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 15px;">
                    <div style="text-align: center;">
                        <div style="color: #fff; font-size: 1.5rem; font-weight: bold;">${keywordList.length}</div>
                        <div style="color: #ccc; font-size: 0.8rem;">Keywords</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #fff; font-size: 1.1rem; font-weight: bold;">${uniqueContexts.join(', ')}</div>
                        <div style="color: #ccc; font-size: 0.8rem;">Kontexte</div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 20px; font-size: 0.85rem; color: #ccc;">
                    <span>Kommerziell: ${commercialCount}</span>
                    <span>Informativ: ${keywordList.length - commercialCount}</span>
                </div>
            </div>
        `;
        
        previewContainer.style.display = 'block';
    }

    function hideGenerationPreview() {
        const container = document.getElementById('generation-preview');
        if (container) {
            container.style.display = 'none';
        }
    }

    // === CONTEXT PREVIEW FUNCTIONS ===
    function createContextDisplay() {
        let contextContainer = document.getElementById('context-preview-container');
        
        if (!contextContainer) {
            contextContainer = document.createElement('div');
            contextContainer.id = 'context-preview-container';
            contextContainer.style.cssText = 'margin: 15px 0; transition: all 0.3s ease; display: none;';
            
            const inputGroup = document.querySelector('.input-group');
            if (inputGroup && inputGroup.nextElementSibling) {
                inputGroup.parentNode.insertBefore(contextContainer, inputGroup.nextElementSibling);
            }
        }
        
        return contextContainer;
    }

    function showContextPreview(keyword, intent) {
        if (!keyword || keyword.trim().length < 3) {
            hideContextPreview();
            return;
        }
        
        const context = analyzeKeywordContext(keyword.trim());
        const container = createContextDisplay();
        
        container.innerHTML = `
            <div style="
                background: linear-gradient(135deg, ${context.color}15 0%, ${context.color}05 100%);
                border: 1px solid ${context.color};
                border-radius: 10px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            ">
                <div style="font-size: 2rem;">${context.icon}</div>
                
                <div style="flex-grow: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <strong style="color: ${context.color}; font-size: 1.1rem;">
                            Kontext erkannt: ${context.label}
                        </strong>
                        
                        <span style="
                            background: ${intent === 'commercial' ? '#28a745' : '#17a2b8'};
                            color: white;
                            padding: 3px 8px;
                            border-radius: 12px;
                            font-size: 0.7rem;
                            font-weight: bold;
                        ">${intent === 'commercial' ? 'Kommerziell' : 'Informativ'}</span>
                    </div>
                    
                    <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
                        Zielgruppe: ${context.audience}
                    </p>
                </div>
            </div>
        `;
        
        container.style.display = 'block';
    }

    function hideContextPreview() {
        const container = document.getElementById('context-preview-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    // === MOCK CONTENT GENERATION (Ersetzt API Call) ===
    async function generateContent(item, index, responseContent) {
        // Simuliere API-Aufruf mit Mock-Daten
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const context = item.context;
        const isCommercial = item.intent === 'commercial';
        
        // Mock-Daten basierend auf Kontext und Intent
        const mockData = {
            keyword: item.keyword,
            intent: item.intent,
            post_title: `${isCommercial ? 'Kaufen Sie' : 'Alles über'} ${item.keyword} - ${context.label} Guide`,
            post_name: item.keyword.toLowerCase().replace(/\s+/g, '-'),
            meta_title: `${item.keyword} | ${context.label} ${isCommercial ? 'Shop' : 'Ratgeber'}`,
            meta_description: `${isCommercial ? 'Entdecken Sie' : 'Erfahren Sie alles über'} ${item.keyword}. ${context.audience} vertrauen auf unsere ${context.label}-Expertise.`,
            h1: `${isCommercial ? 'Premium' : 'Umfassender Guide:'} ${item.keyword}`,
            h2_1: `Was ist ${item.keyword}?`,
            h2_2: `${isCommercial ? 'Warum' : 'Wie'} ${item.keyword} ${isCommercial ? 'kaufen' : 'funktioniert'}`,
            h2_3: `${context.label}-Tipps für ${item.keyword}`,
            h2_4: isCommercial ? `${item.keyword} Preise & Angebote` : `${item.keyword} FAQ`,
            primary_cta: isCommercial ? `${item.keyword} jetzt bestellen` : `Mehr über ${item.keyword} erfahren`,
            secondary_cta: isCommercial ? 'Beratung anfordern' : 'Guide downloaden',
            hero_text: `${isCommercial ? 'Die beste Lösung für' : 'Ihr Experten-Guide zu'} ${item.keyword} im ${context.label}-Bereich`,
            hero_subtext: `${context.audience} vertrauen auf unsere ${context.label}-Expertise`,
            benefits_list: `<ul><li>Professionelle ${context.label}-Lösung</li><li>Speziell für ${context.audience}</li><li>Bewährte Qualität</li></ul>`,
            features_list: `<ul><li>${item.keyword} Features</li><li>${context.label} Integration</li><li>24/7 Support</li></ul>`,
            social_proof: `Über 1000 zufriedene Kunden im ${context.label}-Bereich`,
            testimonial_1: `"${item.keyword} hat unser ${context.label}-Business revolutioniert!"`,
            testimonial_2: `"Beste ${item.keyword}-Lösung auf dem Markt."`,
            pricing_title: isCommercial ? `${item.keyword} Preise` : `${item.keyword} Pakete`,
            price_1: isCommercial ? '€29,99' : 'Kostenlos',
            price_2: isCommercial ? '€59,99' : 'Premium €19',
            price_3: isCommercial ? '€99,99' : 'Pro €49',
            faq_1: `Was ist ${item.keyword}?`,
            faq_answer_1: `${item.keyword} ist eine ${context.label}-Lösung für ${context.audience}.`,
            faq_2: `Wie funktioniert ${item.keyword}?`,
            faq_answer_2: `${item.keyword} arbeitet mit modernster ${context.label}-Technologie.`,
            faq_3: isCommercial ? `Was kostet ${item.keyword}?` : `Ist ${item.keyword} kostenlos?`,
            faq_answer_3: isCommercial ? `${item.keyword} ist ab €29,99 erhältlich.` : `${item.keyword} ist grundsätzlich kostenlos verfügbar.`,
            contact_info: 'info@example.com | +43 1 234 5678',
            footer_cta: isCommercial ? `Jetzt ${item.keyword} bestellen!` : `${item.keyword} Guide herunterladen`,
            trust_signals: 'SSL-verschlüsselt | DSGVO-konform | 30 Tage Geld-zurück',
            guarantee_text: isCommercial ? '30 Tage Geld-zurück-Garantie' : '100% kostenlose Informationen'
        };
        
        return mockData;
    }

    function displayResult(data, index, container) {
        const resultCard = document.createElement('div');
        const context = data._context || analyzeKeywordContext(data.keyword);
        
        resultCard.style.cssText = `
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid ${context.color};
        `;
        
        if (data.error) {
            resultCard.innerHTML = `
                <h4 style="color: #ff6b6b; margin: 0 0 10px 0;">${data.keyword}</h4>
                <p style="color: #ff6b6b; margin: 0;">Fehler: ${data.error}</p>
            `;
        } else {
            resultCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <h4 style="color: #fff; margin: 0; flex-grow: 1;">${data.keyword}</h4>
                    <span style="background: ${data.intent === 'commercial' ? '#28a745' : '#17a2b8'}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem;">
                        ${data.intent === 'commercial' ? 'Kommerziell' : 'Informativ'}
                    </span>
                    <span style="background: ${context.color}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem;">
                        ${context.icon} ${context.label}
                    </span>
                </div>
                <p style="margin: 5px 0; color: #ccc;"><strong>Titel:</strong> ${data.post_title || 'N/A'}</p>
                <p style="margin: 5px 0; color: #ccc;"><strong>Meta:</strong> ${(data.meta_description || 'N/A').substring(0, 100)}...</p>
                <button class="preview-btn" data-index="${index}" style="
                    background: #007cba; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    margin-top: 10px;
                ">Vorschau anzeigen</button>
            `;
        }
        
        container.appendChild(resultCard);
    }

    // === CSV DOWNLOAD ===
    function downloadCsv() {
        if (allGeneratedData.length === 0) {
            alert('Keine Daten zum Download verfügbar.');
            return;
        }

        const headers = [
            "keyword", "intent", "context_name", "context_label",
            "post_title", "post_name", "meta_title", "meta_description", 
            "h1", "h2_1", "h2_2", "h2_3", "h2_4",
            "primary_cta", "secondary_cta", "hero_text", "hero_subtext",
            "benefits_list", "features_list", "social_proof",
            "testimonial_1", "testimonial_2", "pricing_title",
            "price_1", "price_2", "price_3",
            "faq_1", "faq_answer_1", "faq_2", "faq_answer_2", "faq_3", "faq_answer_3",
            "contact_info", "footer_cta", "trust_signals", "guarantee_text"
        ];

        let csvContent = headers.join(",") + "\n";
        
        allGeneratedData.forEach(function(rowData) {
            if (rowData.error) return;
            
            const values = headers.map(function(header) {
                let value = '';
                
                if (header === 'context_name' && rowData._context) {
                    value = rowData._context.name || '';
                } else if (header === 'context_label' && rowData._context) {
                    value = rowData._context.label || '';
                } else {
                    value = rowData[header] || '';
                }
                
                return '"' + String(value).replace(/"/g, '""') + '"';
            });
            
            csvContent += values.join(",") + "\n";
        });
        
        const timestamp = new Date().toISOString().slice(0,16).replace(/[:T]/g, '-');
        const successfulData = allGeneratedData.filter(d => !d.error);
        const contextSummary = [...new Set(successfulData.map(d => d._context?.label || 'General'))].join('-');
        const filename = `silas_${contextSummary}_${timestamp}.csv`;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification(`CSV heruntergeladen: ${successfulData.length} Keywords`, '#28a745');
    }

    // === EVENT LISTENERS ===
    
    // Live-Kontext-Erkennung
    if (keywordInput) {
        keywordInput.addEventListener('input', function() {
            clearTimeout(window.contextUpdateTimeout);
            window.contextUpdateTimeout = setTimeout(() => {
                const keyword = this.value.trim();
                const intent = textIntentSelect ? textIntentSelect.value : 'informational';
                
                if (keyword.length >= 3) {
                    showContextPreview(keyword, intent);
                } else {
                    hideContextPreview();
                }
            }, 300);
        });
        
        keywordInput.addEventListener('blur', function() {
            setTimeout(hideContextPreview, 200);
        });
        
        keywordInput.addEventListener('focus', function() {
            const keyword = this.value.trim();
            const intent = textIntentSelect ? textIntentSelect.value : 'informational';
            if (keyword.length >= 3) {
                showContextPreview(keyword, intent);
            }
        });
    }

    if (textIntentSelect) {
        textIntentSelect.addEventListener('change', function() {
            const keyword = keywordInput.value.trim();
            if (keyword.length >= 3) {
                showContextPreview(keyword, this.value);
            }
        });
    }

    // Form Submit
    if (silasForm) {
        silasForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addKeywords();
        });
    }
    
    if (keywordInput) {
        keywordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addKeywords();
            }
        });
    }
    
    // Clear List Button
    if (clearListBtn) {
        clearListBtn.addEventListener('click', function() {
            keywordList = [];
            allGeneratedData = [];
            updateKeywordDisplay();
            hideContextPreview();
            hideGenerationPreview();
            
            if (silasResponseContainer) {
                silasResponseContainer.innerHTML = '';
                silasResponseContainer.style.display = 'none';
            }
            if (silasStatus) {
                silasStatus.textContent = 'Liste geleert. Bereit für neue Keywords.';
            }
        });
    }

    // === HAUPTGENERIERUNG ===
    if (startGenerationBtn) {
        startGenerationBtn.addEventListener('click', async function() {
            console.log('Start Generation Button geklickt');
            
            try {
                if (keywordList.length === 0) {
                    if (silasStatus) {
                        silasStatus.textContent = 'Bitte füge zuerst Keywords hinzu.';
                    }
                    return;
                }

                checkRateLimit();

                startGenerationBtn.disabled = true;
                allGeneratedData = [];
                
                if (silasResponseContainer) {
                    silasResponseContainer.innerHTML = '<h3>Erstellung läuft...</h3><div id="silas-response-content"></div>';
                    silasResponseContainer.style.display = 'block';
                }
                
                const responseContent = document.getElementById('silas-response-content');

                for (let i = 0; i < keywordList.length; i++) {
                    const item = keywordList[i];
                    
                    if (silasStatus) {
                        silasStatus.innerHTML = `Generiere ${item.context.label}-Content für "${item.keyword}" <span style="color: ${item.context.color};">(${item.intent === 'commercial' ? 'Kommerziell' : 'Informativ'})</span> (${i + 1}/${keywordList.length})...`;
                    }

                    try {
                        const data = await generateContent(item, i, responseContent);
                        data.keyword = item.keyword;
                        data.intent = item.intent;
                        data._context = item.context;
                        allGeneratedData.push(data);
                        displayResult(data, i, responseContent);

                        if (i < keywordList.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                    } catch (error) {
                        console.error(`Fehler bei "${item.keyword}":`, error);
                        const errorData = {
                            keyword: item.keyword,
                            intent: item.intent,
                            error: error.message,
                            _context: item.context
                        };
                        allGeneratedData.push(errorData);
                        displayResult(errorData, i, responseContent);
                    }
                }

                updateUsageCounters();

                if (silasStatus) {
                    silasStatus.textContent = `Alle ${keywordList.length} Texte wurden generiert.`;
                }
                startGenerationBtn.disabled = false;
                
                const headerElement = silasResponseContainer?.querySelector('h3');
                if (headerElement) {
                    headerElement.textContent = 'Erstellung abgeschlossen!';
                }
                
                // Download Button hinzufügen
                if (!document.getElementById('download-csv-dynamic') && silasResponseContainer) {
                    const downloadButton = document.createElement('button');
                    downloadButton.id = 'download-csv-dynamic';
                    downloadButton.className = 'cta-button';
                    downloadButton.innerHTML = '<i class="fas fa-download"></i> CSV Herunterladen';
                    downloadButton.style.marginTop = '1rem';
                    downloadButton.addEventListener('click', downloadCsv);
                    silasResponseContainer.appendChild(downloadButton);
                }

            } catch (error) {
                console.error('Generierungsfehler:', error);
                if (silasStatus) {
                    silasStatus.textContent = error.message;
                    silasStatus.style.color = '#ff6b6b';
                }
                startGenerationBtn.disabled = false;
                
                setTimeout(function() {
                    if (silasStatus) {
                        silasStatus.textContent = 'Bereit zur Generierung.';
                        silasStatus.style.color = '#ffc107';
                    }
                }, 5000);
            }
        });
    } else {
        console.error('Start Generation Button nicht gefunden!');
    }

    // === MODAL FUNCTIONS ===
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

    // Preview Modal Content
    if (silasResponseContainer) {
        silasResponseContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('preview-btn')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                const data = allGeneratedData[index];
                
                if (data && !data.error && previewContentArea) {
                    const context = data._context || analyzeKeywordContext(data.keyword);
                    
                    previewContentArea.innerHTML = `
                        <div style="color: #f0f0f0; line-height: 1.6;">
                            <div style="
                                background: linear-gradient(135deg, ${context.color}20 0%, ${context.color}10 100%); 
                                border: 1px solid ${context.color}; 
                                border-radius: 12px; 
                                padding: 20px; 
                                margin-bottom: 30px; 
                                text-align: center;
                            ">
                                <h2 style="color: ${context.color}; margin: 0; font-size: 1.5rem;">
                                    ${context.icon} ${context.label} Content
                                </h2>
                                <p style="color: #ccc; margin: 5px 0 0 0;">
                                    "${data.keyword}" | ${data.intent === 'commercial' ? 'Verkaufsorientiert' : 'Informativ'}
                                </p>
                            </div>
                            
                            <div style="background: #1a1a1a; padding: 30px; border-radius: 15px;">
                                <h1 style="color: ${context.color}; font-size: 2rem; margin-bottom: 20px;">
                                    ${data.h1 || 'H1 nicht verfügbar'}
                                </h1>
                                
                                <p style="font-size: 1.1rem; color: #e9e9e9; margin-bottom: 30px;">
                                    ${data.hero_text || 'Hero-Text nicht verfügbar'}
                                </p>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px;">
                                    <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                                        <h3 style="color: #28a745; margin-bottom: 15px;">Vorteile</h3>
                                        <div style="color: #ccc;">${data.benefits_list || '<ul><li>Keine Daten</li></ul>'}</div>
                                    </div>
                                    <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                                        <h3 style="color: #17a2b8; margin-bottom: 15px;">Features</h3>
                                        <div style="color: #ccc;">${data.features_list || '<ul><li>Keine Daten</li></ul>'}</div>
                                    </div>
                                </div>
                                
                                ${data.faq_1 ? `
                                <div style="margin-top: 30px;">
                                    <h3 style="color: #ffc107; margin-bottom: 20px;">Häufige Fragen</h3>
                                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                                        <strong style="color: #28a745;">${data.faq_1}</strong>
                                        <p style="color: #ccc; margin: 8px 0 0 0;">${data.faq_answer_1 || 'Antwort nicht verfügbar'}</p>
                                    </div>
                                    ${data.faq_2 ? `
                                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                                        <strong style="color: #17a2b8;">${data.faq_2}</strong>
                                        <p style="color: #ccc; margin: 8px 0 0 0;">${data.faq_answer_2 || 'Antwort nicht verfügbar'}</p>
                                    </div>
                                    ` : ''}
                                    ${data.faq_3 ? `
                                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                                        <strong style="color: #ffc107;">${data.faq_3}</strong>
                                        <p style="color: #ccc; margin: 8px 0 0 0;">${data.faq_answer_3 || 'Antwort nicht verfügbar'}</p>
                                    </div>
                                    ` : ''}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                    
                    openPreviewModal();
                }
            }
        });
    }

    // CSV Download Button (falls vorhanden)
    if (downloadCsvButton) {
        downloadCsvButton.addEventListener('click', downloadCsv);
    }

    // === INITIALIZATION ===
    initDemoTracking();
    showDemoStatus();
    createMasterPasswordUI();

    // Debug-Ausgabe
    console.log('Silas Form initialisiert');
    console.log('Start Button gefunden:', !!startGenerationBtn);
    console.log('Keyword Input gefunden:', !!keywordInput);
    console.log('Keyword List Length:', keywordList.length);

    // Teste Button-Funktionalität
    if (startGenerationBtn) {
        console.log('Event Listener für Start Button wurde hinzugefügt');
    } else {
        console.error('FEHLER: start-generation-btn Element nicht gefunden!');
        // Alternative Button-Suche
        const alternativeBtn = document.querySelector('[id*="start"]') || document.querySelector('[class*="start"]');
        if (alternativeBtn) {
            console.log('Alternativer Button gefunden:', alternativeBtn);
        }
    }
}
