/*
 * script.js
 * Online-Visitenkarte - Finale Version
*/

document.addEventListener('DOMContentLoaded', function() {

    // NEU: Cookie Banner Logik - Start
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptAllBtn = document.getElementById('accept-all-cookies');
    const acceptNecessaryBtn = document.getElementById('accept-necessary-cookies');

    // Funktion zum Setzen eines Cookies (hier für local storage als Ersatz)
    const setCookieConsent = (consentType) => {
        localStorage.setItem('cookieConsent', consentType); // 'all' oder 'necessary'
        cookieBanner.classList.remove('show');
        console.log('Cookie Consent:', consentType);
        // Da laut Datenschutzerklärung nur technisch notwendige Cookies verwendet werden,
        // gibt es hier aktuell keine optionalen Skripte, die geladen werden müssten.
        // Falls sich dies ändert (z.B. Analytics, externe Video-Embeds), müsste hier die Logik ergänzt werden:
        // if (consentType === 'all') {
        //     // Lade hier optionale Skripte wie Google Analytics, YouTube Embeds etc.
        // }
    };

    // Prüfen, ob bereits eine Zustimmung vorliegt
    const cookieConsent = localStorage.getItem('cookieConsent');

    if (!cookieConsent) {
        // Wenn keine Zustimmung vorliegt, zeige den Banner nach kurzer Verzögerung
        // Die Verzögerung sorgt dafür, dass der Banner nicht sofort beim Laden "springt".
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 1000); // Zeigt den Banner nach 1 Sekunde an
    } else {
        // Wenn Zustimmung vorliegt, könnte hier im Falle optionaler Cookies
        // die entsprechende Logik zum Laden der Skripte erfolgen.
        // if (cookieConsent === 'all') {
        //     // Lade optionale Skripte
        // }
        console.log('Cookie Consent bereits vorhanden:', cookieConsent);
    }

    acceptAllBtn.addEventListener('click', () => {
        setCookieConsent('all');
    });

    acceptNecessaryBtn.addEventListener('click', () => {
        setCookieConsent('necessary');
    });
    // NEU: Cookie Banner Logik - Ende


    const body = document.body;

    // --- HILFSFUNKTION FÜR PARTIKEL ---
    const updateParticleColors = () => { /* ... unverändert ... */ };

    // --- THEME-LOGIK ---
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => { /* ... unverändert ... */ };
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    themeToggle.addEventListener('click', () => { /* ... unverändert ... */ });

    // --- H1-TYPEWRITER ---
    const typewriterElement = document.getElementById('typewriter-h1');
    if (typewriterElement) { /* ... unverändert ... */ }

    // --- KONTAKT-MODAL ---
    const contactButton = document.getElementById('contact-button');
    const closeModalButton = document.getElementById('close-modal');
    const contactModal = document.getElementById('contact-modal');
    if (contactButton && closeModalButton && contactModal) { /* ... unverändert ... */ }

    // --- KI-INTERAKTION & DYNAMISCHER PLATZHALTER ---
    const aiForm = document.getElementById('ai-form');
    if (aiForm) { /* ... unverändert ... */ }

    // --- PARTIKEL-HINTERGRUND ---
    if (document.getElementById('particles-js')) { /* ... unverändert ... */ }

    // --- 3D-SCHWEBEEFFEKT ---
    const heroElement = document.getElementById('hero');
    const container = document.querySelector('#hero .container');
    if(heroElement && container) { /* ... unverändert ... */ }
});