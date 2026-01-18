// js/ai-visibility.js - Frontend für KI-Sichtbarkeits-Check

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('visibility-form');
    const domainInput = document.getElementById('domain-input');
    const industryInput = document.getElementById('industry-input');
    const submitBtn = document.getElementById('submit-btn');
    const resultsContainer = document.getElementById('results-container');
    const loadingOverlay = document.getElementById('loading-overlay');

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
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }

    function getRemainingChecks() {
        const usage = getUsageData();
        const today = getTodayString();
        
        // Neuer Tag = Reset
        if (usage.date !== today) {
            return DAILY_LIMIT;
        }
        
        return Math.max(0, DAILY_LIMIT - usage.count);
    }

    function incrementUsage() {
        const today = getTodayString();
        const usage = getUsageData();
        
        if (usage.date !== today) {
            // Neuer Tag - Reset
            setUsageData({ date: today, count: 1 });
        } else {
            // Gleicher Tag - Increment
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

    // Initial anzeigen
    updateLimitDisplay();

    // Quick-Select Buttons für Branchen
    document.querySelectorAll('.industry-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            industryInput.value = this.dataset.industry;
            // Highlight aktiven Button
            document.querySelectorAll('.industry-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Form Submit
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Rate-Limit prüfen
        if (!canMakeRequest()) {
            showError('Du hast dein Tageslimit von 3 Checks erreicht. Probier es morgen wieder!');
            return;
        }
        
        const domain = domainInput.value.trim();
        if (!domain) {
            showError('Bitte gib eine Domain ein.');
            return;
        }

        // Loading State
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

            // Rate-Limit vom Server prüfen
            if (response.status === 429) {
                throw new Error(data.message || 'Tageslimit erreicht. Bitte morgen wieder versuchen.');
            }

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Analyse fehlgeschlagen');
            }

            // Erfolg: Usage incrementieren
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

    function showError(message) {
        resultsContainer.innerHTML = `
            <div class="error-box">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function renderResults(data) {
        const { score, domainAnalysis, aiTests, competitors, recommendations } = data;

        // Score Ring Color
        const scoreColor = score.color;
        const circumference = 2 * Math.PI * 54; // radius 54
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
                </div>
            </div>

            <!-- Score Breakdown -->
            <div class="result-section">
                <h3><i class="fa-solid fa-chart-pie"></i> Score-Zusammensetzung</h3>
                <div class="breakdown-grid">
                    ${score.breakdown.map(item => `
                        <div class="breakdown-item">
                            <div class="breakdown-header">
                                <span class="breakdown-label">${item.category}</span>
                                <span class="breakdown-points">${item.points}/${item.maxPoints}</span>
                            </div>
                            <div class="breakdown-bar">
                                <div class="breakdown-fill" style="width: ${(item.points / item.maxPoints) * 100}%"></div>
                            </div>
                            <p class="breakdown-detail">${item.detail}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Domain Analysis -->
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

            <!-- AI Test Results -->
            <div class="result-section">
                <h3><i class="fa-solid fa-robot"></i> Gemini Live-Tests</h3>
                <p class="section-intro">Diese Fragen wurden live an Gemini gestellt:</p>
                
                <div class="tests-accordion">
                    ${aiTests.map((test, index) => `
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
                                <div class="test-response">
                                    ${test.response}
                                </div>
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

            <!-- Competitors -->
            ${competitors.length > 0 ? `
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
            ` : ''}

            <!-- Recommendations -->
            ${recommendations.length > 0 ? `
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
            ` : ''}

            <!-- Timestamp -->
            <div class="result-footer">
                <p><i class="fa-solid fa-clock"></i> Analyse vom ${new Date(data.timestamp).toLocaleString('de-AT')}</p>
                <p class="disclaimer">Hinweis: KI-Antworten variieren. Dieser Test ist eine Momentaufnahme.</p>
            </div>
        `;

        resultsContainer.innerHTML = html;

        // Animate score ring
        setTimeout(() => {
            document.querySelector('.score-ring-progress')?.classList.add('animated');
        }, 100);

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
