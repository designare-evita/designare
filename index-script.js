/*
 * index-script.js
 * Spezifisches JavaScript für die Startseite (index.html)
*/

// Diese Funktion wird von der Theme-Logik in common.js aufgerufen
function updateParticleColors() {
    if (window.pJSDom && window.pJSDom[0]) {
        const pJS = window.pJSDom[0].pJS;
        const styles = getComputedStyle(document.body);
        const particleColor = styles.getPropertyValue('--particle-color').trim();
        const lineColor = styles.getPropertyValue('--particle-line-color').trim();
        pJS.particles.color.value = particleColor;
        pJS.particles.line_linked.color = lineColor;
        pJS.fn.particlesRefresh();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    
    // --- KONSTANTEN FÜR GESCHWINDIGKEITEN & DELAYS ---
    const H1_TYPING_SPEED = 120;
    const H1_DELETING_SPEED = 70;
    const H1_DELAY_BETWEEN_TEXTS = 2200;
    const AI_TYPING_SPEED = 120;
    const AI_DELETING_SPEED = 50;
    const AI_DELAY_AFTER_TYPING = 20000;
    const AI_DELAY_BEFORE_NEXT_TEXT = 600;

    // --- H1-TYPEWRITER ---
    const typewriterElement = document.getElementById('typewriter-h1');
    if (typewriterElement) {
        const textsToType = [ "Michael Kanda", "Web-Magier", "KI-Therapeut" ]; 
        let textIndex = 0; let charIndex = 0; let isDeleting = false;
        
        function typeWriter() {
            const currentText = textsToType[textIndex];
            if (isDeleting) {
                typewriterElement.innerHTML = currentText.substring(0, charIndex - 1) + '<span class="cursor"></span>';
                charIndex--;
            } else {
                typewriterElement.innerHTML = currentText.substring(0, charIndex + 1) + '<span class="cursor"></span>';
                charIndex++;
            }
            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true; setTimeout(typeWriter, H1_DELAY_BETWEEN_TEXTS); return;
            }
            if (isDeleting && charIndex === 0) {
                isDeleting = false; textIndex = (textIndex + 1) % textsToType.length; setTimeout(typeWriter, 500); return;
            }
            const currentSpeed = isDeleting ? H1_DELETING_SPEED : H1_TYPING_SPEED;
            setTimeout(typeWriter, currentSpeed);
        }
        const style = document.createElement('style');
        style.innerHTML = `.cursor { display: inline-block; width: 3px; height: 1em; background-color: var(--accent-color); animation: blink 0.7s infinite; vertical-align: bottom; margin-left: 5px; } @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
        document.head.appendChild(style);
        setTimeout(typeWriter, 500);
    }
    
    // --- KI-INTERAKTION & DYNAMISCHER PLATZHALTER ---
    const aiForm = document.getElementById('ai-form');
    if (aiForm) {
        const aiQuestionInput = document.getElementById('ai-question');
        const aiStatus = document.getElementById('ai-status');
        const submitButton = aiForm.querySelector('button');

        // Placeholder Typewriter-Logik bleibt hier, da sie nur auf der Startseite benötigt wird
        // ... (Code für Placeholder-Typewriter bleibt unverändert)

        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = aiQuestionInput.value.trim();
            if (!question) return;

            aiStatus.innerText = "Einen Moment, Evita gleicht gerade ihre Bits und Bytes ab...";
            aiStatus.classList.add('thinking');
            aiQuestionInput.disabled = true;
            submitButton.disabled = true;

            try {
                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: question })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Die Antwort vom Server war nicht korrekt.');
                }
                const data = await response.json();
                aiStatus.innerText = data.answer;
            } catch (error) {
                console.error("Fehler bei der KI-Anfrage:", error);
                // OPTIMIERT: Fehler wird direkt im Status-Feld angezeigt, statt mit alert()
                aiStatus.innerText = `Hoppla, da ist was schiefgelaufen. (${error.message})`;
            } finally {
                aiQuestionInput.value = '';
                aiQuestionInput.disabled = false;
                submitButton.disabled = false;
                aiStatus.classList.remove('thinking');
            }
        });
    }

    // --- PARTIKEL-HINTERGRUND ---
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            // ... (Partikel-Konfiguration bleibt unverändert)
        });
        setTimeout(updateParticleColors, 500);
    }

    // --- 3D-SCHWEBEEFFEKT ---
    const heroElement = document.getElementById('hero');
    const container = document.querySelector('#hero .container');
    if(heroElement && container) {
        heroElement.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = heroElement;
            const xRotation = 30 * ((clientY - offsetHeight / 2) / offsetHeight);
            const yRotation = 30 * ((clientX - offsetWidth / 2) / offsetHeight);
            container.style.transform = `rotateX(${xRotation * -1}deg) rotateY(${yRotation}deg)`;
        });
        heroElement.addEventListener('mouseleave', () => {
            container.style.transform = 'rotateX(0) rotateY(0)';
        });
    }
});
