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

    // Speicher für unsere Keywords und Ergebnisse
    let keywordList = [];
    let allGeneratedData = [];

    // --- FUNKTION 1: Keyword zur Liste hinzufügen ---
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

    // --- FUNKTION 2: Die Keyword-Anzeige aktualisieren ---
    const updateKeywordDisplay = () => {
        keywordDisplayList.innerHTML = '';
        keywordList.forEach(kw => {
            const li = document.createElement('li');
            li.textContent = kw;
            keywordDisplayList.appendChild(li);
        });
    };
    
    // --- FUNKTION 3: Liste leeren ---
    clearListBtn.addEventListener('click', () => {
        keywordList = [];
        updateKeywordDisplay();
        silasResponseContainer.style.display = 'none'; // Ergebnis-Box ausblenden
    });

    // --- FUNKTION 4: Die große Massenproduktion starten ---
    startGenerationBtn.addEventListener('click', async () => {
        if (keywordList.length === 0) {
            alert('Bitte füge zuerst mindestens ein Keyword zur Liste hinzu.');
            return;
        }

        // UI für den Ladezustand vorbereiten
        silasStatus.innerText = "Starte die Massenproduktion...";
        silasStatus.classList.add('thinking');
        silasResponseContainer.style.display = 'none';
        startGenerationBtn.disabled = true;
        clearListBtn.disabled = true;
        allGeneratedData = [];

        // Schleife, die für jedes Keyword eine Landingpage generiert
        for (let i = 0; i < keywordList.length; i++) {
            const keyword = keywordList[i];
            silasStatus.innerText = `[${i + 1}/${keywordList.length}] Generiere Landingpage für: "${keyword}"...`;

            try {
                const prompt = `
# DEINE ROLLE
Du bist ein weltweit führender Experte für SEO-Content-Strategie und Texterstellung...
// ... (der gesamte, lange Master-Prompt kommt hier rein) ...
# ZIEL
Erstelle einen vollständigen Text von ca. 500-600 Wörtern zum Thema "${keyword}".
// ... (der Rest des Prompts bleibt ebenfalls unverändert) ...
                `;

                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt, source: 'silas' })
                });

                if (!response.ok) throw new Error(`Fehler bei Keyword "${keyword}"`);

                const resultText = await response.text();
                const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/);
                if (!jsonMatch || !jsonMatch[1]) throw new Error(`Ungültige Antwort für "${keyword}"`);
                
                const jsonData = JSON.parse(jsonMatch[1]);
                allGeneratedData.push({ ...jsonData, Keyword: keyword });

            } catch (error) {
                console.error(error);
                allGeneratedData.push({ error: `Fehler bei der Generierung für "${keyword}"` });
                continue;
            }
        }

        // UI nach Abschluss aktualisieren
        silasStatus.innerText = "";
        silasStatus.classList.remove('thinking');
        startGenerationBtn.disabled = false;
        clearListBtn.disabled = false;
        
        const successCount = allGeneratedData.filter(d => !d.error).length;
        silasResponseContent.innerHTML = `<p><strong>${successCount} von ${keywordList.length} Landingpages erfolgreich erstellt!</strong></p>`;
        silasResponseContainer.style.display = 'block';
    });

    // --- FUNKTION 5: CSV-Download (unverändert) ---
    downloadCsvButton.addEventListener('click', () => {
        // ... (Die Logik für den CSV-Download von der vorherigen Nachricht bleibt hier exakt gleich) ...
        if (allGeneratedData.length === 0) {
            alert("Bitte zuerst Content generieren!");
            return;
        }

        const headers = [
            "post_title", "post_name", "Keyword", "meta_title", "meta_description",
            "h1", "post_content"
        ];
        
        let csvContent = headers.join(",") + "\n";

        allGeneratedData.forEach(rowData => {
            if (rowData.error) return;

            const postContent = (rowData.content_sections || [])
                .map(section => `<h2>${section.h2}</h2>\n<p>${section.paragraph}</p>`)
                .join('\n');
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
