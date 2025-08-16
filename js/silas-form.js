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

        // Platzhalter für den KI-Aufruf - hier werden aktuell Beispieldaten generiert
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simuliert eine Netzwerkverzögerung

        // Beispieldaten-Generierung
        generatedData = []; // Alte Daten löschen
        for (let i = 1; i <= 5; i++) {
            const post_title = `${keyword} - Ein umfassender Leitfaden ${i}`;
            const post_name = `${keyword.toLowerCase().replace(/\s+/g, '-')}-leitfaden-${i}`;
            const meta_title = `Der ultimative Guide zu ${keyword} ${i}`;
            const meta_description = `Alles, was Sie über ${keyword} wissen müssen. Tipps, Tricks und Ratschläge.`;
            generatedData.push({ post_title, post_name, Keyword: keyword, meta_title, meta_description });
        }

        silasStatus.innerText = "";
        silasStatus.classList.remove('thinking');

        // Generierte Daten anzeigen
        silasResponseContent.innerHTML = `
            <p><strong>Post Title:</strong> ${generatedData[0].post_title}</p>
            <p><strong>Post Name:</strong> ${generatedData[0].post_name}</p>
            <p><strong>Keyword:</strong> ${generatedData[0].Keyword}</p>
            <p><strong>Meta Title:</strong> ${generatedData[0].meta_title}</p>
            <p><strong>Meta Description:</strong> ${generatedData[0].meta_description}</p>
            <p>... und 4 weitere Einträge.</p>
        `;
        silasResponseContainer.style.display = 'block';
    });

    downloadCsvButton.addEventListener('click', () => {
        if (generatedData.length === 0) {
            alert("Zuerst Content generieren!");
            return;
        }

        const headers = ["post_title", "post_name", "Keyword", "meta_title", "meta_description"];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

        generatedData.forEach(row => {
            const values = headers.map(header => `"${row[header].replace(/"/g, '""')}"`);
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
