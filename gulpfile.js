import gulp from 'gulp';
import concat from 'gulp-concat';
import cleanCSS from 'gulp-clean-css';

const { src, dest, parallel } = gulp;

// 1. CORE: Wird auf ALLEN Seiten geladen
const coreFiles = [
    'css/style.css',              // Reset & Vars
    'css/header-footer.css',      // Globales Layout
    'css/side-menu.css',          // Navigation
    'css/menu-interactive.css',   // Interaktive Menüs
    'css/light-mode.css',         // Dark/Light Mode Logik
    'css/ai-styles.css'           // Scheint global für Evita/Chat zu sein
];

// 2. HOME: Nur für index.html
const homeFiles = [
    'css/flip-card.css',          // Nur Startseite
    'css/booking.css',            // Nur Startseite (oder Kontakt)
    'css/terminal-fix.css',       // Nur Startseite
    'css/homepage-scroll-fix.css',// Nur Startseite
    'css/legal-style.css'         // Oft auf Home + Impressum
];

// 3. ARTICLE: Für Blogposts
const articleFiles = [
    'css/blog-style.css',         // Basis Blog-Layout
    // 'css/artikel.css',         // Spezifische Artikel-Styles (AUSKOMMENTIERT)
    'css/blog-components.css',    // NEU: Blog-Komponenten
    'css/feedback-style.css',     // Feedback Formulare
    //'css/silas.css',            // Wir lassen es hier drin, damit Gulp die Datei kopiert/erstellt
    'css/lightbox.css'            // Falls genutzt
];


// Tasks definieren
function buildCore() {
    // allowEmpty: true verhindert Absturz, falls eine Datei fehlt
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

// Alle Tasks parallel ausführen
export default parallel(buildCore, buildHome, buildArticle);
