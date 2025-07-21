/*
 * script.js
 * Online-Visitenkarte - Finale Version
*/

document.addEventListener('DOMContentLoaded', function() {

    // --- Cookie Info Bar Logik - Start ---
    const cookieInfoBar = document.getElementById('cookie-info-bar');
    const closeCookieBarBtn = document.getElementById('close-cookie-bar');

    // Optionaler Debug-Log: Prüfen, ob der Button gefunden wird
    if (closeCookieBarBtn) {
        console.log('Schließen-Button für Cookie-Bar gefunden.');
    } else {
        console.error('Schließen-Button für Cookie-Bar NICHT gefunden!');
    }

    const hasClosedCookieInfo = localStorage.getItem('hasClosedCookieInfo');

    if (!hasClosedCookieInfo) { // Nur anzeigen, wenn er noch nicht geschlossen wurde
        setTimeout(() => {
            if (cookieInfoBar) { // Zusätzliche Prüfung, ob der Bar existiert
                 cookieInfoBar.classList.add('show');
            }
        }, 1500); // Zeigt den Bar nach 1.5 Sekunden an
    }

    // Event Listener für den Schließen-Button
    if (closeCookieBarBtn) { // Sicherstellen, dass der Button existiert, bevor ein Listener hinzugefügt wird
        closeCookieBarBtn.addEventListener('click', () => {
            if (cookieInfoBar) { // Sicherstellen, dass der Bar existiert
                cookieInfoBar.classList.remove('show');
                localStorage.setItem('hasClosedCookieInfo', 'true'); // Merken, dass der Nutzer ihn geschlossen hat
                console.log('Cookie-Bar geschlossen und Status gespeichert.');
            }
        });
    }
    // --- Cookie Info Bar Logik - Ende ---


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

    // --- THEME-LOGIK ---
    const themeToggle = document.getElementById('theme-toggle');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        updateParticleColors();
    };

    const savedTheme = localStorage.getItem('theme') || 'dark'; //
    applyTheme(savedTheme); //

    themeToggle.addEventListener('click', () => { //
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark'; //
        localStorage.setItem('theme', newTheme); //
        applyTheme(newTheme); //
    });

    // --- H1-TYPEWRITER ---
    const typewriterElement = document.getElementById('typewriter-h1'); //
    if (typewriterElement) { //
        const textsToType = [ "Michael Kanda", "Web-Entwickler", "KI-Spezialist" ]; //
        let textIndex = 0; let charIndex = 0; let isDeleting = false; //
        const typingSpeed = 110, deletingSpeed = 55, delayBetweenTexts = 2000; //

        function typeWriter() { //
            const currentText = textsToType[textIndex]; //
            if (isDeleting) { //
                typewriterElement.innerHTML = currentText.substring(0, charIndex - 1) + '<span class="cursor"></span>'; //
                charIndex--; //
            } else { //
                typewriterElement.innerHTML = currentText.substring(0, charIndex + 1) + '<span class="cursor"></span>'; //
                charIndex++; //
            }
            if (!isDeleting && charIndex === currentText.length) { //
                isDeleting = true; setTimeout(typeWriter, delayBetweenTexts); return; //
            }
            if (isDeleting && charIndex === 0) { //
                isDeleting = false; textIndex = (textIndex + 1) % textsToType.length; setTimeout(typeWriter, 500); return; //
            }
            const currentSpeed = isDeleting ? deletingSpeed : typingSpeed; //
            setTimeout(typeWriter, currentSpeed); //
        }
        const style = document.createElement('style'); //
        style.innerHTML = `.cursor { display: inline-block; width: 3px; height: 1em; background-color: var(--accent-color); animation: blink 0.7s infinite; vertical-align: bottom; margin-left: 5px; } @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`; //
        document.head.appendChild(style); //
        setTimeout(typeWriter, 500); //
    }

    // --- KONTAKT-MODAL ---
    const contactButton = document.getElementById('contact-button'); //
    const closeModalButton = document.getElementById('close-modal'); //
    const contactModal = document.getElementById('contact-modal'); //

    if (contactButton && closeModalButton && contactModal) { //
        contactButton.addEventListener('click', () => contactModal.classList.add('visible')); //
        closeModalButton.addEventListener('click', () => contactModal.classList.remove('visible')); //
        contactModal.addEventListener('click', (e) => { //
            if (e.target === contactModal) { //
                contactModal.classList.remove('visible'); //
            }
        });
    }

    // --- KI-INTERAKTION & DYNAMISCHER PLATZHALTER ---
    const aiForm = document.getElementById('ai-form'); //
    if (aiForm) { //
        const aiQuestionInput = document.getElementById('ai-question'); //
        const aiStatus = document.getElementById('ai-status'); //
        const submitButton = aiForm.querySelector('button'); //

        const placeholderTexts = [ //
            "Hallo, ich bin Evita, Michaels KI-Assistentin.", //
            "Was kann ich für Sie tun?" //
        ];
        let placeholderIndex = 0; //
        let charPlaceholderIndex = 0; //
        let placeholderInterval; //

        function cyclePlaceholder() { //
            let currentText = aiQuestionInput.placeholder; //
            let deleteInterval = setInterval(() => { //
                if (currentText.length > 0) { //
                    currentText = currentText.slice(0, -1); //
                    aiQuestionInput.placeholder = currentText; //
                } else { //
                    clearInterval(deleteInterval); //
                    placeholderIndex = (placeholderIndex + 1) % placeholderTexts.length; //
                    charPlaceholderIndex = 0; //
                    typePlaceholder(); //
                }
            }, 40); //
        }

        function typePlaceholder() { //
            let newText = placeholderTexts[placeholderIndex]; //
            let typeInterval = setInterval(() => { //
                if (charPlaceholderIndex < newText.length) { //
                    aiQuestionInput.placeholder += newText.charAt(charPlaceholderIndex); //
                    charPlaceholderIndex++; //
                } else { //
                    clearInterval(typeInterval); //
                }
            }, 70); //
        }

        placeholderInterval = setInterval(cyclePlaceholder, 7000); //

        aiQuestionInput.addEventListener('focus', () => clearInterval(placeholderInterval)); //
        aiQuestionInput.addEventListener('blur', () => { //
            if(aiQuestionInput.value === '') { //
                 placeholderInterval = setInterval(cyclePlaceholder, 7000); //
            }
        });

        aiForm.addEventListener('submit', async (e) => { //
            e.preventDefault(); //
            const question = aiQuestionInput.value.trim(); //
            if (!question) return; //

            clearInterval(placeholderInterval); //
            aiStatus.innerText = 'Evita denkt nach...'; //
            aiStatus.classList.add('thinking'); //
            aiQuestionInput.disabled = true; //
            submitButton.disabled = true; //

            try { //
                const fetchPromise = fetch('/api/ask-gemini', { //
                    method: 'POST', //
                    headers: { 'Content-Type': 'application/json' }, //
                    body: JSON.stringify({ question: question }) //
                });

                const delayPromise = new Promise(resolve => setTimeout(resolve, 1200)); //

                const [response] = await Promise.all([fetchPromise, delayPromise]); //

                if (!response.ok) { throw new Error('Netzwerk-Antwort war nicht OK.'); } //

                const data = await response.json(); //
                aiStatus.innerText = data.answer; //

            } catch (error) { //
                console.error("Fehler:", error); //
                aiStatus.innerText = 'Ein Fehler ist aufgetreten.'; //
            } finally { //
                aiQuestionInput.value = ''; //
                aiQuestionInput.disabled = false; //
                submitButton.disabled = false; //
                aiQuestionInput.placeholder = "Haben Sie eine weitere Frage?"; //
                aiStatus.classList.remove('thinking'); //
            }
        });
    }

    // --- PARTIKEL-HINTERGRUND ---
    if (document.getElementById('particles-js')) { //
        particlesJS("particles-js", { //
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#cccccc", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }, "twinkle": { "particles": { "enable": true, "frequency": 0.05, "opacity": 1 } } }, //
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } } }, //
            "retina_detect": true //
        });
        setTimeout(updateParticleColors, 500); //
    }

    // --- 3D-SCHWEBEEFFEKT ---
    const heroElement = document.getElementById('hero'); //
    const container = document.querySelector('#hero .container'); //
    if(heroElement && container) { //
        heroElement.addEventListener('mousemove', (e) => { //
            const { clientX, clientY } = e; //
            const { offsetWidth, offsetHeight } = heroElement; //
            const xRotation = 30 * ((clientY - offsetHeight / 2) / offsetHeight); //
            const yRotation = 30 * ((clientX - offsetWidth / 2) / offsetHeight); //
            container.style.transform = `rotateX(${xRotation * -1}deg) rotateY(${yRotation}deg)`; //
        });
        heroElement.addEventListener('mouseleave', () => { //
            container.style.transform = 'rotateX(0) rotateY(0)'; //
        });
    }
});