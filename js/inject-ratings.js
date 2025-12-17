#!/usr/bin/env node
// scripts/inject-ratings.js
// Injiziert AggregateRating in alle HTML-Dateien vor dem Build/Deploy
//
// Verwendung:
//   node scripts/inject-ratings.js
//   oder automatisch via "prebuild" in package.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname Workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// === KONFIGURATION ===
const CONFIG = {
    // Deine Produktions-URL für API-Calls
    apiBaseUrl: process.env.API_BASE_URL || 'https://designare.at',
    
    // Verzeichnis mit HTML-Dateien (Projekt-Root)
    htmlDir: ROOT_DIR,
    
    // Blog-Artikel mit Feedback-Widget
    // WICHTIG: Hier alle Artikel eintragen die das Feedback-Widget haben!
    includeFiles: [
        'semantisches-markup.html',
        // Weitere Blog-Artikel hier hinzufügen:
        // 'weiterer-artikel.html',
        // 'noch-ein-artikel.html',
    ],
    
    // Dateien die NIE verarbeitet werden sollen
    excludeFiles: [
        'index.html',
        'header.html',
        'footer.html',
        'modals.html',
        'side-menu.html',
        'blog-feedback.html',
        '404.html'
    ]
};

// === HELPER FUNKTIONEN ===

// Slug aus Dateiname generieren (identisch zum Frontend)
function getSlugFromFilename(filename) {
    return filename
        .replace(/\.html?$/, '')
        .replace(/\//g, '-')
        || 'home';
}

// Rating von der API holen
async function fetchRating(slug) {
    const url = `${CONFIG.apiBaseUrl}/api/schema?slug=${encodeURIComponent(slug)}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Rating-Injector/1.0'
            },
            // Timeout nach 10 Sekunden
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
            console.warn(`  ⚠️  API returned ${response.status} for ${slug}`);
            return null;
        }
        
        const data = await response.json();
        return data.aggregateRating || null;
        
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.warn(`  ⚠️  Timeout für ${slug}`);
        } else {
            console.warn(`  ⚠️  Konnte Rating für ${slug} nicht laden:`, error.message);
        }
        return null;
    }
}

// JSON-LD im HTML finden und aktualisieren
function injectRatingIntoHtml(htmlContent, aggregateRating) {
    if (!aggregateRating) return { html: htmlContent, changed: false };
    
    // Regex um JSON-LD Scripts zu finden
    const jsonLdRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    
    let changed = false;
    
    const updatedHtml = htmlContent.replace(jsonLdRegex, (match, jsonContent) => {
        try {
            const schema = JSON.parse(jsonContent);
            
            // Nur BlogPosting, Article, NewsArticle bearbeiten
            if (['BlogPosting', 'Article', 'NewsArticle'].includes(schema['@type'])) {
                
                // Prüfen ob sich das Rating geändert hat
                const existingRating = schema.aggregateRating;
                const newRatingValue = aggregateRating.ratingValue;
                const newRatingCount = aggregateRating.ratingCount;
                
                if (!existingRating || 
                    existingRating.ratingValue !== newRatingValue ||
                    existingRating.ratingCount !== newRatingCount) {
                    
                    schema.aggregateRating = aggregateRating;
                    changed = true;
                    
                    // Formatiert zurückgeben (4 Spaces Indent passend zu deinem HTML)
                    const jsonStr = JSON.stringify(schema, null, 2);
                    const indentedJson = jsonStr.split('\n').map(line => '    ' + line).join('\n');
                    return `<script type="application/ld+json">\n${indentedJson}\n    </script>`;
                }
            }
            
            return match; // Unverändert zurückgeben
            
        } catch (e) {
            // JSON Parse Fehler - unverändert lassen
            console.warn('  ⚠️  Konnte JSON-LD nicht parsen:', e.message);
            return match;
        }
    });
    
    return { html: updatedHtml, changed };
}

// === HAUPTFUNKTION ===

async function main() {
    console.log('\n🚀 Rating-Injection gestartet');
    console.log('═'.repeat(50));
    console.log(`   API: ${CONFIG.apiBaseUrl}`);
    console.log(`   Verzeichnis: ${CONFIG.htmlDir}\n`);
    
    // Prüfen ob API erreichbar ist
    console.log('🔌 Teste API-Verbindung...');
    try {
        const testResponse = await fetch(`${CONFIG.apiBaseUrl}/api/schema?slug=test`, {
            signal: AbortSignal.timeout(5000)
        });
        if (testResponse.ok) {
            console.log('   ✅ API erreichbar\n');
        } else {
            console.log(`   ⚠️  API antwortet mit Status ${testResponse.status}\n`);
        }
    } catch (e) {
        console.log('   ❌ API nicht erreichbar - fahre trotzdem fort\n');
    }
    
    // Dateien sammeln
    const files = CONFIG.includeFiles.filter(f => {
        const filepath = path.join(CONFIG.htmlDir, f);
        const exists = fs.existsSync(filepath);
        if (!exists) {
            console.warn(`  ⚠️  Datei nicht gefunden: ${f}`);
        }
        return exists;
    });
    
    if (files.length === 0) {
        console.log('ℹ️  Keine Dateien zu verarbeiten.');
        console.log('   Tipp: Füge Blog-Artikel zu CONFIG.includeFiles hinzu.\n');
        return;
    }
    
    console.log(`📄 ${files.length} Datei(en) werden verarbeitet:\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const filename of files) {
        const filepath = path.join(CONFIG.htmlDir, filename);
        const slug = getSlugFromFilename(filename);
        
        process.stdout.write(`   ${filename} (slug: ${slug})... `);
        
        try {
            // 1. Rating von API holen
            const rating = await fetchRating(slug);
            
            if (!rating) {
                console.log('⏭️  Keine Bewertungen vorhanden');
                skippedCount++;
                continue;
            }
            
            // 2. HTML einlesen
            const htmlContent = fs.readFileSync(filepath, 'utf-8');
            
            // 3. Rating injizieren
            const { html: updatedHtml, changed } = injectRatingIntoHtml(htmlContent, rating);
            
            if (changed) {
                // 4. Datei speichern
                fs.writeFileSync(filepath, updatedHtml, 'utf-8');
                console.log(`✅ ${rating.ratingValue}⭐ (${rating.ratingCount} Bewertungen)`);
                updatedCount++;
            } else {
                console.log('⏭️  Schema bereits aktuell');
                skippedCount++;
            }
            
        } catch (error) {
            console.log(`❌ Fehler: ${error.message}`);
            errorCount++;
        }
    }
    
    // Zusammenfassung
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Zusammenfassung:');
    console.log(`   ✅ Aktualisiert: ${updatedCount}`);
    console.log(`   ⏭️  Übersprungen: ${skippedCount}`);
    if (errorCount > 0) {
        console.log(`   ❌ Fehler: ${errorCount}`);
    }
    console.log('═'.repeat(50) + '\n');
    
    // Kein Exit-Error bei 0 Updates (ist normal bei erstem Run ohne Bewertungen)
    if (errorCount > 0) {
        process.exit(1);
    }
}

// Script ausführen
main().catch(error => {
    console.error('❌ Kritischer Fehler:', error);
    process.exit(1);
});
