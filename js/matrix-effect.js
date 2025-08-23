// in js/matrix-effect.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) {
        console.error('Matrix Canvas not found!');
        return;
    }
    const ctx = canvas.getContext('2d');
    const sideMenu = document.getElementById('side-menu-panel');

    // --- Konfiguration ---
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#FCB500';
    const alphabet = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const fontSize = 16;
    let intervalId = null; // Hält die laufende Animation

    // --- Kernfunktionen ---
    const resizeAndInitialize = () => {
        if (intervalId) clearInterval(intervalId); // Stoppt alte Animation

        // Leinwand an die AKTUELLE Größe des Menüs anpassen
        canvas.width = sideMenu.offsetWidth;
        canvas.height = sideMenu.offsetHeight;

        // Wenn die Breite 0 ist, nicht zeichnen
        if (canvas.width === 0) return;

        let columns = Math.ceil(canvas.width / fontSize);
        let rainDrops = [];
        for (let x = 0; x < columns; x++) {
            rainDrops[x] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(26, 26, 33, 0.05)'; // Nutzt die Hintergrundfarbe für den Fade-Effekt
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = accentColor;
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

                if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        };
        
        intervalId = setInterval(draw, 33); // Startet die neue Animation
    };

    // --- Ereignisbehandlung ---

    // Beobachtet, ob das Menü die Klasse 'is-active' bekommt (also sichtbar wird)
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.attributeName === 'class') {
                const targetElement = mutation.target;
                if (targetElement.classList.contains('is-active')) {
                    // Kurze Verzögerung, damit die CSS-Animation beginnen kann
                    setTimeout(resizeAndInitialize, 100);
                } else {
                    // Wenn das Menü geschlossen wird, stoppen wir die Animation
                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                }
            }
        }
    });

    observer.observe(sideMenu, { attributes: true });
});
