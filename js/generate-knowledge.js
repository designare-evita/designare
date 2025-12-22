import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const HTML_DIR = './'; // Dein Root-Verzeichnis
const OUTPUT_FILE = './knowledge.json';

// Liste der Dateien, die Evita ignorieren soll
const EXCLUDE_FILES = ['404.html', 'impressum.html', 'datenschutz.html'];

async function generateKnowledge() {
    const files = fs.readdirSync(HTML_DIR).filter(file => 
        file.endsWith('.html') && !EXCLUDE_FILES.includes(file)
    );

    const knowledgeBase = [];

    for (const file of files) {
        const filePath = path.join(HTML_DIR, file);
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);

        // Wir extrahieren nur den Text aus dem <article> oder <main> Tag
        // So ignorieren wir Header, Footer und Navigation
        const content = $('article').text() || $('main').text();
        const title = $('title').text();
        const slug = file.replace('.html', '');

        if (content) {
            knowledgeBase.push({
                title: title.trim(),
                slug: slug,
                // Wir bereinigen den Text von überflüssigen Whitespaces
                text: content.replace(/\s+/g, ' ').trim()
            });
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledgeBase, null, 2));
    console.log(`✅ Wissensdatenbank mit ${knowledgeBase.length} Einträgen erstellt.`);
}

generateKnowledge();
