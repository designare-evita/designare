// js/silas-form.js

export function initSilasForm() {
    // Diese Prüfung ist die Lösung:
    // Wir suchen das Hauptformular von Silas.
    const silasForm = document.getElementById('silas-form');
    
    // Wenn das Formular nicht existiert, sind wir nicht auf der richtigen Seite.
    // Die Funktion wird sofort beendet, um Fehler zu vermeiden.
    if (!silasForm) {
        return;
    }

    // Ab hier läuft der Code nur noch, wenn wir auf der CSV-Creator.html Seite sind.
    const keywordInput = document.getElementById('silas-keyword-input');
    const addKeywordBtn = document.getElementById('add-keyword-btn');
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

    // --- LOGIK ZUM HINZUFÜGEN VON KEYWORDS ---
    function addKeywords() {
        const newKeywords = keywordInput.value.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0 && !keywordList.includes(kw));
        if (newKeywords.length > 0) {
            keywordList.push(...newKeywords);
            updateKeywordDisplay();
            keywordInput.value = '';
        }
    }

    function updateKeywordDisplay() {
        keywordDisplayList.innerHTML = '';
        keywordList.forEach((keyword, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = keyword;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.onclick = () => {
                keywordList.splice(index, 1);
                updateKeywordDisplay();
            };
            listItem.appendChild(removeBtn);
            keywordDisplayList.appendChild(listItem);
        });
        clearListBtn.style.display = keywordList.length > 0 ? 'inline-block' : 'none';
    }

    // --- EVENT-LISTENER ---
    addKeywordBtn.addEventListener('click', addKeywords);
    keywordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addKeywords(); } });
    clearListBtn.addEventListener('click', () => {
        keywordList = [];
        allGeneratedData = [];
        updateKeywordDisplay();
        silasResponseContainer.innerHTML = '';
        silasStatus.textContent = 'Bereit zur Generierung.';
    });

    // --- HAUPTFUNKTION: TEXTGENERIERUNG STARTEN ---
    startGenerationBtn.addEventListener('click', async () => {
        if (keywordList.length === 0) {
            silasStatus.textContent = 'Bitte füge zuerst Keywords hinzu.';
            return;
        }

        startGenerationBtn.disabled = true;
        allGeneratedData = [];
        silasResponseContainer.innerHTML = '';
        const textIntent = textIntentSelect.value;

        for (let i = 0; i < keywordList.length; i++) {
            const keyword = keywordList[i];
            silasStatus.textContent = `Generiere Text für "${keyword}" (${i + 1}/${keywordList.length})...`;
            
            const userPrompt = createSilasPrompt(keyword, textIntent);

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userPrompt, keyword: keyword })
                });

                if (!response.ok) { throw new Error(`Server-Fehler: ${await response.text()}`); }

                const data = await response.json();
                allGeneratedData.push(data);
                displayResult(data, i);

            } catch (error) {
                console.error('Fehler bei der Textgenerierung:', error);
                const errorData = { keyword: keyword, error: error.message };
                allGeneratedData.push(errorData);
                displayResult(errorData, i);
            }
        }
        silasStatus.textContent = `Alle ${keywordList.length} Texte wurden generiert.`;
        startGenerationBtn.disabled = false;
    });

    // --- PROMPT ERSTELLUNG ---
    function createSilasPrompt(keyword, intent) {
        const jsonFormatInstructions = `
{
    "post_title": "SEO-optimierter Titel (50-60 Zeichen)",
    "post_name": "seo-freundlicher-url-slug",
    "meta_title": "Alternativer SEO-Titel (50-60 Zeichen)",
    "meta_description": "Fesselnde Meta-Beschreibung (150-160 Zeichen) mit CTA.",
    "h1": "Kraftvolle H1-Überschrift, die den Hauptnutzen kommuniziert.",
    "h2_1": "Erste H2-Überschrift (Problemorientiert)",
    "h2_2": "Zweite H2-Überschrift (Lösungsorientiert)",
    "h2_3": "Dritte H2-Überschrift (Feature-/Nutzen-orientiert)",
    "h2_4": "Vierte H2-Überschrift (Vertrauensbildend)",
    "primary_cta": "Ein kurzer, starker Call-to-Action Text (z.B. 'Jetzt anfragen').",
    "secondary_cta": "Ein alternativer, sanfterer Call-to-Action (z.B. 'Mehr erfahren').",
    "hero_text": "Ein fesselnder Einleitungstext für den Hero-Bereich (ca. 40-60 Wörter).",
    "hero_subtext": "Eine unterstützende Unterüberschrift für den Hero-Bereich (ca. 15-25 Wörter).",
    "benefits_list": "Eine HTML-Liste (<ul><li>...</li></ul>) mit 3-5 überzeugenden Vorteilen.",
    "features_list": "Eine HTML-Liste (<ul><li>...</li></ul>) mit 3-5 konkreten Merkmalen.",
    "social_proof": "Ein kurzer Satz, der soziale Bewährtheit andeutet (z.B. 'Von über 1.000 zufriedenen Kunden genutzt').",
    "testimonial_1": "Ein glaubwürdiges, fiktives Kunden-Testimonial (Name und Aussage).",
    "testimonial_2": "Ein zweites, andersartiges Kunden-Testimonial.",
    "pricing_title": "Eine Überschrift für den Preisbereich (z.B. 'Wählen Sie Ihren Plan').",
    "price_1": "Beschreibung für das erste Preispaket.",
    "price_2": "Beschreibung für das zweite Preispaket.",
    "price_3": "Beschreibung für das dritte Preispaket.",
    "faq_1": "Die erste häufig gestellte Frage.",
    "faq_answer_1": "Die Antwort auf die erste Frage.",
    "faq_2": "Die zweite häufig gestellte Frage.",
    "faq_answer_2": "Die Antwort auf die zweite Frage.",
    "faq_3": "Die dritte häufig gestellte Frage.",
    "faq_answer_3": "Die Antwort auf die dritte Frage.",
    "contact_info": "Eine kurze Kontaktinformation oder ein Hinweis (z.B. 'Fragen? Rufen Sie uns an: ...').",
    "footer_cta": "Ein letzter Call-to-Action für den Footer (z.B. 'Starten Sie noch heute Ihr Projekt').",
    "trust_signals": "Ein kurzer Text mit Vertrauenssignalen (z.B. 'Zertifiziert, Sicher, Garantiert').",
    "guarantee_text": "Ein Satz, der eine Garantie beschreibt (z.B. '30-Tage-Geld-zurück-Garantie')."
}`;

        let roleAndTask = '';
        if (intent === 'commercial') {
            roleAndTask = `Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet. Erstelle einen kommerziell ausgerichteten Text.`;
        } else {
            roleAndTask = `Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich. Erstelle einen informationsorientierten Text.`;
        }

        return `
# HAUPTAUFGABE
Erstelle den gesamten Textinhalt für eine professionelle Landingpage zum Thema "${keyword}". Konzentriere dich zu 100% auf das Thema.

# DEINE ROLLE
${roleAndTask}

# WICHTIGER HINWEIS ZUM AUSGABEFORMAT
Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }. Gib keine Markdown-Formatierung wie \`\`\`json aus.

# GEWÜNSCHTES JSON-FORMAT & ANWEISUNGEN
Das JSON-Objekt muss exakt die folgenden Schlüssel haben. Fülle jeden Schlüssel mit passendem, themenrelevantem Inhalt für "${keyword}", basierend auf den Anweisungen in diesem Schema:
${jsonFormatInstructions}
`;
    }

    // --- ANZEIGE & VORSCHAU ---
    function displayResult(data, index) {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        if (data.error) {
            resultCard.innerHTML = `<h3>${data.keyword}</h3><p class="error">Fehler: ${data.error}</p>`;
        } else {
            resultCard.innerHTML = `<h3>${data.keyword}</h3><p><strong>Titel:</strong> ${data.post_title || 'N/A'}</p><p><strong>Meta:</strong> ${data.meta_description || 'N/A'}</p><button class="preview-btn" data-index="${index}">Vorschau</button>`;
        }
        silasResponseContainer.appendChild(resultCard);
    }
    
    const openPreviewModal = () => previewModal.classList.add('visible');
    const closePreviewModal = () => previewModal.classList.remove('visible');
    closePreviewModalBtn.addEventListener('click', closePreviewModal);
    previewModal.addEventListener('click', (e) => { if (e.target === previewModal) closePreviewModal(); });

    silasResponseContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('preview-btn')) {
            const index = e.target.getAttribute('data-index');
            const data = allGeneratedData[index];
            let previewHtml = `<h1>${data.h1 || ''}</h1><p>${data.hero_text || ''}</p><h2>${data.h2_1 || ''}</h2><h2>${data.h2_2 || ''}</h2>`;
            previewContentArea.innerHTML = previewHtml;
            openPreviewModal();
        }
    });

    // --- CSV-DOWNLOAD ---
    downloadCsvButton.addEventListener('click', () => {
        if (allGeneratedData.length === 0) return;

        const headers = [
            "keyword", "post_title", "post_name", "meta_title", "meta_description", "h1",
            "h2_1", "h2_2", "h2_3", "h2_4", "primary_cta", "secondary_cta", "hero_text",
            "hero_subtext", "benefits_list", "features_list", "social_proof", "testimonial_1",
            "testimonial_2", "pricing_title", "price_1", "price_2", "price_3", "faq_1",
            "faq_answer_1", "faq_2", "faq_answer_2", "faq_3", "faq_answer_3", "contact_info",
            "footer_cta", "trust_signals", "guarantee_text"
        ];

        let csvContent = headers.join(",") + "\n";
        allGeneratedData.forEach(rowData => {
            if (rowData.error) return;
            const values = headers.map(header => `"${String(rowData[header] || '').replace(/"/g, '""')}"`);
            csvContent += values.join(",") + "\n";
        });
        
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "silas_generated_content.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
