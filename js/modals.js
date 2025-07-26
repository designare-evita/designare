// Function to load header and footer
export function loadHeaderFooter() {
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
            // Re-initialize event listeners for dynamically loaded content if needed
            initModals(); // Example: Re-init modal buttons in the header
            initTheme(); // Re-init theme toggle in the header
        });

    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
            initLegalLinks(); // Re-init legal links in the footer
        });
}

// Function to handle modal popups
export function initModals() {
    const aboutMeBtn = document.getElementById('about-me-btn');
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');
    const legalModalContentArea = document.getElementById('legal-modal-content-area');

    if (aboutMeBtn) {
        aboutMeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const aboutContent = document.getElementById('about-me-content').innerHTML;
            legalModalContentArea.innerHTML = aboutContent;
            legalModal.style.display = 'flex';
        });
    }

    if (closeLegalModalBtn) {
        closeLegalModalBtn.onclick = () => {
            legalModal.style.display = 'none';
        };
    }
}

// Function to handle legal links
export function initLegalLinks() {
    const legalLinks = document.querySelectorAll('.legal-link');
    const legalModal = document.getElementById('legal-modal');
    const legalContentArea = document.getElementById('legal-modal-content-area');

    legalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.getAttribute('href');
            fetch(url)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const content = doc.querySelector('.legal-container').innerHTML;
                    legalContentArea.innerHTML = content;
                    legalModal.style.display = 'flex';
                });
        });
    });
}


// Function for contact form modal
export function initContactForm() {
    // This part was not in the original files but is needed for completeness
    // If you have specific code for the contact form, it should go here.
}

// Function for cookie banner
export function initCookieBanner() {
    const cookieLightbox = document.getElementById('cookie-info-lightbox');
    const acknowledgeBtn = document.getElementById('acknowledge-cookie-lightbox');

    if (cookieLightbox && !localStorage.getItem('cookieAcknowledged')) {
        cookieLightbox.style.display = 'flex';
    }

    if (acknowledgeBtn) {
        acknowledgeBtn.addEventListener('click', () => {
            localStorage.setItem('cookieAcknowledged', 'true');
            cookieLightbox.style.display = 'none';
        });
    }
}

// Re-importing theme to avoid circular dependency issues from main.js
import { initTheme } from './theme.js';
