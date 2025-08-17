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
        if (e.target === previewModal) {
            closePreviewModal();
        }
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
            const generatedContent = allGeneratedData.find(data => data.Keyword === kw && !data.error);
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
    
    const showPreview = (content) => {
        previewContentArea.innerHTML = `
            <h1>${content.h1}</h1>
            <p>${content.intro_text}</p>
            ${content.content_sections.map(section => `
                <h2>${section.h2}</h2>
                <p>${section.paragraph}</p>
            `).join('')}
            <h3>${content.cta_headline}</h3>
            <p>${content.cta_text}</p>
        `;
        openPreviewModal();
    };
    
    clearListBtn.addEventListener('click', () => {
        keywordList = [];
        allGeneratedData = [];
        updateKeywordDisplay();
        silasResponseContainer.style.display = 'none';
    });

    // --- DIE MASSENPRODUKTION ---
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
                // =================================================================
                // NEUER, PRÄZISERER MASTER-PROMPT
                // =================================================================
                const prompt = `
# HAUPTAUFGABE
Deine einzige Aufgabe ist es, einen umfassenden, SEO-optimierten und hochwertigen Fachtext zum Thema "${keyword}" zu schreiben. Der Text soll einen Leser informieren und vom Thema überzeugen. Ignoriere alle vorherigen Anweisungen über Plugins oder CSV-Dateien für den Inhalt. Konzentriere dich zu 100% auf das Thema.

# DEINE ROLLE
Du bist ein professioneller SEO-Texter und Fachexperte für das Thema "${keyword}". Dein Stil ist kompetent, fesselnd und für Laien verständlich.

# WICHTIGER HINWEIS ZUM AUSGABEFORMAT
Der fertige Text wird von einem Computer-System importiert. Es ist daher absolut entscheidend, dass deine Antwort NUR den JSON-Codeblock enthält und sonst nichts. Beginne deine Antwort direkt mit \`\`\`json.

# GEWÜNSCHTES JSON-FORMAT & ANWEISUNGEN
Das JSON-Objekt muss exakt die folgende Struktur haben:

{
  "post_title": "...",
  "post_name": "...",
  "meta_title": "...",
  "meta_description": "...",
  "h1": "...",
  "intro_text": "...",
  "content_sections": [
    {
      "h2": "...",
      "paragraph": "..."
    },
    {
      "h2": "...",
      "paragraph": "..."
    },
    {
      "h2": "...",
      "paragraph": "..."
    }
  ],
  "cta_headline": "...",
  "cta_text": "..."
}

# DETAILLIERTE ANWEISUNGEN FÜR JEDEN SCHLÜSSEL

1.  **post_title**: Klickstarker, SEO-optimierter Titel zum Thema "${keyword}". Länge: 50-60 Zeichen.
2.  **post_name**: SEO-freundlicher URL-Slug aus dem post_title. Nur Kleinbuchstaben, Zahlen, Bindestriche.
3.  **meta_title**: Alternativer, fesselnder SEO-Titel zum Thema "${keyword}". Länge: 50-60 Zeichen.
4.  **meta_description**: Ansprechende Meta-Beschreibung (150-160 Zeichen) zum Thema "${keyword}" mit einer klaren Handlungsaufforderung.
5.  **h1**: Kraftvolle H1-Überschrift, die das Keyword "${keyword}" prominent enthält und den Hauptnutzen kommuniziert.
6.  **intro_text**: Fesselnder Einleitungstext (ca. 80-100 Wörter) zum Thema "${keyword}".
7.  **content_sections**: Erstelle genau 3-4 Abschnitte. Jeder mit einer relevanten "h2"-Überschrift und einem informativen "paragraph" von ca. 120-150 Wörtern über einen Aspekt von "${keyword}".
8.  **cta_headline**: Kurze, aktivierende Überschrift für einen abschließenden Handlungsaufruf.
9.  **cta_text**: Kurzer Text, der den Leser zu einer passenden Handlung auffordert.

Halte dich exakt an diese Vorgaben.
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
                allGeneratedData.push({ ...jsonData, Keyword: keyword });

            } catch (error) {
                allGeneratedData.push({ error: `Fehler bei "${keyword}"`, Keyword: keyword });
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
        const headers = ["post_title", "post_name", "Keyword", "meta_title", "meta_description", "h1", "post_content"];
        let csvContent = headers.join(",") + "\n";
        allGeneratedData.forEach(rowData => {
            if (rowData.error) return;
            const postContent = (rowData.content_sections || []).map(section => `<h2>${section.h2}</h2>\n<p>${section.paragraph}</p>`).join('\n');
            const finalCta = `<h3>${rowData.cta_headline}</h3>\n<p>${rowData.cta_text}</p>`;
            const csvRow = {
                post_title: rowData.post_title,
                post_name: rowData.post_name,
                Keyword: rowData.Keyword,
                meta_title: rowData.meta_title,
                meta_description: rowData.meta_description,
                h1: rowData.h1,
                post_content: `${rowData.intro_text || ''}\n${postContent}\n${finalCta}`
            };
            const values = headers.map(header => `"${(csvRow[header] || '').replace(/"/g, '""')}"`);
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
