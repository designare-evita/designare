/* generate-sitemap.js 
   Führt autom. Scans durch und generiert die sitemap.xml im public Ordner
   INKLUSIVE: Schutz vor kaputten CSV-Zeilen (HTML-Code)
*/

const fs = require('fs');
const path = require('path');

// 1. EINSTELLUNGEN
const BASE_URL = 'https://designare.at'; 
const OUTPUT_FILE = path.join(__dirname, 'public', 'sitemap.xml');
const CSV_FILE = path.join(__dirname, 'content.csv');

// Seiten, die NICHT in die Sitemap sollen
const EXCLUDE_FILES = [
    '404.html', 'google', 'side-menu.html', 'header.html', 'footer.html', 'modals.html', 
    'CSV-Creator.html', 'CSV-Importer-PRO.html', 'silas.html', 'impressum.html', 'datenschutz.html', 'disclaimer.html'
];

const getDate = () => new Date().toISOString().split('T')[0];

console.log('🤖 Starte Sitemap-Generierung...');

// 2. STATISCHE HTML-DATEIEN FINDEN
let urls = [];
const files = fs.readdirSync(__dirname);

files.forEach(file => {
    if (file.endsWith('.html') && !EXCLUDE_FILES.includes(file)) {
        let urlPath = file === 'index.html' ? '' : file;
        urls.push({
            loc: `${BASE_URL}/${urlPath}`,
            lastmod: getDate(),
            changefreq: 'weekly',
            priority: file === 'index.html' ? '1.0' : '0.8'
        });
    }
});

console.log(`✅ ${urls.length} statische Seiten gefunden.`);

// 3. DYNAMISCHE INHALTE AUS CSV LESEN
if (fs.existsSync(CSV_FILE)) {
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const rows = csvContent.split('\n').slice(1); 

    let skippedCount = 0;

    rows.forEach((row, index) => {
        // Versuche Komma oder Semikolon als Trenner
        const delimiter = row.includes(';') ? ';' : ',';
        const columns = row.split(delimiter); 
        
        if (columns.length > 0) {
            // Wir nehmen an, der Slug steht in Spalte 1 (Index 0). 
            // Falls er woanders steht, ändere die 0 hier:
            const rawSlug = columns[0].trim(); 

            // --- SICHERHEITS-CHECK ---
            // Wenn der Slug wie HTML aussieht (<...) oder zu lang ist (>100 Zeichen), überspringen wir ihn.
            if (rawSlug.includes('<') || rawSlug.length > 100 || rawSlug.includes('>')) {
                skippedCount++;
                // Nur die ersten paar Fehler ausgeben, um die Konsole nicht zu fluten
                if (skippedCount <= 3) console.log(`⚠️ Überspringe Zeile ${index + 2}: Sieht nach HTML/Text aus ("${rawSlug.substring(0, 30)}...")`);
                return; 
            }
            
            if (rawSlug) {
                urls.push({
                    loc: `${BASE_URL}/artikel.html?topic=${encodeURIComponent(rawSlug)}`,
                    lastmod: getDate(),
                    changefreq: 'monthly',
                    priority: '0.6'
                });
            }
        }
    });
    console.log(`✅ CSV verarbeitet. URLs: ${urls.length} (Übersprungen: ${skippedCount} fehlerhafte Zeilen)`);
}

// 4. XML ZUSAMMENBAUEN
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// 5. DATEI SCHREIBEN
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, xmlContent);
console.log(`🎉 sitemap.xml erfolgreich erstellt unter: ${OUTPUT_FILE}`);
