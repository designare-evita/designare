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
                // --- VOLLSTÄNDIGER MASTER-PROMPT ---
                const prompt = `
# DEINE ROLLE
Du bist ein weltweit führender Experte für SEO-Content-Strategie und Texterstellung. Deine Aufgabe ist es, den gesamten Inhalt für eine professionelle, SEO-optimierte und überzeugende Landingpage zu erstellen, die für ein WordPress-Plugin über einen CSV-Import verwendet wird.

# ZIEL
Erstelle einen vollständigen Text von ca. 500-600 Wörtern zum Thema "${keyword}". Das Ergebnis muss ein einziges, valides JSON-Objekt sein, das in einen Markdown-Codeblock (\`\`\`json ... \`\`\`) eingeschlossen ist.

# GEWÜNSCHTES JSON-FORMAT & ANWEISUNGEN
Das JSON-Objekt muss exakt die folgende Struktur und die folgenden Schlüssel haben:

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

1.  **post_title**: Erstelle einen klickstarken, SEO-optimierten Titel. Er muss das Keyword "${keyword}" enthalten. Länge: 50-60 Zeichen.
2.  **post_name**: Erstelle daraus einen SEO-freundlichen URL-Slug. Nur Kleinbuchstaben, Zahlen und Bindestriche. Keine Umlaute oder Sonderzeichen.
3.  **meta_title**: Erstelle einen alternativen, ebenfalls fesselnden SEO-Titel, der das Keyword "${keyword}" enthält. Länge: 50-60 Zeichen.
4.  **meta_description**: Schreibe eine ansprechende Meta-Beschreibung, die neugierig macht und zum Klicken anregt. Sie muss das Keyword "${keyword}" enthalten und eine klare Handlungsaufforderung (Call-to-Action) beinhalten. Länge: 150-160 Zeichen.
5.  **h1**: Formuliere eine kraftvolle H1-Überschrift. Sie muss das Keyword "${keyword}" prominent enthalten und den Hauptnutzen für den Leser kommunizieren.
6.  **intro_text**: Schreibe einen fesselnden Einleitungstext (ca. 80-100 Wörter). Beginne mit einem Haken, der das Hauptproblem des Lesers anspricht, und stelle eine Lösung in Aussicht. Das Keyword "${keyword}" muss in den ersten 50 Wörtern vorkommen.
7.  **content_sections**: Erstelle genau 3-4 Abschnitte. Jeder Abschnitt muss ein Objekt mit einem "h2"-Schlüssel und einem "paragraph"-Schlüssel sein.
    * **h2**: Eine relevante, interessante Zwischenüberschrift, die einen Aspekt des Themas "${keyword}" behandelt.
    * **paragraph**: Ein informativer und gut lesbarer Textblock von ca. 120-150 Wörtern. Bringe hier dein Expertenwissen ein, gib Tipps, erkläre Zusammenhänge oder präsentiere Lösungen.
8.  **cta_headline**: Eine kurze, aktivierende Überschrift für den abschließenden Call-to-Action-Block.
9.  **cta_text**: Ein kurzer Text, der den Leser zu einer Handlung auffordert (z.B. "Kontakt aufnehmen", "Mehr erfahren").

# QUALITÄTSANFORDERUNGEN
- **Stil**: Professionell, kompetent und überzeugend.
- **Einzigartigkeit**: Der gesamte Inhalt muss zu 100% einzigartig sein.
- **SEO**: Baue semantisch verwandte Begriffe und LSI-Keywords zum Thema "${keyword}" natürlich in den Text ein.
- **Lesbarkeit**: Verwende kurze Sätze, aktive Sprache und vermeide Füllwörter.

Führe diese Anweisungen exakt aus.
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

    // --- FUNKTION 5: CSV-Download ---
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
