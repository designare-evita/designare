document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) {
        console.error('Matrix Canvas not found!');
        return;
    }
    const ctx = canvas.getContext('2d');
    const sideMenu = document.getElementById('side-menu-panel');

    // Funktion, um die Canvas-Größe zu setzen
    const resizeCanvas = () => {
        canvas.width = sideMenu.offsetWidth;
        canvas.height = sideMenu.offsetHeight;
    };
    resizeCanvas(); // Einmal initial aufrufen

    // Holen der Akzentfarbe aus den CSS-Variablen
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;

    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    const rainDrops = [];

    for (let x = 0; x < columns; x++) {
        rainDrops[x] = 1;
    }

    const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- HIER IST DIE ÄNDERUNG ---
        // Statt '#0F0' verwenden wir jetzt die Akzentfarbe
        ctx.fillStyle = accentColor || '#FCB500'; // Fallback-Farbe, falls die Variable nicht gefunden wird
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

    let intervalId = setInterval(draw, 30);

    // Canvas-Größe anpassen und Animation neu starten, wenn das Fenster verändert wird
    window.addEventListener('resize', () => {
        resizeCanvas();
        // Setzt die Spaltenanzahl und Tropfenpositionen zurück, um dem neuen Layout zu entsprechen
        const newColumns = Math.ceil(canvas.width / fontSize);
        for (let x = 0; x < newColumns; x++) {
            rainDrops[x] = 1;
        }
        // Startet die Animation neu
        clearInterval(intervalId);
        intervalId = setInterval(draw, 30);
    });
});
