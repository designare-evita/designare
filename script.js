/*
 * script.js
 * Online-Visitenkarte - Finale Version
*/

document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;

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
            body.style.overflow = 'hidden'; // Scrollen des Body verhindern, wenn Lightbox offen ist
        }
    };

    // Funktion zum Schließen der Lightbox und Speichern im localStorage
    const closeLightbox = () => {
        if (cookieInfoLightbox) {
            cookieInfoLightbox.classList.remove('visible');
            localStorage.setItem('hasSeenCookieInfoLightbox', 'true');
            body.style.overflow = ''; // Scrollen wieder erlauben, nachdem Lightbox geschlossen
        }
    };

    // Beim Laden der Seite: Wenn die Lightbox noch nicht gesehen wurde, öffne sie nach Verzögerung
    if (!hasSeenCookieInfoLightbox) {
        setTimeout(() => {
            openLightbox(); // Öffnet die Lightbox nach der Verzögerung
        }, 1000); // Zeigt die Lightbox nach 1 Sekunde an
    } else {
        // Wenn Lightbox schon gesehen wurde, Seite ist von Anfang an sichtbar, kein spezielles Einblenden
        body.style.overflow = ''; // Sicherstellen, dass Scrollen erlaubt ist, wenn kein Modal offen ist
    }


    // Event Listener für den neuen Cookie Info Button
    if (cookieInfoButton) {
        cookieInfoButton.addEventListener('click', () => {
            // Beim erneuten Öffnen soll die Lightbox immer wieder erscheinen
            localStorage.removeItem('hasSeenCookieInfoLightbox'); // Status zurücksetzen
            openLightbox(); // Lightbox öffnen
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
    const contactForm = document.getElementById('contact-form-inner');
    const contactSuccessMessage = document.getElementById('contact-success-message');
    const closeSuccessMessageBtn = document.getElementById('close-success-message');

    if (contactButton && closeModalButton && contactModal) {
        contactButton.addEventListener('click', () => {
            contactModal.classList.add('visible');
            // Beim Öffnen des Kontaktformulars soll Scrollen verhindert werden
            body.style.overflow = 'hidden';
            if (contactForm) contactForm.style.display = 'flex';
            if (contactSuccessMessage) contactSuccessMessage.style.display = 'none';
        });

        closeModalButton.addEventListener('click', () => {
            contactModal.classList.remove('visible');
            body.style.overflow = '';
        });
        
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.classList.remove('visible');
                body.style.overflow = '';
            }
        });

        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(contactForm);
                const object = {};
                formData.forEach((value, key) => {
                    object[key] = value;
                });
                if (!object['_subject']) {
                    object['_subject'] = 'Neue Kontaktanfrage von designare.at';
                }
                object['_honey'] = '';

                // Text für den Sende-Status des Buttons
                const originalButtonText = e.submitter.innerText;
                e.submitter.innerText = "Sende...";
                e.submitter.disabled = true;


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
                        contactForm.style.display = 'none';
                        contactSuccessMessage.style.display = 'block';
                        contactForm.reset();
                    } else {
                        alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut. Details: ' + data.message);
                    }
                } catch (error) {
                    console.error("Fehler:", error);
                    alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
                } finally {
                    e.submitter.innerText = originalButtonText; // Button-Text zurücksetzen
                    e.submitter.disabled = false; // Button wieder aktivieren
                }
            });
        }

        if (closeSuccessMessageBtn) {
            closeSuccessMessageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                contactModal.classList.remove('visible');
                body.style.overflow = '';
                if (contactForm) contactForm.style.display = 'flex';
                if (contactSuccessMessage) contactSuccessMessage.style.display = 'none';
            });
        }
    }

    // --- KI-INTERAKTION & DYNAMISCHER PLATZHALTER ---
    const aiForm = document.getElementById('ai-form');
    if (aiForm) {
        const aiQuestionInput = document.getElementById('ai-question');
        const aiStatus = document.getElementById('ai-status');
        const submitButton = aiForm.querySelector('button');

        const placeholderTexts = [
            "Hallo, ich bin Evita,",
            "Michaels KI-Assistentin.",
            "Was kann ich für Dich tun?"
        ];
        let placeholderIndex = 0;
        let charPlaceholderIndex = 0;
        let typeInterval; // Muss hier deklariert werden, damit focus/blur darauf zugreifen können
        let deleteInterval; // Muss hier deklariert werden

        typePlaceholder(); // Startet den Typewriter-Effekt für den Platzhalter

        function typePlaceholder() {
            let newText = placeholderTexts[placeholderIndex];
            aiQuestionInput.placeholder = ""; // Platzhalter vor dem Tippen leeren
            typeInterval = setInterval(() => { // Zuweisung zu globaler Variable
                if (charPlaceholderIndex < newText.length) {
                    aiQuestionInput.placeholder += newText.charAt(charPlaceholderIndex);
                    charPlaceholderIndex++;
                } else {
                    clearInterval(typeInterval);
                    setTimeout(deletePlaceholder, 2000); // 2 Sekunden Pause vor dem Löschen
                }
            }, 70); // Tippgeschwindigkeit
        }

        function deletePlaceholder() {
            let currentText = aiQuestionInput.placeholder;
            deleteInterval = setInterval(() => { // Zuweisung zu globaler Variable
                if (currentText.length > 0) {
                    currentText = currentText.slice(0, -1);
                    aiQuestionInput.placeholder = currentText;
                } else {
                    clearInterval(deleteInterval);
                    placeholderIndex = (placeholderIndex + 1) % placeholderTexts.length;
                    charPlaceholderIndex = 0;
                    setTimeout(typePlaceholder, 500); // 0.5 Sekunden Pause vor dem Tippen des nächsten Textes
                }
            }, 40); // Löschgeschwindigkeit
        }

        aiQuestionInput.addEventListener('focus', () => {
            clearInterval(typeInterval);
            clearInterval(deleteInterval);
            aiQuestionInput.placeholder = "";
        });

        aiQuestionInput.addEventListener('blur', () => {
            if(aiQuestionInput.value === '') {
                 typePlaceholder();
            }
        });

        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = aiQuestionInput.value.trim();
            if (!question) return;

            clearInterval(typeInterval);
            clearInterval(deleteInterval);
            
            aiStatus.innerText = "Einen Moment, Evita gleicht gerade ihre Bits und Bytes ab...";
            aiStatus.classList.add('thinking');
            aiQuestionInput.disabled = true;
            submitButton.disabled = true;

            try {
                const fetchPromise = fetch('/api/ask-gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: question })
                });

                const delayPromise = new Promise(resolve => setTimeout(resolve, 1200));

                const [response] = await Promise.all([fetchPromise, delayPromise]);

                if (!response.ok) { throw new Error('Netzwerk-Antwort war nicht OK.'); }

                const data = await response.json();
                aiStatus.innerText = data.answer;

            } catch (error) {
                console.error("Fehler:", error);
                aiStatus.innerText = 'Ein Fehler ist aufgetreten.';
            } finally {
                aiQuestionInput.value = '';
                aiQuestionInput.disabled = false;
                submitButton.disabled = false;
                aiQuestionInput.placeholder = "Haben Sie eine weitere Frage?";
                aiStatus.classList.remove('thinking');
                typePlaceholder();
            }
        });
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

    // --- Legal-Seiten Lightbox Navigation ---
    const impressumLink = document.getElementById('impressum-link');
    const datenschutzLink = document.getElementById('datenschutz-link');
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');
    const legalModalContentArea = document.getElementById('legal-modal-content-area');

    // Funktion zum Laden und Anzeigen der Legal-Seite in der Lightbox
    async function loadLegalPageInModal(pageName) {
        const url = `${pageName}.html`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const legalContainer = doc.querySelector('.legal-container');

            if (legalContainer) {
                legalModalContentArea.innerHTML = ''; // Vorherigen Inhalt leeren

                const children = Array.from(legalContainer.children);
                // Finde den Index des <a class="back-link"> Elements
                const backLinkIndex = children.findIndex(child => child.classList.contains('back-link'));
                // Entferne den back-link aus der Liste der Kinder, damit er nicht doppelt hinzugefügt wird
                let backLinkElement = null;
                if (backLinkIndex !== -1) {
                    backLinkElement = children.splice(backLinkIndex, 1)[0]; // Element entfernen und speichern
                }

                let allParts = []; // Array, das alle Teile enthält
                let currentPage = 0; // Aktuelle Seite (0-indiziert)
                let paginationButtonsDiv; // Referenz für die Buttons

                // NEU: Spezifische Split-Logik für datenschutz.html mit 3 Split-Punkten für 4 Teile
                if (pageName === 'datenschutz') {
                    const splitElement1 = children.find(child => child.id === 'datenschutz-part-2-start');
                    const splitElement2 = children.find(child => child.id === 'datenschutz-part-3-start');
                    const splitElement3 = children.find(child => child.id === 'datenschutz-part-4-start'); // NEU: Dritter Split-Punkt

                    console.log('Datenschutz: Attempting multi-part split (4 parts).');
                    console.log('Split Point 1 (#datenschutz-part-2-start):', splitElement1);
                    console.log('Split Point 2 (#datenschutz-part-3-start):', splitElement2);
                    console.log('Split Point 3 (#datenschutz-part-4-start):', splitElement3); // NEU: Debug-Log

                    if (splitElement1 && splitElement2 && splitElement3) { // NEU: Prüfe alle 3 Split-Punkte
                        const index1 = children.indexOf(splitElement1);
                        const index2 = children.indexOf(splitElement2);
                        const index3 = children.indexOf(splitElement3); // NEU: Index für dritten Split-Punkt

                        if (index1 !== -1 && index2 !== -1 && index3 !== -1 && index1 < index2 && index2 < index3) { // NEU: Prüfe alle Indizes und Reihenfolge
                            allParts.push(children.slice(0, index1));
                            allParts.push(children.slice(index1, index2));
                            allParts.push(children.slice(index2, index3)); // NEU: Dritter Teil
                            allParts.push(children.slice(index3)); // NEU: Vierter Teil
                            console.log('Datenschutz: Successfully split into 4 parts based on IDs.');
                            console.log('Part 1 length:', allParts[0].length, 'Part 2 length:', allParts[1].length, 'Part 3 length:', allParts[2].length, 'Part 4 length:', allParts[3].length); // NEU: Debug-Log
                        } else {
                            console.warn('Datenschutz: Specific IDs found but indices invalid/out of order for 4-part split. Falling back to 2-part split.');
                            // Fallback, wenn IDs gefunden, aber Reihenfolge falsch oder indexOf -1
                            const splitIndex = Math.ceil(children.length * 0.5);
                            allParts.push(children.slice(0, splitIndex));
                            allParts.push(children.slice(splitIndex));
                        }
                    } else {
                        console.warn('Datenschutz: One or more specific split points NOT found for 4-part split. Falling back to 2-part split.');
                        // Fallback, wenn IDs nicht gefunden
                        const splitIndex = Math.ceil(children.length * 0.5);
                        allParts.push(children.slice(0, splitIndex));
                        allParts.push(children.slice(splitIndex));
                    }
                } else { // Logik für Impressum oder andere Seiten (2-Teile-Split)
                    const targetSplitCount = Math.ceil(children.length * 0.5);
                    let h3SplitIndex = -1;
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i];
                        if (child.tagName === 'H3' && i >= targetSplitCount * 0.8 && i <= targetSplitCount * 1.2) {
                            h3SplitIndex = i;
                            break;
                        }
                    }

                    if (h3SplitIndex !== -1) {
                        allParts.push(children.slice(0, h3SplitIndex));
                        allParts.push(children.slice(h3SplitIndex));
                        console.log('2-Part Split: Found H3 near middle.');
                    } else {
                        const splitIndex = Math.ceil(children.length * 0.5);
                        allParts.push(children.slice(0, splitIndex));
                        allParts.push(children.slice(splitIndex));
                        console.log('2-Part Split: 50% element count.');
                    }
                }

                // Erstelle die Divs für jeden Teil und füge den Inhalt hinzu
                const partDivs = allParts.map(part => {
                    const div = document.createElement('div');
                    part.forEach(child => div.appendChild(child.cloneNode(true)));
                    return div;
                });

                // Funktion zum Rendern des aktuellen Teils
                const renderCurrentPart = () => {
                    partDivs.forEach((div, index) => {
                        div.style.display = (index === currentPage) ? 'block' : 'none';
                    });
                    legalModalContentArea.scrollTop = 0; // Nach oben scrollen
                    updatePaginationButtons();
                    console.log('Rendering part:', currentPage + 1);
                };

                // Funktion zum Aktualisieren der Button-Sichtbarkeit
                const updatePaginationButtons = () => {
                    const backButton = document.getElementById('legal-back-button');
                    const continueButton = document.getElementById('legal-continue-button');

                    if (backButton) {
                        backButton.style.display = (currentPage > 0) ? 'block' : 'none';
                    }
                    if (continueButton) {
                        continueButton.style.display = (currentPage < allParts.length - 1) ? 'block' : 'none';
                    }
                };

                // Füge alle Teile zum Modal hinzu (initial alle versteckt außer dem ersten)
                partDivs.forEach(div => legalModalContentArea.appendChild(div));

                // Buttons für Paginierung erstellen (nur wenn mehr als 1 Teil)
                if (allParts.length > 1) {
                    paginationButtonsDiv = document.createElement('div');
                    paginationButtonsDiv.className = 'legal-modal-pagination-buttons';

                    const backButton = document.createElement('button');
                    backButton.id = 'legal-back-button';
                    backButton.textContent = 'Zurück';
                    backButton.addEventListener('click', () => { currentPage--; renderCurrentPart(); });

                    const continueButton = document.createElement('button');
                    continueButton.id = 'legal-continue-button';
                    continueButton.textContent = 'Weiter';
                    continueButton.addEventListener('click', () => { currentPage++; renderCurrentPart(); });

                    paginationButtonsDiv.appendChild(backButton);
                    paginationButtonsDiv.appendChild(continueButton);
                    legalModalContentArea.appendChild(paginationButtonsDiv);
                }


                renderCurrentPart(); // Ersten Teil rendern und Buttons aktualisieren

                // Den ursprünglichen "Zurück zur Startseite" Link im Modal behandeln
                const backLinkInLoadedContent = legalModalContentArea.querySelector('.back-link');
                if (backLinkInLoadedContent) {
                    backLinkInLoadedContent.addEventListener('click', (e) => {
                        e.preventDefault();
                        legalModal.classList.remove('visible');
                        body.style.overflow = '';
                        legalModalContentArea.innerHTML = '';
                        console.log('Clicked "Zurück zur Startseite" in modal, closing modal.');
                    });
                }


                legalModal.classList.add('visible');
                body.style.overflow = 'hidden';
                console.log('Legal modal opened. Total parts:', allParts.length);

            } else {
                console.error(`Could not find .legal-container in ${pageName}.html`);
                alert(`Fehler: Inhalt von ${pageName} konnte nicht geladen werden.`);
            }

        } catch (error) {
            console.error(`Fehler beim Laden der Seite ${url}:`, error);
            alert(`Die Seite ${pageName} konnte nicht geladen werden. Details: ${error.message}`);
            body.style.overflow = '';
        }
    }

    // Event Listener für Footer-Links
    if (impressumLink) {
        impressumLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('impressum');
        });
    }

    if (datenschutzLink) {
        datenschutzLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLegalPageInModal('datenschutz');
        });
    }

    // Event Listener für den Schließen-Button der Legal-Lightbox
    if (closeLegalModalBtn) {
        closeLegalModalBtn.addEventListener('click', () => {
            legalModal.classList.remove('visible');
            body.style.overflow = '';
            legalModalContentArea.innerHTML = '';
            console.log('Legal modal closed via X button.');
        });
    }

    // Event Listener für Klick auf den Hintergrund (außerhalb des Inhalts) der Legal-Lightbox
    if (legalModal) {
        legalModal.addEventListener('click', (e) => {
            if (e.target === legalModal) {
                legalModal.classList.remove('visible');
                body.style.overflow = '';
                legalModalContentArea.innerHTML = '';
                console.log('Legal modal closed via overlay click.');
            }
        });
    }
});
