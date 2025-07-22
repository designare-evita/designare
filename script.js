/*
 * script.js
 * Online-Visitenkarte - Finale Version
*/

document.addEventListener('DOMContentLoaded', function() {

    // --- Cookie Info Lightbox Logik - Start ---
    const cookieInfoLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeCookieLightboxBtn = document.getElementById('acknowledge-cookie-lightbox');
    const privacyPolicyLinkButton = document.getElementById('privacy-policy-link-button');
    const cookieInfoButton = document.getElementById('cookie-info-button');

    const hasSeenCookieInfoLightbox = localStorage.getItem('hasSeenCookieInfoLightbox');

    // Funktion zum Öffnen der Lightbox
    const openLightbox = () => {
        if (cookieInfoLightbox) {
            cookieInfoLightbox.classList.add('visible');
        }
    };

    // Funktion zum Schließen der Lightbox und Speichern im localStorage
    const closeLightbox = () => {
        if (cookieInfoLightbox) {
            cookieInfoLightbox.classList.remove('visible');
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true'); // Merken, dass der Nutzer die Lightbox gesehen hat
        }
    };

    // Beim Laden der Seite: Wenn die Lightbox noch nicht gesehen wurde, öffne sie automatisch
    if (!hasSeenCookieInfoLightbox) {
        setTimeout(() => {
            openLightbox();
        }, 1000);
    }

    // Event Listener für den neuen Cookie Info Button
    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', () => {
            localStorage.removeItem('hasSeenCookieInfoLightbox');
            openLightbox();
        });
    }

    // Event Listener für den "Alles klar" Button
    if (acknowledgeCookieLightboxBtn) {
        acknowledgeCookieLightboxBtn.addEventListener('click', closeLightbox);
    }

    // Event Listener für den "Datenschutzerklärung" Link-Button
    if (privacyPolicyLinkButton) {
        privacyPolicyLinkButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeLightbox();
            setTimeout(() => {
                window.open(e.target.href, '_blank');
            }, 300);
        });
    }

    // Event Listener für Klick auf den Hintergrund (außerhalb des Inhalts)
    if (cookieInfoLightbox) {
        cookieInfoLightbox.addEventListener('click', (e) => {
            if (e.target === cookieInfoLightbox) {
                closeLightbox();
            }
        });
    }
    // --- Cookie Info Lightbox Logik - Ende ---


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

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- H1-TYPEWRITER ---
    const typewriterElement = document.getElementById('typewriter-h1');
    if (typewriterElement) {
        const textsToType = [ "Michael Kanda", "Web-Entwickler", "KI-Spezialist" ];
        let textIndex = 0; let charIndex = 0; let isDeleting = false;
        const typingSpeed = 110, deletingSpeed = 55, delayBetweenTexts = 2000;

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
                isDeleting = true; setTimeout(typeWriter, delayBetweenTexts); return;
            }
            if (isDeleting && charIndex === 0) {
                isDeleting = false; textIndex = (textIndex + 1) % textsToType.length; setTimeout(typeWriter, 500); return;
            }
            const currentSpeed = isDeleting ? deletingSpeed : typingSpeed;
            setTimeout(typeWriter, currentSpeed);
        }
        const style = document.createElement('style');
        style.innerHTML = `.cursor { display: inline-block; width: 3px; height: 1em; background-color: var(--accent-color); animation: blink 0.7s infinite; vertical-align: bottom; margin-left: 5px; } @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
        document.head.appendChild(style);
        setTimeout(typeWriter, 500);
    }

    // --- KONTAKT-MODAL (GEÄNDERT für Dankesmeldung) ---
    const contactButton = document.getElementById('contact-button');
    const closeModalButton = document.getElementById('close-modal');
    const contactModal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form-inner'); // NEU: Referenz zum Formular
    const contactSuccessMessage = document.getElementById('contact-success-message'); // NEU: Referenz zur Erfolgsnachricht
    const closeSuccessMessageBtn = document.getElementById('close-success-message'); // NEU: Referenz zum "Schließen" Button der Erfolgsnachricht

    if (contactButton && closeModalButton && contactModal) {
        contactButton.addEventListener('click', () => {
            contactModal.classList.add('visible');
            // Sicherstellen, dass das Formular sichtbar ist und die Nachricht versteckt ist,
            // falls das Modal schon einmal geöffnet wurde.
            if (contactForm) contactForm.style.display = 'flex';
            if (contactSuccessMessage) contactSuccessMessage.style.display = 'none';
        });

        closeModalButton.addEventListener('click', () => contactModal.classList.remove('visible'));
        
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.classList.remove('visible');
            }
        });

        // NEU: Formular Submit Handler
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // Standard-Formularsendung verhindern

                const formData = new FormData(contactForm);
                // FormSubmit.co benötigt _subject und _next/honey-pot.
                // Da _next nicht mehr für Weiterleitung genutzt wird, aber für FormSubmit benötigt wird,
                // können wir es trotzdem senden, oder den honeypot nutzen um Spam zu reduzieren.
                // Für dieses Szenario, fügen wir _subject manuell hinzu, falls es nicht da ist.
                // Die _honey und _next Felder werden nicht direkt aus dem HTML gelesen.

                const object = {};
                formData.forEach((value, key) => {
                    object[key] = value;
                });
                // Füge _subject manuell hinzu, falls das Feld im HTML _subject heißt
                if (!object['_subject']) {
                    object['_subject'] = 'Neue Kontaktanfrage von designare.at';
                }
                // Füge den Honeypot manuell hinzu, um Spam zu filtern, falls kein Feld im HTML ist
                object['_honey'] = ''; // Leerer Wert für den Honeypot

                try {
                    const response = await fetch('https://formsubmit.co/ajax/michael@designare.at', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(object)
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Bei Erfolg: Formular verstecken, Erfolgsnachricht anzeigen
                        contactForm.style.display = 'none';
                        contactSuccessMessage.style.display = 'block';
                        contactForm.reset(); // Formularfelder leeren
                    } else {
                        // Bei Fehler: Fehlermeldung anzeigen (z.B. im aiStatus oder Alert)
                        alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut. Details: ' + data.message);
                    }
                } catch (error) {
                    console.error('Sende-Fehler:', error);
                    alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
                }
            });
        }

        // NEU: Event Listener für den Schließen-Button der Erfolgsnachricht
        if (closeSuccessMessageBtn) {
            closeSuccessMessageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                contactModal.classList.remove('visible'); // Modal schließen
                // Optional: Formular wieder anzeigen, wenn das Modal das nächste Mal geöffnet wird
                if (contactForm) contactForm.style.display = 'flex';
                if (contactSuccessMessage) contactSuccessMessage.style.display = 'none';
            });
        }
    }

    // --- PARTIKEL-HINTERGRUND ---
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#cccccc", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }, "twinkle": { "particles": { "enable": true, "frequency": 0.05, "opacity": 1 } } },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } } },
            "retina_detect": true
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
