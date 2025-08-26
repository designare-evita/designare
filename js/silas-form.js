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
            <!-- Vorschau Box (100% Breite) -->
            <div style="
                background: linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,193,7,0.08) 100%);
                border: 1px solid #ffc107;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
                width: 100%;
            ">
                <h4 style="color: #ffc107; margin: 0 0 20px 0; font-size: 1.2rem;">
                    Generierungs-Vorschau
                </h4>
                
                <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 15px;">
                    <div style="text-align: center;">
                        <div style="color: #fff; font-size: 1.8rem; font-weight: bold;">${keywordList.length}</div>
                        <div style="color: #ccc; font-size: 0.9rem;">Keywords</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #fff; font-size: 1.1rem; font-weight: bold;">${uniqueContexts.join(', ')}</div>
                        <div style="color: #ccc; font-size: 0.9rem;">Kontexte</div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 30px; font-size: 0.9rem; color: #ccc;">
                    <span>Kommerziell: ${commercialCount}</span>
                    <span>Informativ: ${keywordList.length - commercialCount}</span>
                </div>
            </div>
            
            <!-- Button Container (50/50 Layout) -->
            <div style="
                display: flex; 
                gap: 15px; 
                width: 100%;
                margin-bottom: 20px;
            ">
                <button id="create-content-btn" style="
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    border: none;
                    padding: 18px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1.1rem;
                    font-weight: bold;
                    flex: 1;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                ">
                    Content erstellen
                </button>
                
                <button id="clear-keywords-btn" style="
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    color: white;
                    border: none;
                    padding: 18px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1.1rem;
                    font-weight: bold;
                    flex: 1;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
                ">
                    Liste leeren
                </button>
            </div>
        `;
        
        previewContainer.style.display = 'block';
        
        // Event Listener für die neuen Buttons hinzufügen
        setTimeout(() => {
            const newStartBtn = document.getElementById('create-content-btn');
            const newClearBtn = document.getElementById('clear-keywords-btn');
            
            if (newStartBtn) {
                newStartBtn.addEventListener('click', startGeneration);
                
                // Hover-Effekte hinzufügen
                newStartBtn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                });
                newStartBtn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                });
            }
            
            if (newClearBtn) {
                newClearBtn.addEventListener('click', function() {
                    if (confirm('Möchtest du wirklich alle Keywords löschen?')) {
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
                    }
                });
                
                // Hover-Effekte hinzufügen
                newClearBtn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                });
                newClearBtn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                });
            }
        }, 100);
        
        // Verstecke originale Buttons
        if (startGenerationBtn) startGenerationBtn.style.display = 'none';
        if (clearListBtn) clearListBtn.style.display = 'none';
    }

    function hideGenerationPreview() {
        const container = document.getElementById('generation-preview');
        if (container) {
            container.style.display = 'none';
        }
        
        // Zeige originale Buttons wieder
        if (startGenerationBtn) startGenerationBtn.style.display = 'block';
        if (clearListBtn) clearListBtn.style.display = keywordList.length > 0 ? 'block' : 'none';
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

    // === HAUPTGENERIERUNG ===
    async function startGeneration() {
        console.log('Start Generation aufgerufen');
        
        try {
            if (keywordList.length === 0) {
                if (silasStatus) {
                    silasStatus.textContent = 'Bitte füge zuerst Keywords hinzu.';
                }
                return;
            }

            checkRateLimit();

            // Alle Start-Buttons deaktivieren
            const allStartBtns = [
                document.getElementById('start-generation-btn'),
                document.getElementById('create-content-btn')
            ];
            allStartBtns.forEach(btn => {
                if (btn) btn.disabled = true;
            });
            
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
            
            // Buttons wieder aktivieren
            allStartBtns.forEach(btn => {
                if (btn) btn.disabled = false;
            });
            
            const headerElement = silasResponseContainer?.querySelector('h3');
            if (headerElement) {
                headerElement.textContent = 'Erstellung abgeschlossen!';
            }
            
            // Download Button hinzufügen
            if (!document.getElementById('download-csv-dynamic') && silasResponseContainer) {
                const downloadButton = document.createElement('button');
                downloadButton.id = 'download-csv-dynamic';
                downloadButton.innerHTML = 'CSV Herunterladen';
                downloadButton.style.cssText = `
                    background: linear-gradient(135deg, #007cba 0%, #0056b3 100%);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    margin-top: 20px;
                    width: 100%;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0, 124, 186, 0.3);
                `;
                downloadButton.addEventListener('click', downloadCsv);
                
                // Hover-Effekt
                downloadButton.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 20px rgba(0, 124, 186, 0.4)';
                });
                downloadButton.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 15px rgba(0, 124, 186, 0.3)';
                });
                
                silasResponseContainer.appendChild(downloadButton);
            }

        } catch (error) {
            console.error('Generierungsfehler:', error);
            if (silasStatus) {
                silasStatus.textContent = error.message;
                silasStatus.style.color = '#ff6b6b';
            }
            
            // Buttons wieder aktivieren
            const allStartBtns = [
                document.getElementById('start-generation-btn'),
                document.getElementById('create-content-btn')
            ];
            allStartBtns.forEach(btn => {
                if (btn) btn.disabled = false;
            });
            
            setTimeout(function() {
                if (silasStatus) {
                    silasStatus.textContent = 'Bereit zur Generierung.';
                    silasStatus.style.color = '#ffc107';
                }
            }, 5000);
        }
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

    // Originaler Start Button (falls vorhanden)
    if (startGenerationBtn) {
        startGenerationBtn.addEventListener('click', startGeneration);
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
                        <div style="
                            color: #f0f0f0; 
                            line-height: 1.6; 
                            max-height: 80vh; 
                            overflow-y: auto; 
                            padding-right: 10px;
                        ">
                            <div style="
                                background: linear-gradient(135deg, ${context.color}20 0%, ${context.color}10 100%); 
                                border: 1px solid ${context.color}; 
                                border-radius: 12px; 
                                padding: 20px; 
                                margin-bottom: 25px; 
                                text-align: center;
                            ">
                                <h2 style="color: ${context.color}; margin: 0; font-size: 1.5rem;">
                                    ${context.icon} ${context.label} Content
                                </h2>
                                <p style="color: #ccc; margin: 5px 0 0 0;">
                                    "${data.keyword}" | ${data.intent === 'commercial' ? 'Verkaufsorientiert' : 'Informativ'}
                                </p>
                            </div>
                            
                            <!-- SEO Grundlagen -->
                            <div style="background: #1a1a1a; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                                <h3 style="color: #ffc107; margin-bottom: 15px;">SEO Grundlagen</h3>
                                <div style="margin-bottom: 15px;">
                                    <strong style="color: #28a745;">Post Titel:</strong>
                                    <p style="color: #e9e9e9; margin: 5px 0;">${data.post_title || 'N/A'}</p>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <strong style="color: #17a2b8;">Meta Beschreibung:</strong>
                                    <p style="color: #e9e9e9; margin: 5px 0;">${data.meta_description || 'N/A'}</p>
                                </div>
                            </div>

                            <!-- Hauptcontent -->
                            <div style="background: #1a1a1a; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                                <h3 style="color: #ffc107; margin-bottom: 15px;">Hauptcontent</h3>
                                <h1 style="color: ${context.color}; font-size: 1.8rem; margin-bottom: 15px;">
                                    ${data.h1 || 'H1 nicht verfügbar'}
                                </h1>
                                <div style="margin-bottom: 15px;">
                                    <strong style="color: #28a745;">Hero Text:</strong>
                                    <p style="color: #e9e9e9; margin: 5px 0;">${data.hero_text || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <!-- Vorteile & Features -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div style="background: #1a1a1a; padding: 20px; border-radius: 10px;">
                                    <h3 style="color: #28a745; margin-bottom: 15px;">Vorteile</h3>
                                    <div style="color: #ccc;">${data.benefits_list || '<ul><li>Keine Daten</li></ul>'}</div>
                                </div>
                                <div style="background: #1a1a1a; padding: 20px; border-radius: 10px;">
                                    <h3 style="color: #17a2b8; margin-bottom: 15px;">Features</h3>
                                    <div style="color: #ccc;">${data.features_list || '<ul><li>Keine Daten</li></ul>'}</div>// silas-form.js - REPARIERTE UND VOLLSTÄNDIGE VERSION

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
            unlockBtn.innerHTML = '🔒';
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

    // === INTELLIGENTE CONTENT GENERATION ===
    async function generateContent(item, index, responseContent) {
        // Simuliere API-Aufruf
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const context = item.context;
        const isCommercial = item.intent === 'commercial';
        const keyword = item.keyword.toLowerCase().trim();
        
        // Mock-Daten generieren
        const mockData = generateMockData(item);
        return mockData;
    }

    function generateMockData(item) {
        const keyword = item.keyword;
        const context = item.context;
        const isCommercial = item.intent === 'commercial';
        
        // Generiere intelligente Inhalte basierend auf Keyword und Kontext
        function generateIntelligentContent(keyword, context, isCommercial) {
            const contextActions = {
                'tech': {
                    verbs: ['optimieren', 'automatisieren', 'integrieren', 'entwickeln'],
                    benefits: ['Performance-Steigerung', 'Automatisierung', 'Benutzerfreundlichkeit', 'Skalierbarkeit'],
                    features: ['Dashboard', 'API-Integration', 'Cloud-Sync', 'Analytics']
                },
                'business': {
                    verbs: ['steigern', 'optimieren', 'maximieren', 'strategisch nutzen'],
                    benefits: ['ROI-Steigerung', 'Effizienz-Gewinn', 'Marktvorsprung', 'Kostenersparnis'],
                    features: ['Reporting', 'CRM-Integration', 'Automatisierung', 'KPI-Tracking']
                },
                'pets': {
                    verbs: ['trainieren', 'pflegen', 'gesund halten', 'glücklich machen'],
                    benefits: ['Gesunde Entwicklung', 'Stressreduktion', 'Bindungsaufbau', 'Verhaltensverbesserung'],
                    features: ['Trainingsplan', 'Gesundheits-Monitoring', 'Ernährungsberatung', '24/7 Betreuung']
                },
                'gastro': {
                    verbs: ['zubereiten', 'servieren', 'genießen', 'kreieren'],
                    benefits: ['Geschmackserlebnis', 'Frische Qualität', 'Authentische Rezepte', 'Regionale Zutaten'],
                    features: ['Saisonale Karte', 'Online-Bestellung', 'Catering-Service', 'Allergiker-freundlich']
                },
                'health': {
                    verbs: ['verbessern', 'stärken', 'fördern', 'unterstützen'],
                    benefits: ['Mehr Energie', 'Bessere Fitness', 'Stress-Reduktion', 'Langzeit-Gesundheit'],
                    features: ['Personal Training', 'Ernährungsplan', 'Progress-Tracking', 'Experten-Betreuung']
                },
                'general': {
                    verbs: ['verbessern', 'optimieren', 'erweitern', 'entwickeln'],
                    benefits: ['Qualitätssteigerung', 'Effizienz', 'Zufriedenheit', 'Erfolg'],
                    features: ['Benutzerfreundlich', 'Professionell', 'Zuverlässig', 'Modern']
                }
            };
            
            const actions = contextActions[context.name] || contextActions['general'];
            const mainVerb = actions.verbs[Math.floor(Math.random() * actions.verbs.length)];
            
            return {
                post_title: isCommercial 
                    ? `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${mainVerb} - Premium ${context.label} Lösung`
                    : `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Kompletter ${context.label} Ratgeber 2025`,
                    
                meta_description: isCommercial
                    ? `${mainVerb.charAt(0).toUpperCase() + mainVerb.slice(1)} Sie ${keyword} mit unserer professionellen ${context.label}-Lösung. ${actions.benefits[0]} garantiert!`
                    : `Alles über ${keyword}: ${actions.benefits.slice(0,2).join(', ')} und mehr. Ihr umfassender ${context.label}-Guide.`,
                    
                h1: isCommercial
                    ? `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}-Lösung für ${context.audience.split(',')[0]}`
                    : `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: ${context.label} Experten-Wissen`,
                    
                h2_1: isCommercial ? `Warum ${keyword} professionell ${mainVerb}?` : `Was macht perfekte ${keyword} aus?`,
                h2_2: isCommercial ? `Unsere ${keyword}-Pakete im Überblick` : `${keyword} richtig ${mainVerb} - Schritt für Schritt`,
                h2_3: `${context.label}-Tipps für ${keyword}`,
                h2_4: isCommercial ? `Preise & Buchung` : `Häufige Fehler vermeiden`,
                
                hero_text: isCommercial
                    ? `${mainVerb.charAt(0).toUpperCase() + mainVerb.slice(1)} Sie ${keyword} mit unserer bewährten ${context.label}-Expertise`
                    : `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} erfolgreich ${mainVerb}: Praktische Tipps und Experten-Wissen`,
                    
                hero_subtext: `Speziell entwickelt für ${context.audience}`,
                
                primary_cta: isCommercial ? `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} jetzt optimieren` : `Kostenlosen ${context.label}-Guide herunterladen`,
                secondary_cta: isCommercial ? 'Kostenlose Beratung anfordern' : 'Experten-Tipps per E-Mail',
                
                benefits_list: `<ul>${actions.benefits.map(benefit => `<li>${benefit}</li>`).join('')}</ul>`,
                features_list: `<ul>${actions.features.map(feature => `<li>${feature} für ${keyword}</li>`).join('')}</ul>`,
                
                social_proof: `Über 2.500 ${context.audience.split(',')[0]} nutzen bereits unsere ${keyword}-Lösung`,
                
                testimonial_1: `"Durch diese ${keyword}-Lösung haben wir ${actions.benefits[0].toLowerCase()} erreicht!"`,
                testimonial_2: `"Die beste ${keyword}-Lösung die ich je verwendet habe."`,
                
                pricing_title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Pakete`,
                price_1: isCommercial ? '€39,90' : 'Kostenlos',
                price_2: isCommercial ? '€79,90' : 'Premium €29',
                price_3: isCommercial ? '€149,90' : 'Pro €59',
                
                faq_1: `Wie kann ich ${keyword} am besten ${mainVerb}?`,
                faq_answer_1: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} lässt sich am besten ${mainVerb} durch systematische Herangehensweise und die richtigen Tools.`,
                faq_2: `Was kostet ${keyword} ${isCommercial ? 'Optimierung' : 'Planung'}?`,
                faq_answer_2: isCommercial 
                    ? `Unsere ${keyword}-Pakete starten bereits ab €39,90 monatlich.`
                    : `Die Kosten für ${keyword} variieren je nach Umfang. Mit unseren Tipps können Sie jedoch erheblich sparen.`,
                faq_3: `Wie lange dauert es bis ${keyword} Ergebnisse zeigt?`,
                faq_answer_3: `Mit der richtigen Strategie sehen Sie erste Verbesserungen bereits nach wenigen Tagen.`,
                
                contact_info: 'info@example.com • +43 1 234 5678 • Online-Chat verfügbar',
                footer_cta: isCommercial ? 'Jetzt Angebot anfordern' : 'Newsletter abonnieren',
                trust_signals: 'SSL-verschlüsselt • DSGVO-konform • Über 5 Jahre Erfahrung',
                guarantee_text: isCommercial ? '30 Tage Geld-zurück-Garantie' : '100% kostenlose Basis-Informationen'
            };
        }
        
        // Generiere intelligente Inhalte
        const intelligentContent = generateIntelligentContent(keyword, context, isCommercial);
        
        // Vervollständige die Daten
        const mockData = {
            keyword: item.keyword,
            intent: item.intent,
            post_name: keyword.toLowerCase().replace(/\s+/g, '-'),
            meta_title: intelligentContent.post_title,
            ...intelligentContent
        };
        
        return mockData;
    }

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
