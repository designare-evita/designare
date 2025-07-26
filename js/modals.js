// js/modals.js

document.addEventListener('DOMContentLoaded', () => {
    // === Allgemeine Modal-Logik ===
    const modal = document.getElementById('myModal');
    if (!modal) return; // Beenden, wenn kein Modal auf der Seite ist

    const modalContent = document.querySelector('.modal-content');
    const span = document.getElementsByClassName('close')[0];
    const pageCounter = document.getElementById('page-counter');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const contentContainer = document.getElementById('modal-text-content');
    let pages = [];
    let currentPage = 0;

    const showModal = () => {
        if(modal) modal.style.display = 'block';
    };

    const closeModal = () => { // KORREKTUR: Korrekte Pfeilfunktions-Syntax
        if(modal) modal.style.display = 'none';
        if(contentContainer) contentContainer.innerHTML = '';
    };

    if (span) span.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == modal) closeModal();
    };

    const updatePage = () => {
        if (pages.length > 0 && contentContainer) {
            contentContainer.innerHTML = '';
            contentContainer.appendChild(pages[currentPage].cloneNode(true));
            pageCounter.textContent = `${currentPage + 1} / ${pages.length}`;
            prevButton.disabled = currentPage === 0;
            nextButton.disabled = currentPage === pages.length - 1;
            modalContent.classList.toggle('single-page', pages.length <= 1);
        }
    };

    if (prevButton) prevButton.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            updatePage();
        }
    });

    if (nextButton) nextButton.addEventListener('click', () => {
        if (currentPage < pages.length - 1) {
            currentPage++;
            updatePage();
        }
    });

    const paginateAndShowModal = (contentElement) => {
        if (!contentElement) return;
        pages = [];
        currentPage = 0;
        const children = Array.from(contentElement.children);
        
        if (children.length > 0) {
            let pageContent = document.createElement('div');
            let contentOnPage = false;
            children.forEach(child => {
                if (child.tagName === 'H2' && contentOnPage) {
                    pages.push(pageContent);
                    pageContent = document.createElement('div');
                    contentOnPage = false;
                }
                pageContent.appendChild(child.cloneNode(true));
                contentOnPage = true;
            });
            pages.push(pageContent);
        }
        updatePage();
        showModal();
    };

    // Event Listener für Modal-Buttons
    const aboutMeButton = document.getElementById('about-me-btn');
    if (aboutMeButton) {
        aboutMeButton.addEventListener('click', (e) => {
            e.preventDefault();
            const aboutContentSource = document.getElementById('about-me-content');
            if (aboutContentSource) paginateAndShowModal(aboutContentSource);
        });
    }

    const legalLinks = document.querySelectorAll('.legal-link');
    legalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const contentId = link.getAttribute('data-content-id');
            const contentSource = document.getElementById(contentId);
            if (contentSource) paginateAndShowModal(contentSource);
        });
    });
    
    // Kontaktformular-Logik bleibt hier unverändert...
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const dataObject = Object.fromEntries(formData.entries());
            console.log('Sende Formulardaten:', dataObject);
            // Hier kommt deine fetch-Logik zum Senden der Daten...
        });
    }
});
