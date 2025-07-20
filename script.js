/*
 * script.js
 * Online-Visitenkarte mit ECHTER Gemini-Anbindung
*/

document.addEventListener('DOMContentLoaded', function() {

    const body = document.body;
    
    // --- HILFSFUNKTION FÜR PARTIKEL ---
    const updateParticleColors = () => {
        if (window.pJSDom && window.pJSDom[0]) {
            const pJS = window.pJSDom[0].pJS;
            const styles = getComputedStyle(body);
            const particleColor = styles.getPropertyValue('--particle-color').trim();
            const lineColor = styles.getPropertyValue('--particle-line-color').trim();
            pJS.particles.color.value = particleColor;
            pJS.particles.line_linked.color = lineColor;
            pJS.fn.particlesRefresh();
        }
    };

    // --- Effekt 0: Tag-/Nachtmodus Logik ---
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        updateParticleColors();
    };
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    themeToggle.addEventListener('click', () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
    
    // --- Effekt 1: ECHTE Gemini AI Interaktion ---
    const aiForm = document.getElementById('ai-form');
    const aiQuestionInput = document.getElementById('ai-question');
    const aiStatus = document.getElementById('ai-status');
    const h1Element = document.getElementById('typewriter-h1');
    const submitButton = aiForm.querySelector('button');
    
    let typingInterval = null;
    function typeAnswer(text) {
        let i = 0;
        h1Element.innerHTML = '';
        aiStatus.innerText = '';

        clearInterval(typingInterval);
        typingInterval = setInterval(() => {
            if (i < text.length) {
                h1Element.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 40); // Schreibgeschwindigkeit
    }

    if (aiForm) {
        // Initialer Text für die h1
        typeAnswer("Ihre persönliche KI-Assistenz");

        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = aiQuestionInput.value.trim();
            if (!question) return;

            // UI für "Laden" vorbereiten
            aiStatus.innerText = 'KI denkt nach...';
            aiQuestionInput.disabled = true;
            submitButton.disabled = true;
            clearInterval(typingInterval);
            h1Element.innerHTML = '';

            try {
                // Anfrage an das Backend senden
                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: question })
                });

                if (!response.ok) {
                    // Versucht, eine Fehlermeldung vom Server zu bekommen
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Netzwerk-Antwort war nicht OK.');
                }

                const data = await response.json();
                
                // Antwort mit dem Typewriter-Effekt anzeigen
                typeAnswer(data.answer);

            } catch (error) {
                console.error("Fehler:", error);
                aiStatus.innerText = 'Ein Fehler ist aufgetreten.';
                h1Element.innerHTML = 'Assistent offline';
            } finally {
                aiQuestionInput.value = '';
                aiQuestionInput.disabled = false;
                submitButton.disabled = false;
            }
        });
    }

    // --- Effekt 2: Partikel-Hintergrund Initialisierung ---
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#cccccc", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }, "twinkle": { "particles": { "enable": true, "frequency": 0.05, "opacity": 1 } } },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } } },
            "retina_detect": true
        });
        setTimeout(updateParticleColors, 500);
    }

    // --- Effekt 3: 3D-Schwebeeffekt ---
    const heroElement = document.getElementById('hero');
    const container = document.querySelector('#hero .container');
    if(heroElement && container) {
        heroElement.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e; 
            const { offsetWidth, offsetHeight } = heroElement;
            const xRotation = 30 * ((clientY - offsetHeight / 2) / offsetHeight);
            const yRotation = 30 * ((clientX - offsetWidth / 2) / offsetWidth);
            container.style.transform = `rotateX(${xRotation * -1}deg) rotateY(${yRotation}deg)`;
        });
        heroElement.addEventListener('mouseleave', () => { 
            container.style.transform = 'rotateX(0) rotateY(0)'; 
        });
    }

});