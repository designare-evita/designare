document.addEventListener('DOMContentLoaded', () => {

    // --- THEME-LOGIK ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    // --- PARTICLES.JS EFFEKT ---
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles":{ "number":{ "value":80,"density":{ "enable":true,"value_area":800 } },"color":{ "value":"#ffffff" },"shape":{ "type":"circle" },"opacity":{ "value":0.5,"random":false },"size":{ "value":3,"random":true },"line_linked":{ "enable":true,"distance":150,"color":"#ffffff","opacity":0.4,"width":1 },"move":{ "enable":true,"speed":6,"direction":"none","out_mode":"out" } },"interactivity":{ "detect_on":"canvas","events":{ "onhover":{ "enable":true,"mode":"repulse" },"onclick":{ "enable":true,"mode":"push" } },"retina_detect":true });
    }

    // --- TYPEWRITER EFFEKT ---
    const h1Element = document.getElementById('typewriter-h1');
    if (h1Element) {
        let i = 0;
        const text = 'Michael Kanda | Wo Webseiten & KI sich begegnen';
        h1Element.innerHTML = '';
        const typeEffect = () => {
            if (i < text.length) {
                h1Element.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeEffect, 70);
            }
        };
        typeEffect();
    }
    
    // --- AI-CHAT FORMULAR ---
    const aiForm = document.getElementById('ai-form');
    if (aiForm) {
        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('ai-question');
            const status = document.getElementById('ai-status');
            if (status) status.textContent = 'Evita denkt nach...';
            // Simuliert eine KI-Antwort nach 1.5 Sekunden
            setTimeout(() => {
                if (status) status.textContent = 'Das ist eine ausgezeichnete Frage! Michael arbeitet gerade an meiner Verbindung.';
            }, 1500);
            input.value = '';
        });
    }

    // --- MODAL-LOGIK ---
    const setupModal = (btnId, modalId, closeBtnId) => {
        const openBtn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        const closeBtn = document.getElementById(closeBtnId);
        
        if (openBtn && modal) {
            openBtn.onclick = (e) => { e.preventDefault(); modal.style.display = 'flex'; };
        }
        if (closeBtn && modal) {
            closeBtn.onclick = () => { modal.style.display = 'none'; };
        }
        if (modal) {
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
        }
    };
    
    setupModal('contact-btn', 'contact-modal', 'close-modal');

    // --- COOKIE BANNER ---
    const cookieBanner = document.getElementById('cookie-info-lightbox');
    const ackBtn = document.getElementById('acknowledge-cookie-lightbox');
    if (cookieBanner && !localStorage.getItem('cookieAcknowledged')) {
        cookieBanner.style.display = 'flex';
    }
    if (ackBtn) {
        ackBtn.onclick = () => {
            localStorage.setItem('cookieAcknowledged', 'true');
            if (cookieBanner) cookieBanner.style.display = 'none';
        };
    }
});
