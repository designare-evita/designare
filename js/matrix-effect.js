// Korrigierte Version von matrix-effect.js

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
    let intervalId = null;
    let rainDrops = [];

    // --- Canvas-Größe setzen ---
    const updateCanvasSize = () => {
        const rect = sideMenu.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Neu berechnen der Spalten wenn sich die Größe ändert
        const columns = Math.ceil(canvas.width / fontSize);
        rainDrops = [];
        for (let x = 0; x < columns; x++) {
            rainDrops[x] = Math.floor(Math.random() * canvas.height / fontSize);
        }
    };

    // --- Zeichenfunktion ---
    const draw = () => {
        // Prüfen ob Canvas noch existiert und sichtbar ist
        if (!canvas.width || !canvas.height) return;

        // Semi-transparenter Overlay für Fade-Effekt
        ctx.fillStyle = 'rgba(26, 26, 33, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Matrix-Text zeichnen
        ctx.fillStyle = accentColor;
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < rainDrops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            const x = i * fontSize;
            const y = rainDrops[i] * fontSize;
            
            ctx.fillText(text, x, y);

            // Reset der Tropfen wenn sie den Boden erreichen
            if (y > canvas.height && Math.random() > 0.975) {
                rainDrops[i] = 0;
            }
            rainDrops[i]++;
        }
    };

    // --- Animation starten ---
    const startAnimation = () => {
        if (intervalId) return; // Bereits gestartet
        
        updateCanvasSize();
        
        // Nur starten wenn Canvas eine gültige Größe hat
        if (canvas.width > 0 && canvas.height > 0) {
            intervalId = setInterval(draw, 50); // 50ms = ~20 FPS
        }
    };

    // --- Animation stoppen ---
    const stopAnimation = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        // Canvas leeren
        if (canvas.width && canvas.height) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    // --- Event-Listener für Menü-Toggle ---
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const closeMenuButton = document.getElementById('close-menu-button');

    // Menü öffnen
    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', () => {
            sideMenu.classList.add('is-active');
            // Kurze Verzögerung für CSS-Transition
            setTimeout(() => {
                startAnimation();
            }, 100);
        });
    }

    // Menü schließen
    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', () => {
            stopAnimation();
            sideMenu.classList.remove('is-active');
        });
    }

    // --- MutationObserver als Fallback ---
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.attributeName === 'class') {
                const targetElement = mutation.target;
                if (targetElement.classList.contains('is-active')) {
                    setTimeout(startAnimation, 150);
                } else {
                    stopAnimation();
                }
            }
        }
    });

    observer.observe(sideMenu, { attributes: true });

    // --- Resize-Handler ---
    window.addEventListener('resize', () => {
        if (sideMenu.classList.contains('is-active') && intervalId) {
            stopAnimation();
            setTimeout(startAnimation, 100);
        }
    });

    // --- Cleanup beim Seitenwechsel ---
    window.addEventListener('beforeunload', stopAnimation);
});
