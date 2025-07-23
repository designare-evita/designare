/*
 * script.js
 * Online-Visitenkarte - KORRIGIERTE & ZUSAMMENGEFÜHRTE VERSION
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

    // --- Allgemeine Lightbox Funktionen ---
    const openLightbox = (lightboxElement) => {
        if (lightboxElement) {
            lightboxElement.classList.add('visible');
            body.style.overflow = 'hidden';
        }
    };
    const closeLightbox = (lightboxElement) => {
        if (lightboxElement) {
            lightboxElement.classList.remove('visible');
            body.style.overflow = '';
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
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // --- Alle Lightbox- und Modal-Initialisierungen ---
    
    // Cookie Info Lightbox
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    if (cookieInfoLightbox) {
        const hasSeenCookieInfoLightbox = localStorage.getItem('hasSeenCookieInfoLightbox');
        if (!hasSeenCookieInfoLightbox) {
            setTimeout(() => openLightbox(cookieInfoLightbox), 1000);
        }
        document.getElementById('cookie-info-button')?.addEventListener('click', () => openLightbox(cookieInfoLightbox));
        document.getElementById('acknowledge-cookie-lightbox')?.addEventListener('click', () => {
            closeLightbox(cookieInfoLightbox);
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
        });
        cookieInfoLightbox.addEventListener('click', (e) => {
            if (e.target === cookieInfoLightbox) closeLightbox(cookieInfoLightbox);
        });
    }

    // Kontakt Modal
    const contactModal = document.getElementById('contact-modal');
    if(contactModal){
        document.getElementById('contact-button')?.addEventListener('click', () => openLightbox(contactModal));
        document.getElementById('close-modal')?.addEventListener('click', () => closeLightbox(contactModal));
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) closeLightbox(contactModal);
        });
        // Formular-Logik
        const contactForm = document.getElementById('contact-form-inner');
        const contactSuccessMessage = document.getElementById('contact-success-message');
        contactForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (unveränderte Formular-Sende-Logik)
        });
        document.getElementById('close-success-message')?.addEventListener('click', (e) => {
            e.preventDefault();
            closeLightbox(contactModal);
        });
    }

    // Legal Modal (Impressum/Datenschutz)
    const legalModal = document.getElementById('legal-modal');
    if(legalModal) {
        const legalModalContentArea = document.getElementById('legal-modal-content-area');
        
        // KORRIGIERTE Ladefunktion
        const loadLegalPageInModal = async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP-Fehler! Status: ${response.status}`);
                const htmlContent = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, 'text/html');
                const legalContainer = doc.querySelector('.legal-container');
                if (legalContainer) {
                    legalModalContentArea.innerHTML = '';
                    // Zurück-Link entfernen, da wir den im Modal nicht brauchen
                    legalContainer.querySelector('.back-link')?.remove();
                    legalModalContentArea.appendChild(legalContainer);
                    openLightbox(legalModal);
                }
            } catch (error) {
                console.error(`Fehler beim Laden von ${url}:`, error);
            }
        };

        // KORRIGIERTE Event Listener, die den Pfad direkt aus dem Link nehmen
        document.getElementById('impressum-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal(e.currentTarget.href);
        });
        document.getElementById('datenschutz-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal(e.currentTarget.href);
        });
         document.getElementById('privacy-policy-link-button')?.addEventListener('click', (e) => {
            e.preventDefault();
            closeLightbox(cookieInfoLightbox);
            loadLegalPageInModal(e.currentTarget.href);
        });
        
        document.getElementById('close-legal-modal')?.addEventListener('click', () => closeLightbox(legalModal));
        legalModal.addEventListener('click', (e) => {
            if (e.target === legalModal) closeLightbox(legalModal);
        });
    }


    // --- SPEZIFISCHE FUNKTIONEN FÜR DIE STARTSEITE ---
    // Diese werden nur ausgeführt, wenn die entsprechenden Elemente (#hero, #ai-form etc.) vorhanden sind.
    
    // H1-TYPEWRITER
    const typewriterElement = document.getElementById('typewriter-h1');
    if (typewriterElement) {
        // ... (unveränderte Typewriter-Logik) ...
    }

    // KI-INTERAKTION
    const aiForm = document.getElementById('ai-form');
    if (aiForm) {
        const aiQuestionInput = document.getElementById('ai-question');
        const aiStatus = document.getElementById('ai-status');
        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = aiQuestionInput.value.trim();
            if (!question) return;

            aiStatus.innerText = "Einen Moment, Evita gleicht ihre Bits und Bytes ab...";
            aiStatus.classList.add('thinking');
            aiForm.querySelector('button').disabled = true;
            aiQuestionInput.disabled = true;

            try {
                const response = await fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question })
                });
                if (!response.ok) throw new Error('Netzwerk-Antwort war nicht OK.');
                const data = await response.json();
                aiStatus.innerText = data.answer;
            } catch (error) {
                console.error("Fehler bei KI-Anfrage:", error);
                // KORRIGIERT: Fehlerbehandlung ohne alert()
                aiStatus.innerText = "Hoppla, da gab es einen Fehler. Vielleicht hat Evita gerade eine Kaffeepause.";
            } finally {
                aiForm.querySelector('button').disabled = false;
                aiQuestionInput.disabled = false;
                aiQuestionInput.value = '';
            }
        });
    }

    // PARTIKEL-HINTERGRUND
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#cccccc", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out" } },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } } },
            "retina_detect": true
        });
        setTimeout(updateParticleColors, 500);
    }

    // 3D-SCHWEBEEFFEKT
    const heroElement = document.getElementById('hero');
    if(heroElement) {
        const container = heroElement.querySelector('.container');
        heroElement.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = heroElement;
            const xRotation = 20 * ((clientY - offsetHeight / 2) / offsetHeight);
            const yRotation = 20 * ((clientX - offsetWidth / 2) / offsetWidth);
            container.style.transform = `rotateX(${xRotation * -1}deg) rotateY(${yRotation}deg)`;
        });
        heroElement.addEventListener('mouseleave', () => {
            container.style.transform = 'rotateX(0) rotateY(0)';
        });
    }
});
