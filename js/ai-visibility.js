// js/ai-visibility.js - Frontend für KI-Sichtbarkeits-Check (Dual-KI: Gemini + ChatGPT)

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('visibility-form');
    const domainInput = document.getElementById('domain-input');
    const industryInput = document.getElementById('industry-input');
    const submitBtn = document.getElementById('submit-btn');
    const resultsContainer = document.getElementById('results-container');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Accessibility: Screenreader informieren wenn Ergebnisse geladen
    resultsContainer.setAttribute('aria-live', 'polite');

    // =================================================================
    // RATE LIMITING - 3 Abfragen pro Tag
    // =================================================================
    const DAILY_LIMIT = 3;
    const STORAGE_KEY = 'ai_visibility_usage';

    function getUsageData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return { date: null, count: 0 };
            return JSON.parse(data);
        } catch (e) {
            return { date: null, count: 0 };
        }
    }

    function setUsageData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('localStorage nicht verfügbar');
        }
    }

    function getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    function getRemainingChecks() {
        const usage = getUsageData();
        const today = getTodayString();
        if (usage.date !== today) return DAILY_LIMIT;
        return Math.max(0, DAILY_LIMIT - usage.count);
    }

    function incrementUsage() {
        const today = getTodayString();
        const usage = getUsageData();
        if (usage.date !== today) {
            setUsageData({ date: today, count: 1 });
        } else {
            setUsageData({ date: today, count: usage.count + 1 });
        }
    }

    function canMakeRequest() {
        return getRemainingChecks() > 0;
    }

    function updateLimitDisplay() {
        const remaining = getRemainingChecks();
        let limitInfo = document.getElementById('limit-info');
        
        if (!limitInfo) {
            limitInfo = document.createElement('div');
            limitInfo.id = 'limit-info';
            limitInfo.className = 'limit-info';
            form.insertBefore(limitInfo, submitBtn);
        }
        
        if (remaining === 0) {
            limitInfo.innerHTML = `
                <i class="fa-solid fa-clock"></i>
                <span>Tageslimit erreicht (${DAILY_LIMIT}/${DAILY_LIMIT}). Morgen wieder verfügbar!</span>
            `;
            limitInfo.classList.add('limit-reached');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Limit erreicht';
        } else {
            limitInfo.innerHTML = `
                <i class="fa-solid fa-circle-info"></i>
                <span>Noch <strong>${remaining}</strong> von ${DAILY_LIMIT} Checks heute verfügbar</span>
            `;
            limitInfo.classList.remove('limit-reached');
            submitBtn.disabled = false;
        }
    }

    updateLimitDisplay();

    // Quick-Select Buttons für Branchen
    document.querySelectorAll('.industry-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            industryInput.value = this.dataset.industry;
            document.querySelectorAll('.industry-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Form Submit
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!canMakeRequest()) {
            showError('Du hast dein Tageslimit von 3 Checks erreicht. Probier es morgen wieder!');
            return;
        }
        
        const domain = domainInput.value.trim();
        if (!domain) {
            showError('Bitte gib eine Domain ein.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analysiere...';
        loadingOverlay.classList.add('visible');
        resultsContainer.innerHTML = '';

        try {
            const response = await fetch('/api/ai-visibility-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: domain,
                    industry: industryInput.value.trim() || null
                })
            });

            const data = await response.json();

            if (response.status === 429) {
                throw new Error(data.message || 'Tageslimit erreicht. Bitte morgen wieder versuchen.');
            }

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Analyse fehlgeschlagen');
            }

            incrementUsage();
            updateLimitDisplay();
            renderResults(data);

        } catch (error) {
            console.error('Fehler:', error);
            showError(error.message || 'Ein Fehler ist aufgetreten.');
        } finally {
            submitBtn.disabled = getRemainingChecks() === 0;
            submitBtn.innerHTML = getRemainingChecks() === 0 
                ? '<i class="fa-solid fa-lock"></i> Limit erreicht'
                : '<i class="fa-solid fa-robot"></i> KI-Sichtbarkeit prüfen';
            loadingOverlay.classList.remove('visible');
        }
    });

    // =================================================================
    // XSS-SICHER: showError mit textContent statt innerHTML
    // =================================================================
    function showError(message) {
        const errorBox = document.createElement('div');
        errorBox.className = 'error-box';
        errorBox.setAttribute('role', 'alert');

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-triangle-exclamation';

        const p = document.createElement('p');
        p.textContent = message;

        errorBox.appendChild(icon);
        errorBox.appendChild(p);

        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(errorBox);
    }

    // =================================================================
    // HELPER: Status-Pill HTML
    // =================================================================
    function statusPill(test) {
        if (!test) return '<span style="color:#555;">–</span>';
        if (test.mentioned) {
            return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(34,197,94,0.15);color:#22c55e;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:500;">
                <i class="fa-solid fa-check" style="font-size:0.7rem;"></i> Erwähnt
            </span>`;
        }
        return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,0.15);color:#ef4444;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:500;">
            <i class="fa-solid fa-xmark" style="font-size:0.7rem;"></i> Nicht erwähnt
        </span>`;
    }

    function sentimentDot(test) {
        if (!test) return '';
        const colors = { positiv: '#22c55e', neutral: '#f59e0b', negativ: '#ef4444', fehler: '#666' };
        const color = colors[test.sentiment] || '#666';
        return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;color:${color};margin-top:4px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
            ${test.sentiment}
        </span>`;
    }

    // =================================================================
    // RENDER RESULTS
    // Hinweis: Die KI-Antworten (test.response) werden bereits im Backend
    // durch escapeHTML() sanitized. Das Frontend rendert nur bereits
    // bereinigte HTML-Fragmente (<strong>, <p>, <br>, <ul>, <li>).
    // =================================================================
    function renderResults(data) {
        const { score, domainAnalysis, aiTests, competitors, recommendations } = data;

        // Tests nach Engine trennen
        const geminiTests = aiTests.filter(t => !t.engine || t.engine === 'gemini');
        const chatgptTests = aiTests.filter(t => t.engine === 'chatgpt');
        const hasChatGPT = chatgptTests.length > 0;

        // Score Ring
        const scoreColor = score.color;
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (score.total / 100) * circumference;

        let html = `
            <!-- Score Overview -->
            <div class="result-section score-section">
                <div class="score-ring-container">
                    <svg class="score-ring" viewBox="0 0 120 120">
                        <circle class="score-ring-bg" cx="60" cy="60" r="54" />
                        <circle class="score-ring-progress" cx="60" cy="60" r="54" 
                            style="stroke: ${scoreColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};" />
                    </svg>
                    <div class="score-value">
                        <span class="score-number">${score.total}</span>
                        <span class="score-max">/100</span>
                    </div>
                </div>
                <div class="score-details">
                    <h3 style="color: ${scoreColor}">${score.label}</h3>
                    <p class="score-domain">${data.domain}</p>
                    ${data.industry ? `<p class="score-industry"><i class="fa-solid fa-tag"></i> ${data.industry}</p>` : ''}
                    ${hasChatGPT ? '<p class="score-engines"><i class="fa-solid fa-robot"></i> Geprüft mit Gemini + ChatGPT</p>' : ''}
                </div>
            </div>

            <!-- Score Breakdown -->
            <div class="result-section">
                <h3><i class="fa-solid fa-chart-pie"></i> Score-Zusammensetzung</h3>
                <div class="breakdown-grid">
                    ${score.breakdown.map(item => {
                        let icon = '';
                        if (item.category.includes('Gemini')) icon = '<span class="breakdown-engine engine-gemini">G</span>';
                        else if (item.category.includes('ChatGPT')) icon = '<span class="breakdown-engine engine-chatgpt">C</span>';
                        
                        return `
                            <div class="breakdown-item">
                                <div class="breakdown-header">
                                    <span class="breakdown-label">${icon} ${item.category}</span>
                                    <span class="breakdown-points">${item.points}/${item.maxPoints}</span>
                                </div>
                                <div class="breakdown-bar">
                                    <div class="breakdown-fill" style="width: ${(item.points / item.maxPoints) * 100}%"></div>
                                </div>
                                <p class="breakdown-detail">${item.detail}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // =================================================================
        // KI-VERGLEICH (wenn ChatGPT vorhanden)
        // =================================================================
        if (hasChatGPT) {
            const geminiKnowledge = geminiTests.find(t => t.id === 'knowledge');
            const chatgptKnowledge = chatgptTests.find(t => t.id === 'chatgpt_knowledge');
            const geminiReputation = geminiTests.find(t => t.id === 'reviews');
            const geminiExternal = geminiTests.find(t => t.id === 'mentions');

            const thStyle = 'padding:12px 16px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);font-weight:400;color:#999;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;';
            const thLeftStyle = 'padding:12px 16px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);font-weight:400;color:#999;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;';
            const tdStyle = 'padding:14px 16px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);';
            const tdLeftStyle = 'padding:14px 16px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.05);color:#e0e0e0;font-weight:500;';
            const geminiLogo = '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#4285f4;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;">G</span> Gemini</span>';
            const chatgptLogo = '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:#10a37f;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;">C</span> ChatGPT</span>';

            html += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-code-compare"></i> KI-Vergleich: Gemini vs. ChatGPT</h3>
                    <p class="section-intro">Kennen die großen KI-Systeme deine Domain?</p>
                    
                    <div style="overflow-x:auto;margin-top:1rem;">
                        <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.02);border-radius:10px;overflow:hidden;">
                            <thead>
                                <tr style="background:rgba(255,255,255,0.04);">
                                    <th style="${thLeftStyle}">Test</th>
                                    <th style="${thStyle}">${geminiLogo}</th>
                                    <th style="${thStyle}">${chatgptLogo}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="${tdLeftStyle}">
                                        <i class="fa-solid fa-magnifying-glass" style="color:#c4a35a;margin-right:6px;width:16px;"></i>
                                        Bekanntheit
                                    </td>
                                    <td style="${tdStyle}">
                                        ${statusPill(geminiKnowledge)}
                                        <br>${sentimentDot(geminiKnowledge)}
                                    </td>
                                    <td style="${tdStyle}">
                                        ${statusPill(chatgptKnowledge)}
                                        <br>${sentimentDot(chatgptKnowledge)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="${tdLeftStyle}">
                                        <i class="fa-solid fa-star" style="color:#c4a35a;margin-right:6px;width:16px;"></i>
                                        Reputation
                                    </td>
                                    <td style="${tdStyle}">
                                        ${statusPill(geminiReputation)}
                                        <br>${sentimentDot(geminiReputation)}
                                    </td>
                                    <td style="${tdStyle}">
                                        <span style="color:#555;font-size:0.8rem;">nur Gemini</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="${tdLeftStyle}">
                                        <i class="fa-solid fa-link" style="color:#c4a35a;margin-right:6px;width:16px;"></i>
                                        Ext. Erwähnungen
                                    </td>
                                    <td style="${tdStyle}">
                                        ${statusPill(geminiExternal)}
                                        <br>${sentimentDot(geminiExternal)}
                                    </td>
                                    <td style="${tdStyle}">
                                        <span style="color:#555;font-size:0.8rem;">nur Gemini</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // =================================================================
        // DOMAIN ANALYSE
        // =================================================================
        html += `
            <div class="result-section">
                <h3><i class="fa-solid fa-magnifying-glass-chart"></i> Domain-Analyse</h3>
                
                <div class="analysis-grid">
                    <div class="analysis-card">
                        <h4>Schema.org</h4>
                        <div class="analysis-status ${domainAnalysis.schema.found ? 'status-good' : 'status-bad'}">
                            <i class="fa-solid ${domainAnalysis.schema.found ? 'fa-check' : 'fa-xmark'}"></i>
                            ${domainAnalysis.schema.found ? 'Vorhanden' : 'Nicht gefunden'}
                        </div>
                        ${domainAnalysis.schema.types.length > 0 ? `
                            <div class="schema-types">
                                ${domainAnalysis.schema.types.map(t => `<span class="schema-tag">${t}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div class="analysis-card">
                        <h4>E-E-A-T Signale</h4>
                        <ul class="eeat-list">
                            <li class="${domainAnalysis.eeat.aboutPage ? 'check' : 'missing'}">
                                <i class="fa-solid ${domainAnalysis.eeat.aboutPage ? 'fa-check' : 'fa-xmark'}"></i>
                                Über-uns Seite
                            </li>
                            <li class="${domainAnalysis.eeat.contactPage ? 'check' : 'missing'}">
                                <i class="fa-solid ${domainAnalysis.eeat.contactPage ? 'fa-check' : 'fa-xmark'}"></i>
                                Kontakt/Impressum
                            </li>
                            <li class="${domainAnalysis.eeat.authorInfo ? 'check' : 'missing'}">
                                <i class="fa-solid ${domainAnalysis.eeat.authorInfo ? 'fa-check' : 'fa-xmark'}"></i>
                                Autoren-Informationen
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // =================================================================
        // GEMINI TESTS
        // =================================================================
        html += `
            <div class="result-section">
                <h3><span class="engine-badge engine-gemini">Gemini</span> Live-Tests mit Google-Suche</h3>
                <p class="section-intro">Gemini durchsucht das Web live (Grounding) und prüft deine Sichtbarkeit:</p>
                
                <div class="tests-accordion">
                    ${geminiTests.map((test, index) => `
                        <details class="test-item ${test.mentioned ? 'mentioned' : 'not-mentioned'}" ${index === 0 ? 'open' : ''}>
                            <summary>
                                <span class="test-status">
                                    <i class="fa-solid ${test.mentioned ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                </span>
                                <span class="test-name">${test.description}</span>
                                <span class="test-sentiment sentiment-${test.sentiment}">${test.sentiment}</span>
                                <span class="test-toggle"><i class="fa-solid fa-chevron-down"></i></span>
                            </summary>
                            <div class="test-content">
                                <div class="test-response">${test.response}</div>
                                ${test.competitors.length > 0 ? `
                                    <div class="test-competitors">
                                        <strong>Erwähnte Alternativen:</strong>
                                        ${test.competitors.map(c => `<span class="competitor-tag">${c}</span>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </details>
                    `).join('')}
                </div>
            </div>
        `;

        // =================================================================
        // CHATGPT TESTS (wenn vorhanden)
        // =================================================================
        if (hasChatGPT) {
            const chatgptKnown = chatgptTests.find(t => t.id === 'chatgpt_knowledge')?.mentioned;
            
            let chatgptInsight = '';
            if (!chatgptKnown) {
                chatgptInsight = `
                    <div style="background:rgba(239,68,68,0.08);border-left:3px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:1rem;font-size:0.9rem;color:#ccc;">
                        <strong style="color:#ef4444;">⚠ Nicht in ChatGPTs Wissensbasis</strong><br>
                        ChatGPT kennt deine Domain nicht. Nutzer von ChatGPT sehen bei Branchenanfragen nur deine Konkurrenten. Mehr externe Erwähnungen und strukturierte Daten können helfen.
                    </div>`;
            } else {
                chatgptInsight = `
                    <div style="background:rgba(34,197,94,0.08);border-left:3px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:1rem;font-size:0.9rem;color:#ccc;">
                        <strong style="color:#22c55e;">✅ In ChatGPTs Wissensbasis</strong><br>
                        ChatGPT kennt dein Unternehmen. Du bist auch für ChatGPT-Nutzer sichtbar.
                    </div>`;
            }

            html += `
                <div class="result-section">
                    <h3><span class="engine-badge engine-chatgpt">ChatGPT</span> Wissens-Check</h3>
                    <p class="section-intro">ChatGPT antwortet aus seinem Trainings&shy;wissen – ohne Live-Suche:</p>
                    
                    ${chatgptInsight}
                    
                    <div class="tests-accordion">
                        ${chatgptTests.map((test, index) => `
                            <details class="test-item ${test.mentioned ? 'mentioned' : 'not-mentioned'}" ${index === 0 ? 'open' : ''}>
                                <summary>
                                    <span class="test-status">
                                        <i class="fa-solid ${test.mentioned ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    </span>
                                    <span class="test-name">${test.description}</span>
                                    <span class="test-sentiment sentiment-${test.sentiment}">${test.sentiment}</span>
                                    <span class="test-toggle"><i class="fa-solid fa-chevron-down"></i></span>
                                </summary>
                                <div class="test-content">
                                    <div class="test-response">${test.response}</div>
                                    ${test.competitors.length > 0 ? `
                                        <div class="test-competitors">
                                            <strong>Erwähnte Alternativen:</strong>
                                            ${test.competitors.map(c => `<span class="competitor-tag">${c}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </details>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // =================================================================
        // KONKURRENTEN
        // =================================================================
        if (competitors.length > 0) {
            html += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-users"></i> Konkurrenten in KI-Antworten</h3>
                    <p class="section-intro">Diese Domains werden statt deiner erwähnt:</p>
                    <div class="competitors-list">
                        ${competitors.map(c => `
                            <a href="https://${c}" target="_blank" rel="noopener" class="competitor-link">
                                <i class="fa-solid fa-external-link"></i> ${c}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // =================================================================
        // EMPFEHLUNGEN
        // =================================================================
        if (recommendations.length > 0) {
            html += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-lightbulb"></i> Empfehlungen</h3>
                    <div class="recommendations-list">
                        ${recommendations.map(rec => `
                            <div class="recommendation-card priority-${rec.priority}">
                                <div class="rec-priority">${rec.priority === 'hoch' ? 'Priorität: Hoch' : 'Priorität: Mittel'}</div>
                                <h4>${rec.title}</h4>
                                <p>${rec.description}</p>
                                ${rec.link ? `<a href="${rec.link}" class="rec-link">Mehr erfahren <i class="fa-solid fa-arrow-right"></i></a>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // =================================================================
        // FOOTER
        // =================================================================
        html += `
            <div class="result-footer">
                <p><i class="fa-solid fa-clock"></i> Analyse vom ${new Date(data.timestamp).toLocaleString('de-AT')}</p>
                <p class="disclaimer">Hinweis: KI-Antworten variieren. Dieser Test ist eine Momentaufnahme.${hasChatGPT ? ' ChatGPT nutzt Trainingswissen, Gemini durchsucht das Web live.' : ''}</p>
            </div>
        `;

        resultsContainer.innerHTML = html;

        // Animate score ring
        setTimeout(() => {
            document.querySelector('.score-ring-progress')?.classList.add('animated');
        }, 100);

        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
