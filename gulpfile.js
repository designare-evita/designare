import gulp from 'gulp';
import concat from 'gulp-concat';
import cleanCSS from 'gulp-clean-css';

const { src, dest, parallel } = gulp;

// 1. CORE: Wird auf ALLEN Seiten geladen
// Basierend auf deiner index.html und geo-seo.html Schnittmenge
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
    'css/legal-style.css'         // Oft auf Home + Impressum (kann man hier lassen oder splitten)
];

// 3. ARTICLE: Für Blogposts (geo-seo.html, wordpress-diaet.html etc.)
const articleFiles = [
    'css/blog-style.css',         // Basis Blog-Layout
    'css/artikel.css',            // Spezifische Artikel-Styles
    'css/blog-components.css',    // NEU: Blog-Komponenten (Boxen, Buttons etc.)
    'css/feedback-style.css',     // Feedback Formulare
    'css/silas.css',              // Falls genutzt
    'css/lightbox.css'            // Falls genutzt
];

// Tasks definieren
function buildCore() {
    return src(coreFiles)
        .pipe(concat('core.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie11', level: 2 }))
        .pipe(dest('public/css'));
}

function buildHome() {
    return src(homeFiles)
        .pipe(concat('home.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie11', level: 2 }))
        .pipe(dest('public/css'));
}

function buildArticle() {
    return src(articleFiles)
        .pipe(concat('article.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie11', level: 2 }))
        .pipe(dest('public/css'));
}

// Alle Tasks parallel ausführen
export default parallel(buildCore, buildHome, buildArticle);
