// js/silas-form.js

export function initSilasForm() {
    const silasForm = document.getElementById('silas-form');
    if (!silasForm) return;

    const silasKeywordInput = document.getElementById('silas-keyword');
    const silasStatus = document.getElementById('silas-status');
    const silasResponseContainer = document.getElementById('silas-response-container');
    const silasResponseContent = document.getElementById('silas-response-content');
    const downloadCsvButton = document.getElementById('download-csv');
    let generatedData = [];

    silasForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keyword = silasKeywordInput.value.trim();
        if (!keyword) return;

        silasStatus.innerText = "Silas denkt nach...";
        silasStatus.classList.add('thinking');
        silasResponseContainer.style.display = 'none';
        generatedData = [];

        try {
            // Dies ist der "Trainings-Prompt" speziell für Silas' Aufgabe
            const prompt = `
                Erstelle 5 einzigartige SEO-Texte für das Keyword "${keyword}".
                Die Ausgabe muss ein valides JSON-Array von Objekten sein, eingeschlossen in einen Markdown-Codeblock (```json ... ```).
                Jedes Objekt muss exakt diese vier Schlüssel haben: "post_title", "post_name", "meta_title", "meta_description".
                
                - post_title: Ein klickstarker, SEO-optimierter Titel (ca. 50-60 Zeichen).
                - post_name: Eine SEO-freundliche URL-Slug basierend auf dem post_title (nur Kleinbuchstaben, Zahlen, Bindestriche).
                - meta_title: Ein alternativer, ebenfalls SEO-optimierter Titel für Metadaten (ca. 50-60 Zeichen).
                - meta_description: Eine ansprechende Meta-Beschreibung (ca. 150-160 Zeichen), die zum Klicken anregt.
            `;

            // Sende den Prompt an die zentrale API mit der Kennung "silas"
            const response = await fetch('/api/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    source: 'silas' // Dies sagt der API, welche Logik sie verwenden soll
                }),
            });

            if (!response.ok) {
                throw new Error(`API-Fehler: ${response.statusText}`);
            }

            const resultText = await response.text();
            
            // Extrahiert zuverlässig das JSON aus dem Markdown-Block
            const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch || !jsonMatch[1]) {
                throw new Error("Kein valides JSON im KI-Response gefunden.");
            }
            
            const jsonData = JSON.parse(jsonMatch[1]);

            // Fügt das ursprüngliche Keyword zu jedem Ergebnis hinzu
            generatedData = jsonData.map(item => ({ ...item, Keyword: keyword }));

        } catch (error) {
            console.error('Fehler beim Abrufen der KI-Daten:', error);
            silasStatus.innerText = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
            return; // Beendet die Funktion bei einem Fehler
        } finally {
            silasStatus.innerText = "";
            silasStatus.classList.remove('thinking');
        }

        // Zeigt eine Vorschau der generierten Daten an
        if (generatedData.length > 0) {
            silasResponseContent.innerHTML = `
                <p><strong>Post Title:</strong> ${generatedData[0].post_title}</p>
                <p><strong>Post Name:</strong> ${generatedData[0].post_name}</p>
                <p><strong>Keyword:</strong> ${generatedData[0].Keyword}</p>
                <p><strong>Meta Title:</strong> ${generatedData[0].meta_title}</p>
                <p><strong>Meta Description:</strong> ${generatedData[0].meta_description}</p>
                <p>... und ${generatedData.length - 1} weitere Einträge erfolgreich erstellt.</p>
            `;
            silasResponseContainer.style.display = 'block';
        } else {
            silasStatus.innerText = "Die KI konnte leider keine passenden Daten generieren.";
        }
    });

    // Event-Listener für den CSV-Download-Button
    downloadCsvButton.addEventListener('click', () => {
        if (generatedData.length === 0) {
            alert("Bitte zuerst Content generieren!");
            return;
        }

        const headers = ["post_title", "post_name", "Keyword", "meta_title", "meta_description"];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

        generatedData.forEach(row => {
            const values = headers.map(header => `"${(row[header] || '').replace(/"/g, '""')}"`);
            csvContent += values.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "seo_content.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
