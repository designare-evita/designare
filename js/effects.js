// js/effects.js

// Initialisiert den Partikel-Hintergrund
function setupParticles() {
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            // ... (Ihre komplette Partikel-Konfiguration hier einfügen)
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#cccccc", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false } },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } } },
            "retina_detect": true
        });
    }
}

/*
 // Initialisiert den 3D-Schwebeeffekt für den Hero-Bereich
function setup3dHover() {
    const heroElement = document.getElementById('hero');
    const container = document.querySelector('#hero .container');
    if (heroElement && container) {
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
}  */

// Exportiert eine Haupt-Initialisierungsfunktion für alle Effekte
export function initEffects() {
    setupParticles();
    // setup3dHover();
}

// Exportiert die Funktion zum Aktualisieren der Partikelfarben, damit andere Module sie nutzen können
export function updateParticleColors() {
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
