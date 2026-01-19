import gulp from 'gulp';
import concat from 'gulp-concat';
import cleanCSS from 'gulp-clean-css';

const { src, dest, parallel } = gulp;

// 1. CORE: Wird auf ALLEN Seiten geladen
// WICHTIG: light-mode.css MUSS am Ende stehen!
const coreFiles = [
    'css/style.css',              // Reset & Vars
    'css/header-footer.css',      // Globales Layout
    'css/side-menu.css',          // Navigation
    'css/menu-interactive.css',   // Interaktive Menüs
    'css/ai-styles.css',          // Evita/Chat Styles
    'css/light-mode.css',          // ← MUSS ZULETZT sein für Overrides
    'css/legal-style.css'    
];

// 2. HOME: Nur für index.html
const homeFiles = [
    'css/flip-card.css',          // Nur Startseite
    'css/booking.css',            // Nur Startseite (oder Kontakt)
    'css/terminal-fix.css',       // Nur Startseite
    'css/homepage-scroll-fix.css' // Nur Startseite
];

// 3. ARTICLE: Für Blogposts (OHNE Silas)
const articleFiles = [
    'css/blog-style.css',         // Basis Blog-Layout
    // 'css/artikel.css',         // Spezifische Artikel-Styles (AUSKOMMENTIERT)
    'css/blog-components.css',    // NEU: Blog-Komponenten
    'css/feedback-style.css',     // Feedback Formulare
    // 'css/silas.css',           // HIER ENTFERNT -> Eigener Task unten!
    'css/lightbox.css',            // Falls genutzt
    'css/ai-visibility.css'
];


// --- TASKS ---

function buildCore() {
    return src(coreFiles, { allowEmpty: true }) 
        .pipe(concat('core.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie11', level: 2 }))
        .pipe(dest('public/css'));
}

function buildHome() {
    return src(homeFiles, { allowEmpty: true })
        .pipe(concat('home.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie11', level: 2 }))
        .pipe(dest('public/css'));
}

function buildArticle() {
    return src(articleFiles, { allowEmpty: true })
        .pipe(concat('article.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie11', level: 2 }))
        .pipe(dest('public/css'));
}

// NEU: Eigener Task nur für Silas
function buildSilas() {
    return src('css/silas.css', { allowEmpty: true })
        // Kein concat nötig, da es nur eine Datei ist
        // Wir minifizieren sie trotzdem für Performance
        .pipe(cleanCSS({ compatibility: 'ie11', level: 2 }))
        .pipe(dest('public/css')); // Speichert sie als "silas.css" in public/css
}

// Alle Tasks parallel ausführen (Silas Task hinzugefügt)
export default parallel(buildCore, buildHome, buildArticle, buildSilas);
