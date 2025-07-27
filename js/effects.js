// js/effects.js

function setupParticles() {
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                // KORREKTUR: Farben fest auf Dark Mode eingestellt
                "color": { "value": "#bbbbbb" }, 
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { 
                    "enable": true, 
                    "distance": 150, 
                    // KORREKTUR: Farben fest auf Dark Mode eingestellt
                    "color": "#888888", 
                    "opacity": 0.4, 
                    "width": 1 
                },
                "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }
}

export function initEffects() {
    setupParticles();
}

// GELÖSCHT: Die Funktion updateParticleColors wurde entfernt.
