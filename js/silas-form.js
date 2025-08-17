// js/silas-form.js

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) return;

    // Alle DOM-Elemente holen
    const keywordInput = document.getElementById('silas-keyword-input');
    const keywordDisplayList = document.getElementById('keyword-display-list');
    const startGenerationBtn = document.getElementById('start-generation-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    const silasStatus = document.getElementById('silas-status');
    const silasResponseContainer = document.getElementById('silas-response-container');
    const silasResponseContent = document.getElementById('silas-response-content');
    const downloadCsvButton = document.getElementById('download-csv');
    const previewModal = document.getElementById('silas-preview-modal');
    const closePreviewModalBtn = document.getElementById('close-preview-modal');
    const previewContentArea = document.getElementById('preview-content-area');

    let keywordList = [];
    let allGeneratedData = [];

    // --- VORSCHAU-FUNKTIONEN ---
    const openPreviewModal = () => previewModal.classList.add('visible');
    const closePreviewModal = () => previewModal.classList.remove('visible');

    closePreviewModalBtn.addEventListener('click', closePreviewModal);
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) closePreviewModal();
    });

    // --- LOGIK ZUM HINZUFÜGEN, ANZEIGEN UND LÖSCHEN VON KEYWORDS ---
    silasForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const keyword = keywordInput.value.trim();
        if (keyword && !keywordList.includes(keyword)) {
            keywordList.push(keyword);
            updateKeywordDisplay();
        }
        keywordInput.value = '';
        keywordInput.focus();
    });

    const updateKeywordDisplay = () => {
        keywordDisplayList.innerHTML = '';
        keywordList.forEach((kw) => {
            const li = document.createElement('li');
            const keywordText = document.createElement('span');
            keywordText.textContent = kw;
            li.appendChild(keywordText);
            
            // FINALE KORREKTUR: Vergleich auf Kleinschreibung umgestellt
            const generatedContent = allGeneratedData.find(data => 
                data.keyword && 
                data.keyword.trim().toLowerCase() === kw.trim().toLowerCase() && 
                !data.error
            );
            
            if (generatedContent) {
                const previewBtn = document.createElement('button');
                previewBtn.textContent = 'Vorschau';
                previewBtn.className = 'preview-button';
                previewBtn.onclick = () => showPreview(generatedContent);
                li.appendChild(previewBtn);
            }
            keywordDisplayList.appendChild(li);
        });
    };
    
    // --- FUNKTION: Vollständige Vorschau im Modal ---
    const showPreview = (content) => {
        previewContentArea.innerHTML = `
            <h1>${content.h1}</h1>
            <p><em>${content.hero_subtext}</em></p>
            <p>${content.hero_text}</p>
            <h2>${content.h2_1}</h2>
            <h3>Vorteile</h3>
            ${content.benefits_list}
            <h3>Merkmale</h3>
            ${content.features_list}
            <h2>${content.h2_2}</h2>
            <p>${content.social_proof}</p>
            <blockquote>"${content.testimonial_1}"</blockquote>
            <blockquote>"${content.testimonial_2}"</blockquote>
            <h2>${content.h2_3}</h2>
            <h3>${content.pricing_title}</h3>
            <ul>
                <li>${content.price_1}</li>
                <li>${content.price_2}</li>
                <li>${content.price_3}</li>
            </ul>
            <h2>${content.h2_4}</h2>
            <h3>Häufig gestellte Fragen (FAQ)</h3>
            <h4>${content.faq_1}</h4>
            <p>${content.faq_answer_1}</p>
            <h4>${content.faq_2}</h4>
            <p>${content.faq_answer_2}</p>
            <h4>${content.faq_3}</h4>
            <p>${content.faq_answer_3}</p>
            <hr>
            <p><strong>Kontakt:</strong> ${content.contact_info}</p>
            <p><strong>Garantie:</strong> ${content.guarantee_text}</p>
            <p><strong>Vertrauen:</strong> ${content.trust_signals}</p>
            <h3>${content.footer_cta}</h3>
        `;
        openPreviewModal();
    };
    
    clearListBtn.addEventListener('click', () => {
        keywordList = [];
        allGeneratedData = [];
        updateKeywordDisplay();
        silasResponseContainer.style.display = 'none';
    });

    // --- DIE MASSENPRODUKTION (unverändert) ---
    startGenerationBtn.addEventListener('click', async () => {
        if (keywordList.length === 0) {
            alert('Bitte füge zuerst mindestens ein Keyword zur Liste hinzu.');
            return;
        }

        silasStatus.innerText = "Starte die Massenproduktion...";
        silasStatus.classList.add('thinking');
        silasResponseContainer.style.display = 'none';
        startGenerationBtn.disabled = true;
        clearListBtn.disabled = true;
        allGeneratedData = [];

        for (let i = 0; i < keywordList.length; i++) {
            const keyword = keywordList[i];
            silasStatus.innerText = `[${i + 1}/${keywordList.length}] Generiere Content für: "${keyword}"...`;

            try {
                const prompt = `
# HAUPTAUFGABE
Erstelle den gesamten Textinhalt für eine professionelle Landingpage zum Thema "${keyword}". Konzentriere dich zu 100% auf das Thema.

# DEINE ROLLE
Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet.

# WICHTIGER HINWEIS ZUM AUSGABEFORMAT
Deine Antwort MUSS ein einziges, valides JSON-Objekt sein, eingeschlossen in einen Markdown-Codeblock (\`\`\`json ... \`\`\`). Beginne direkt mit \`\`\`json.

# GEWÜNSCHTES JSON-FORMAT & ANWEISUNGEN
Das JSON-Objekt muss exakt die folgenden 33 Schlüssel haben. Fülle jeden Schlüssel mit passendem, themenrelevantem Inhalt für "${keyword}".

{
  "keyword": "${keyword}",
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
}
`;

                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt, source: 'silas' })
                });

                if (!response.ok) throw new Error(`API-Fehler`);
                const resultText = await response.text();
                const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/);
                if (!jsonMatch || !jsonMatch[1]) throw new Error(`Ungültige JSON-Antwort`);
                const jsonData = JSON.parse(jsonMatch[1]);
                allGeneratedData.push(jsonData);

            } catch (error) {
                allGeneratedData.push({ error: `Fehler bei "${keyword}"`, keyword: keyword });
                continue;
            }
        }

        silasStatus.innerText = "";
        silasStatus.classList.remove('thinking');
        startGenerationBtn.disabled = false;
        clearListBtn.disabled = false;
        const successCount = allGeneratedData.filter(d => !d.error).length;
        silasResponseContent.innerHTML = `<p><strong>${successCount} von ${keywordList.length} Contentthemen erfolgreich erstellt!</strong></p>`;
        silasResponseContainer.style.display = 'block';
        updateKeywordDisplay(); 
    });

    // --- CSV-DOWNLOAD (unverändert) ---
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
            const values = headers.map(header => {
                const value = rowData[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += values.join(",") + "\n";
        });
        
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `landingpages_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
