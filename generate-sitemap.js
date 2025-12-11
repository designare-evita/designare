/* generate-sitemap.js 
   Generiert die sitemap.xml im public Ordner
   NUR echte, statische HTML-Dateien werden aufgenommen
   content.csv wird IGNORIERT (enthält nur Silas-Vorschau/Testdaten)
*/

const fs = require('fs');
const path = require('path');

// 1. EINSTELLUNGEN
const BASE_URL = 'https://designare.at'; 
const OUTPUT_FILE = path.join(__dirname, 'public', 'sitemap.xml');

// Seiten, die NICHT in die Sitemap sollen
const EXCLUDE_FILES = [
    '404.html', 
    'google', 
    'side-menu.html', 
    'header.html', 
    'footer.html', 
    'modals.html', 
    'CSV-Creator.html', 
    'CSV-Importer-PRO.html', 
    'silas.html', 
    'impressum.html', 
    'datenschutz.html', 
    'disclaimer.html'
];

const getDate = () => new Date().toISOString().split('T')[0];

console.log('🤖 Starte Sitemap-Generierung...');

// 2. NUR STATISCHE HTML-DATEIEN FINDEN
let urls = [];
const files = fs.readdirSync(__dirname);

files.forEach(file => {
    if (file.endsWith('.html') && !EXCLUDE_FILES.includes(file)) {
        // Clean URL ohne .html (dank vercel.json cleanUrls: true)
        let urlPath = file === 'index.html' ? '' : file.replace(/\.html$/, '');
        urls.push({
            loc: `${BASE_URL}/${urlPath}`,
            lastmod: getDate(),
            changefreq: 'weekly',
            priority: file === 'index.html' ? '1.0' : '0.8'
        });
    }
});

console.log(`✅ ${urls.length} statische Seiten gefunden.`);

// 3. XML ZUSAMMENBAUEN
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// 4. DATEI SCHREIBEN
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, xmlContent);
console.log(`🎉 sitemap.xml erfolgreich erstellt unter: ${OUTPUT_FILE}`);
console.log(`📊 Enthält ${urls.length} URLs`);
