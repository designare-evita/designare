import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const HTML_DIR = './'; 
const OUTPUT_FILE = './knowledge.json';
const EXCLUDE = ['404.html', 'impressum.html', 'datenschutz.html'];

async function generateKnowledge() {
    const files = fs.readdirSync(HTML_DIR).filter(file => 
        file.endsWith('.html') && !EXCLUDE.includes(file)
    );

    const knowledgeBase = [];

    for (const file of files) {
        const html = fs.readFileSync(path.join(HTML_DIR, file), 'utf8');
        const $ = cheerio.load(html);

        // Wir nutzen dein semantisches Markup: <article> oder <main>
        const content = $('article').text() || $('main').text();
        const title = $('h1').first().text() || $('title').text();

        if (content) {
            knowledgeBase.push({
                title: title.trim(),
                slug: file.replace('.html', ''),
                // Bereinigung für GEO: Kontext erhalten, Ballast entfernen
                text: content.replace(/\s+/g, ' ').trim().substring(0, 3000) 
            });
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledgeBase, null, 2));
    console.log(`✅ Wissensdatenbank mit ${knowledgeBase.length} Quellen erstellt.`);
}

generateKnowledge();
