/* generate-sitemap.js 
   Generiert sitemap.xml UND sitemap.html im public Ordner
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname Workaround für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. EINSTELLUNGEN
const BASE_URL = 'https://designare.at'; 
const OUTPUT_XML = path.join(__dirname, 'public', 'sitemap.xml');
const OUTPUT_HTML = path.join(__dirname, 'public', 'sitemap.html');

// Seiten, die NICHT in die Sitemap sollen
const EXCLUDE_FILES = [
    '404.html', 
    'google', 
    'side-menu.html', 
    'header.html', 
    'footer.html', 
    'modals.html', 
    'CSV-Creator.html', 
    'blog-feedback.html',
    'sitemap.html' // Sich selbst ausschließen
];

const getDate = () => new Date().toISOString().split('T')[0];

// Hilfsfunktion: Macht aus "semantisches-markup.html" -> "Semantisches Markup"
function formatTitle(filename) {
    if (filename === 'index.html') return 'Startseite';
    let name = filename.replace(/\.html$/, '');
    // Bindestriche zu Leerzeichen
    name = name.replace(/-/g, ' ');
    // Erster Buchstabe groß
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
}

console.log('🤖 Starte Sitemap-Generierung (XML + HTML)...');

try {
    const files = fs.readdirSync(__dirname);
    let urls = [];

    files.forEach(file => {
        if (file.endsWith('.html') && !EXCLUDE_FILES.includes(file)) {
            // Clean URL ohne .html
            let urlPath = file === 'index.html' ? '' : file.replace(/\.html$/, '');
            
            urls.push({
                file: file, // Original Dateiname für Links in HTML Sitemap (wenn kein Clean URL Server)
                path: urlPath,
                loc: `${BASE_URL}/${urlPath}`,
                title: formatTitle(file),
                lastmod: getDate(),
                changefreq: 'weekly',
                priority: file === 'index.html' ? '1.0' : '0.8'
            });
        }
    });

    console.log(`✅ ${urls.length} Seiten gefunden.`);

    // --- TEIL A: XML GENERIEREN ---
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // --- TEIL B: HTML GENERIEREN ---
    // Wir bauen eine simple, aber gestylte HTML Seite
    // Hinweis: Die CSS Pfade müssen stimmen (relativ zu public/)
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemap | Designare.at</title>
    <meta name="description" content="Übersicht aller Seiten auf Designare.at">
    <meta name="robots" content="noindex, follow"> <link rel="icon" href="images/favicon.webp" type="image/webp">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/header-footer.css">
    <link rel="stylesheet" href="css/ai-styles.css">

    <style>
        .sitemap-main {
            max-width: 800px;
            margin: 120px auto 60px; /* Platz für Header lassen */
            padding: 20px;
            min-height: 60vh;
        }
        .sitemap-list {
            list-style: none;
            padding: 0;
            display: grid;
            gap: 15px;
        }
        .sitemap-list li {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .sitemap-list li:hover {
            transform: translateX(10px);
            border-color: var(--ai-accent, #00d2ff);
        }
        .sitemap-list a {
            display: block;
            padding: 15px 20px;
            text-decoration: none;
            color: #fff;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .sitemap-list a i {
            color: var(--ai-accent, #00d2ff);
            font-size: 0.9em;
        }
        h1 { margin-bottom: 40px; text-align: center; }
    </style>
</head>
<body class="dark-mode">

    <div id="header-placeholder"></div>

    <main class="sitemap-main">
        <h1><i class="fa-solid fa-sitemap"></i> Inhaltsverzeichnis</h1>
        
        <nav aria-label="Sitemap">
            <ul class="sitemap-list">
                ${urls.map(u => `
                <li>
                    <a href="${u.path || 'index.html'}">
                        <i class="fa-regular fa-file-lines"></i>
                        <span>${u.title}</span>
                    </a>
                </li>`).join('')}
            </ul>
        </nav>
    </main>

    <div id="footer-placeholder"></div>
    
    <script type="module" src="js/main.js"></script>
</body>
</html>`;

    // 4. DATEIEN SCHREIBEN
    if (!fs.existsSync(path.dirname(OUTPUT_XML))) {
        fs.mkdirSync(path.dirname(OUTPUT_XML), { recursive: true });
    }

    fs.writeFileSync(OUTPUT_XML, xmlContent);
    fs.writeFileSync(OUTPUT_HTML, htmlContent);

    console.log(`🎉 sitemap.xml UND sitemap.html erfolgreich erstellt!`);
    console.log(`📊 ${urls.length} Links verarbeitet.`);

} catch (error) {
    console.error("❌ Fehler bei der Sitemap-Generierung:", error);
    process.exit(1);
}
