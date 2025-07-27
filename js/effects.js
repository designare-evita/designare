// js/effects.js

// NEU: Importiert die Theme-Funktion, um sie nach der Animation zu starten.
import { initTheme } from './theme.js';

// Initialisiert den Partikel-Hintergrund
function setupParticles() {
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", 
          {
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#888888" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#cccccc", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false } },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } } },
            "retina_detect": true
          }, 
          // Callback-Funktion: Wird ausgeführt, wenn die Partikel bereit sind.
          function() {
            console.log('Partikel-Animation ist bereit. Initialisiere Theme...');
            // Dies ist jetzt der einzige und sichere Ort, um das Theme zu starten.
            initTheme(); 
          }
        );
    }
}

// Exportiert eine Haupt-Initialisierungsfunktion für alle Effekte
export function initEffects() {
    setupParticles();
}

// Exportiert die Funktion zum Aktualisieren der Partikelfarben
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
}
