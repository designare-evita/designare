/* generate-sitemap.js 
   Führt autom. Scans durch und generiert die sitemap.xml im public Ordner
*/

const fs = require('fs');
const path = require('path');

// 1. EINSTELLUNGEN
const BASE_URL = 'https://designare.at'; // Deine Domain

// WICHTIG: Speicherort in den 'public' Ordner ändern
const OUTPUT_FILE = path.join(__dirname, 'public', 'sitemap.xml');
const CSV_FILE = path.join(__dirname, 'content.csv');

// Seiten, die NICHT in die Sitemap sollen
const EXCLUDE_FILES = [
    '404.html',
    'google', 
    'side-menu.html',
    'header.html',
    'footer.html',
    'modals.html',
    'CSV-Creator.html',
    'CSV-Importer-PRO.html'
];

// Hilfsfunktion: Datum im Format YYYY-MM-DD
const getDate = () => new Date().toISOString().split('T')[0];

console.log('🤖 Starte Sitemap-Generierung...');

// 2. STATISCHE HTML-DATEIEN FINDEN
let urls = [];

// Wir lesen die Dateien weiterhin aus dem Hauptverzeichnis (__dirname)
const files = fs.readdirSync(__dirname);

files.forEach(file => {
    if (file.endsWith('.html') && !EXCLUDE_FILES.includes(file)) {
        // "index.html" wird zu "/"
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
    const rows = csvContent.split('\n').slice(1); // Header überspringen

    rows.forEach(row => {
        const columns = row.split(','); 
        
        if (columns.length > 1) {
            const slug = columns[0].trim();
            
            if (slug) {
                urls.push({
                    loc: `${BASE_URL}/artikel.html?topic=${encodeURIComponent(slug)}`,
                    lastmod: getDate(),
                    changefreq: 'monthly',
                    priority: '0.6'
                });
            }
        }
    });
    console.log(`✅ CSV verarbeitet. Total URLs: ${urls.length}`);
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
// Stellen sicher, dass der Ordner existiert (sollte er durch 'build' aber schon)
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, xmlContent);
console.log(`🎉 sitemap.xml erfolgreich erstellt unter: ${OUTPUT_FILE}`);
