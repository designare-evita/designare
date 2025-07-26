// js/modals.js

document.addEventListener('DOMContentLoaded', () => {
    // === Allgemeine Modal-Logik ===
    const modal = document.getElementById('myModal');
    const modalContent = document.querySelector('.modal-content');
    const span = document.getElementsByClassName('close')[0];
    const pageCounter = document.getElementById('page-counter');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const contentContainer = document.getElementById('modal-text-content');
    let pages = [];
    let currentPage = 0;

    // Funktion zum Anzeigen des Modals
    const showModal = () => {
        if(modal) modal.style.display = 'block';
    };

    // Funktion zum Schließen des Modals
    const closeModal = (). => {
        if(modal) modal.style.display = 'none';
        contentContainer.innerHTML = ''; // Inhalt beim Schließen leeren
    };

    // Schließen per Klick auf (x)
    if (span) {
        span.onclick = closeModal;
    }

    // Schließen bei Klick außerhalb des Modals
    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    // === Logik für die Paginierung ===
    const updatePage = () => {
        if (pages.length > 0) {
            contentContainer.innerHTML = ''; // Vorherigen Inhalt löschen
            contentContainer.appendChild(pages[currentPage]); // Seiteninhalt als DOM-Element einfügen
            pageCounter.textContent = `${currentPage + 1} / ${pages.length}`;
            prevButton.disabled = currentPage === 0;
            nextButton.disabled = currentPage === pages.length - 1;
            modalContent.classList.toggle('single-page', pages.length <= 1);
        }
    };

    // Event Listener für die Paginierungs-Buttons
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                updatePage();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (currentPage < pages.length - 1) {
                currentPage++;
                updatePage();
            }
        });
    }

    /**
     * **OPTIMIERUNG 1: Direkte DOM-Element-Verarbeitung**
     * Diese Funktion nimmt jetzt ein DOM-Element (einen Container) an, anstatt eines HTML-Strings.
     * Das ist performanter und sauberer, da der HTML-Code nicht unnötig in einen String
     * umgewandelt und dann wieder geparst werden muss.
     */
    const paginateAndShowModal = (contentElement) => {
        pages = []; // Seiten zurücksetzen
        currentPage = 0;

        // Wir arbeiten direkt mit den Kind-Elementen des übergebenen Containers.
        const children = Array.from(contentElement.children);
        
        if (children.length > 0) {
            let pageContent = document.createElement('div');
            let contentOnPage = false;
    
            children.forEach(child => {
                // Hier kannst du die Logik definieren, wann eine neue Seite beginnen soll.
                // In diesem Fall beginnt eine neue Seite bei jeder h2-Überschrift.
                if (child.tagName === 'H2' && contentOnPage) {
                    pages.push(pageContent);
                    pageContent = document.createElement('div');
                    contentOnPage = false;
                }
                pageContent.appendChild(child.cloneNode(true));
                contentOnPage = true;
            });
            pages.push(pageContent); // Die letzte Seite hinzufügen
        }

        updatePage();
        showModal();
    };


    // === Event Listener für die verschiedenen Modal-Buttons ===

    // "Über Mich"-Modal
    const aboutMeButton = document.getElementById('about-me-btn');
    if (aboutMeButton) {
        aboutMeButton.addEventListener('click', (e) => {
            e.preventDefault();
            const aboutContentSource = document.getElementById('about-me-content');
            if (aboutContentSource) {
                // **OPTIMIERUNG 1-Anwendung:** Wir übergeben das Element direkt.
                paginateAndShowModal(aboutContentSource);
            }
        });
    }

    // Impressum & Datenschutz Modals
    const legalLinks = document.querySelectorAll('.legal-link');
    legalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const contentId = link.getAttribute('data-content-id');
            const contentSource = document.getElementById(contentId);
            if (contentSource) {
                 // **OPTIMIERUNG 1-Anwendung:** Auch hier übergeben wir das Element direkt.
                paginateAndShowModal(contentSource);
            }
        });
    });
    
    // Kontaktformular
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loader"></span> Sending...';
    
            const formData = new FormData(contactForm);

            /**
             * **OPTIMIERUNG 2: Vereinfachte FormData-Konvertierung**
             * Statt einer forEach-Schleife nutzen wir Object.fromEntries(),
             * um das FormData-Objekt direkt in ein einfaches JavaScript-Objekt umzuwandeln.
             * Das ist kürzer, moderner und besser lesbar.
             */
            const dataObject = Object.fromEntries(formData.entries());
    
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataObject),
                });
    
                if (response.ok) {
                    contactForm.reset();
                    // Feedback für den User (könnte man noch schöner machen, z.B. mit einem Toast)
                    alert('Vielen Dank! Ihre Nachricht wurde gesendet.');
                } else {
                    const errorData = await response.json();
                    alert(`Fehler: ${errorData.message || 'Nachricht konnte nicht gesendet werden.'}`);
                }
            } catch (error) {
                console.error('Sende-Fehler:', error);
                alert('Ein technischer Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
});
