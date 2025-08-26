<div style="color: #fff; font-size: 2rem; font-weight: bold; margin-top: 5px;">${keywordList.length}</div>
                    </div>
                    
                    <div style="
                        background: rgba(255,255,255,0.08);
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #17a2b8;
                    ">
                        <strong style="color: #17a2b8; font-size: 0.9rem; display: block;">Kontexte</strong>
                        <div style="color: #fff; font-size: 1.1rem; font-weight: 600; margin-top: 5px;">${uniqueContexts.join(', ')}</div>
                    </div>
                </div>
                
                <div style="
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    font-size: 0.85rem;
                    color: #ccc;
                ">
                    <span style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 12px; height: 12px; background: #28a745; border-radius: 50%;"></div>
                        Kommerziell: ${commercialCount}
                    </span>
                    <span style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 12px; height: 12px; background: #17a2b8; border-radius: 50%;"></div>
                        Informativ: ${informationalCount}
                    </span>
                </div>
                
                <div style="
                    margin-top: 15px;
                    font-size: 0.8rem;
                    color: #aaa;
                    font-style: italic;
                ">
                    Silas erstellt automatisch kontextspezifischen Content für jeden Bereich
                </div>
            </div>
        `;
        
        previewContainer.style.display = 'block';
    }

    function hideGenerationPreview() {
        const previewContainer = document.getElementById('generation-preview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }

    // === CONTENT GENERATION ===
    async function generateContentForKeyword(item, index, responseContent) {
        const { keyword, intent, context } = item;
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: Object.assign(
                    { 'Content-Type': 'application/json' },
                    isMasterModeActive() ? { 'X-Silas-Master': 'SilasUnlimited2024!' } : {}
                ),
                body: JSON.stringify({ 
                    prompt: `Generate content for ${keyword}`, 
                    keyword: keyword,
                    intent: intent
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error(`Fehler bei "${keyword}":`, error);
            throw error;
        }
    }

    function displayEnhancedResult(data, index, container) {
        const resultCard = document.createElement('div');
        const context = data._context || analyzeKeywordContext(data.keyword);
        const qualityScore = data._quality ? Math.round(data._quality.score * 100) : 0;
        
        let borderColor = context.color || '#6c757d';
        if (qualityScore > 0) {
            borderColor = qualityScore >= 70 ? '#28a745' : qualityScore >= 50 ? '#ffc107' : '#ff6b6b';
        }
        
        resultCard.style.cssText = `
            background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 5px solid ${borderColor};
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: 1px solid ${borderColor}30;
        `;
        
        if (data.error) {
            resultCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <h4 style="color: #ff6b6b; margin: 0; flex-grow: 1; font-size: 1.1rem;">${data.keyword}</h4>
                    <span style="background: #dc3545; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">FEHLER</span>
                </div>
                <p style="color: #ff9999; margin: 0; font-size: 0.9rem;">⚠️ ${data.error}</p>
            `;
        } else {
            resultCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <h4 style="color: #fff; margin: 0; flex-grow: 1; font-size: 1.1rem; font-weight: 600;">${data.keyword}</h4>
                    <span style="background: ${data.intent === 'commercial' ? '#28a745' : '#17a2b8'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">
                        ${data.intent === 'commercial' ? 'KOMMERZIELL' : 'INFORMATIV'}
                    </span>
                    ${context.name !== 'general' ? `<span style="background: ${context.color}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">
                        ${context.icon} ${context.label}
                    </span>` : ''}
                    ${qualityScore > 0 ? `<span style="background: ${borderColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">
                        ${qualityScore}%
                    </span>` : ''}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 15px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; border-left: 3px solid #ffc107;">
                        <strong style="color: #ffc107; font-size: 0.85rem;">SEO TITEL:</strong>
                        <div style="color: #e9e9e9; font-size: 0.9rem; margin-top: 4px; line-height: 1.4;">${data.post_title || 'N/A'}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; border-left: 3px solid #17a2b8;">
                        <strong style="color: #17a2b8; font-size: 0.85rem;">META BESCHREIBUNG:</strong>
                        <div style="color: #e9e9e9; font-size: 0.9rem; margin-top: 4px; line-height: 1.4;">${(data.meta_description || 'N/A').substring(0, 120)}...</div>
                    </div>
                </div>
                
                ${data._quality && data._quality.issues && data._quality.issues.length > 0 ? `
                <div style="background: rgba(255,193,7,0.1); border: 1px solid #ffc107; border-radius: 6px; padding: 10px; margin-bottom: 15px;">
                    <strong style="color: #ffc107; font-size: 0.8rem;">⚠️ Qualitätshinweise:</strong>
                    <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 0.75rem; color: #ffeb3b;">
                        ${data._quality.issues.slice(0, 3).map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="preview-btn enhanced" 
                            data-index="${index}" 
                            style="
                                background: linear-gradient(135deg, #007cba 0%, #0056b3 100%); 
                                color: white; 
                                border: none; 
                                padding: 12px 24px; 
                                border-radius: 8px; 
                                cursor: pointer; 
                                font-weight: 500;
                                font-size: 0.9rem;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 8px rgba(0,124,186,0.3);
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(0,124,186,0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,124,186,0.3)';">
                        🔍 Vollständige Vorschau
                    </button>
                    
                    <div style="color: #aaa; font-size: 0.8rem; line-height: 1.3;">
                        <div>Kontext: ${context.label}</div>
                        <div>${data._meta ? `Model: ${data._meta.model_used}` : ''}</div>
                    </div>
                </div>
            `;
        }
        
        container.appendChild(resultCard);
    }

    // === EVENT LISTENERS ===
    
    // Live-Kontext-Erkennung beim Tippen
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
    
    // Clear List
    clearListBtn.addEventListener('click', function() {
        keywordList = [];
        allGeneratedData = [];
        updateKeywordDisplayWithContext();
        hideContextPreview();
        hideGenerationPreview();
        
        silasResponseContainer.innerHTML = '';
        silasResponseContainer.style.display = 'none';
        silasStatus.textContent = 'Liste geleert. Bereit für neue Keywords.';
    });

    // === HAUPTGENERIERUNG ===
    startGenerationBtn.addEventListener('click', async function() {
        try {
            if (keywordList.length === 0) {
                silasStatus.textContent = 'Bitte füge zuerst Keywords hinzu.';
                return;
            }

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
                const context = item.context;
                
                silasStatus.innerHTML = `Generiere ${context.label}-Content für "${keyword}" <span style="color: ${context.color};">(${intent === 'commercial' ? 'Kommerziell' : 'Informativ'})</span> (${i + 1}/${keywordList.length})...`;

                try {
                    const data = await generateContentForKeyword(item, i, responseContent);
                    data.keyword = keyword;
                    data.intent = intent;
                    data._context = context;
                    allGeneratedData.push(data);
                    displayEnhancedResult(data, i, responseContent);

                    // Kurze Pause zwischen Requests
                    if (i < keywordList.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (error) {
                    console.error('Fehler bei der Textgenerierung:', error);
                    const errorData = {
                        keyword: keyword,
                        intent: intent,
                        error: error.message,
                        _context: context
                    };
                    allGeneratedData.push(errorData);
                    displayEnhancedResult(errorData, i, responseContent);
                }
            }

            updateUsageCounters();

            silasStatus.textContent = `✅ Alle ${keywordList.length} Texte wurden generiert.`;
            startGenerationBtn.disabled = false;
            silasResponseContainer.querySelector('h3').textContent = 'Erstellung abgeschlossen!';
            
            // Enhanced Download Button
            if (!document.getElementById('download-csv-dynamic')) {
                const downloadButton = document.createElement('button');
                downloadButton.id = 'download-csv-dynamic';
                downloadButton.className = 'cta-button';
                downloadButton.innerHTML = '<i class="fas fa-download"></i> CSV Herunterladen';
                downloadButton.style.cssText = `
                    margin-top: 1rem;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                `;
                downloadButton.onmouseover = function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                };
                downloadButton.onmouseout = function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                };
                downloadButton.addEventListener('click', downloadEnhancedCsv);
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

    // === CSV DOWNLOAD MIT KONTEXT-INFO ===
    function downloadEnhancedCsv() {
        if (allGeneratedData.length === 0) {
            alert('Keine Daten zum Download verfügbar.');
            return;
        }

        // Erweiterte Header mit Kontext-Informationen
        const headers = [
            "keyword", "intent", "context_name", "context_label", "quality_score",
            "post_title", "post_name", "meta_title", "meta_description", 
            "h1", "h2_1", "h2_2", "h2_3", "h2_4",
            "primary_cta", "secondary_cta", "hero_text", "hero_subtext",
            "benefits_list", "features_list", "social_proof",
            "testimonial_1", "testimonial_2", "pricing_title",
            "price_1", "price_2", "price_3",
            "faq_1", "faq_answer_1", "faq_2", "faq_answer_2", "faq_3", "faq_answer_3",
            "contact_info", "footer_cta", "trust_signals", "guarantee_text",
            "generation_time", "model_used"
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
                } else if (header === 'quality_score' && rowData._quality) {
                    value = rowData._quality.score ? Math.round(rowData._quality.score * 100) + '%' : '';
                } else if (header === 'generation_time' && rowData._meta) {
                    value = rowData._meta.generation_time || '';
                } else if (header === 'model_used' && rowData._meta) {
                    value = rowData._meta.model_used || '';
                } else {
                    value = rowData[header] || '';
                }
                
                return '"' + String(value).replace(/"/g, '""') + '"';
            });
            
            csvContent += values.join(",") + "\n";
        });
        
        // Download mit Kontext-Info im Filename
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
        
        // Download-Feedback
        showNotification(`📁 CSV heruntergeladen: ${successfulData.length} Keywords mit Kontext-Info`, '#28a745');
        
        console.log(`CSV Download: ${filename} (${successfulData.length} Datensätze)`);
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

    // Enhanced Preview Modal Content
    silasResponseContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('preview-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const data = allGeneratedData[index];
            
            if (data && !data.error && previewContentArea) {
                const context = data._context || analyzeKeywordContext(data.keyword);
                const qualityScore = data._quality ? Math.round(data._quality.score * 100) : 'N/A';
                
                let previewHtml = `
                    <div class="enhanced-preview" style="color: #f0f0f0; line-height: 1.6;">
                        
                        <!-- QUALITY & CONTEXT HEADER -->
                        <div style="
                            background: linear-gradient(135deg, ${context.color}20 0%, ${context.color}10 100%); 
                            border: 1px solid ${context.color}; 
                            border-radius: 12px; 
                            padding: 20px; 
                            margin-bottom: 30px; 
                            text-align: center;
                        ">
                            <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 15px;">
                                <span style="font-size: 2.5rem;">${context.icon}</span>
                                <div>
                                    <h2 style="color: ${context.color}; margin: 0; font-size: 1.5rem;">
                                        ${context.label} Content
                                    </h2>
                                    <p style="color: #ccc; margin: 5px 0 0 0; font-size: 0.9rem;">
                                        ${data.intent === 'commercial' ? 'Verkaufsorientiert' : 'Informativ'} | Qualität: ${qualityScore}%
                                    </p>
                                </div>
                            </div>
                            <p style="color: #ddd; margin: 0; font-size: 0.85rem;">
                                Keyword: "${data.keyword}" | Zielgruppe: ${context.audience}
                            </p>
                        </div>
                        
                        <!-- LANDINGPAGE PREVIEW -->
                        <div class="preview-landingpage" style="
                            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); 
                            padding: 30px; 
                            border-radius: 15px; 
                            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                        ">
                            
                            <!-- HERO SECTION -->
                            <header style="
                                text-align: center; 
                                margin-bottom: 50px; 
                                padding: 40px; 
                                background: linear-gradient(135deg, ${context.color}15 0%, ${context.color}08 100%); 
                                border-radius: 12px; 
                                border: 1px solid ${context.color}30;
                            ">
                                <h1 style="
                                    color: ${context.color}; 
                                    font-size: 2.5rem; 
                                    margin-bottom: 25px; 
                                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                                ">${data.h1 || 'H1 nicht verfügbar'}</h1>
                                
                                <p style="
                                    font-size: 1.2rem; 
                                    color: #e9e9e9; 
                                    margin: 0 auto 20px auto; 
                                    max-width: 800px; 
                                    line-height: 1.6;
                                ">${data.hero_text || 'Hero-Text nicht verfügbar'}</p>
                                
                                <p style="
                                    font-size: 1rem; 
                                    color: #bbb; 
                                    margin-bottom: 30px; 
                                    font-style: italic;
                                ">${data.hero_subtext || ''}</p>
                                
                                <div style="
                                    display: flex; 
                                    gap: 15px; 
                                    justify-content: center; 
                                    flex-wrap: wrap; 
                                    margin-top: 30px;
                                ">
                                    <button style="
                                        background: linear-gradient(135deg, ${context.color} 0%, ${context.color}dd 100%); 
                                        color: white; 
                                        border: none; 
                                        padding: 15px 30px; 
                                        border-radius: 8px; 
                                        font-weight: bold; 
                                        cursor: pointer; 
                                        box-shadow: 0 4px 15px ${context.color}30;
                                    ">${data.primary_cta || 'Jetzt anfragen'}</button>
                                    
                                    <button style="
                                        background: transparent; 
                                        color: ${context.color}; 
                                        border: 2px solid ${context.color}; 
                                        padding: 15px 30px; 
                                        border-radius: 8px; 
                                        font-weight: bold; 
                                        cursor: pointer;
                                    ">${data.secondary_cta || 'Mehr erfahren'}</button>
                                </div>
                            </header>
                            
                            <!-- CONTENT SECTIONS -->
                            <main style="max-width: 1000px; margin: 0 auto;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                                    <div style="padding: 25px; background: rgba(255,255,255,0.05); border-radius: 10px; border-top: 3px solid ${context.color};">
                                        <h3 style="color: ${context.color}; margin-bottom: 15px; font-size: 1.4rem;">Vorteile</h3>
                                        <div style="color: #ccc; font-size: 0.95rem;">${data.benefits_list || '<ul><li>Vorteil 1</li></ul>'}</div>
                                    </div>
                                    <div style="padding: 25px; background: rgba(255,255,255,0.05); border-radius: 10px; border-top: 3px solid #17a2b8;">
                                        <h3 style="color: #17a2b8; margin-bottom: 15px; font-size: 1.4rem;">Features</h3>
                                        <div style="color: #ccc; font-size: 0.95rem;">${data.features_list || '<ul><li>Feature 1</li></ul>'}</div>
                                    </div>
                                </div>
                                
                                <!-- TESTIMONIALS -->
                                <section style="margin-bottom: 40px;">
                                    <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.5rem;">Kundenstimmen</h3>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                        <blockquote style="
                                            background: rgba(255,255,255,0.08); 
                                            padding: 20px; 
                                            border-radius: 8px; 
                                            border-left: 4px solid ${context.color}; 
                                            font-style: italic; 
                                            color: #e9e9e9; 
                                            margin: 0;
                                        ">
                                            "${data.testimonial_1 || 'Testimonial 1 Text'}"
                                        </blockquote>
                                        <blockquote style="
                                            background: rgba(255,255,255,0.08); 
                                            padding: 20px; 
                                            border-radius: 8px; 
                                            border-left: 4px solid #17a2b8; 
                                            font-style: italic; 
                                            color: #e9e9e9; 
                                            margin: 0;
                                        ">
                                            "${data.testimonial_2 || 'Testimonial 2 Text'}"
                                        </blockquote>
                                    </div>
                                </section>
                                
                                <!-- FAQ SECTION -->
                                <section style="margin-bottom: 40px;">
                                    <h3 style="color: #ffc107; text-align: center; margin-bottom: 25px; font-size: 1.5rem;">Häufige Fragen</h3>
                                    <div style="display: grid; gap: 15px;">
                                        ${data.faq_1 ? `
                                        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 3px solid #28a745;">
                                            <strong style="color: #28a745; display: block; margin-bottom: 8px;">${data.faq_1}</strong>
                                            <p style="color: #ccc; margin: 0; line-height: 1.5;">${data.faq_answer_1 || 'Antwort nicht verfügbar'}</p>
                                        </div>
                                        ` : ''}
                                        ${data.faq_2 ? `
                                        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 3px solid #17a2b8;">
                                            <strong style="color: #17a2b8; display: block; margin-bottom: 8px;">${data.faq_2}</strong>
                                            <p style="color: #ccc; margin: 0; line-height: 1.5;">${data.faq_answer_2 || 'Antwort nicht verfügbar'}</p>
                                        </div>
                                        ` : ''}
                                        ${data.faq_3 ? `
                                        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border-left: 3px solid #ffc107;">
                                            <strong style="color: #ffc107; display: block; margin-bottom: 8px;">${data.faq_3}</strong>
                                            <p style="color: #ccc; margin: 0; line-height: 1.5;">${data.faq_answer_3 || 'Antwort nicht verfügbar'}</p>
                                        </div>
                                        ` : ''}
                                    </div>
                                </section>
                            </main>
                            
                            <!-- SEO DETAILS -->
                            <section style="
                                margin-top: 40px; 
                                padding: 25px; 
                                background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(45,45,45,0.8) 100%); 
                                border-radius: 12px; 
                                border: 2px solid #444;
                            ">
                                <h3 style="
                                    color: #ffc107; 
                                    margin: 0 0 25px 0; 
                                    text-align: center; 
                                    font-size: 1.5rem; 
                                    border-bottom: 2px solid #ffc107; 
                                    padding-bottom: 15px;
                                ">SEO & Meta-Informationen</h3>
                                
                                <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                                    <div style="padding: 15px; background: rgba(40,167,69,0.1); border-radius: 8px; border-left: 4px solid #28a745;">
                                        <strong style="color: #28a745;">URL Slug:</strong>
                                        <code style="color: #e9e9e9; font-family: monospace; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; margin-left: 10px;">${data.post_name || 'n-a'}</code>
                                    </div>
                                    <div style="padding: 15px; background: rgba(23,162,184,0.1); border-radius: 8px; border-left: 4px solid #17a2b8;">
                                        <strong style="color: #17a2b8;">Meta Title:</strong>
                                        <span style="color: #e9e9e9; margin-left: 10px; word-break: break-word;">${data.meta_title || data.post_title || 'N/A'}</span>
                                    </div>
                                    <div style="padding: 15px; background: rgba(255,193,7,0.1); border-radius: 8px; border-left: 4px solid #ffc107;">
                                        <strong style="color: #ffc107;">Meta Description:</strong>
                                        <span style="color: #e9e9e9; margin-left: 10px; word-break: break-word;">${data.meta_description || 'N/A'}</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                `;
                
                previewContentArea.innerHTML = previewHtml;
                openPreviewModal();
            }
        }
    });

    // === INITIALIZATION ===
    initDemoTracking();
    showDemoStatus();
    createMasterPasswordUI();

    console.log('Silas Form mit Kontext-System initialisiert');
}// silas-form.js - KOMPLETT NEU MIT KONTEXT-SYSTEM UND QUALITÄTSKONTROLLE

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    
    if (!silasForm) {
        console.warn('Silas Form nicht gefunden');
        return;
    }

    console.log('Silas Form wird initialisiert...');

    // === MASTER PASSWORD SYSTEM ===
    const MASTER_PASSWORD = "SilasUnlimited2024!";
    
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

    // === KONTEXT-ANALYSE SYSTEM ===
    function analyzeKeywordContext(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        
        const contexts = {
            'tech': {
                terms: ['wordpress', 'plugin', 'software', 'app', 'digital', 'web', 'tool', 'system', 'online', 'code', 'entwicklung'],
                label: 'Technologie',
                icon: '💻',
                color: '#007cba',
                audience: 'Entwickler, Website-Betreiber, IT-Entscheider'
            },
            'business': {
                terms: ['marketing', 'seo', 'beratung', 'consulting', 'strategie', 'erfolg', 'umsatz', 'verkauf', 'unternehmen'],
                label: 'Business',
                icon: '📈',
                color: '#28a745',
                audience: 'Unternehmer, Marketing-Manager, Selbstständige'
            },
            'pets': {
                terms: ['hund', 'tier', 'haustier', 'welpe', 'katze', 'training', 'futter', 'veterinär'],
                label: 'Haustiere',
                icon: '🐕',
                color: '#ff6b6b',
                audience: 'Hundebesitzer, Tierliebhaber'
            },
            'gastro': {
                terms: ['cafe', 'restaurant', 'gastronomie', 'küche', 'essen', 'trinken', 'speise', 'cafehaus'],
                label: 'Gastronomie',
                icon: '🍽️',
                color: '#ffc107',
                audience: 'Gastronomiebetreiber, Genießer'
            },
            'health': {
                terms: ['gesundheit', 'fitness', 'wellness', 'sport', 'training', 'ernährung', 'therapie'],
                label: 'Gesundheit',
                icon: '💪',
                color: '#17a2b8',
                audience: 'Gesundheitsbewusste, Sportler'
            },
            'finance': {
                terms: ['kredit', 'finanz', 'versicherung', 'bank', 'geld', 'investment', 'steuer'],
                label: 'Finanzen',
                icon: '💰',
                color: '#6f42c1',
                audience: 'Privatpersonen, Investoren, KMU'
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

    // === DEMO LIMITS SYSTEM ===
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

    // === MASTER MODE UI ===
    function createMasterPasswordUI() {
        if (!isMasterModeActive() && !document.getElementById('master-unlock-btn')) {
            const unlockBtn = document.createElement('button');
            unlockBtn.id = 'master-unlock-btn';
            unlockBtn.innerHTML = '🔓';
            unlockBtn.title = 'Master Access';
            unlockBtn.style.cssText = 'position: fixed; bottom: 40px; right: 20px; background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); border: 2px solid #e0a800; color: #1a1a1a; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); transition: all 0.3s ease; z-index: 1000;';
            unlockBtn.onclick = function() {
                const password = prompt('🔐 Master-Passwort eingeben:');
                if (password === MASTER_PASSWORD) {
                    activateMasterMode();
                } else if (password !== null) {
                    alert('❌ Falsches Passwort!');
                }
            };
            document.body.appendChild(unlockBtn);
        }

        if (isMasterModeActive()) {
            showMasterModeIndicator();
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
    }

    function showMasterModeIndicator() {
        const existing = document.getElementById('master-mode-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'master-mode-indicator';
        indicator.style.cssText = 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 20px; text-align: center; font-weight: bold; border-radius: 8px; margin: 15px 0; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); border: 2px solid #155724; position: relative;';
        indicator.innerHTML = '🔓 <strong>MASTER MODE AKTIV</strong> 🔓<br><small style="opacity: 0.9;">Unlimited Keywords • No Rate Limits • Enhanced Quality</small><button onclick="deactivateMasterMode()" style="position: absolute; top: 8px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px;" title="Master Mode deaktivieren">×</button>';
        
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

    // === RATE LIMITING FUNCTIONS ===
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
            throw new Error('📅 Tägliches Demo-Limit erreicht. Versuche es morgen wieder.');
        }
        
        if (hourlyData.count >= DEMO_LIMITS.maxGenerationsPerHour) {
            throw new Error('⏰ Stündliches Demo-Limit erreicht. Versuche es in einer Stunde wieder.');
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
                throw new Error('🔍 Keyword zu lang (max. 100 Zeichen im Master Mode).');
            }
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
            throw new Error('🔍 Keywords dürfen maximal 50 Zeichen lang sein.');
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
            demoStatusContainer.innerHTML = '<div style="background: linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%); border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; color: #ffc107;"><strong>🎯 Demo-Modus:</strong> Heute noch <strong>' + dailyRemaining + '</strong> Generierungen | Diese Stunde noch <strong>' + hourlyRemaining + '</strong> Generierungen<br><small style="color: #ccc; margin-top: 5px; display: block;">Silas dient zu Demonstrationszwecken</small></div>';
        }
    }

    // === KONTEXT-PREVIEW SYSTEM ===
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
                animation: slideIn 0.3s ease;
            ">
                <div style="font-size: 2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${context.icon}</div>
                
                <div style="flex-grow: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <strong style="color: ${context.color}; font-size: 1.1rem; font-weight: 600;">
                            Kontext erkannt: ${context.label}
                        </strong>
                        
                        <span style="
                            background: ${intent === 'commercial' ? '#28a745' : '#17a2b8'};
                            color: white;
                            padding: 3px 8px;
                            border-radius: 12px;
                            font-size: 0.7rem;
                            font-weight: bold;
                            text-transform: uppercase;
                        ">${intent === 'commercial' ? 'Kommerziell' : 'Informativ'}</span>
                    </div>
                    
                    <p style="color: #ccc; margin: 0; font-size: 0.9rem; line-height: 1.4;">
                        Zielgruppe: ${context.audience}
                    </p>
                </div>
                
                <div style="
                    background: ${context.color}20;
                    border-radius: 50%;
                    width: 8px;
                    height: 8px;
                    animation: pulse 2s infinite;
                "></div>
            </div>
        `;
        
        container.style.display = 'block';
        
        // CSS Animation hinzufügen
        if (!document.getElementById('context-animations')) {
            const style = document.createElement('style');
            style.id = 'context-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.2); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function hideContextPreview() {
        const container = document.getElementById('context-preview-container');
        if (container) {
            container.style.display = 'none';
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
            
            // Session-Limit prüfen
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
                        intent: currentIntent,
                        context: analyzeKeywordContext(keyword)
                    });
                } else {
                    keywordList[existingIndex].intent = currentIntent;
                    keywordList[existingIndex].context = analyzeKeywordContext(keyword);
                }
            });
            
            if (newKeywords.length > 0) {
                updateKeywordDisplayWithContext();
                showGenerationPreview();
                keywordInput.value = '';
                hideContextPreview();
                
                const lastKeyword = newKeywords[newKeywords.length - 1];
                const context = analyzeKeywordContext(lastKeyword);
                silasStatus.innerHTML = `✅ "${lastKeyword}" hinzugefügt <span style="color: ${context.color};">(${context.label})</span>`;
                setTimeout(function() {
                    silasStatus.textContent = 'Bereit zur Generierung.';
                }, 3000);
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

    function updateKeywordDisplayWithContext() {
        keywordDisplayList.innerHTML = '';
        
        keywordList.forEach(function(item, index) {
            const listItem = document.createElement('li');
            
            // Intent Badge
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
            
            // Kontext Badge
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
            
            // Keyword Text
            const keywordSpan = document.createElement('span');
            keywordSpan.textContent = item.keyword;
            keywordSpan.style.cssText = `
                font-weight: 500;
                color: #fff;
                word-break: break-word;
                line-height: 1.4;
                margin-bottom: 8px;
                display: block;
            `;
            
            // Content Container
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = 'flex-grow: 1; min-width: 0;';
            
            const badgeContainer = document.createElement('div');
            badgeContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
            badgeContainer.appendChild(intentBadge);
            badgeContainer.appendChild(contextBadge);
            
            contentDiv.appendChild(keywordSpan);
            contentDiv.appendChild(badgeContainer);
            
            // Remove Button
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
                flex-shrink: 0;
                margin-left: 15px;
                transition: all 0.2s ease;
            `;
            removeBtn.onmouseover = () => {
                removeBtn.style.backgroundColor = '#ff5252';
                removeBtn.style.transform = 'scale(1.1)';
            };
            removeBtn.onmouseout = () => {
                removeBtn.style.backgroundColor = '#ff6b6b';
                removeBtn.style.transform = 'scale(1)';
            };
            removeBtn.onclick = function() {
                keywordList.splice(index, 1);
                updateKeywordDisplayWithContext();
                showGenerationPreview();
                
                silasStatus.textContent = `Keyword "${item.keyword}" entfernt.`;
                setTimeout(() => {
                    silasStatus.textContent = 'Bereit zur Generierung.';
                }, 2000);
            };
            
            // List Item Style
            listItem.style.cssText = `
                background: linear-gradient(135deg, ${item.context.color}10 0%, ${item.context.color}05 100%);
                margin-bottom: 12px;
                padding: 15px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 0.95rem;
                color: #fff;
                border-left: 4px solid ${item.context.color};
                min-height: 60px;
                gap: 15px;
                transition: all 0.2s ease;
                border: 1px solid ${item.context.color}30;
            `;
            
            // Hover-Effekt
            listItem.onmouseover = function() {
                this.style.transform = 'translateX(5px)';
                this.style.boxShadow = `0 4px 15px ${item.context.color}20`;
            };
            listItem.onmouseout = function() {
                this.style.transform = 'translateX(0)';
                this.style.boxShadow = 'none';
            };
            
            listItem.appendChild(contentDiv);
            listItem.appendChild(removeBtn);
            keywordDisplayList.appendChild(listItem);
        });
        
        clearListBtn.style.display = keywordList.length > 0 ? 'inline-block' : 'none';
    }

    function showGenerationPreview() {
        if (keywordList.length === 0) {
            hideGenerationPreview();
            return;
        }
        
        const uniqueContexts = [...new Set(keywordList.map(item => item.context.label))];
        const commercialCount = keywordList.filter(item => item.intent === 'commercial').length;
        const informationalCount = keywordList.length - commercialCount;
        
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
                box-shadow: 0 4px 20px rgba(255,193,7,0.1);
            ">
                <h4 style="
                    color: #ffc107;
                    margin: 0 0 20px 0;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                ">
                    🎯 Generierungs-Vorschau
                </h4>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                ">
                    <div style="
                        background: rgba(255,255,255,0.08);
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #28a745;
                    ">
                        <strong style="color: #28a745; font-size: 0.9rem; display: block;">Keywords gesamt</strong>
                        <div style="color: #fff; font-size: 2rem; font-weight:
