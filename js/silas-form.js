// js/silas-form.js

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) return;

    // Wir holen uns die neuen Elemente
    const silasKeywordTextarea = document.getElementById('silas-keyword-list');
    const silasStatus = document.getElementById('silas-status');
    const silasResponseContainer = document.getElementById('silas-response-container');
    const silasResponseContent = document.getElementById('silas-response-content');
    const downloadCsvButton = document.getElementById('download-csv');
    const submitButton = silasForm.querySelector('button');
    let allGeneratedData = []; // Hier sammeln wir alle Ergebnisse

    silasForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keywords = silasKeywordTextarea.value.split('\n').map(kw => kw.trim()).filter(kw => kw);
        if (keywords.length === 0) return;

        // UI für den Ladezustand vorbereiten
        silasStatus.innerText = "Starte die Massenproduktion...";
        silasStatus.classList.add('thinking');
        silasResponseContainer.style.display = 'none';
        submitButton.disabled = true;
        silasKeywordTextarea.disabled = true;
        allGeneratedData = [];

        // Schleife, die für jedes Keyword eine Landingpage generiert
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            silasStatus.innerText = `[${i + 1}/${keywords.length}] Generiere Landingpage für: "${keyword}"...`;

            try {
                // Der "Master-Prompt" bleibt derselbe, nur das Keyword wird dynamisch eingesetzt
                const prompt = `
# DEINE ROLLE
Du bist ein weltweit führender Experte für SEO-Content-Strategie...
// ... (der gesamte, lange Master-Prompt von der vorherigen Nachricht kommt hier rein) ...
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
                
                // Füge das Keyword zum Ergebnis hinzu und speichere es
                allGeneratedData.push({ ...jsonData, Keyword: keyword });

            } catch (error) {
                console.error(error);
                // Wenn ein Fehler auftritt, fügen wir eine leere Zeile hinzu, damit der Prozess weiterläuft
                allGeneratedData.push({ error: `Fehler bei der Generierung für "${keyword}"` });
                continue; // Mache mit dem nächsten Keyword weiter
            }
        }

        // UI nach Abschluss aktualisieren
        silasStatus.innerText = "";
        silasStatus.classList.remove('thinking');
        submitButton.disabled = false;
        silasKeywordTextarea.disabled = false;
        
        const successCount = allGeneratedData.filter(d => !d.error).length;
        silasResponseContent.innerHTML = `
            <p><strong>${successCount} von ${keywords.length} Landingpages erfolgreich erstellt!</strong></p>
            <p>Die CSV-Datei mit allen Inhalten steht jetzt zum Download bereit.</p>
        `;
        silasResponseContainer.style.display = 'block';
    });

    downloadCsvButton.addEventListener('click', () => {
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
            // Überspringe Zeilen, bei denen ein Fehler aufgetreten ist
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
